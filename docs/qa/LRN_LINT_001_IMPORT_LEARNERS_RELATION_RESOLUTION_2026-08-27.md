# LRN-LINT-001 Import Learners Relation Resolution

Date: 2026-08-27
Status: complete locally and in hosted Development; Production untouched

## Summary

`db lint --level error` reported `42P01 relation "lrn_005_import_rows" does
not exist` while checking `public.import_learners(jsonb)`. The relation was a
temporary table created inside the function, so `plpgsql_check` could not
resolve it before execution.

Rollback-only runtime diagnosis also found a real transaction-reuse defect:
the first import call succeeded, but a second call in the same transaction
failed with `42P07 relation "lrn_005_import_rows" already exists` because
`ON COMMIT DROP` had not run yet.

Forward-only migration 64 replaces the temporary staging table with normalized
transaction-local `jsonb` and typed `jsonb_to_recordset` reads. The public RPC
signature, role/MFA guard, 1–500-row limit, normalization, duplicate and
existing-record rejection, atomic inserts, count-only audit, return shape,
search path, and grants are preserved. Required normalized values are now
rejected explicitly rather than relying on temporary-table `NOT NULL`
constraints.

## Files Changed

- `supabase/migrations/20260827140000_lrn_lint_001_import_learners_relation_resolution.sql`;
- `supabase/tests/database/lrn_lint_001_import_learners_relation_resolution.test.sql`;
- `scripts/verify-lrn-lint-001.mjs`;
- `scripts/verify-lrn-005.mjs`;
- `package.json`;
- this report and directly related planning/status references.

## Database Objects

Migration:
`20260827140000_lrn_lint_001_import_learners_relation_resolution.sql`.

Changed object:

- `public.import_learners(jsonb)` — replaced in place.

No table, column, type, trigger, policy, grant boundary, Storage object, or
application data row was added or changed. Hosted Development is at migration
64/64. Production remains at migration 60.

## Tests / Verification

Pre-fix local reproduction:

- `db lint --level error` returned the expected `42P01` temporary-relation
  finding;
- the first rollback-only import call succeeded;
- a second call in the same transaction returned the expected `42P07`;
- cleanup verification returned `0|0|0|0` for the synthetic Auth user,
  learners, emails, and phones.

Passed locally after the correction:

- clean rebuild of all 64 migrations;
- focused LRN-LINT-001 pgTAP: 13/13;
- LRN-005 pgTAP: 15/15;
- QA-001 pgTAP: 42/42;
- QA-003 aggregate pgTAP: 31/31;
- QA-003 content-policy pgTAP: 10/10;
- selected current database gate: 111/111;
- `db lint --level error`: no schema errors;
- `npm run verify:lrn-lint-001`;
- `npm run verify:lrn-005`;
- `npm run verify:qa-001`;
- `npm run verify:qa-003`;
- ESLint;
- TypeScript;
- production build: 51 static pages generated;
- `git diff --check`.

Passed against hosted Development:

- dry run listed only migration 64;
- migration 64 applied successfully;
- local/remote migration parity: 64/64;
- `db lint --level error`: no schema errors;
- focused LRN-LINT-001 pgTAP: 13/13;
- LRN-005 pgTAP: 15/15;
- QA-001 pgTAP: 42/42;
- QA-003 aggregate pgTAP: 31/31;
- QA-003 content-policy pgTAP: 10/10;
- hosted rollback-only database gate: 111/111.

## Security Notes

- `public.import_learners(jsonb)` remains `SECURITY DEFINER` with the fixed
  `internal, public, extensions, pg_temp` search path.
- Only authenticated callers receive `EXECUTE`; role, active-admin, and MFA/AAL2
  authorization remain enforced inside the function.
- Content Manager and anonymous execution remain denied.
- Existing learners and contacts are never overwritten.
- Audit metadata remains exactly the imported count and contains no learner PII,
  uploaded rows, or contact values.
- Hosted tests used synthetic `.invalid` data inside rollback-only transactions;
  no Auth user, learner, email, phone, credential, PDF, number, activation, or
  email-delivery row persisted.
- No secret value was printed or committed. Production was not accessed or
  changed by this ticket.

## Deviations / Open Questions

- Historical phase-local `lrn_001_learner_core.test.sql` is not a valid
  current-schema aggregate gate because it intentionally asserts that the later
  LRN-002/LRN-003 email and phone tables do not exist.
- Historical `lrn_002_learner_emails.test.sql` currently stops in pgTAP
  `results_eq` with an environment-specific collation ambiguity. The current
  LRN-005, LRN-LINT-001, QA-001, and QA-003 gates pass locally and in hosted
  Development; changing historical test infrastructure is outside this ticket.
- A first attempt to run independent Supabase test processes in parallel caused
  pgTAP extension setup/teardown collisions. All acceptance suites were rerun
  sequentially.

## Next Dependency

Promote the ordered migrations 61–64 to Production only under a separate,
explicitly authorized release ticket. PDFGEN cohort mutation acceptance at
200/540/1000 items and real complete-package VEDOS delivery remain separate
Owner-gated operational acceptance steps.

Rollback/remediation: migration 64 is forward-only and replaces one function.
If a defect is found after promotion, add a later `create or replace function`
migration; do not rewrite migration 64 or mutate learner data to simulate a
rollback.
