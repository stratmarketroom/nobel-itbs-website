# API Specification v2

Product: Nobel ITBS Website and Credential Registry
Status: Release 1 implementation baseline

## 1. Principles

- Version prefix: `/api/v1`.
- JSON responses.
- Public, admin, and internal routes are separated.
- Public verification is server-mediated.
- Service role is server-only.
- Public routes never expose raw database errors or internal IDs.
- Admin sensitive actions require valid session, active user, role check, and MFA where required.

## 2. Public Content API

Public content may be delivered through cached Next.js server routes or server-rendered data access.

Core public data:

- content pages;
- programmes;
- programme area/type landing pages;
- partners;
- experts;
- legal pages;
- site settings needed for public CTAs.

Language behaviour:

- `en` default;
- `ua`;
- `cz`;
- fallback to English when requested translation is missing/draft.

## 3. Programme API

### Public Programme Catalogue

`GET /api/v1/public/programmes`

Release 1:

- returns list/grid data;
- no visible public filters required;
- may accept future filter query params without UI dependency.

Fields:

- slug;
- title;
- catalogue description;
- compact duration, learning volume, delivery, and instruction-language facts;
- completion-document summary;
- area;
- type;
- format;
- instruction-language codes, kept separate from the website locale;
- enrolment badge;
- current run start date where applicable;
- featured image/media if available.

The public endpoint accepts `locale=en|ua|cz`, falls back to published English
when a requested translation is missing or draft, and returns programmes in
manager-controlled `catalogue_sort_order`. Release 1 does not return pricing in
the catalogue projection.

### Public Programme Detail

`GET /api/v1/public/programmes/{slug}`

Returns sales-page structured data:

- hero;
- sections;
- pricing options;
- CTA data;
- experts;
- FAQ;
- SEO metadata.

### Programme Area/Type Landing

`GET /api/v1/public/programmes/{slug}`

The backend resolves slug against shared programme namespace:

- programme;
- programme area landing page;
- programme type landing page;
- redirect.

A historical published slug returns HTTP `301` directly to the same public API
path with the entity's current slug. The `locale` query parameter is preserved,
and redirect chains are not returned.

Slug collisions are forbidden in admin.

The response identifies the resolved entity kind. Programme responses include
structured sales sections, calculated run presentation, optional active pricing
options, and the external/contact CTA destination. Area and type responses
include structured introduction content and an automatic list of matching
published programmes.

## 4. Contact API

`POST /api/v1/public/contact-submissions`

Types:

- `general`;
- `programme_question`;
- `partner_enquiry`;
- `organisation_enquiry`.

Statuses:

- `new`;
- `processed`;
- `archived`.

For programme question:

- request includes programme slug/id context from page;
- server stores linked programme.

The public form sends the programme slug, website locale, name, email, optional
phone, message, and required privacy acknowledgement. The server resolves the
published programme ID; the visitor never selects or submits an internal UUID.
Successful creation returns `201` without returning the submission ID. Invalid
fields return `400`, an unknown programme returns `404`, and a rate-limited
request returns `429` with `Retry-After`.

Processing:

- validate;
- rate limit;
- CAPTCHA where required;
- save submission;
- optionally send a privacy-minimised Telegram notification to the manager chat.

Notification sending is attempted only after the submission is stored. A
temporary Telegram delivery failure must not discard an accepted submission or
expose provider errors in the public response. The Telegram message contains no
visitor message, email, or phone; managers open the protected admin area to read
the submission. The Telegram provider is intentionally not configured until the
pre-launch integration ticket.

Admin operations:

- `GET /api/v1/admin/contact-submissions` lists submissions and supports
  optional `status` and `type` filters;
- `GET /api/v1/admin/contact-submissions/{id}` returns the private detail for an
  authorized manager;
- `PATCH /api/v1/admin/contact-submissions/{id}` changes only the Release 1
  status.

These routes require an active Owner, Super Admin, or Credential Manager
session with satisfied MFA. Content Manager has no access.

## 5. Public Verification API

### Verify by Token

`GET /api/v1/public/verify/{token}`

Token processing:

- normalize token;
- calculate HMAC lookup;
- resolve credential server-side;
- return curated response.

### Verify by Document Number

`POST /api/v1/public/verify`

Request:

```json
{
  "documentNumber": "NITBS-C-2026-000123"
}
```

