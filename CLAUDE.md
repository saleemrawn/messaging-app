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
- Errors: async controllers rely on Express 5 forwarding rejected promises to `errorHandler` (`src/middleware/error-middleware.ts`). That handler maps Prisma `P2002`→409 and `P2025`→404, passes through an error's `statusCode` (4xx messages only), and otherwise returns a generic 500.
- ESM with explicit `.ts` import extensions (`verbatimModuleSyntax`, `erasableSyntaxOnly`: no enums or parameter properties). ESLint uses typescript-eslint `strictTypeChecked` + `stylisticTypeChecked`. Prefix unused vars/args with `_`.

## API tests

`apps/api/tests/*.test.ts` use vitest + supertest against the exported `app`. **They run against the real database in `DATABASE_URL`**: `beforeEach` calls `resetDbTables()`, which TRUNCATEs every table, then reseeds fixed fixtures from `tests/helpers/database.ts`. Because of this, tests run serially (`--no-file-parallelism --no-isolate`). Never point `DATABASE_URL` at data you want to keep.

Fixtures: four users (`johndoe01`, `aishadoe01`, `phillipedoe01`, `janedoe01`, all with password `Testpassword01!`) map to account ids 1–4. Conversation 1 is between accounts 1↔2 and conversation 2 is between 1↔3. Auth helpers in `tests/helpers/auth.ts`:
- `createAuthenticatedAgent()`: logs in through the real endpoint (cookie).
- `createAuthenticatedAgentAs(userAccountId)`: signs a Bearer token directly.
- `createUnauthenticatedAgent()`: for 401 checks.

Use `isoDateString()` / `anyString()` from `tests/helpers/types.ts` for timestamp and string matchers.

`prisma/populate.ts` (`npm run seed -w apps/api`) is a separate faker-based dev seed. It TRUNCATEs every table, then writes 21 users (password `Testpassword01!`) with a conversation between every pair, each with 1–5 messages at staggered times. Generation lives in the pure `prisma/seed-data.ts` (unit-tested in `tests/seed-data.test.ts`); `populate.ts` only persists it. Running the API tests wipes seeded data, so re-seed afterwards.

## Web

- Feature-based layout under `src/`, with dependencies flowing `app → features → shared`:
  - `app/`: route config (`routes.ts`), the authenticated `AppLayout` + `Sidebar`, and the root `ErrorPage`.
  - `features/<name>/` (`auth`, `conversations`, `profile`): the feature's API service, loaders/actions, `types.ts`, and `components/`, `pages/`, `utils/` subfolders. Tests sit next to the file they cover.
  - `shared/`: domain-agnostic code: `api/` (HTTP client, `ApiResponse` envelope types, `api-errors.ts` incl. `isUnauthorizedError`), generic `components/` (`FormField`, `FormError`, `UserAvatar`) and `utils/`. Move code here only when it has no feature knowledge.
  - No barrel `index.ts` files; import files directly with their extension.
- `src/shared/api/axios.ts` creates the axios instance (`baseURL` from `VITE_API_URL`, default `http://localhost:3000/api`; see `apps/web/.env.example`. `withCredentials: true` so the auth cookie is sent). `src/shared/api/client.ts` wraps it with typed `get/post/put/delete`.
- Auth gating: the JWT cookie is httpOnly, so the client asks `GET /api/auth/me`. Route loaders in `src/features/auth/loaders.ts` redirect: `/` needs a user (else `/login`), `/login` is guest-only (else `/`). `getCurrentUser()` maps 401/404 to `null` and rethrows anything else to the route `ErrorBoundary`.
- The API enables CORS for `CLIENT_ORIGIN` with credentials; the Vite dev origin must match it.
- Tests: `src/**/*.test.ts(x)`, MSW handlers per test on `server` from `src/test/server.ts`, and `renderRoute(path)` from `src/test/render-route.tsx` (memory router with the real route config). `src/test/setup.ts` switches axios to the fetch adapter because jsdom's XHR enforces CORS against the mocked API.

## Git

Use Conventional Commits scoped by app: `feat(api): …`, `fix(web): …`, `chore(web): …`, `refactor(api): …`, `test(api): …`.
