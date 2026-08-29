# PDFGEN-008 Generation Security and End-to-End Acceptance

Date: 2026-08-28
Status: PDFGEN runtime security gate passed; hosted Development 200-item Batch A,
540-item Batch B, and 1000-item Batch C generation passed; 55 Batch A items are
privately reviewed; permanent QA activation guard is accepted in hosted
Development; Production is untouched

## Scope For This Stage

The initial stage implemented the first four approved PDFGEN-008 work items:

1. reconcile the active documentation and exact acceptance matrix;
2. extend aggregate RLS, private Storage, function-grant, and audit/privacy coverage;
3. extend the Owner/Super Admin/Content Manager/Credential Manager and AAL1/AAL2 matrix;
4. strengthen local unsafe-PDF, multi-document, multi-page, EN/UA/CZ, long-content, and QR tests.

The approved hosted Development stage then created synthetic 200/540/1000
cohorts, confirmed a 200-item Batch A, and completed one deliberately bounded
generation/review path followed by three approved ten-item retry/review slices
and one approved 24-item retryable-remainder stage. After retryable recovery was
complete, the normal resumable batch process generated the remaining 145 queued
items. It did not activate a credential, send email, or mutate Production.

The next approved hosted Development stage confirmed the complete 540-item
synthetic Batch B against immutable published template v1. Opening that batch
exposed a large-ID detail-loading bottleneck before any number was reserved.
PDFGEN-008 then added bounded 100-ID relation loading, stable item pagination,
and linear provenance grouping, with regression coverage for both 540 and 1000
IDs. The deployed correction loaded all 540 queued items successfully. The
normal generator then completed all 540 items across safe resumable checkpoints,
including browser fetch interruptions after 230, 255, and 275 committed items.
No item was duplicated, retried, reviewed, activated, or emailed.

The final approved throughput stage confirmed and generated the complete
1000-item synthetic Batch C against the same immutable published template v1.
The normal resumable generator completed the cohort without duplicate number
reservation. Three isolated server failures became retryable and then generated
successfully on attempt 2 with their original permanent numbers. All 1000
private PDFs subsequently passed a server-side file, provenance, safety, text,
hash, and QR audit. No Batch C item was reviewed, activated, or emailed.

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
- hosted runtime corrections: `lib/credentials/generation.ts`,
  `lib/credential-templates/pdf-validation.ts`,
  `lib/credential-templates/pdf-generation.ts`, and `next.config.mjs`;
- full-cohort reference pagination coverage:
  `lib/credentials/pagination.ts`,
  `scripts/test-pdfgen-008-cohort-pagination.mjs`;
- large-batch detail loading and regression coverage:
  `lib/credentials/chunking.ts`, `lib/credentials/batch-generation.ts`,
  `scripts/test-pdfgen-008-batch-detail-chunking.mjs`;
- directly related active documentation and `package.json`.

## Database Objects

The PDFGEN-008 QA cohort guard adds a forward-only migration with permanent
batch activation-block metadata, synthetic-cohort marking/backfill, privacy-safe
audit coverage, and fail-closed activation/delivery triggers. It is implemented
locally and applied in hosted Development only. The
separate QA-003-MFA-RLS-001 ticket adds repository migration 62 and alters 45
editorial mutation policies and is already applied in hosted Development and
Production. The local guard tests used transaction/rollback boundaries, and the
stack was stopped after verification. Docker retained only its local
development volume and downloaded images.

Hosted Development data now includes the approved synthetic 200/540/1000
learner cohorts and one fully generated 200-item Batch A with 200 pending
credentials, permanent reserved numbers, private generated PDFs, and append-only
provenance rows. The first 55 items are reviewed; the 145 normal-batch items
remain generated and intentionally unreviewed.
The batch remains pinned to immutable published template v1. Published template
v2 exists for future batches but was not used to repin or mutate Batch A.

Hosted Development also contains one fully generated 540-item Batch B with 540
pending credentials, permanent reserved numbers
`NITBS-C-2026-000201–000740`, 540 private generated PDFs, and 540 append-only v1
provenance rows. All 540 items remain generated and intentionally unreviewed.
The batch is pinned to immutable published template v1. No Batch B activation,
delivery, review, or email row exists, and `NITBS-C-2026-000741` remains free.

Hosted Development now also contains one fully generated 1000-item Batch C with
1000 pending credentials, permanent reserved numbers
`NITBS-C-2026-000741–001740`, 1000 private primary PDFs, and 1000 append-only v1
provenance rows. All items remain generated and intentionally unreviewed. The
batch is pinned to immutable published template v1. No Batch C activation,
delivery, review, or email row exists, and `NITBS-C-2026-001741` remains free.

