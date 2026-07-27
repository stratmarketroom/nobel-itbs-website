# Supabase Local Setup

This project uses the Supabase CLI for local PostgreSQL, Auth, Storage, Studio, and database test workflows.

## Prerequisites

- Node.js 20 or newer if using an npm-installed Supabase CLI.
- Supabase CLI available as `supabase`.
- Docker Desktop or another Docker-compatible runtime.

Official Supabase CLI docs:

- https://supabase.com/docs/guides/local-development/cli/getting-started
- https://supabase.com/docs/guides/local-development/cli/config

## First Run

1. Copy `.env.example` to `.env`.
2. Start the local stack:

   ```sh
   npm run supabase:start
   ```

3. Print local service URLs and keys:

   ```sh
   npm run supabase:status
   ```

4. Put the local anon key into `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env`.

Do not put production secrets into local files. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only and never expose it through browser code.

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
