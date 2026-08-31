# Credential Document Generation Specification v2

Product: Nobel ITBS Website and Credential Registry
Status: Owner-approved Release 1 requirement
Approved: 2026-08-25
Ticket: `CRD-PDFGEN-001`

## 1. Decision

Release 1 must generate personalized credential PDF packages from reusable,
programme-specific templates. The manual-only workflow in which an admin
creates every personalized PDF outside the platform is not operationally
acceptable.

This decision supersedes the earlier v2 statements that placed automatic PDF
generation in the post-launch backlog. It does not change the existing
credential identity, lifecycle, numbering, verification, privacy, or delivery
rules.

## 2. Goal

An authorized admin must be able to configure a reusable template package once
and then generate consistent personalized credential files for one learner or
an explicitly selected group of learners.

The platform must:

- reserve each document number before generating its files;
- generate the QR verification URL server-side;
- place approved learner and credential data into the templates;
- generate one or more PDF files per credential;
- support multi-page PDF files;
- keep all templates and generated files private;
- let an admin review generated files before activation;
- support controlled batch activation and delivery after review.

## 3. Core Model

### 3.1 Template Package

A Template Package is a reusable internal configuration for one exact issuing
context:

- programme;
- optional programme run override;
- credential type;
- credential language;
- named document variant where a programme has more than one document package.

Examples of variants include an intermediate certificate, final diploma, or a
programme tier with a different document package.

A Template Package is not a Credential Set. It has no learner, number, QR,
public page, or credential lifecycle status.

### 3.2 Template Package Version

Template Packages are versioned.

Rules:

- a version starts as `draft`;
- only a validated draft may become `published`;
- a published version's source documents, placements, rendering rules, and
  issuing context are immutable;
- changing design, field placement, or file composition creates a new version;
- a published version may be `retired` for future generation;
- previously generated files retain the exact template-version reference;
- template versions are retained for audit and reproducibility even though old
  generated credential PDF versions are not retained by Release 1.

Template version states are template-management states and do not add or alter
credential lifecycle statuses.

### 3.3 Template Documents

One Template Package version contains one or more Template Documents.

Each Template Document has:

- an uploaded source PDF;
- a credential file type such as `main_certificate`, `supplement`, or
  `transcript`;
- an administrative label;
- an output filename pattern;
- a stable sort order;
- a primary/main flag;
- one or more pages.

Exactly one Template Document in the package is primary. Other files are
optional additional documents.

Examples:

- one-page Certificate plus a three-page Supplement;
- two-page Diploma plus a multi-page Diploma Supplement;
- one Certificate only.

The generated credential receives the same file package: one private
`credential_files` row per output PDF, with exactly one primary file.

### 3.4 Field Placements

The source PDF supplies the visual design. The platform overlays only approved
dynamic fields through a constrained placement editor; it is not a full PDF or
page-layout designer.

Each placement defines:

- document and page number;
- field key;
- x/y coordinates and width/height;
- font family, size, minimum size, weight, colour, and alignment where relevant;
- single-line, wrap, or shrink-to-fit behaviour;
- date formatting where relevant;
- required/optional status.

Allowed Release 1 dynamic fields:

- `holder_name`;
- `programme_title`;
- `credential_type`;
- `document_number`;
- `issue_date`;
- `completion_date`;
- `programme_run_label`;
- `verification_qr`;
- `verification_url`;
- approved template-level static text fields.

Arbitrary code, expressions, HTML, remote images, remote fonts, and database
queries are forbidden in templates.

Course-specific hours, ECTS, module lists, signatures, stamps, and other fixed
design content may be baked into the uploaded PDF. If such content must vary per
learner or run later, it requires an explicitly approved field addition rather
than free-form template logic.

## 4. Template Management Workflow

Actors:

- Owner;
- Super Admin.

Credential Manager may use published templates and generate documents but may
not create, edit, publish, retire, or delete template definitions.

Workflow:

1. Admin creates a draft Template Package for programme, optional run,
   credential type, language, and variant.
2. Admin uploads one or more source PDFs.
3. Admin assigns file type, label, filename pattern, sort order, and primary
   file.
4. Admin places allowed dynamic fields on any page of each source PDF.
5. System renders a private sample preview using non-production sample data.
6. System validates the entire package.
7. Admin publishes the immutable version.

Publication validation must reject:

- no primary document or more than one primary document;
- an encrypted or malformed source PDF;
- unsupported active PDF content;
- missing required field placements;
- placements outside page boundaries;
- unsupported or missing fonts;
- duplicate output filenames;
- a credential type/language mismatch;
- a template package with no documents.

## 5. Single Credential Generation

Actors:

- Owner;
- Super Admin;
- Credential Manager.

All actors require active access and MFA/AAL2.

Workflow:

