# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

npm workspaces monorepo (`apps/*`):

- `apps/api`: Express 5 REST API with Prisma 7 (PostgreSQL via `@prisma/adapter-pg`) and Passport (local + JWT). Runs TypeScript directly on Node (`node --watch ./src/server.ts`). There is no build step.
- `apps/web`: Vite + React 19 + Tailwind v4 frontend using react-router data mode (`src/app/routes.ts`).

## Commands

Run from the repo root:

```sh
npm run dev:api          # API dev server (watch mode), port from PORT in apps/api/.env
npm run dev:web          # Vite dev server
npm run test:api         # API test suite (vitest, run once)
npm run test:web         # web test suite (vitest + jsdom + RTL + MSW)
npm run seed -w apps/api # wipe the DB in DATABASE_URL and seed dev data (21 users, a conversation per pair)

# Single test file / single test
npm test -w apps/api -- tests/message.test.ts
npm test -w apps/api -- tests/message.test.ts -t "delete message"

# Lint / build
(cd apps/api && npx eslint .)   # api has no lint script
npm run lint -w apps/web
npm run build -w apps/web       # tsc -b && vite build
```

Prisma: the config file is `apps/api/prisma7.config.ts`, which is not the default name, so pass `--config` explicitly. Run these from `apps/api`:

```sh
npx prisma generate --config prisma7.config.ts          # client output: apps/api/generated/prisma (gitignored)
npx prisma migrate dev --config prisma7.config.ts --name <name>
```

Import the generated client from `generated/prisma/client.ts`, not from `@prisma/client`.

## API architecture

Request flow: `server.ts` → `app.ts` (`createApp()` registers the Passport strategies, then mounts the routers under `/api/{auth,users,conversations,messages}`) → feature router → validators → `handleValidationErrors` → controller → repository → `prisma`.

Each feature folder (`src/user`, `src/conversation`, `src/message`) follows the same split:
- `*-routes.ts`: an express Router. Protected routers call `router.use(requireAuth)`. `POST /api/users` (signup) is the only public route besides login, so it is registered before `requireAuth`.
- `*-validators.ts`: arrays of express-validator chains. Params are sanitized with `.toInt()`.
- `*-controllers.ts`: read input via `matchedData(req)`, never `req.params`/`req.body` directly. They get the caller's identity with `getAuthenticatedUserAccountId(req)` and respond with the `ApiResponse<Data, Errors>` envelope (`{ success, data?, message?, errors? }`) from `src/types/api-types.ts`.
- `*-repository.ts`: the only layer that touches Prisma.
- Request and response types live in `src/types/<feature>-types.ts`.

Key conventions:
- **Identity is the `UserAccount` id, not the `User` id.** The JWT payload is `{ userAccountId }`, `req.user.id` is a `UserAccount.id`, and ownership checks (update/delete user, delete message) compare against it. `User` holds the profile, `UserAccount` holds the credentials, and they are 1:1.
- **Soft deletes.** Every model except `MessageReceipt` has `deletedAt`. Deletes set it rather than removing rows, and queries filter `deletedAt: null`. Ownership-scoped mutations use `updateMany({ where: { id, userAccountId, deletedAt: null } })` and treat `count === 0` as 404.
- Auth: `POST /api/auth/login` signs a 1h JWT and sets it as an httpOnly `token` cookie (it also returns it in the body). The JWT strategy accepts either the cookie or `Authorization: Bearer`.
- Errors: async controllers rely on Express 5 forwarding rejected promises to `errorHandler` (`src/middleware/error-middleware.ts`). That handler maps Prisma `P2002`→409 and `P2025`→404, passes through an error's `statusCode` (4xx messages only), and otherwise returns a generic 500. Throw `HttpError` (`src/lib/http-error.ts`) for a 4xx with a user-facing message.

