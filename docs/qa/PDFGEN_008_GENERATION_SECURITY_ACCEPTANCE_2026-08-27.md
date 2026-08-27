# PDFGEN-008 Generation Security and End-to-End Acceptance

Date: 2026-08-27
Status: PDFGEN runtime security gate passed; content-MFA gap resolved locally;
mutation E2E remains open

## Scope For This Stage

This stage implements the first four approved PDFGEN-008 work items:

1. reconcile the active documentation and exact acceptance matrix;
2. extend aggregate RLS, private Storage, function-grant, and audit/privacy coverage;
3. extend the Owner/Super Admin/Content Manager/Credential Manager and AAL1/AAL2 matrix;
4. strengthen local unsafe-PDF, multi-document, multi-page, EN/UA/CZ, long-content, and QR tests.

This stage does not create learners, credentials, permanent numbers, batches,
Storage objects, activation records, or email sends. The 200/540/1000 cohort
tests, hosted mutation E2E, Production PDFGEN-007 migration, and real VEDOS
delivery remain later acceptance gates.

## Acceptance Matrix

### Authorization and RLS

- all 46 public tables are explicit in aggregate QA-001;
- all ten PDFGEN template/generation/provenance/activation tables enable and
  force RLS;
- anonymous and Content Manager access is denied;
- template-definition mutations are Owner/Super Admin plus MFA only;
- Credential Manager may use published template metadata for generation,
  review, activation, retry, and delivery after MFA, but may not mutate template
  definitions;
- all 30 PDFGEN public functions deny anonymous execution, expose only guarded
  authenticated execution, use `SECURITY DEFINER`, and pin `search_path`;
- browser roles have no direct controlled-state DML or private Storage policy.

### Privacy

- template source bucket/path/hash columns remain hidden from browser roles;
- generation leases, batches, activation ledgers, and provenance contain no raw
  token, token ciphertext/hash, private path, PDF bytes, or learner contact
  content;
- activation ledgers contain outcome identifiers only; recipient/message/file
  content remains in the existing private immutable delivery history;
- static guards reject forbidden token/path/byte/contact fields in PDFGEN
  Audit/History payload construction;
- credential lifecycle remains exactly `pending`, `valid`, `revoked`, `voided`.

### PDF Safety and Typography

- source validation accepts valid one- and multi-page PDFs and rejects
  malformed/encrypted PDFs, JavaScript, attachments, forms, launch/URI/remote
  actions, submit/import actions, rich media, and open actions;
- generation produces exactly one primary plus additional multi-page PDFs while
  preserving page dimensions/orientation;
- EN, Ukrainian Cyrillic, and Czech diacritics render with server-bundled
  embedded Noto Sans fonts;
- realistic long holder names shrink safely, long programme titles wrap safely,
  and unfit required text fails with `text_overflow`;
- QR codes decode to the exact fictional HTTPS verification URL on normal and
  rotated pages in every locale case;
- local generation tests keep artifacts in memory and do not persist private
  PDF fixtures in the repository.

## Files Changed

- aggregate QA: `supabase/tests/database/qa_001_rls_matrix.test.sql`,
  `supabase/tests/database/qa_003_mfa_matrix.test.sql`;
- focused acceptance: `supabase/tests/database/pdfgen_008_generation_security_acceptance.test.sql`;
- pgTAP 1.2 compatibility corrections in the focused PDFGEN-001/002/003/005/006/007
  suites (`values (...)` query syntax and explicit catalog-text collation);
- static guards: `scripts/verify-qa-001.mjs`, `scripts/verify-qa-003.mjs`,
  `scripts/verify-pdfgen-008.mjs`;
- PDF tests: `scripts/test-pdfgen-002-validation.mjs`,
  `scripts/test-pdfgen-004-generation.mjs`;
- directly related active documentation and `package.json`.

## Database Objects

PDFGEN-008 itself adds no database object. The separate
QA-003-MFA-RLS-001 ticket adds repository migration 62 and alters 45 editorial
mutation policies; it was applied only to the local Docker Supabase stack.
Every test used its transaction/rollback boundary, and the stack was stopped
after verification. Docker retained only its local development volume and
downloaded images.

## Tests / Verification

Passed locally on 2026-08-27:

- `npm run verify:qa-001`;
- `npm run verify:qa-003`;
- `npm run verify:pdfgen-001` through `npm run verify:pdfgen-008`;
- `npm run test:pdfgen-002:validation`;
- `npm run test:pdfgen-004:generation`;
- `npm run lint -- --max-warnings=0`;
- `npx tsc --noEmit`;
- `npm run build`;
- `git diff --check`.

The 42-assertion QA-001, 31-assertion QA-003, and 23-assertion focused
PDFGEN-008 pgTAP files have internally matching plans. Static verification
confirms the exact 46-table and 30-function inventories. Runtime PDF checks
passed for strict unsafe-source rejection, an in-memory primary-plus-supplement
package, mixed EN/UA/CZ text, all three locale-specific long-content cases,
localized dates, fail-closed overflow, and exact QR decoding on normal and
rotated pages.

Runtime pgTAP was rerun against local PostgreSQL 15 after a clean rebuild of all
62 repository migrations:

- PDFGEN-001/002/003/005/006/007/008: 203/203 assertions passed;
- aggregate QA-001: 42/42 assertions passed;
- aggregate QA-003: 31/31 assertions passed;
- PDFGEN plus aggregate QA result: 276/276 assertions passed;
- including the focused 10-assertion content-policy hardening suite: 286/286.

The previously reported aggregate QA-003 failure is resolved locally by the
separate QA-003-MFA-RLS-001 migration. All 45 editorial
`INSERT`/`UPDATE`/`DELETE` policies now call
`internal.is_mfa_requirement_satisfied()` without making Content Manager MFA
mandatory by default. PDFGEN helper-delegated MFA remains covered without
weakening the content-policy assertion.

## Security Notes

- No service-role, SMTP, token-encryption, or HMAC secret is added or exposed.
- No private object URL or real token enters a test fixture.
- PDF runtime fixtures are fictional and remain in memory.
- Production remains untouched during this stage.

## Deviations / Open Questions

- Full mutation E2E requires an explicitly approved non-production cohort and
  permanent-number allocation.
- Cohort-size acceptance at 200, 540, and 1000 items is not part of this first
  stage and must not be represented as passed.
- The first approved real complete-package VEDOS delivery remains a separate
  operational acceptance dependency.
- The separate content-policy migration is verified locally and in hosted
  Development; Production remains untouched.

## Next Dependency

Address the independent `import_learners` lint finding in a separate ticket.
Production policy/function promotion and the later PDFGEN mutation stage remain
separate; the mutation stage additionally requires an approved non-production
cohort and permanent-number allocation.
