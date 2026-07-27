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
- summary;
- area;
- type;
- format;
- language summary;
- enrolment badge;
- featured image/media if available.

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

Slug collisions are forbidden in admin.

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

Processing:

- validate;
- rate limit;
- CAPTCHA where required;
- save submission;
- send notification to general Nobel ITBS email.

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
- manage Leeloo URLs.

## 9. Admin Learner API

Credential Manager/Super Admin/Owner:

- create/update learner;
- add/remove learner emails;
- set primary email;
- add/remove phones;
- set messaging flags;
- view learner credential list.

Duplicate email/phone returns conflict with existing learner reference.

Content Manager has no access.

## 10. Admin Credential API

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

Required for:

- contact submissions;
- public manual verification;
- suspicious repeated verification attempts.

CAPTCHA provider should remain replaceable.

## 14. Acceptance Criteria

API v2 is implemented when:

- public verification follows v2 response model;
- activation sends email attempt but does not depend on success;
- credential PDFs remain private;
- roles are multi-role;
- Owner-only user actions are enforced;
- Content Manager cannot access restricted modules;
- Credential Manager cannot edit programmes;
- programme sales/pricing/Leeloo APIs support Release 1 flows;
- public routes do not expose internal IDs or raw errors.