## Tests / Verification

Passed locally on 2026-08-27 and rerun for the final Batch C stage on
2026-08-28 where applicable:

- `npm run verify:qa-001`;
- `npm run verify:qa-003`;
- `npm run verify:pdfgen-001` through `npm run verify:pdfgen-008`;
- `npm run test:pdfgen-002:validation`;
- `npm run test:pdfgen-004:generation`;
- `npm run test:pdfgen-008:pagination`;
- `npm run test:pdfgen-008:chunking`;
- `npm run lint -- --max-warnings=0`;
- `npx tsc --noEmit`;
- `npm run build`;
- `git diff --check`.

The final hosted-runtime correction was also verified by inspecting the local
Next.js output trace for the exact batch retry route. Its serverless manifest
contains `pdf.worker.mjs`, Noto Sans Regular, and Noto Sans Bold. This closes the
Vercel-only fake-worker failure while keeping both single and batch generation
assets explicit.

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

The later permanent QA-cohort guard stage also passed its focused local pgTAP
suite 27/27, static regression checks, ESLint, TypeScript, the 51-page production
build, and diff validation. In hosted Development, migration
`20260829120000_pdfgen_008_qa_cohort_activation_guard.sql` was the only pending
migration, applied successfully, and reached 66/66 parity. The post-apply audit
confirmed three locked batches, 1,740 pending cohort credentials, zero valid
cohort credentials, zero activation requests/items, zero cohort email sends,
and three lock audit events. A transaction-scoped hosted negative test rejected
all four guarded mutation paths and rolled back. Vercel Preview completed for
commit `cdbb779`; authenticated Owner/AAL2 UI acceptance confirmed `QA locked`
for 200/540/1000, retained review controls, no activation controls, and no
console warnings or errors.

The previously reported aggregate QA-003 failure is resolved locally by the
separate QA-003-MFA-RLS-001 migration. All 45 editorial
`INSERT`/`UPDATE`/`DELETE` policies now call
`internal.is_mfa_requirement_satisfied()` without making Content Manager MFA
mandatory by default. PDFGEN helper-delegated MFA remains covered without
weakening the content-policy assertion.

## Hosted Development Mutation Evidence

- approved number pool: `NITBS-C-2026-000001` through
  `NITBS-C-2026-001740`, partitioned 200 + 540 + 1000;
- Batch A: 200 synthetic learners, immutable published template v1;
- bounded control item: `E2eA0001`, document number
  `NITBS-C-2026-000001`;
- final batch item state: `reviewed`, generation attempt 7,
  `last_error_code = null`, reviewer and review timestamp present;
- credential state remains `pending`; no activation or email record exists;
- exactly one credential file exists, is primary, is a private PDF, uses the
  canonical path invariant, and has a valid bounded size;
- exactly one private Storage object exists and the bucket is non-public;
- exactly one provenance row exists, points to template v1, batch item, and
  attempt 7, carries valid SHA-256 inputs/outputs, and resolves to one page;
- `000001` exists once as reserved, `000002` is absent, and only one number from
  the approved pool is consumed;
- rendered PDF is A4 landscape, one page, unencrypted, contains no JavaScript or
  form, and visually preserves the holder, programme, issue date, document
  number, and QR without clipping;
- the rendered QR decodes to HTTPS with the expected `/verify/<43-char-token>`
  shape. The raw token and signed preview URL were not added to the repository
  or acceptance report;
- Batch A had 145 queued, 54 retryable, and 1 reviewed before the first approved
  ten-item continuation.

The approved continuation then processed positions 2–11 only:

- all ten started as retryable attempt 1 with no credential and no reserved
  target number;
- individual guarded retry produced ten generated items at attempt 2 with
  numbers `NITBS-C-2026-000002` through `NITBS-C-2026-000011`;
- server-side acceptance confirmed ten pending credentials, ten primary private
  PDFs, ten canonical Storage objects, ten v1 provenance rows, valid hashes,
  ten total pages, and zero error, activation, or email records;
- every PDF was rendered for review; the contact sheet confirmed the matching
  holder and number on each item without clipping or misplaced content;
- every one of the ten QR codes decoded independently to the expected HTTPS
  `/verify/<43-char-token>` shape;
- all ten were marked reviewed only after the complete visual and QR pass;
- after this slice, Batch A was 145 queued, 44 retryable, and 11 reviewed;
- exactly 11 approved-pool numbers are consumed and `000012` remains unused.