1. Admin selects learner, programme/run, completion context, credential type,
   language, issue date, and published Template Package version.
2. System validates that the package matches the selected context.
3. System creates the pending credential, finds/creates its Credential Set,
   reserves the permanent document number, and generates protected token
   material.
4. Server decrypts or uses the verification token only inside the controlled
   generation process and builds the QR verification URL.
5. Server renders every Template Document, including every page.
6. Generated PDFs are attached to the pending credential in
   `private-credentials`; exactly one is primary.
7. Admin reviews the generated files through short-lived controlled URLs.
8. Admin may regenerate while the credential is pending.
9. Admin activates and delivers the reviewed credential through the existing
   activation workflow.

The raw verification token must never be logged, placed in audit/history, or
returned separately to the browser.

## 6. Batch Generation

Batch generation is required. Automatic PDF generation without batch handling
does not solve the approved operational problem.

One batch has one shared issuing context:

- programme;
- optional programme run;
- completion date;
- credential type;
- credential language;
- issue date;
- published Template Package version;
- explicitly selected learners.

Rules:

- the admin-facing workflow has no fixed 500-learner cap and must support the
  full explicitly selected cohort, including groups of 200, 540, 1000, or more;
- archived learners are rejected;
- learners already holding a non-voided credential for the exact issuing
  context are shown as conflicts and are not silently duplicated;
- the admin must review the learner list and context before confirmation;
- credentials, permanent numbers, tokens, and PDFs are created per learner;
- processing is resumable and idempotent;
- one failed item does not delete or corrupt successful items;
- an item that reserved a number but failed to generate remains `pending` and
  retryable; its number is never reused;
- the result reports generated, failed, conflicting, and retryable items;
- no batch action may hard-delete credentials or number-log entries.

Serverless execution must automatically divide the selected cohort into
bounded, configurable processing chunks rather than one unbounded request. The
chunk size is an internal technical control, not a product-visible cohort
limit. The batch must keep one aggregate progress/result view and resume from
the last safely recorded item. Release 1 must not add an external queue vendor
solely for this workflow.

## 7. Review, Batch Activation, and Delivery

Generated documents are not activated automatically.

The batch review screen must show:

- learner;
- document number;
- template package/version;
- generated file count and page counts;
- generation status;
- validation errors;
- private preview actions;
- activation eligibility.

Admin may explicitly select reviewed items and run batch activation.

Batch activation rules:

- every selected credential must still be `pending`;
- every selected credential must have one primary PDF;
- each credential activates independently;
- each credential receives its own immutable delivery-history entry;
- email failure does not roll back activation;
- one item's delivery failure does not block other selected items;
- activation/delivery also runs in bounded, resumable, idempotent chunks;
- the result clearly separates activated/sent, activated/not-sent, and failed
  items.

All current PDFs in the generated package are sent together through VEDOS.

## 8. Regeneration and Correction

Pending credential:

- may regenerate its current package using the same number and QR;
- regeneration replaces the current generated files in place;
- the credential identity and Template Package issuing context remain fixed;
- generation attempts are audited.

Valid credential:

- regeneration/replacement requires a mandatory private reason;
- generated PDFs may be replaced only through the existing controlled valid
  credential correction workflow;
- status remains `valid`;
- document number and QR remain unchanged;
- replacement does not resend automatically;
- resend remains an explicit separate action.

Revoked and voided credentials cannot generate or replace files through the
standard workflow.

## 9. Storage and File Rules

### Template sources

- stored in a dedicated private `credential-templates` bucket;
- never public;
- accessible only through controlled server routes;
- versioned template objects are immutable after publication;
- maximum source PDF size is 20 MB per Template Document unless a later tested
  implementation limit is approved.

### Generated outputs

- stored in the existing private `private-credentials` bucket;
- remain subject to current credential-file size, MIME, primary-file, access,
  replacement, activation, and delivery rules;
- are never publicly downloadable;
- do not expose source template paths or generation metadata publicly.

PDF validation must verify more than the browser-supplied MIME type. Encrypted
files, malformed files, embedded JavaScript, embedded attachments, launch
actions, and unsupported external-resource behaviour must be rejected or
removed by a tested sanitization/flattening step before publication or output.

## 10. Typography and Layout Safety

The generation engine must support Latin, Ukrainian Cyrillic, and Czech
characters through approved server-bundled fonts.

Rules:

- fonts used for dynamic text must be embedded in generated PDFs;
- no font is downloaded from a public URL during generation;
- long names and titles must use configured wrap or shrink-to-fit rules;
- text must never be silently clipped;
- generation fails visibly when required content cannot fit at the allowed
  minimum size;
- QR output must remain scannable at the configured printed size;
- every page preserves the source PDF dimensions and orientation.

## 11. Data Model Additions

Implementation is expected to add forward-only migrations for private,
RLS-protected objects equivalent to:

- `credential_template_packages` — issuing context and variant identity;
- `credential_template_versions` — version records with draft/published/retired
  state and immutable published rendering content;
- `credential_template_documents` — one or more source PDFs per version;
- `credential_template_field_placements` — constrained field/page geometry;
- `credential_generation_batches` — private batch context and aggregate state;
- `credential_generation_batch_items` — one learner/credential result per item;
- `credential_file_generations` — generated-file provenance without raw token or
  private file content.

Exact table and enum names may be adjusted during the database ticket, but the
separation of package, immutable version, document, placement, batch, item, and
generated-file provenance must be preserved.

The data model must not add new credential lifecycle statuses.

## 12. API Additions

Implementation is expected to provide protected server routes equivalent to:

- list/create Template Packages;
- load/update a draft package version;
- upload/delete draft Template Documents;
- save field placements;
- render a private sample preview;
- validate and publish a template version;
- retire a published version;
- generate or regenerate files for one pending credential;
- create and confirm a generation batch;
- process/retry bounded batch items;
- load batch results;
- activate explicitly selected reviewed batch items.

Every mutation must validate active role and MFA. Browser code must never
receive Supabase service-role credentials, private bucket paths, encryption
keys, HMAC secrets, raw verification tokens, or unrestricted storage access.

## 13. Audit and History

Audit events are required for:

- template package creation;
- draft update;
- template source upload/delete;
- version publication/retirement;
- preview generation;
- single and batch generation start/completion/failure;
- pending regeneration;
- batch activation request and per-credential result.

Credential History must record generated-file attachment/replacement and the
template package/version identifiers needed for private traceability.

Audit/history must not store:

- raw verification tokens;
- generated PDF bytes;
- source PDF bytes;
- private storage paths;
- learner contact details;
- email message bodies;
- unnecessary batch PII.

## 14. Permissions

Owner and Super Admin:

- manage, preview, publish, and retire templates;
- generate single/batch documents;
- review and activate generated credentials.

Credential Manager:

- read published template metadata needed for generation;
- generate single/batch documents;
- review generated files;
- activate generated credentials;
- cannot mutate or publish template definitions.

Content Manager:

- no template, generation-batch, learner, credential, or private-file access.

Public/anonymous users:

- no template, batch, generation metadata, or PDF access.

## 15. Explicitly Out of Scope

- automatic LMS/Moodle completion or eligibility decisions;
- automatic selection of who has earned a credential;
- public PDF download;
- public template preview;
- a full free-form PDF/page designer;
- arbitrary template scripts or formulas;
- external document-generation vendors;
- automatic activation without human review;
- automatic resend after regeneration;
- old generated credential PDF version retention;
- changes to credential statuses or public verification projection.

## 16. Acceptance Criteria

The Release 1 document-generation extension is accepted only when:

- one published Template Package can produce a primary PDF plus optional
  additional multi-page PDFs;
- template context is enforced by programme, optional run, credential type,
  language, and explicit variant;
- dynamic EN/UA/CZ text and QR render correctly with embedded fonts;
- long-name overflow and unsafe PDF cases fail safely and visibly;
- single generation creates private current PDFs for a pending credential;
- an explicitly selected cohort of any operational size is previewed and
  confirmed as one batch, then automatically processed in bounded, resumable,
  idempotent chunks; acceptance must cover at least 200, 540, and 1000 items;
- every generated credential has its own permanent number and QR;
- failed items never cause number reuse;
- admins can privately review every generated file before activation;
- explicitly selected reviewed items can be batch-activated;
- all current package PDFs are delivered together through VEDOS;
- activation remains valid when email delivery fails;
- permissions, MFA, RLS, audit, history, private storage, and public privacy
  tests pass;
- no manual per-learner PDF composition is required for a configured template
  package.

## 17. Implementation Sequence

Implement one ticket at a time:

1. `PDFGEN-001 Template and generation database foundation`;
2. `PDFGEN-002 Private template storage and validation`;
3. `PDFGEN-003 Template Package admin and field placement editor`;
4. `PDFGEN-004 Server-side multi-document PDF generation`;
5. `PDFGEN-005 Single credential generation and regeneration workflow`;
6. `PDFGEN-006 Batch creation, generation, retry, and review`;
7. `PDFGEN-007 Batch activation and VEDOS delivery`;
8. `PDFGEN-008 Security, RLS, privacy, typography, and end-to-end acceptance`.

Canonical-domain acceptance and consent-gated GA4 page-view analytics were
completed as separate QA-005 tickets on 2026-08-31. Custom analytics events,
real credential VEDOS acceptance, and live backup/restore remain separate
operational items. Per Owner decision, backup activation/restore is deferred
until real learners and credentials exist; document generation must be
implemented before operational credential issuance begins.
