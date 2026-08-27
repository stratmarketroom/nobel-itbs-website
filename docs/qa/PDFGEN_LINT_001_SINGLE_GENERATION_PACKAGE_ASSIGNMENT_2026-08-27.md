# PDFGEN-LINT-001 Single Generation Package Assignment

Date: 2026-08-27
Status: complete locally and in hosted Development; Production untouched

## Summary

Hosted Development `db lint` identified a PL/pgSQL assignment error in the
already deployed `public.begin_single_credential_generation(uuid, uuid, uuid)`
function. The original query selected the table alias as one nested composite
value and attempted to assign it to a row variable whose first field is UUID.

The forward-only correction selects `template_package.*` so PostgreSQL assigns
the expanded row fields to the declared
`public.credential_template_packages` composite variable. The function
signature, return shape, role/MFA guard, pending-only lifecycle, exact template
context, regeneration provenance, lease, History/Audit, grants, and fixed
`search_path` remain unchanged.

## Files Changed

- `supabase/migrations/20260827120000_pdfgen_lint_001_single_generation_package_assignment.sql`;
- `supabase/tests/database/pdfgen_lint_001_single_generation_package_assignment.test.sql`;
- `supabase/tests/database/pdfgen_005_single_generation.test.sql`;
- `scripts/verify-pdfgen-lint-001.mjs`;
- `package.json`;
- directly related QA, planning, and status documentation.

## Database Objects Changed

One forward-only migration performs `CREATE OR REPLACE FUNCTION` for
`public.begin_single_credential_generation(uuid, uuid, uuid)`. No table,
column, type, trigger, policy, grant, Storage rule, or application row changes.

## Tests / Verification

Passed locally after a clean rebuild of all 63 repository migrations:

- focused PDFGEN-LINT-001 pgTAP: 6/6;
- PDFGEN-005: 21/21;
- all selected PDFGEN suites: 204/204;
- QA-003 content-policy focused suite: 10/10;
- aggregate QA-003: 31/31;
- aggregate QA-001: 42/42;
- combined selected regression: 293/293 across 11 files;
- `npm run verify:pdfgen-lint-001`;
- `npm run verify:pdfgen-005`;
- `node --check scripts/verify-pdfgen-lint-001.mjs`;
- `git diff --check`.

Local `supabase db lint --level error` no longer reports
`begin_single_credential_generation`. Its only remaining result is the separate
pre-existing `public.import_learners` temporary-table resolution finding.

Passed against hosted Development:

- pre-push dry-run listed only migration `20260827120000`;
- focused PDFGEN-LINT-001 pgTAP: 6/6;
- PDFGEN-005: 21/21;
- combined hosted correction gate: 27/27;
- error-level database lint no longer reports
  `begin_single_credential_generation`;
- post-push dry-run: remote database is up to date at migration 63.

## Security Notes

- The existing Owner/Super Admin/Credential Manager plus MFA/AAL2 guard is
  preserved.
- `SECURITY DEFINER` and the fixed `public, internal, pg_temp` search path are
  preserved.
- No token, PDF, Storage path, learner contact, credential, number reservation,
  activation, or email data is added or exposed.

## Deviations / Open Questions

- The separate pre-existing `public.import_learners` lint finding remained
  outside this ticket and was subsequently resolved by LRN-LINT-001 migration
  64.
- Hosted Development contains migration 63. Production remains at 60 and was
  not changed by this ticket.

## Next Dependency

Hosted lint is clean after the separately scoped migration 64. Production
promotion of ordered migrations 61–64 and PDFGEN mutation acceptance remain
separately authorized steps.