The second approved continuation then processed positions 12–21 only:

- all ten started as retryable attempt 1 with no credential and no reserved
  target number;
- individual guarded retry produced ten generated items at attempt 2 with
  numbers `NITBS-C-2026-000012` through `NITBS-C-2026-000021`;
- server-side acceptance confirmed ten pending credentials, ten primary private
  PDFs, ten canonical Storage objects, ten v1 provenance rows, valid hashes,
  ten total pages, and zero error, activation, or email records;
- every downloaded PDF SHA-256 matched its append-only provenance row;
- every PDF was rendered for review; the contact sheet confirmed the matching
  holder and number on each item without clipping or misplaced content;
- PDF metadata confirmed one unencrypted A4 landscape page per item with no
  JavaScript or form;
- every one of the ten QR codes decoded independently to the expected HTTPS
  `/verify/<43-char-token>` shape;
- all ten were marked reviewed only after the complete visual, metadata, hash,
  and QR pass;
- the final Batch A state is 145 queued, 34 retryable, and 21 reviewed;
- exactly 21 approved-pool numbers are consumed and `000022` remains unused.

The third approved continuation then processed positions 22–31 only:

- all ten started as retryable attempt 1 with no credential and no reserved
  target number;
- individual guarded retry produced ten generated items at attempt 2 with
  numbers `NITBS-C-2026-000022` through `NITBS-C-2026-000031`;
- server-side acceptance confirmed ten pending credentials, ten primary private
  PDFs, ten canonical Storage objects, ten v1 provenance rows, valid hashes,
  ten total pages, and zero error, activation, or email records;
- every downloaded PDF SHA-256 matched its append-only provenance row;
- every PDF was rendered for review; the contact sheet confirmed the matching
  holder and number on each item without clipping or misplaced content;
- PDF metadata confirmed one unencrypted A4 landscape page per item with no
  JavaScript or form;
- every one of the ten QR codes decoded independently to the expected HTTPS
  `/verify/<43-char-token>` shape;
- all ten were marked reviewed only after the complete visual, metadata, hash,
  and QR pass;
- the final Batch A state is 145 queued, 24 retryable, and 31 reviewed;
- exactly 31 approved-pool numbers are consumed and `000032` remains unused.

The approved retryable-remainder stage then processed positions 32–55 only:

- all 24 started as retryable attempt 1 with no credential and no reserved
  target number;
- individual guarded retry produced 24 generated items at attempt 2 with
  numbers `NITBS-C-2026-000032` through `NITBS-C-2026-000055`;
- server-side acceptance confirmed 24 pending credentials, 24 primary private
  PDFs, 24 canonical Storage objects, 24 v1 provenance rows, valid hashes,
  24 total pages, and zero error, activation, or email records;
- every downloaded PDF SHA-256 matched its append-only provenance row;
- all 24 PDFs were rendered across three complete contact sheets; holder and
  number pairs matched without clipping or misplaced content;
- a corrupted intermediate contact-sheet composition for positions 40–47 was
  discarded and rebuilt serially from the already verified page renders; the
  corrected sheet passed visual review, and the source PDFs were unaffected;
- PDF metadata confirmed one unencrypted A4 landscape page per item with no
  JavaScript or form;
- all 24 QR codes decoded independently to the expected HTTPS
  `/verify/<43-char-token>` shape;
- all 24 were marked reviewed only after the complete visual, metadata, hash,
  and QR pass;
- the final Batch A state is 145 queued and 55 reviewed, with no retryable,
  processing, activating, or activated item;
- exactly 55 approved-pool numbers are consumed and `000056` remains unused.

The normal resumable batch process then generated positions 56–200:

- one approved `Generate remaining 145` action iterated the configured bounded
  chunks until no queued item remained;
- progress increased monotonically from 0 to 145 generated items, processing
  terminated normally, and no retryable item appeared;
- all 145 items generated on attempt 1 with numbers
  `NITBS-C-2026-000056` through `NITBS-C-2026-000200`;
- server-side acceptance confirmed 145 pending credentials, 145 primary private
  PDFs, 145 canonical Storage objects, 145 v1 provenance rows, valid hashes,
  145 total pages, and zero error, review, activation, or email records;
- every private PDF was downloaded in turn, matched against its append-only
  output SHA-256, inspected with PDF metadata tooling, rendered for QR decoding,
  and deleted from temporary storage immediately after verification;
