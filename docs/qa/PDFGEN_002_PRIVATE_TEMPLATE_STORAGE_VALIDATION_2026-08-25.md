# PDFGEN-002 Private Template Storage and Validation QA

Date: 2026-08-25
Status: accepted at the currently available code, Preview, dev, and Production level

## Scope

This ticket implements only the source-PDF boundary required before the Template Package editor:

- private `credential-templates` Storage bucket;
- strict server-side PDF validation;
- atomic draft document/page metadata attachment;
- controlled draft deletion with compensating Storage rollback;
- private server-proxied source preview;
- published/retired object immutability;
- publication refusal when any source object is missing.

It does not implement the PDFGEN-003 package/placement UI, sample rendering, publication UI, credential generation, batch processing, or delivery.

## Implemented Boundary

### Storage and database

- Forward-only migration: `20260825120000_pdfgen_002_private_template_storage_validation.sql`.
- Bucket is private, PDF-only, and limited to 20 MB per object.
- No `storage.objects` browser policy is created. Storage operations use the server-only service role after application role/MFA authorization.
- Canonical object identity is `{templateVersionId}/{documentId}.pdf`.
- A Storage trigger blocks non-canonical paths, identity changes, and update/delete of objects owned by published or retired versions.
- The Storage trigger takes a share lock on the owning version before draft object update/delete, closing the concurrent publish/delete race.
- Publication checks that every Template Document still has a corresponding private Storage object.
- Attach/delete functions require Owner or Super Admin plus the shared MFA/AAL2 guard and require the Storage operation to occur in the correct order.
- Source paths and SHA-256 values are no longer available through authenticated whole-row reads; only the approved safe metadata columns remain selectable under RLS.

### PDF validation

The upload route does not trust the filename, browser MIME declaration, or `%PDF-` header alone. It uses `pdfjs-dist` server-side and rejects rather than sanitizes unsupported files.

Checks include:

- exact `application/pdf` MIME and 1-byte to 20-MB size boundary;
- readable PDF structure with strict parser error handling;
- encrypted/password-protected input;
- XFA/AcroForm content;
- JavaScript and document/page actions;
- embedded attachments and file specifications;
- launch, remote navigation, submit/import, rich media, URI, and other unsupported active/external content;
- page annotations/actions;
- complete page operator parsing;
- finite positive page dimensions for every page;
- SHA-256 calculation and contiguous multi-page metadata.

### Protected API

- `POST /api/v1/admin/credential-templates/versions/{versionId}/documents` validates and uploads one draft Template Document and atomically stores its page metadata.
- `GET /api/v1/admin/credential-templates/versions/{versionId}/documents/{documentId}` proxies the private PDF inline with `private, no-store` caching; it does not return a signed Storage URL or source path.
- `DELETE /api/v1/admin/credential-templates/versions/{versionId}/documents/{documentId}` deletes a draft object first, deletes metadata through the guarded function, and restores the object if metadata deletion fails.

All routes require a valid admin session, Owner or Super Admin role, and MFA/AAL2.

## Verification

Passed locally:

- focused validator tests for valid one-page and two-page PDFs;
- page size and SHA-256 assertions;
- rejection tests for malformed/non-PDF input and active-content names including encryption, JavaScript (including escaped names), attachments, launch actions, URI, and forms;
- `verify:pdfgen-002` static contract;
- updated `verify:pdfgen-001` regression contract;
- updated `verify:qa-001` aggregate RLS/grant contract;
- all 72 non-live repository verifiers;
- ESLint;
- TypeScript `--noEmit`;
- Next.js production build, including both protected routes.

Passed in linked dev through a transactionally applied/recorded migration and a
separate read-only audit:

- migration history contains 56 rows and records `20260825120000` with the
  expected name;
- `credential-templates` is private, PDF-only, and 20 MB;
- no browser Storage policy references the bucket;
- both safety triggers and all four PDFGEN-002 database functions exist;
- authenticated whole-row `credential_template_documents` SELECT is absent;
- source bucket/path/hash columns are not selectable by `authenticated`;
- credential statuses are unchanged;
- no Template Document fixture rows exist.

Passed in Preview and Production:

- PR #31 Preview reached Ready with 2/2 checks passing;
- PR #31 was merged as `970fd6cb7f1d929c33a1efb3686df716b9ae268c`, and the merge commit's Production check passed;
- Production preflight confirmed 55 prior migrations, no PDFGEN-002 migration record, no `credential-templates` bucket, and zero Template Document rows;
- migration `20260825120000` was applied and recorded transactionally in Production;
- the independent Production audit confirmed 56 migrations and returned true for all ten controls: migration record, private PDF-only 20-MB bucket, zero browser Storage policies, both safety triggers, all four functions, no authenticated whole-row SELECT, hidden source bucket/path/hash columns, unchanged credential statuses, and zero Template Document rows.

Committed pgTAP coverage:

- `pdfgen_002_private_template_storage_validation.test.sql` with 20 assertions;
- updated PDFGEN-001 suite with 66 assertions;
- updated aggregate QA-001 suite with 40 assertions.

## Verification Limitation

The committed pgTAP files were not executed locally because this workstation has no Docker-compatible local Supabase runtime. This is an explicit QA item, not a claimed pass. Authenticated browser upload/preview/delete acceptance with real template packages is deferred until PDFGEN-003 supplies the package UI and a real source template exists; the server routes, validator rejection samples, rollback contracts, deployment, and dev/Production database security boundaries passed the currently available automated and read-only checks.

## Security Notes

- No service-role key is exposed to browser code.
- No public/anonymous template source access exists.
- Credential Manager and Content Manager cannot upload, preview, delete, or mutate template sources.
- The browser receives validated safe metadata and proxied PDF bytes only; it receives neither private source path nor source hash.
- Published/retired source objects cannot be changed or deleted.
- Audit/history contracts remain path-, byte-, hash-, token-, and unnecessary-PII-free.
- Credential statuses remain exactly `pending`, `valid`, `revoked`, and `voided`.

## Next Dependency

The next ticket is `PDFGEN-003 Template Package Admin and Field Placement Editor`. PDFGEN-003 must consume these routes, provide the first authenticated end-to-end template workflow acceptance, and must not add direct browser Storage access.