Avatars (`src/avatar/`):
- `User.avatarKey` stores a provider-neutral storage key, never a URL: `avatars/seed-NN.{jpg,jpeg,png}` for seed photos and `avatars/user-{accountId}-{16-hex sha256}.{jpg,png}` for uploads. Responses expose only `avatarUrl` (via `toAvatarUrl()`, `null` = initials), which every user shape includes (`/auth/me`, users, lookup, contacts, conversation recipients). Shared select/mapper: `src/user/user-profile.ts`.
- File access goes through the `AvatarStorage` interface (`avatar-storage.ts`; `put`/`delete`/async `getUrl`). The only adapter is local disk under `apps/api/assets/` (override with `AVATAR_STORAGE_DIR`). A CDN/object-store move means adding an adapter there.
- `PUT /api/users/:id/avatar` (multipart field `avatar`, own account only): multer caps it at 4 MB and JPEG/PNG MIME types. Then sharp checks the real format and that it's square, and re-encodes it at 320×320 (stripping metadata). The new file is stored, then `avatarKey` is updated, then the previous *upload* is deleted (seed files never are). `DELETE` on the same path clears it.
- `GET /api/avatars/:fileName` is deliberately **public**, like Discord and Slack avatars: upload URLs carry a content hash, so they can't be guessed. That way images load cross-site or from a CDN without the login cookie. It validates the name against `AVATAR_FILE_NAME_PATTERN` and sends `public, max-age=31536000, immutable`. Seed names (`seed-NN`) are guessable, which is fine for dev data. Private media (e.g. future message attachments) should use signed, expiring URLs from `getUrl()` instead.
- Uploads (`assets/avatars/user-*`) are gitignored; seed photos are supplied by hand and committed.
Rate limiting (`src/rate-limit/`, library `rate-limiter-flexible`):
- Limits live in `rate-limit-config.ts`. They are fixed windows that start at a key's first request. A 429 goes through `HttpError` in the usual envelope, with `Retry-After` set.
- In memory (per process, reset on restart): global per IP (mounted after `cors` so 429s carry CORS headers, before body parsing), login attempts per IP, per account (`router.use(requireAuth, accountRateLimit)` on every protected router and `/auth/me`), send message, and avatar upload.
- In Postgres (table `rate_limits`, model `RateLimit`, via `RateLimiterPrisma`): signup per IP, and failed logins counted three ways (`login-rate-limit.ts`): username+IP, username, and IP. A failure that spends a counter's last point blocks it for `blockSeconds`. While any counter is blocked, login returns 429 *before* the password is checked. A success resets only username+IP.
- Keys: `toIpKey()` unwraps IPv4-mapped addresses and groups IPv6 by /64; usernames are lowercased.
- `TRUST_PROXY` env var: unset/`false`, or the number of proxy hops in front of the API. It sets `trust proxy`, so `req.ip` (and every per-IP limit) depends on it. `true` is rejected, since clients could then spoof `X-Forwarded-For`. `createApp({ trustProxy })` overrides it (tests use this to vary IPs).
- ESM with explicit `.ts` import extensions (`verbatimModuleSyntax`, `erasableSyntaxOnly`: no enums or parameter properties). ESLint uses typescript-eslint `strictTypeChecked` + `stylisticTypeChecked`. Prefix unused vars/args with `_`.

## API tests

`apps/api/tests/*.test.ts` use vitest + supertest against the exported `app`. **They run against the real database in `DATABASE_URL`**: `beforeEach` calls `resetDbTables()`, which TRUNCATEs every table, then reseeds fixed fixtures from `tests/helpers/database.ts`. Because of this, tests run serially (`--no-file-parallelism --no-isolate`). Never point `DATABASE_URL` at data you want to keep.

Fixtures: four users (`johndoe01`, `aishadoe01`, `phillipedoe01`, `janedoe01`, all with password `Testpassword01!`) map to account ids 1–4. Conversation 1 is between accounts 1↔2 and conversation 2 is between 1↔3. Auth helpers in `tests/helpers/auth.ts`:
- `createAuthenticatedAgent()`: logs in through the real endpoint (cookie).
- `createAuthenticatedAgentAs(userAccountId)`: signs a Bearer token directly.
- `createUnauthenticatedAgent()`: for 401 checks.

`resetDbTables()` also TRUNCATEs `rate_limits` and calls `resetRateLimiters()` (recreates the in-memory limiters), so every test starts with empty counters. Use `isoDateString()` / `anyString()` from `tests/helpers/types.ts` for timestamp and string matchers. Exact-match user assertions include `avatarUrl: null`. `tests/avatar.test.ts` points `AVATAR_STORAGE_DIR` at a temp dir and generates its images with sharp.

`prisma/populate.ts` (`npm run seed -w apps/api`) is a separate faker-based dev seed. It TRUNCATEs every table, then writes 21 users (password `Testpassword01!`) with a conversation between every pair, each with 1–5 messages at staggered times. User *n* (1-based) gets the photo `apps/api/assets/avatars/seed-NN.{jpg,jpeg,png}` when that file exists, and initials otherwise (it warns about missing files). It also deletes leftover `user-*` uploads, since account ids restart. Generation lives in the pure `prisma/seed-data.ts` (unit-tested in `tests/seed-data.test.ts`); `populate.ts` only persists it. Running the API tests wipes seeded data, so re-seed afterwards.

## Web

