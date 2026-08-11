# Supabase Setup

This project uses the Supabase CLI for local PostgreSQL, Auth, Storage, Studio, database test workflows, and remote dev database migrations.

## Prerequisites

- Node.js 20 or newer.
- Project dependencies installed with `npm install`.
- Docker Desktop or another Docker-compatible runtime.

Official Supabase CLI docs:

- https://supabase.com/docs/guides/local-development/cli/getting-started
- https://supabase.com/docs/guides/local-development/cli/config

## Local First Run

1. Install dependencies:

   ```sh
   npm install
   ```

2. Confirm the project-local Supabase CLI works:

   ```sh
   npx supabase --version
   ```

3. Copy `.env.example` to `.env`.
4. Start Docker Desktop or another Docker-compatible runtime.
5. Start the local stack:

   ```sh
   npm run supabase:start
   ```

6. Print local service URLs and keys:

   ```sh
   npm run supabase:status
   ```

7. Put the local anon key into `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env`.

Do not put production secrets into local files. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only and never expose it through browser code.

## Remote Dev Project

Remote dev project currently used for integration smoke checks:

- Project name: `nobel-itbs-dev`
- Project ref: `flswzhgjbpagohbwehcz`
- Project URL: `https://flswzhgjbpagohbwehcz.supabase.co`

Required local-only values in `.env.local`:

```sh
NEXT_PUBLIC_SUPABASE_URL=https://flswzhgjbpagohbwehcz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_ACCESS_TOKEN=...
SUPABASE_DB_PASSWORD=...
DEV_OWNER_EMAIL=...
DEV_OWNER_PASSWORD=...
```

Never commit `.env.local`.

Link the local Supabase CLI project:

```sh
set -a
source .env.local
set +a
npx supabase link --project-ref flswzhgjbpagohbwehcz --password "$SUPABASE_DB_PASSWORD"
```

Preview and push remote migrations:

```sh
set -a
source .env.local
set +a
npx supabase db push --dry-run
npx supabase db push
```

List local and remote migration state:

```sh
npx supabase migration list
```

## Dev Owner Bootstrap

The first dev Owner is created only for development/integration checks. Keep the email and password in `.env.local`.

Expected current security behavior:

- Owner sign-in succeeds.
- `/api/v1/admin/me` returns the Owner profile and role.
- Sensitive user-management endpoints return `403` until the session satisfies MFA/AAL2.

## Common Commands

```sh
npm run supabase:start
npm run supabase:status
npm run supabase:reset
npm run supabase:test
npm run supabase:stop
```

## Verification

DBF-001 can be verified without starting Docker:

```sh
npm run verify:dbf-001
```

This checks that the Supabase foundation files exist and that no SQL migrations were added in the foundation ticket.

## Ticket Boundary

DBF-001 creates only the local Supabase structure and setup documentation. It does not create:

- programme tables;
- learner tables;
- credential tables;
- frontend feature pages;
- Gmail, Leeloo, or CAPTCHA integrations.
