# Documentation Maintenance

Date: 2026-07-27

Project documentation must stay current as implementation progresses.

## After Each Ticket

Update documentation when the work changes any of the following:

- implemented branch stack or current state;
- database migrations or remote migration status;
- Supabase setup, keys, local/remote workflow, or operational assumptions;
- security behavior, roles, MFA, RLS, or service-role usage;
- public routes, admin routes, API routes, or user-facing behavior;
- design/product context used by design skills;
- QA result, manual smoke result, known issue, or residual risk.

## Required Places To Check

Always consider:

- `docs/development/IMPLEMENTATION_STATUS.md`
- `docs/development/SUPABASE_LOCAL_SETUP.md`
- `docs/development/MIGRATION_STANDARDS.md`
- `docs/qa/`
- `.agents/context/PRODUCT.md`
- `.agents/context/DESIGN.md`
- `docs/README.md`

Update v2 source-of-truth docs only when the product or technical decision changes. Do not edit archived `docs/source/v1/` unless explicitly requested.

## Ticket Closeout

Every implementation ticket should end with:

- summary;
- files changed;
- database objects changed, if any;
- verification;
- security notes;
- deviations or open questions;
- next dependency.

If a ticket is verified against the remote Supabase dev project, record whether migrations were pushed and which real smoke checks passed.