- Feature-based layout under `src/`, with dependencies flowing `app → features → shared`:
  - `app/`: route config (`routes.ts`), the authenticated `AppLayout` + `Sidebar`, and the root `ErrorPage`.
  - `features/<name>/` (`auth`, `conversations`, `profile`): the feature's API service, loaders/actions, `types.ts`, and `components/`, `pages/`, `utils/` subfolders. Tests sit next to the file they cover.
  - `shared/`: domain-agnostic code: `api/` (HTTP client, `ApiResponse` envelope types, `api-errors.ts` incl. `isUnauthorizedError`, `api-url.ts` `toApiUrl()` for API-relative URLs such as avatars), generic `components/` (`FormField`, `FormError`, `UserAvatar`, which shows `avatarUrl` and falls back to initials) and `utils/`. Move code here only when it has no feature knowledge.
- Profile photos: while editing, `features/profile/components/EditableAvatar.tsx` adds a pencil button that opens `AvatarUploadDialog`. The flow is pick or drop a file (validated by `utils/validate-avatar-file.ts`), crop it (react-easy-crop, 1:1 round), then `utils/crop-image.ts` draws it onto a 320×320 canvas. `use-avatar-upload.ts` uploads it with progress and then revalidates the current user. Saving is independent of the profile form. Tests mock `react-easy-crop` and `cropImage` (jsdom has no canvas or image decoding), stub `URL.createObjectURL`, and check multipart bodies with `request.text()`, because undici's `formData()` rejects jsdom's `File`.
  - No barrel `index.ts` files; import files directly with their extension.
- Responsive layout is decided in JS from two media queries, so loaders, components and tests share one definition. Read them with `useMediaQuery` (`shared/hooks/use-media-query.ts`) or `matchesMediaQuery` (`shared/utils/media-query.ts`) for loaders:
  - `DESKTOP_QUERY` (`app/layout-queries.ts`, ≥1280px): the sidebar is a fixed column. Below it, `AppLayout` shows `MobileTopBar` (hamburger + logo), and the sidebar opens in `SidebarDrawer`, a modal `<dialog>` that closes on any navigation.
  - `SPLIT_VIEW_QUERY` (`features/conversations/split-view.ts`): desktop, or a landscape tablet (≥768px wide, ≥640px tall). There the list and viewer sit side by side. Otherwise (phones, portrait tablets) `/conversations` is the list screen, so the loader doesn't redirect to the newest conversation. An open conversation fills the screen with a back link and no top bar, and archiving returns to the list.
  - Icons come from `lucide-react`.
- Tests: jsdom has no `matchMedia`, so `src/test/setup.ts` installs a fake from `src/test/media-query.ts`, which is reset to desktop after each test. Call `setViewport("mobile" | "tablet-landscape" | "desktop")` before rendering. Calling it after render simulates a resize or rotation.
- `src/shared/api/axios.ts` creates the axios instance (`baseURL` from `VITE_API_URL`, default `http://localhost:3000/api`; see `apps/web/.env.example`. `withCredentials: true` so the auth cookie is sent). `src/shared/api/client.ts` wraps it with typed `get/post/put/delete`.
- Loading UI: loaders block, so pending navigations show skeletons instead. `usePendingPathname()` (`shared/hooks/use-pending-pathname.ts`) returns the pathname of a link or redirect navigation once it has been loading for 150 ms. It ignores form submissions and same-path reloads. `app/PageOutlet.tsx` swaps the outlet for the destination page's skeleton (`*PageSkeleton.tsx`), and `MessagesPage` handles switching conversations itself, so the list stays. Skeletons are built from `shared/components/Skeleton.tsx`, `ListSkeleton.tsx` and `LoadingStatus.tsx` (a `role="status"` with a label, which tests query). First load shows `app/AppLoading.tsx` as the root `HydrateFallback`. In tests, `holdRequest(method, path)` from `src/test/server.ts` keeps a request pending until you call its release function.
- Auth gating: the JWT cookie is httpOnly, so the client asks `GET /api/auth/me`. Route loaders in `src/features/auth/loaders.ts` redirect: `/` needs a user (else `/login`), `/login` is guest-only (else `/`). `getCurrentUser()` maps 401/404 to `null` and rethrows anything else to the route `ErrorBoundary`.
- The API enables CORS for `CLIENT_ORIGIN` with credentials; the Vite dev origin must match it.
- Tests: `src/**/*.test.ts(x)`, MSW handlers per test on `server` from `src/test/server.ts`, and `renderRoute(path)` from `src/test/render-route.tsx` (memory router with the real route config). `src/test/setup.ts` switches axios to the fetch adapter because jsdom's XHR enforces CORS against the mocked API.

## Git

Use Conventional Commits scoped by app: `feat(api): …`, `fix(web): …`, `chore(web): …`, `refactor(api): …`, `test(api): …`.