- all 145 PDFs were one unencrypted A4 landscape page with no JavaScript or
  form, and all 145 QR codes decoded to the expected HTTPS
  `/verify/<43-char-token>` shape;
- a visual spot-check spanning positions 56, 57, 80, 100, 125, 150, 175, and
  200 confirmed holder/number matching and unclipped layout across the range;
- the resulting Batch A state is 145 generated and 55 reviewed, with no queued,
  retryable, processing, activating, or activated item;
- exactly 200 approved-pool numbers are consumed and `000201` remains unused.

The hosted fixes were isolated to this ticket: full-cohort reference pagination,
placement lookup through template documents, PDF.js Node canvas bootstrapping,
actual-glyph height measurement, sanitized validation diagnostics, preserved
wrapped error cause, explicit Vercel worker/font output tracing, bounded 100-ID
batch-detail relation loading, stable item pagination beyond the PostgREST
1000-row boundary, and linear provenance grouping.

The approved 540-item Batch B throughput stage then passed:

- preflight confirmed exactly 540 active synthetic learners
  `E2eB0001–E2eB0540`, no existing Batch B item, and a completely free approved
  range `NITBS-C-2026-000201–000740`;
- server preview returned exactly 540 selected, 540 accepted, zero conflicts,
  zero archived learners, template v1, issue date `2026-08-27`, and no
  completion date;
- confirmation created exactly 540 queued items and did not reserve a number;
- the deployed large-batch correction loaded the complete 540-item review model
  without one oversized UUID filter or a 1000-row truncation;
- browser fetch interruptions occurred only after atomic item completion. DB
  checkpoints were 230 generated/310 queued, 255 generated/285 queued, and 275
  generated/265 queued, always with zero processing lease, retryable, conflict,
  failed, or error-code item before resume;
- each guarded resume continued only the remaining queued items. Permanent
  numbers stayed contiguous and unique, and no item exceeded generation
  attempt 1;
- final state is 540 generated, zero queued/processing/retryable/conflict/
  reviewed/activating/activated/failed items, and zero activation or email rows;
- all 540 credentials remain `pending`, with numbers
  `NITBS-C-2026-000201` through `NITBS-C-2026-000740`; the next approved number
  `NITBS-C-2026-000741` is unused;
- server-side acceptance confirmed 540 primary private PDFs, 540 canonical
  Storage objects, 540 immutable-template-v1 provenance rows, valid generation
  attempt 1 and SHA-256 fields, and a non-public `private-credentials` bucket;
- every private PDF was downloaded in turn, matched against its append-only
  output SHA-256, checked for exact stored size, inspected with PDF metadata
  tooling, checked for the matching synthetic holder and document number,
  rendered at 240 DPI for QR decoding, and deleted from temporary storage;
- all 540 PDFs are one unencrypted A4 landscape page with no form, JavaScript,
  embedded-file, launch, submit, or open action, and all 540 QR codes decode to
  an HTTPS `/verify/<43-char-token>` shape;
- visual positions 1, 2, 25, 100, 200, 300, 400, 500, 539, and 540 confirmed
  correct holder/number pairs, consistent layout, QR placement, and no clipping
  across the full range.

The approved 1000-item Batch C throughput stage then passed:

- preflight confirmed exactly 1000 active synthetic learners
  `E2eC0001–E2eC1000`, no existing Batch C item, and a completely free approved
  range `NITBS-C-2026-000741–001740`;
- server preview returned exactly 1000 selected, 1000 accepted, zero conflicts,
  zero archived learners, template v1, issue date `2026-08-28`, and no
  completion date;
- confirmation created exactly 1000 queued items and did not reserve a number;
- bounded processing used the batch's five-item atomic chunk size while the UI
  grouped at most 25 items per resumable action;
- committed checkpoints included 109 generated/1 retryable/890 queued,
  583 generated/2 retryable/415 queued, 810 generated/190 queued,
  970 generated/30 queued, 985 generated/15 queued, and
  995 generated/5 queued;
- positions 87, 424, and 460 recovered from isolated server failures on attempt
  2 while preserving permanent numbers `NITBS-C-2026-000827`,
  `NITBS-C-2026-001164`, and `NITBS-C-2026-001200` respectively;
- final server-reloaded state is 1000 generated and zero queued, processing,
  retryable, conflict, reviewed, activating, activated, or failed items;
- all 1000 credentials remain `pending`, with contiguous unique numbers
  `NITBS-C-2026-000741` through `NITBS-C-2026-001740`; the next approved number
  `NITBS-C-2026-001741` is unused;
