# QA-005-PROD-MIG-001 Production Migration Promotion 61–64

Date: 2026-08-27
Status: complete in Production

## Summary

The four ordered migrations already accepted in hosted Development were
promoted to `nobel-itbs-prod` and accepted through a read-only post-deploy
audit. Production now matches the repository and Development at 64/64
migrations, the post-push dry run reports no pending migration, and hosted
error-level schema lint reports no finding.

This release did not create a cohort, learner, credential, permanent number,
template, PDF, activation request, email-send record, Storage object, Auth
user, or MFA factor. It did not invoke PDF generation, activation, VEDOS, or
public verification.

## Scope

Promoted, in order:

1. `20260826140000_pdfgen_007_batch_activation_delivery.sql`;
2. `20260827100000_qa_003_content_policy_mfa_hardening.sql`;
3. `20260827120000_pdfgen_lint_001_single_generation_package_assignment.sql`;
4. `20260827140000_lrn_lint_001_import_learners_relation_resolution.sql`.

Out of scope:

- PDFGEN cohort mutation acceptance at 200/540/1000 items;
- permanent-number allocation;
- generation or review of a private PDF package;
- credential activation or real VEDOS delivery;
- backup-plan activation or a restore drill;
- any application deployment or external-service configuration change.

## Files Changed

- this acceptance report;
- `docs/README.md`;
- `docs/development/IMPLEMENTATION_STATUS.md`;
- `docs/planning/AGENT_EXECUTION_SEQUENCE.md`;
- `docs/planning/PROJECT_MASTER_CHECKLIST.md`.

No application, migration, test, script, or configuration file changed in this
release ticket.

## Database Objects

Migration 61 adds the already-reviewed PDFGEN-007 private activation boundary:

- two private activation request/item enums;
- `credential_generation_batch_activation_requests`;
- `credential_generation_batch_activation_items`;
- their constraints, indexes, updated-at and immutability triggers;
- two forced-RLS authenticated read policies;
- seven guarded public activation/delivery functions and two internal helper
  functions.

Migration 62 alters 45 existing editorial mutation policies so their
`INSERT`, `UPDATE`, and `DELETE` boundaries call the shared profile-aware MFA
helper.

Migration 63 replaces
`public.begin_single_credential_generation(uuid, uuid, uuid)` in place with the
correct expanded Template Package composite assignment.

Migration 64 replaces `public.import_learners(jsonb)` in place with normalized
transaction-local JSONB staging.

No application data row or Storage object was inserted, updated, or deleted by
the promotion or its acceptance checks.

## Tests / Verification

Preflight:

- release branch started from Production merge `53ad9e3` / current `main`;
- clean local rebuild applied all 64 migrations;
- focused local production-release pgTAP gate passed 168/168 across eight
  PDFGEN, learner, QA-001, and QA-003 suites;
- local `db lint --level error` reported no schema errors;
- all directly relevant static verifiers passed;
- ESLint with zero warnings, TypeScript `--noEmit`, the 51-page production
  build, and diff checks passed;
- Production identity guard matched project `szratzjodgiacvnhqmhx`;
- Production ledger was exactly 60 migrations with latest version
  `20260826123000`;
- learners, credentials, Template Packages, generation batches, private
  credential objects, and credential-template objects were all zero;
- both future activation-ledger tables were absent;
- the dry run listed exactly migrations 61–64 above.

Post-deploy:

- migration ledger: 64/64, latest `20260827140000`;
- post-push dry run: remote database is up to date;
- hosted `db lint --level error`: no schema errors;
- activation tables with enabled and forced RLS: 2/2;
- guarded activation read policies: 2/2;
- authenticated browser direct activation-ledger DML: denied;
- guarded activation functions with `SECURITY DEFINER`, fixed `search_path`,
  authenticated execution, and anonymous denial: 7/7;
- hardened editorial mutation policies: 45/45;
- single-generation assignment correction: present;
- learner-import relation correction: present;
- credential lifecycle remains exactly
  `pending,valid,revoked,voided`;
- learners, credentials, Template Packages, generation batches, activation
  requests/items, and both private Storage object counts remained zero.

The two PostgreSQL identifier-truncation notices for the long migration-61
index/trigger names matched the prior Development application and did not
prevent creation or acceptance.

## Security Notes

- Production credentials were read only from ignored local environment files;
  no secret value was printed, copied into the repository, or committed.
- The release used a direct TLS PostgreSQL connection after the stored Supabase
  Management API token proved unavailable; the confirmed project-ref and URL
  guard ran before every Production command.
- The new activation ledgers are forced-RLS and expose no browser DML.
- Anonymous function execution remains denied; authenticated execution remains
  protected by active-role and MFA checks inside the functions.
- Migration 62 adds database-level MFA defence in depth without making Content
  Manager MFA mandatory by default or changing editorial read access.
- No raw verification token, contact detail, private path, PDF byte, SMTP
  credential, or service-role key entered the evidence.

## Deviations / Open Questions

- The organisation remains on the previously documented Supabase Free/no-daily-
  backup state. This promotion was accepted because the affected learner,
  credential, template, generation, activation, and private-Storage registries
  were empty; migration 61 is additive, migration 62 is policy-only, and
  migrations 63–64 replace functions in place. Backup activation and the
  restore drill remain mandatory before operational credential issuance.
- The stored Supabase Management API token is expired/unavailable. Direct TLS
  database access with the ignored Production password was used for the
  migration ledger, dry runs, promotion, lint, and read-only audits.
- Migrations are forward-only. If a defect is found, remediate it with a later
  migration: replace the affected function/policy, or supersede the additive
  PDFGEN objects. Do not rewrite or delete migrations 61–64.

## Next Dependency

The remaining PDFGEN-008 mutation acceptance requires a separately approved
non-production cohort and permanent-number allocation for the 200/540/1000
tests. Real complete-package VEDOS delivery remains a separate Owner-approved
operational acceptance. Production backup/restore readiness must be activated
before real credential issuance.
