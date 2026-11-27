# Messaging App

A one-to-one messaging app: an Express REST API with PostgreSQL that handles accounts, conversations and messages, and a React frontend.

## Getting started

### Prerequisites

- Node.js 22.18 or later, which can run `.ts` files without a build step
- A PostgreSQL database

### 1. Install dependencies

```sh
git clone https://github.com/saleemrawn/messaging-app.git
cd messaging-app
npm install
```

### 2. Configure the API

Create `apps/api/.env`:

```sh
PORT=3000
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/messaging_app
JWT_SECRET=replace-with-a-long-random-string
CLIENT_ORIGIN=http://localhost:5173
# Optional: where profile photos are stored (defaults to apps/api/assets)
# AVATAR_STORAGE_DIR=
```

`CLIENT_ORIGIN` must match the URL the web app runs on, because the API only allows CORS requests with credentials from that origin.

### 3. Configure the web app

```sh
cp apps/web/.env.example apps/web/.env
```

`VITE_API_URL` defaults to `http://localhost:3000/api`. Change it if you use a different `PORT`.

### 4. Set up the database

The Prisma config file has a non-default name, so pass it with `--config`. Run these from `apps/api`:

```sh
cd apps/api
npx prisma generate --config prisma7.config.ts
npx prisma migrate dev --config prisma7.config.ts
```

To fill the database with sample data, run this from the repo root:

```sh
npm run seed -w apps/api
```

Every seeded user has the password `Testpassword01!`.

### 5. Run the app

In two terminals from the repo root:

```sh
npm run dev:api
npm run dev:web
```

## Testing

```sh
npm run test:api
npm run test:web
```

The API tests run against the database in `DATABASE_URL` and empty every table before each test. Don't point it at data you want to keep, and re-seed after running them.

## Build

To lint and build:

```sh
(cd apps/api && npx eslint .)
npm run lint -w apps/web
npm run build -w apps/web
```
