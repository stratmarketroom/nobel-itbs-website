# Implementation Status

Last updated: 2026-08-01

This document records the current implementation state. It is not a replacement for the v2 product and technical specifications.

## Current Branch Stack

Active branch:

- `codex/ux-prototypes-public-pages`

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
- `codex/auth-007-mfa-login-ui`
- `codex/design-context-prep`
- `codex/ux-prototypes-public-pages`

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
- `20260727171000_auth_003_owner_minimum_guard.sql`

Remote smoke check after migration push:

- `user_profiles`: reachable
- `user_roles`: reachable
- `audit_log`: reachable

Owner minimum guard smoke check after QA hardening:

- active Owner count remains `1`;
- deactivating the last active Owner is blocked;
- deleting the last Owner role assignment is blocked.

## Auth Foundation State

Implemented database objects:

- `public.user_profiles`
- `public.user_roles`
- `public.audit_log`
- `public.app_role`
- Internal role, Owner governance, audit, and MFA helper functions
- Owner uniqueness and minimum-owner guardrails
- Admin user management RPC functions:
  - `public.create_admin_profile`
  - `public.update_admin_profile`
  - `public.assign_admin_roles`
  - `public.remove_admin_roles`

Implemented application foundation:

- Server-only Supabase clients and admin session context loading
- Browser-safe Supabase client using public anon configuration only
- Admin login route with password sign-in, TOTP enrollment, and TOTP challenge flow
- Admin API routes under `/api/v1/admin`
- Foundational admin users page at `/admin/users`
- Next.js App Router scaffold with English, Ukrainian, and Czech public locale routes

## Design Context State

Project-level design-skill context has been prepared:

- `.agents/context/PRODUCT.md`
- `.agents/context/DESIGN.md`
- `docs/development/DESIGN_SKILLS_SETUP.md`

The `impeccable` context loader confirms both product and design context are available.

Installed design-oriented skills observed locally:

- `impeccable`
- `huashu-design`

No project-specific design skill files were found in the known neighbouring project checked during setup.

## Public UX Prototype State

Release 1 public UX prototypes have been built and pushed on
`codex/ux-prototypes-public-pages`.

Implemented public prototype surfaces:

- Home;
- Programmes catalogue;
- Programme Area landing pages;
- Programme Type landing pages;
- programme detail pages for the approved Release 1 programmes;
- About Us;
- Partnerships;
- For Organisations;
- Verify document;
- Terms of Use, Privacy Policy, and Refund Policy pages;
- minimal cookie-consent block;
- system pages for 404, rate limit, temporary error, and access denied states.

Approved prototype decision:

- The programme question form is an inline block on programme pages, not a
  modal.
- The programme question topic uses a compact dropdown/select instead of
  option chips.
- The form remains a UX prototype. It does not yet submit to the
  `contact_submissions` backend.

Content and implementation source notes:

- Public page content is aligned to v2 documentation and `docs/preparation/`.
- Programme master copy is read from `docs/preparation/programmes/` for the
  remaining approved programme pages.
- `lib/i18n.ts` is still used by prototype components, but the approved content
  source remains `docs/preparation/`.
- Alina Yudina's photo remains pending and does not block the public prototype.

Current design-stage status:

- UX prototype layer for Release 1 public pages is complete enough for UI review.
- UI polish and final UI system extraction are intentionally deferred until the
  next design pass.
- The UI system should be documented after reviewing the real pages, not before.

## Dev Owner Bootstrap

A first dev Owner has been created in the Supabase dev project.

Verified behavior:

- Supabase Auth sign-in succeeds for the dev Owner.
- `/api/v1/admin/me` returns the active Owner profile and `owner` role.
- `/api/v1/admin/users` returns `403` until the Owner session satisfies MFA/AAL2.
- Remote DB blocks deactivating the last active Owner and deleting the last Owner role assignment.
- `/admin/login` renders the admin sign-in and MFA flow.
- Manual browser smoke completed: dev Owner enrolled TOTP MFA through `/admin/login` and was redirected to `/admin/users`.
- `AUTH-007` QA edge-case review completed with no open blocking findings.

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
- `npm run verify:auth-007`
- `npm run verify:fef-001`
- `npm run lint`
- `npm run build`
- `npm audit --omit=dev`
- Supabase remote `db push --dry-run`
- Supabase remote `db push`
- `impeccable` context loader: `hasProduct=true`, `hasDesign=true`

Latest public prototype checks:

- `npm run lint` passed.
- `git diff --check` passed before commit.
- `npm run build` compiled and passed TypeScript, then failed during prerender of
  `/admin/login` because Supabase browser configuration was missing in the local
  environment. This is an environment/configuration blocker, not a public
  prototype TypeScript error.

## Known Operational Notes

- Local Supabase via Docker has not been run because a Docker-compatible runtime was not available.
- Remote dev Supabase is currently used for real integration smoke checks.
- The local Supabase access token is time-limited and must be replaced when it expires.
- GitHub integration in the Supabase dashboard should be verified separately if branch previews are required.

## Next Recommended Work

Recommended next step:

- Run the UI review/polish pass across the approved public UX prototype pages.
- After the page-by-page UI pass is approved, extract the concrete UI system
  rules into the design documentation.
- Implement real public contact submission handling for the programme question
  block through the approved `/api/v1/public/contact-submissions` path.

Other near-term candidates:

- Continue admin UI integration with real session state.
- Start the next database/security module from the ticket pack.