No name/surname search in Release 1.

### Verification Response

Valid:

```json
{
  "result": "valid",
  "publicStatus": "Дійсний",
  "document": {
    "documentNumber": "NITBS-C-2026-000123",
    "holderName": "John Doe",
    "programmeTitle": "Strategic Management Programme",
    "credentialType": "Certificate",
    "issueDate": "2026-05-12"
  }
}
```

Revoked:

```json
{
  "result": "revoked",
  "publicStatus": "Відкликаний"
}
```

Not found:

```json
{
  "result": "not_found",
  "message": "За цим кодом/номером документ не знайдено."
}
```

Rules:

- `pending` returns `not_found`;
- `voided` returns `not_found`;
- wrong token/number returns `not_found`;
- revoked returns status only;
- no PDF links;
- no partner data;
- no internal IDs.

## 6. Admin Auth and Users API

### Current Admin Context

`GET /api/v1/admin/me`

Returns:

- user profile;
- roles array;
- owner flag;
- active status;
- MFA requirement/status.

### User Management

Owner/Super Admin according to role rules:

- list users;
- create admin user;
- activate/deactivate;
- assign/remove roles.

Owner-only:

- create/change Super Admin;
- change Owner-related settings.

Roles are arrays, not single role.

## 7. Admin Content API

Content pages:

- list;
- detail;
- update structured sections;
- publish/unpublish translations.

Site settings:

- For Organisations Leeloo URL;
- other controlled settings.

Email templates:

- list;
- update EN/UA templates;
- no full version history;
- audit on change.

## 8. Admin Programme API

Entities:

- Programme Areas;
- Programme Types;
- Programmes;
- Programme Runs;
- Pricing Options;
- Programme slug redirects.

Capabilities:

- CRUD by Content Manager/Super Admin/Owner;
- Credential Manager read-only reference access only;
- publish/draft translation status per language;
- manage sales sections;
- manage pricing options;
- manage Leeloo and partner-site application URLs.

Implemented Release 1 routes:

- `GET|POST /api/v1/admin/programme-areas`;
- `GET|PATCH|DELETE /api/v1/admin/programme-areas/{id}`;
- `GET|POST /api/v1/admin/programme-types`;
- `GET|PATCH|DELETE /api/v1/admin/programme-types/{id}`;
- `GET|POST /api/v1/admin/programmes`;
- `GET|PATCH|DELETE /api/v1/admin/programmes/{id}`;
- `GET|POST /api/v1/admin/programme-runs`;
- `GET|PATCH|DELETE /api/v1/admin/programme-runs/{id}`;
- `GET|POST /api/v1/admin/programme-pricing-options`;
- `GET|PATCH|DELETE /api/v1/admin/programme-pricing-options/{id}`;
- `GET /api/v1/admin/programme-slug-redirects`.

Record creation uses the entity fields directly. Update requests use exactly one
of `record` or `translation`, so a failed translation publication cannot silently
partially apply a record update. Slug redirects are read-only because published
slug changes create and collapse redirect rows through database triggers.

### Partner and Expert manager routes

Content Manager, Super Admin, and Owner can manage public partner and expert
cards and their EN/UA/CZ translation states through:

- `GET|POST /api/v1/admin/partners`;
- `GET|PATCH|DELETE /api/v1/admin/partners/{id}`;
- `GET|POST /api/v1/admin/experts`;
- `GET|PATCH|DELETE /api/v1/admin/experts/{id}`.

Record creation uses direct entity fields. Updates use exactly one of `record`
or `translation`. Public assets remain approved WebP files under the existing
`/partners/` and `/experts/` paths; asset upload/storage expansion is not part
of this manager API.

## 9. Admin Learner API

Credential Manager/Super Admin/Owner:

- create/update learner;
- add/remove learner emails;
- set primary email;
- add/remove phones;
- set messaging flags;
- view learner credential list.

Duplicate email/phone returns conflict with existing learner reference.

### Learner List Import

Implemented protected routes for Credential Manager/Super Admin/Owner with MFA:

- `GET /api/v1/admin/learners/import/template` — controlled `.xlsx` template;
- `POST /api/v1/admin/learners/import/preview` — in-memory `.xlsx`/`.csv` parsing and preview; no learner data is written;
- `POST /api/v1/admin/learners/import/commit` — revalidates the submitted valid rows, repeats database conflict checks, then invokes the atomic import workflow.

