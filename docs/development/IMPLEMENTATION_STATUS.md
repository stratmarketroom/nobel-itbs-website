# Implementation Status

Last updated: 2026-07-27

This document records the current implementation state. It is not a replacement for the v2 product and technical specifications.

## Current Branch Stack

Active branch:

- `codex/auth-005-admin-user-management`

Implemented and pushed branches:

- `codex/dbf-001-supabase-foundation`
- `codex/dbf-002-migration-standards`
- `codex/dbf-003-internal-schema-extensions`
- `codex/dbf-004-audit-foundation`
- `codex/auth-001-user-profiles`
- `codex/auth-002-multi-role-model`
- `codex/auth-003-owner-rules`
- `codex/auth-004-role-helpers`
- `codex/auth-006-mfa-enforcement`
- `codex/fef-001-nextjs-scaffold`
- `codex/auth-005-admin-user-management`

## Supabase Dev Project

Remote dev project:

- Project name: `nobel-itbs-dev`
- Project ref: `flswzhgjbpagohbwehcz`
- Project URL: `https://flswzhgjbpagohbwehcz.supabase.co`
- Region observed in dashboard: West EU (Ireland)

Local secrets are stored in `.env.local`, which is ignored by git. Never commit `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD`, or development user passwords.

Supabase CLI is linked locally to the dev project.

## Remote Migration State

The following migrations have been pushed to the remote dev database:

- `20260727104215_dbf_003_internal_schema_and_extensions.sql`
- `20260727105232_dbf_004_audit_foundation.sql`
- `20260727111852_auth_001_user_profiles.sql`
- `20260727112603_auth_002_multi_role_model.sql`
- `20260727114756_auth_003_owner_rules.sql`
- `20260727145222_auth_004_role_helpers.sql`
- `20260727145835_auth_006_mfa_enforcement.sql`
- `20260727154750_auth_005_admin_user_management_functions.sql`

Remote smoke check after migration push:

- `user_profiles`: reachable
- `user_roles`: reachable
- `audit_log`: reachable

## Auth Foundation State

Implemented database objects:

- `public.user_profiles`
- `public.user_roles`
- `public.audit_log`
- `public.app_role`
- Internal role, Owner governance, audit, and MFA helper functions
- Admin user management RPC functions:
  - `public.create_admin_profile`
  - `public.update_admin_profile`
  - `public.assign_admin_roles`
  - `public.remove_admin_roles`

Implemented application foundation:

- Server-only Supabase clients and admin session context loading
- Admin API routes under `/api/v1/admin`
- Foundational admin users page at `/admin/users`
- Next.js App Router scaffold with English, Ukrainian, and Czech public locale routes

## Dev Owner Bootstrap

A first dev Owner has been created in the Supabase dev project.

Verified behavior:

- Supabase Auth sign-in succeeds for the dev Owner.
- `/api/v1/admin/me` returns the active Owner profile and `owner` role.
- `/api/v1/admin/users` returns `403` until the Owner session satisfies MFA/AAL2.

This is expected because Owner requires MFA.

## Verification Run

The following checks passed during the latest implementation pass:

- `npm run verify:dbf-001`
- `npm run verify:dbf-002`
- `npm run verify:dbf-003`
- `npm run verify:dbf-004`
- `npm run verify:auth-001`
- `npm run verify:auth-002`
- `npm run verify:auth-003`
- `npm run verify:auth-004`
- `npm run verify:auth-005`
- `npm run verify:auth-006`
- `npm run verify:fef-001`
- `npm run lint`
- `npm run build`
- `npm audit --omit=dev`

## Known Operational Notes

- Local Supabase via Docker has not been run because a Docker-compatible runtime was not available.
- Remote dev Supabase is currently used for real integration smoke checks.
- The local Supabase access token is time-limited and must be replaced when it expires.
- GitHub integration in the Supabase dashboard should be verified separately if branch previews are required.

## Next Recommended Work

Recommended next step:

- Add MFA enrollment/login UI flow, then repeat `/api/v1/admin/users` smoke test with an AAL2 session.

Other near-term candidates:

- QA review for `AUTH-005`.
- Continue admin UI integration with real session state.
- Start the next database/security module from the ticket pack.
