# PDFGEN-001 Template and Generation Database Foundation — 2026-08-25

Ticket: `PDFGEN-001 Template and Generation Database Foundation`

## Summary

The private database foundation for reusable credential-document Template
Packages and resumable generation batches is implemented. It supports one
primary Certificate/Diploma PDF plus optional additional multi-page outputs,
immutable published versions, constrained field placements, full-cohort batch
state without a product-facing 500-person limit, and append-only generated-file
provenance.

The ticket intentionally does not create the `credential-templates` Storage
bucket, validate/render PDF bytes, add admin UI/API generation workflows, or
activate/send credentials. Those remain PDFGEN-002..007.

During transactional dev runtime testing, the initial shared draft-content
trigger exposed a PostgreSQL record-shape defect on page rows. No fixture data
persisted. The applied foundation history was preserved and a forward-only
repair migration replaced the trigger with table-specific branches. The same
multi-document/multi-page publication and immutability runtime test then passed
and rolled back cleanly.

## Files Changed

- `supabase/migrations/20260825090000_pdfgen_001_template_generation_foundation.sql`
- `supabase/migrations/20260825100000_pdfgen_001_template_content_trigger_fix.sql`
- `supabase/tests/database/pdfgen_001_template_generation_foundation.test.sql`
- `supabase/tests/database/qa_001_rls_matrix.test.sql`
- `scripts/verify-pdfgen-001.mjs`
- `scripts/verify-qa-001.mjs`
- `package.json`
- `docs/technical/DATABASE_SCHEMA_v2.md`
- `docs/development/IMPLEMENTATION_STATUS.md`
- `docs/planning/PROJECT_MASTER_CHECKLIST.md`
- `docs/planning/AGENT_EXECUTION_SEQUENCE.md`
- `docs/README.md`
- this report

## Database Objects

New enums:

- `credential_template_version_status`;
- `credential_template_field_key`;
- `credential_template_text_alignment`;
- `credential_template_fit_mode`;
- `credential_generation_batch_status`;
- `credential_generation_item_status`.

New private tables:

- `credential_template_packages`;
- `credential_template_versions`;
- `credential_template_documents`;
- `credential_template_document_pages`;
- `credential_template_field_placements`;
- `credential_generation_batches`;
- `credential_generation_batch_items`;
- `credential_file_generations`.

Controlled public functions:

- `create_credential_template_package(...)`;
- `create_credential_template_version(uuid)`;
- `publish_credential_template_version(uuid)`;
- `retire_credential_template_version(uuid)`.

All eight tables enable and force RLS. Owner/Super Admin may manage draft
template content after active-role and MFA checks. Credential Manager receives
published/retired template reads and private batch/provenance reads only.
Content Manager and anonymous users receive no access. Direct authenticated or
service-role mutations are absent for version, batch, item, and provenance
state.

## Tests / Verification

Passed locally:

- `npm run verify:pdfgen-001`;
- updated `npm run verify:qa-001` for all 44 public tables;
- all 71 non-live `verify:*` package scripts;
- `npm run lint`;
- `npx tsc --noEmit`;
- `npm run build` with 46/46 pages generated;
- `git diff --check`.

Passed against `nobel-itbs-dev`:

- the foundation migration compiled inside a transaction and rolled back;
- versions `20260825090000` and `20260825100000` were applied atomically and
  recorded in `supabase_migrations.schema_migrations`;
- all 8 new tables exist and force RLS; the aggregate public-table inventory is
  44;
- 18 scoped policies exist, with zero Content Manager policy references;
- anonymous table reads, direct authenticated sensitive-state mutations, and
  direct service-role mutations are all zero;
- all four public lifecycle functions are denied to anonymous users and
  executable by authenticated users subject to their internal role/MFA guards;
- the `credential-templates` bucket is still absent, as required before
  PDFGEN-002;
- credential statuses remain exactly `pending`, `valid`, `revoked`, `voided`;
- an Owner/AAL2 transaction created a primary one-page document plus a
  three-page supplement, published the version, rejected post-publication
  mutation, created draft version 2, and rolled every fixture back.

The 65-assertion focused pgTAP file and updated 39-assertion QA-001 aggregate
file are committed, but the complete pgTAP runner was not executed: local
Docker is unavailable and the dev project does not expose `plan(integer)`.

## Security Notes

- Template and generation objects are private and deny by default.
- Published/retired rendering content, package identity, terminal batch/item
  identity, and generated-file provenance are protected from destructive
  mutation.
- Audit metadata excludes PDF bytes, private paths, raw token material,
  learner contacts, placement content, and generation hashes.
- Source PDF metadata is constrained to the future private
  `credential-templates` path, PDF MIME, 20 MB, canonical object path, page
  count, and SHA-256 format; storage and deep PDF validation remain PDFGEN-002.
- No credential lifecycle state, public verification projection, public PDF
  access, email behavior, or number-reuse rule changed.
- A cohort has no product-facing size cap. `processing_chunk_size` is restricted
  to 1..250 solely as an internal resumable-worker control.

## Deviations / Open Questions

- The dev project lacks pgTAP `plan(integer)`, and no compatible local Docker
  runtime is available. Static, compiled SQL, read-only live structure, and
  transactional runtime checks passed; the full pgTAP files remain queued for
  a compatible runner.
- PDFGEN-001 does not make template upload or generation operational by itself.
  The schema becomes usable only through the controlled storage/API/UI tickets.

## Next Dependency

Proceed with `PDFGEN-002 Private Template Storage and Validation`: create the
private `credential-templates` bucket, implement server-only source PDF
upload/validation/sanitization, enforce published-object immutability, and add
short-lived private preview access.