Limits: 5 MB and 500 data rows per file. Invalid rows are reported separately and are not submitted. Duplicate learner identity, email, or phone is rejected both inside the file and against existing records. Existing records are never updated by the import. A race or data change after preview returns `409` and requires a fresh preview.

Content Manager has no access.

## 10. Admin Credential API

### Manager Workspace Reads and Notes

Implemented protected routes for Credential Manager/Super Admin/Owner with MFA:

- `GET /api/v1/admin/credentials` — credential list plus safe creation references;
- `GET /api/v1/admin/credentials/{id}` — private administrative detail, current PDFs, append-only History, and controlled Notes;
- `GET /api/v1/admin/credential-sets` — read-only status-free grouping list;
- `GET /api/v1/admin/document-numbers` — read-only permanent number log;
- `POST /api/v1/admin/credentials/{id}/notes`;
- `PATCH|DELETE /api/v1/admin/credentials/{id}/notes/{noteId}`.

These responses never include verification-token hashes/ciphertext/raw values,
private Storage paths, or PDF bytes. Note ownership and soft-delete rules remain
enforced by the CRD-006 controlled functions and forced RLS.

### Create Pending Credential

`POST /api/v1/admin/credentials`

Requires:

- Credential Manager/Super Admin/Owner;
- MFA.

Server:

- creates/finds Credential Set;
- reserves document number;
- generates token;
- creates pending credential;
- writes Document Number Log.

### Upload/Manage PDF Files

Routes:

- upload file;
- list files;
- replace file;
- delete pending file where allowed;
- set primary file.

Rules:

- exactly one primary file;
- primary file required for activation;
- no public access.

### Credential Template Packages and Generation

Protected routes must cover:

- list/create programme/type/language/variant Template Packages;
- load/update a draft package version;
- upload/delete draft source PDFs and configure primary/additional documents;
- save constrained text/date/QR placements on any source PDF page;
- render a private sample preview;
- validate/publish an immutable template version;
- retire a published version for future use;
- generate/regenerate all files for one pending credential;
- create, confirm, process, retry, and read a generation batch for the complete
  selected cohort without a fixed product-facing cap;
- privately preview every generated output;
- activate explicitly selected reviewed batch items.

One package may contain multiple output PDFs, and every output may be
multi-page. Exactly one generated output is primary. All current outputs attach
to the existing credential and are sent together by activation/resend.

Template mutation/publication requires Owner or Super Admin with MFA.
Credential Manager may read published template metadata and run generation,
review, activation, and delivery workflows with MFA but cannot mutate template
definitions.

PDFGEN-002 source routes:

- `POST /api/v1/admin/credential-templates/versions/{versionId}/documents` —
  accept multipart PDF plus file type, admin label, output filename pattern,
  sort order, and primary flag; validate the complete PDF server-side before
  attaching private source and contiguous page metadata;
- `GET /api/v1/admin/credential-templates/versions/{versionId}/documents/{documentId}` —
  return a role/MFA-checked, server-proxied, inline private source preview with
  `Cache-Control: private, no-store`; never return the Storage path or a direct
  browser Storage URL;
- `DELETE /api/v1/admin/credential-templates/versions/{versionId}/documents/{documentId}` —
  delete one draft source through the compensating Storage/database workflow.

These routes are Owner/Super Admin plus MFA only. Source upload rejects rather
than sanitizes encrypted/malformed PDFs, forms/XFA, JavaScript/actions,
attachments, launch/remote actions, page annotations, and unsupported external
content. The per-document limit is 20 MB; page count and dimensions are derived
from the parsed PDF rather than accepted from the browser.

PDFGEN-003 editor routes:

- `GET|POST /api/v1/admin/credential-templates` — load the private workspace or create a package with draft v1;
- `POST /api/v1/admin/credential-templates/{packageId}/versions` — create the next draft when no draft exists;
- `PATCH /api/v1/admin/credential-templates/versions/{versionId}/documents/{documentId}` — update safe draft document metadata;
- `PUT /api/v1/admin/credential-templates/versions/{versionId}/placements` — atomically replace one document's constrained placements;
- `POST /api/v1/admin/credential-templates/versions/{versionId}/{validate|publish|retire|preview}` — validate or perform the guarded lifecycle/audit action;
- `GET /api/v1/admin/credential-templates/versions/{versionId}/documents/{documentId}/pages/{pageNumber}` — return an authenticated no-store PNG rendering for the fictional sample editor.