- server-side acceptance confirmed 1000 primary PDFs in the non-public
  `private-credentials` bucket, 1000 canonical Storage objects, 1000
  immutable-template-v1 provenance rows, 997 attempt-1 and three attempt-2
  successful generations, and zero activation request, activation item, or
  email-send row;
- every private PDF was downloaded in turn, matched against its append-only
  output SHA-256, checked for exact stored size, matched to its expected holder
  and document number, rendered at 240 DPI for QR decoding, and discarded after
  inspection;
- all 1000 PDFs are one unencrypted A4 landscape page with no form, JavaScript,
  embedded file, launch, submit, or open action, and all 1000 QR codes decode to
  an HTTPS `/verify/<43-char-token>` shape;
- visual positions 1, 2, 25, 87, 100, 200, 300, 400, 424, 460, 500, 600, 700,
  800, 900, 999, and 1000 confirmed correct holder/number pairs, consistent
  layout, QR placement, and no clipping across the complete range;
- the machine audit completed in 696 seconds. Its one-time branch-scoped Vercel
  Preview, contact sheet, temporary files, and local CLI project material were
  deleted after evidence capture.

## Security Notes

- No service-role, SMTP, token-encryption, or HMAC secret is added or exposed.
- No private object URL or real token enters a test fixture.
- PDF runtime fixtures are fictional and remain in memory.
- Unexpected PDF validator diagnostics contain only a normalized error name and
  a redacted, control-character-stripped message capped at 240 characters;
  browser responses remain generic.
- Generated output stays in the non-public `private-credentials` bucket; local
  review used a temporary mode-0600 copy outside the repository.
- Sensitive Vercel variables remained unreadable to the local process. The
  Batch C auditor received them only inside a one-time branch-scoped Preview
  build and emitted counts and pass/fail evidence only; it never emitted secret
  values, raw verification tokens, private paths, or PDF bytes.
- Production remains untouched during this stage. No activation or VEDOS email
  operation was attempted.

## Approved Human Review And Activation Policy

- Batch A, Batch B, and Batch C are synthetic QA cohorts. They require no
  further manual review and must never be activated or emailed.
- Every real generated credential package requires 100% private human review;
  sampling is not sufficient for activation.
- The responsible administrator reviews real packages in private pages of 25,
  using thumbnails plus controlled open/zoom actions to verify holder name,
  programme, credential type, issue date, document number, QR, and layout.
- Only explicitly selected packages that passed review may be marked reviewed
  and proceed to activation. A package with a problem is excluded, corrected or
  regenerated under the same permanently reserved number, and reviewed again.
- Review and activation may be performed by different available authorized
  people. For each action the responsibility order is Owner, then Super Admin,
  then Credential Manager, and the acting user must satisfy MFA.
- Review does not activate a credential automatically. Activation and delivery
  remain separate explicit actions, and email failure must not roll back a
  successful activation.
- Accountability is preserved through separate reviewer/timestamp data,
  activation-request ownership, credential history, and the security audit log.
- The current authorization model permits all three approved credential roles
  and intentionally does not require reviewer/activator identity equality.

## Deviations / Open Questions

- Batch A 200-item, Batch B 540-item, and Batch C 1000-item generation passed in
  Development. Only Batch A positions 1–55 were individually reviewed. Batch A
  positions 56–200 and every Batch B/C item remain generated. These cohorts are
  now classified as synthetic QA-only data, require no further manual review,
  and must never be activated or emailed.
- The explicitly interrupted Batch B resume path passed at three committed
  checkpoints without duplicate number reservation, attempt escalation, or
  partial-file state.
- The Batch C retry path passed at positions 87, 424, and 460 without number
  reuse, duplicate current files, or partial provenance.
- Vercel Deployment Protection returns 401 before the anonymous public route in
  Preview. Therefore the hosted `pending -> not_found` QR response could not be
  observed anonymously at the protected Preview URL; database status, route
  logic, and existing public-verification tests remain the supporting evidence.
- The first approved real complete-package VEDOS delivery remains a separate
  operational acceptance dependency.
- The separate content-policy migration is verified locally and in hosted
  Development; Production remains untouched.
- The permanent synthetic-cohort activation guard is active and accepted in
  hosted Development. It is intentionally not promoted to Production in this
  ticket because the protected cohorts exist only in Development.

## Next Dependency

PDFGEN-008 synthetic generation and permanent non-activation acceptance are
complete in Development. The next operational dependency is a separately
approved real complete-package activation and VEDOS delivery acceptance. Any
Production promotion remains a separate ticket and authorization gate.