All PDFGEN-003 routes require Owner or Super Admin plus MFA. Page rendering never returns a Storage path or signed URL and does not create a generated credential file.

PDFGEN-005 single-credential routes:

- `GET /api/v1/admin/credentials/{id}/generate` — return matching published
  Template Package options plus privacy-safe current generation provenance;
- `POST /api/v1/admin/credentials/{id}/generate` — generate the complete
  private package for one pending credential or regenerate its same immutable
  provenance version in place;
- `GET /api/v1/admin/credentials/{id}/files/{fileId}?disposition=inline` —
  return a short-lived controlled inline review URL through the existing
  credential-file boundary; the default disposition remains attachment.

Generation and review require Owner, Super Admin, or Credential Manager plus
MFA. The POST body accepts only `templateVersionId`. Regeneration never changes
the credential number, verification token/QR, template version, or lifecycle
status. The response contains identifiers, attempt number, and file/page counts
only; it never returns PDF bytes, private paths, signed source URLs, or token
material.

Batch processing must automatically divide the cohort into bounded,
configurable technical chunks while preserving one aggregate batch view. It
must be resumable and idempotent. Every learner gets
an independent pending credential, permanent number, protected token, file
package, activation result, and delivery result. Failure after number
reservation leaves a retryable pending credential and never releases the
number.

Responses must not expose service-role credentials, raw tokens, token
hash/ciphertext, encryption material, private storage paths, PDF bytes, or
unnecessary learner/contact data. Detailed contracts are defined in
`docs/product/CREDENTIAL_DOCUMENT_GENERATION_SPECIFICATION_v2.md`.

### Activate Credential

`POST /api/v1/admin/credentials/{id}/activate`

Request:

```json
{
  "recipientEmail": "learner@example.com",
  "emailSubject": "...",
  "emailBody": "..."
}
```

Rules:

- pending only;
- primary PDF required;
- status becomes valid;
- email send is attempted;
- activation succeeds even if email fails;
- send history records result.

### Resend Credential

`POST /api/v1/admin/credentials/{id}/resend`

Rules:

- valid credentials;
- custom recipient allowed;
- sends all current PDFs;
- stores actual email text and file list.

### Revoke Credential

`POST /api/v1/admin/credentials/{id}/revoke`

Requires reason.

Valid only.

Irreversible in standard workflow.

### Void Pending Credential

`POST /api/v1/admin/credentials/{id}/void`

Requires reason.

Pending only.

Number becomes permanently voided.

### Update Valid Credential Public Data

`PUT /api/v1/admin/credentials/{id}/public-data`

Requires reason.

Writes history.

Public verification uses current data.

### Credential Set Operations

- add credential to existing set;
- move credential between sets.

Requires audit.

## 11. Document Number Log API

Admin read endpoint for:

- reserved numbers;
- issued numbers;
- voided numbers;
- reason/actor/timestamps.

No public access.

## 12. Audit and History API

Credential page History tab reads credential history.

Global audit read access according to role policy.

Raw token, MFA secrets, private file contents are never returned.

## 13. Rate Limiting and CAPTCHA

Rate limiting is required for:

- contact submissions;
- public manual verification;
- suspicious repeated verification attempts.

CAPTCHA is an optional adaptive control. It is not shown for every ordinary
contact submission and is not required to be configured at launch. If later
enabled for suspicious or abusive traffic, the provider must remain replaceable.

## 14. Acceptance Criteria

API v2 is implemented when:

- public verification follows v2 response model;
- activation sends email attempt but does not depend on success;
- credential PDFs remain private;
- template sources, generation batches, and generated PDFs remain private;
- published template packages generate one primary plus optional additional multi-page PDFs;
- single/batch generation is review-gated, resumable, idempotent, and never reuses reserved numbers;
- roles are multi-role;
- Owner-only user actions are enforced;
- Content Manager cannot access restricted modules;
- Credential Manager cannot edit programmes;
- programme sales/pricing/application APIs support Leeloo and partner-site Release 1 flows;
- public routes do not expose internal IDs or raw errors.
