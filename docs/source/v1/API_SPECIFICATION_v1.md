# **API SPECIFICATION v1**

## **Nobel ITBS Website and Credential Registry**

**Версія:** 1.0  
**Статус:** робочий документ для технічного затвердження  
**Продукт:** nobel-itbs.eu  
**Backend:** Next.js Server Routes / Supabase  
**Власник продукту:** Nobel ITBS s.r.o.  
**Product Owner:** Ольга Дашевська

---

# **1\. Мета документа**

Документ визначає API-контракти Release 1 для:

* public website;  
* programme catalogue;  
* programme detail;  
* programme runs;  
* partners;  
* experts;  
* FAQ;  
* contact forms;  
* public credential verification;  
* manual verification;  
* admin authentication context;  
* learner management;  
* Credential Groups;  
* credential creation;  
* snapshot update;  
* activation;  
* cancellation;  
* revocation;  
* expiration;  
* reissue;  
* QR generation;  
* private credential files;  
* Credential Types;  
* Credential Issuers;  
* audit log;  
* user administration.

Документ фіксує:

* endpoints;  
* HTTP methods;  
* authentication;  
* permissions;  
* request schemas;  
* response schemas;  
* status codes;  
* validation;  
* idempotency;  
* pagination;  
* filtering;  
* sorting;  
* rate limiting;  
* CAPTCHA;  
* error model;  
* logging;  
* security requirements;  
* API acceptance criteria.

---

# **2\. Архітектурна модель API**

## **2.1. Public API**

Використовується для:

* programme catalogue;  
* programme detail;  
* public trust content;  
* FAQ;  
* contact form;  
* credential verification.

Public API не має direct access до credential base tables.

## **2.2. Admin API**

Використовується авторизованими ролями:

* Content Manager;  
* Credential Manager;  
* Super Admin.

Admin API:

* перевіряє Supabase session;  
* визначає роль через `user_profiles`;  
* перевіряє active status;  
* перевіряє MFA/AAL для sensitive actions;  
* викликає controlled RPC або server-side service.

## **2.3. Internal API**

Використовується тільки backend:

* token HMAC lookup;  
* encrypted token retrieval;  
* manual verification;  
* scheduled expiration;  
* audit writer;  
* private file signed URLs;  
* email notifications.

Internal endpoints не доступні browser client.

## **2.4. Database access**

Preferred flow:

Browser  
→ Next.js route/server action  
→ authorization and validation  
→ Supabase RPC or server-side query  
→ curated response

Прямий browser access до Supabase допускається тільки для:

* public curated views;  
* admin-safe read views;  
* low-risk authenticated reads, дозволених RLS.

Sensitive mutations виконуються через server routes або controlled RPC.

---

# **3\. Base URLs**

## **Production**

`https://nobel-itbs.eu/api`

## **Staging**

`https://staging.nobel-itbs.eu/api`

## **Local**

`http://localhost:3000/api`

API version prefix у Release 1:

`/api/v1`

Приклад:

`GET /api/v1/public/programmes`

---

# **4\. Загальні стандарти**

## **4.1. Format**

* JSON;  
* UTF-8;  
* ISO 8601;  
* dates: `YYYY-MM-DD`;  
* timestamps: RFC 3339 UTC;  
* currency codes: ISO 4217;  
* country codes: ISO 3166-1 alpha-2;  
* language codes: `en`, `uk`, `cs`.

## **4.2. Naming**

JSON використовує `camelCase`.

Database fields залишаються `snake_case`.

## **4.3. Headers**

### **Request**

* `Content-Type: application/json`  
* `Accept: application/json`  
* `Authorization: Bearer <access_token>` — admin  
* `Idempotency-Key: <uuid>` — create operations  
* `X-Captcha-Token: <token>` — where required  
* `Accept-Language: en|uk`

### **Response**

* `Content-Type: application/json`  
* `Cache-Control`  
* `X-Request-Id`  
* `Retry-After` — rate limiting

## **4.4. Request ID**

Кожен request має server-generated request ID.

Він:

* повертається у response header;  
* використовується в logs;  
* не є credential або learner ID;  
* може передаватися support team.

---

# **5\. Authentication**

## **5.1. Public endpoints**

Не потребують login.

Захищаються:

* rate limiting;  
* CAPTCHA where required;  
* input validation;  
* generic error responses.

## **5.2. Admin endpoints**

Потребують:

* valid Supabase session;  
* application profile;  
* active user;  
* allowed role.

## **5.3. Sensitive admin endpoints**

Потребують MFA/AAL2:

* credential create;  
* activation;  
* cancellation;  
* revoke;  
* reissue;  
* number override;  
* issuer/type management;  
* user management;  
* private file signed URL;  
* audit access.

## **5.4. Authentication errors**

* `401` — no valid session;  
* `403` — role or MFA insufficient;  
* inactive user — `403`;  
* missing profile — `403`.

---

# **6\. Authorization roles**

## **Content Manager**

Access:

* programmes;  
* translations;  
* programme runs;  
* experts;  
* partners;  
* FAQ;  
* public media.

## **Credential Manager**

Access:

* learners;  
* Credential Groups;  
* credentials;  
* snapshots;  
* lifecycle actions;  
* QR;  
* private credential files.

## **Super Admin**

Access:

* all controlled modules;  
* users;  
* issuers;  
* Credential Types;  
* audit.

## **Service backend**

Access:

* internal verification;  
* manual verification;  
* expiration;  
* contact insert;  
* private token operations.

---

# **7\. Standard response model**

## **7.1. Success**

{  
  "data": {},  
  "meta": {  
    "requestId": "req\_123",  
    "timestamp": "2026-07-23T12:00:00Z"  
  }  
}

## **7.2. List response**

{  
  "data": \[\],  
  "meta": {  
    "page": 1,  
    "pageSize": 20,  
    "total": 120,  
    "totalPages": 6,  
    "requestId": "req\_123"  
  }  
}

## **7.3. Error response**

{  
  "error": {  
    "code": "CRED\_NOT\_FOUND",  
    "message": "Credential not found.",  
    "details": null  
  },  
  "meta": {  
    "requestId": "req\_123",  
    "timestamp": "2026-07-23T12:00:00Z"  
  }  
}

Public errors do not expose:

* SQL;  
* table names;  
* constraint names;  
* stack traces;  
* internal IDs;  
* secret values.

---

# **8\. Pagination, filtering and sorting**

## **8.1. Pagination**

Query parameters:

* `page`;  
* `pageSize`.

Defaults:

* page \= 1;  
* pageSize \= 20\.

Maximum:

* public \= 50;  
* admin \= 100\.

## **8.2. Sorting**

Format:

`sort=field:asc`

Example:

`sort=createdAt:desc`

Only whitelisted fields accepted.

## **8.3. Filtering**

Format:

* explicit query parameters;  
* no arbitrary SQL-like filter expressions.

Example:

`status=published&field=business_management`

## **8.4. Search**

Search query:

`q=marketing`

Search input:

* trimmed;  
* max length 150;  
* escaped;  
* rate limited if public.

---

# **9\. Public Programme API**

## **9.1. List programmes**

### **Endpoint**

`GET /api/v1/public/programmes`

### **Auth**

Public.

### **Query parameters**

* `language`;  
* `field`;  
* `type`;  
* `format`;  
* `featured`;  
* `q`;  
* `page`;  
* `pageSize`;  
* `sort`.

### **Response**

{  
  "data": \[  
    {  
      "slug": "mini-mba-marketing",  
      "title": "MINI-MBA in Marketing",  
      "shortDescription": "Programme description",  
      "field": {  
        "code": "business\_management",  
        "title": "Business & Management"  
      },  
      "type": {  
        "code": "mini\_mba",  
        "title": "MINI-MBA"  
      },  
      "format": "cohort\_online",  
      "duration": {  
        "value": 12,  
        "unit": "weeks"  
      },  
      "learningHours": 180,  
      "ects": 6,  
      "price": {  
        "amount": 999,  
        "currency": "EUR"  
      },  
      "featured": true,  
      "enrolmentStatus": "enrolment\_open"  
    }  
  \]  
}

### **Cache**

`public, max-age=60, stale-while-revalidate=300`

---

## **9.2. Programme detail**

### **Endpoint**

`GET /api/v1/public/programmes/{slug}`

### **Query**

* `language`;

### **Response**

Includes:

* programme title;  
* descriptions;  
* target audience;  
* outcomes;  
* competencies;  
* modules;  
* assessment;  
* admission requirements;  
* credential description;  
* languages;  
* expert data;  
* partner data;  
* active primary run;  
* Leeloo CTA.

### **Leeloo priority**

1. primary active run URL;  
2. programme default Leeloo URL;  
3. contact fallback.

### **Errors**

* `404 PROGRAMME_NOT_FOUND`;  
* archived/draft treated as not found publicly.

---

## **9.3. Programme fields**

`GET /api/v1/public/programme-fields`

Returns active fields and translations.

## **9.4. Programme types**

`GET /api/v1/public/programme-types`

Returns active types and translations.

---

# **10\. Public Experts API**

## **List**

`GET /api/v1/public/experts`

## **Detail**

`GET /api/v1/public/experts/{slug}`

Release 1 may omit public expert detail page. Endpoint should only be enabled if route exists.

Returns published experts only.

---

# **11\. Public Partners API**

## **List**

`GET /api/v1/public/partners`

## **Detail**

`GET /api/v1/public/partners/{slug}`

Returns:

* official/display name;  
* country;  
* type;  
* description;  
* programme relations;  
* logo;  
* website.

Never returns credential relations.

---

# **12\. Public FAQ API**

## **Endpoint**

`GET /api/v1/public/faq`

### **Query**

* `language`;  
* `category`.

Returns published FAQ only.

---

# **13\. Contact API**

## **13.1. Submit contact form**

### **Endpoint**

`POST /api/v1/public/contact`

### **Auth**

Public.

### **Headers**

* `X-Captcha-Token`.

### **Request**

{  
  "submissionType": "general",  
  "name": "Example Name",  
  "organisation": "Example Ltd",  
  "email": "name@example.com",  
  "countryCode": "CZ",  
  "interestCode": "mini\_mba",  
  "message": "Message",  
  "languageCode": "en",  
  "consentGiven": true,  
  "sourcePage": "/programmes/mini-mba-marketing",  
  "utm": {  
    "source": "google",  
    "medium": "cpc"  
  }  
}

### **Validation**

* name required;  
* valid email;  
* message 10–5000 characters;  
* consent true;  
* valid language;  
* valid submission type;  
* CAPTCHA valid;  
* honeypot empty;  
* rate limit passed.

### **Response**

`202 Accepted`

{  
  "data": {  
    "accepted": true  
  }  
}

### **Rate limit**

Initial configurable default:

* 5 submissions per 30 minutes per IP hash.

---

# **14\. Public Credential Verification API**

## **14.1. Verify by token**

### **Endpoint**

`GET /api/v1/public/credentials/verify/{token}`

### **Auth**

Public.

### **Processing**

1. validate token format;  
2. normalize;  
3. calculate HMAC-SHA-256;  
4. call internal lookup;  
5. return curated response.

### **Valid response**

{  
  "data": {  
    "status": "valid",  
    "credential": {  
      "documentNumber": "NITBS-MBA-2026-000127",  
      "printedFullName": "Example Name",  
      "programmeTitle": "MINI-MBA in Marketing",  
      "credentialType": "MINI-MBA Diploma",  
      "issueDate": "2026-07-20",  
      "completionDate": "2026-07-15",  
      "learningHours": 180,  
      "ects": 6,  
      "instructionLanguages": \["en"\],  
      "credentialLanguages": \["en", "uk"\],  
      "issuer": {  
        "officialName": "Nobel ITBS s.r.o.",  
        "countryCode": "CZ"  
      }  
    },  
    "verifiedAt": "2026-07-23T12:00:00Z"  
  }  
}

### **Status values**

* `pending`;  
* `valid`;  
* `revoked`;  
* `reissued`;  
* `expired`;  
* `not_found`.

### **Pending**

{  
  "data": {  
    "status": "pending",  
    "credential": null,  
    "verifiedAt": "2026-07-23T12:00:00Z"  
  }  
}

### **Reissued**

May include:

{  
  "replacementUrl": "/verify/new-token"  
}

### **Cancelled**

Returns `not_found`.

### **HTTP policy**

* known business statuses: `200`;  
* malformed token: `400`;  
* unknown token: `404`;  
* rate limited: `429`;  
* maintenance: `503`.

### **Cache**

`Cache-Control: no-store`

---

## **14.2. Manual verification**

### **Endpoint**

`POST /api/v1/public/credentials/resolve`

### **Request**

{  
  "identifier": "NITBS-MBA-2026-000127",  
  "language": "en",  
  "captchaToken": "..."  
}

### **Accepted identifiers**

* document number;  
* verification token.

### **Processing**

#### **Document number**

* exact lookup;  
* return verification result directly;  
* do not decrypt token;  
* do not redirect to token URL.

#### **Token**

* HMAC lookup;  
* same result as token verification.

### **Response**

Same public verification response model.

### **Rate limit**

Initial configurable default:

* 10 searches per 10 minutes;  
* CAPTCHA after 5 failed searches;  
* temporary block after repeated abuse.

---

# **15\. Admin session API**

## **15.1. Current admin context**

### **Endpoint**

`GET /api/v1/admin/session`

### **Auth**

Authenticated.

### **Response**

{  
  "data": {  
    "userId": "uuid",  
    "fullName": "Admin Name",  
    "role": "credential\_manager",  
    "isActive": true,  
    "mfaRequired": true,  
    "aal": "aal2"  
  }  
}

No sensitive auth metadata returned.

---

# **16\. Admin Programme API**

## **16.1. List programmes**

`GET /api/v1/admin/programmes`

Roles:

* Content Manager;  
* Super Admin.

Supports:

* status;  
* field;  
* type;  
* q;  
* pagination;  
* sorting.

## **16.2. Get programme**

`GET /api/v1/admin/programmes/{id}`

Returns full editable data.

## **16.3. Create programme**

`POST /api/v1/admin/programmes`

Initial status always Draft.

### **Request**

Includes:

* slug;  
* field ID;  
* type ID;  
* format;  
* duration;  
* hours;  
* ECTS;  
* price;  
* translations;  
* languages.

### **Response**

`201 Created`

## **16.4. Update programme**

`PATCH /api/v1/admin/programmes/{id}`

Cannot directly update:

* publicationStatus;  
* publishedAt;  
* archivedAt.

## **16.5. Publish programme**

`POST /api/v1/admin/programmes/{id}/publish`

Roles:

* Content Manager;  
* Super Admin.

Validates EN and UA content.

## **16.6. Unpublish programme**

`POST /api/v1/admin/programmes/{id}/unpublish`

## **16.7. Archive programme**

`POST /api/v1/admin/programmes/{id}/archive`

## **16.8. Primary run**

`POST /api/v1/admin/programmes/{id}/primary-run`

Request:

{  
  "programmeRunId": "uuid"  
}

---

# **17\. Programme Run API**

## **List**

`GET /api/v1/admin/programmes/{programmeId}/runs`

## **Create**

`POST /api/v1/admin/programmes/{programmeId}/runs`

## **Update**

`PATCH /api/v1/admin/programme-runs/{id}`

## **Cancel**

`POST /api/v1/admin/programme-runs/{id}/cancel`

## **Complete**

`POST /api/v1/admin/programme-runs/{id}/complete`

Direct primary flag update forbidden.

---

# **18\. Experts Admin API**

## **List**

`GET /api/v1/admin/experts`

## **Create**

`POST /api/v1/admin/experts`

## **Detail**

`GET /api/v1/admin/experts/{id}`

## **Update**

`PATCH /api/v1/admin/experts/{id}`

## **Archive**

`POST /api/v1/admin/experts/{id}/archive`

## **Programme relation**

`POST /api/v1/admin/programmes/{programmeId}/experts`

`DELETE /api/v1/admin/programmes/{programmeId}/experts/{expertId}`

Roles:

* Content Manager;  
* Super Admin.

---

# **19\. Partners Admin API**

Same general model as Experts.

Endpoints:

* `GET /api/v1/admin/partners`;  
* `POST /api/v1/admin/partners`;  
* `GET /api/v1/admin/partners/{id}`;  
* `PATCH /api/v1/admin/partners/{id}`;  
* `POST /api/v1/admin/partners/{id}/archive`;  
* programme relation endpoints.

No credential endpoints reference Partners.

---

# **20\. FAQ Admin API**

* `GET /api/v1/admin/faq`;  
* `POST /api/v1/admin/faq`;  
* `PATCH /api/v1/admin/faq/{id}`;  
* `POST /api/v1/admin/faq/{id}/publish`;  
* `POST /api/v1/admin/faq/{id}/archive`.

Roles:

* Content Manager;  
* Super Admin.

---

# **21\. Learner API**

## **21.1. List learners**

`GET /api/v1/admin/learners`

Roles:

* Credential Manager;  
* Super Admin.

Filters:

* q;  
* country;  
* includeDeleted;  
* page;  
* pageSize.

List response omits email by default unless explicitly requested in detail endpoint.

## **21.2. Learner detail**

`GET /api/v1/admin/learners/{id}`

Returns:

* names;  
* email;  
* country;  
* note;  
* credential groups summary.

## **21.3. Create learner**

`POST /api/v1/admin/learners`

Request:

{  
  "fullNameOriginal": "Ім’я Прізвище",  
  "fullNameLatin": "Name Surname",  
  "email": "name@example.com",  
  "countryCode": "UA",  
  "internalNote": null  
}

## **21.4. Update learner**

`PATCH /api/v1/admin/learners/{id}`

## **21.5. Soft delete learner**

`POST /api/v1/admin/learners/{id}/soft-delete`

Allowed only if no Credential Groups.

---

# **22\. Credential Group API**

## **22.1. List groups**

`GET /api/v1/admin/credential-groups`

Roles:

* Credential Manager;  
* Super Admin.

Filters:

* status;  
* learner;  
* programme;  
* run;  
* completion date;  
* q.

## **22.2. Group detail**

`GET /api/v1/admin/credential-groups/{id}`

Returns:

* learner;  
* programme;  
* run;  
* completion date;  
* status;  
* credentials;  
* lifecycle summary.

## **22.3. Create group**

`POST /api/v1/admin/credential-groups`

Headers:

`Idempotency-Key`

Request:

{  
  "learnerId": "uuid",  
  "programmeId": "uuid",  
  "programmeRunId": "uuid",  
  "completionDate": "2026-07-15"  
}

### **Idempotency**

* same key \+ same payload → same response;  
* same key \+ different payload → `409`.

## **22.4. Update Draft group**

`PATCH /api/v1/admin/credential-groups/{id}`

Only when Draft.

## **22.5. Cancel group**

`POST /api/v1/admin/credential-groups/{id}/cancel`

Request:

{  
  "reason": "Created by mistake"  
}

Only if no issued credentials.

---

# **23\. Credential API**

## **23.1. List credentials**

`GET /api/v1/admin/credentials`

Roles:

* Credential Manager;  
* Super Admin.

Uses admin-safe view.

Does not return token fields.

Filters:

* status;  
* type;  
* issuer;  
* group;  
* learner;  
* programme;  
* issue date;  
* q.

## **23.2. Credential detail**

`GET /api/v1/admin/credentials/{id}`

Returns:

* safe credential fields;  
* snapshot;  
* group context;  
* status history;  
* predecessor/successor summary;  
* QR availability;  
* private file metadata if allowed.

Does not return:

* encrypted token;  
* lookup hash;  
* idempotency payload hash.

## **23.3. Create Pending credential**

`POST /api/v1/admin/credentials`

Headers:

* Authorization;  
* Idempotency-Key.

Requires MFA/AAL2.

Request:

{  
  "credentialGroupId": "uuid",  
  "credentialTypeId": "uuid",  
  "issuerId": "uuid",  
  "issueDate": "2026-07-20",  
  "validFrom": null,  
  "expiresAt": null,  
  "snapshot": {  
    "printedFullName": "Example Name",  
    "programmeTitle": "MINI-MBA in Marketing",  
    "credentialTypeDisplayNames": {  
      "en": "MINI-MBA Diploma",  
      "uk": "Диплом MINI-MBA"  
    },  
    "learningHours": 180,  
    "ects": 6,  
    "instructionLanguages": \["en"\],  
    "credentialLanguages": \["en", "uk"\],  
    "issuerOfficialName": "Nobel ITBS s.r.o.",  
    "issuerCountryCode": "CZ",  
    "completionDate": "2026-07-15",  
    "additionalPublicData": {}  
  },  
  "internalNote": null  
}

### **Server behavior**

1. Generate raw token.  
2. Compute HMAC.  
3. Encrypt token.  
4. Call controlled RPC.  
5. Return document number, safe URL and QR endpoint.

### **Response**

`201 Created`

{  
  "data": {  
    "id": "uuid",  
    "status": "pending",  
    "documentNumber": "NITBS-MBA-2026-000127",  
    "verificationUrl": "/verify/token",  
    "qrAvailable": true  
  }  
}

Raw token is not returned as a standalone field.

---

## **23.4. Update Pending snapshot**

`PUT /api/v1/admin/credentials/{id}/snapshot`

Requires MFA/AAL2.

Only Pending.

## **23.5. Activate credential**

`POST /api/v1/admin/credentials/{id}/activate`

Requires MFA/AAL2.

Request:

{  
  "confirmed": true  
}

Response status becomes Valid.

## **23.6. Cancel Pending**

`POST /api/v1/admin/credentials/{id}/cancel`

Request:

{  
  "reason": "Incorrect learner data"  
}

## **23.7. Revoke**

`POST /api/v1/admin/credentials/{id}/revoke`

Request:

{  
  "reason": "Credential issued in error"  
}

Only Valid.

## **23.8. Reissue**

`POST /api/v1/admin/credentials/{id}/reissue`

Headers:

* Idempotency-Key.

Request:

{  
  "reason": "Name correction",  
  "credentialTypeId": "uuid"  
}

Type change requires Super Admin.

## **23.9. Activate reissue successor**

`POST /api/v1/admin/credentials/{id}/activate-reissue`

`id` is successor credential.

## **23.10. Cancel reissue**

`POST /api/v1/admin/credentials/{id}/cancel-reissue`

## **23.11. Manual number override**

`POST /api/v1/admin/credentials/{id}/number-override`

Role:

* Super Admin only.

Only Pending.

Requires MFA/AAL2.

Request:

{  
  "documentNumber": "NITBS-MBA-2026-000500",  
  "reason": "Legacy number reservation"  
}

---

# **24\. QR API**

## **24.1. Generate QR preview**

`GET /api/v1/admin/credentials/{id}/qr`

Roles:

* Credential Manager;  
* Super Admin.

Requires MFA/AAL2.

Query:

* `format=svg|png`;  
* `size`.

Response:

* image body;  
* no token JSON.

Pending QR response includes header:

`X-Credential-Status: pending`

UI must warn that credential is not active.

## **24.2. QR download**

`GET /api/v1/admin/credentials/{id}/qr/download`

Returns file download.

No permanent QR storage required.

---

# **25\. Private Credential Files API**

Feature flag controlled.

## **25.1. Upload**

`POST /api/v1/admin/credentials/{id}/files`

Roles:

* Credential Manager;  
* Super Admin.

Requires MFA/AAL2.

Validation:

* MIME whitelist;  
* extension whitelist;  
* file size;  
* credential access;  
* sanitized name.

## **25.2. List metadata**

`GET /api/v1/admin/credentials/{id}/files`

Returns metadata only.

## **25.3. Signed download URL**

`POST /api/v1/admin/credentials/{id}/files/{fileId}/signed-url`

Default expiry:

* 5 minutes.

## **25.4. Delete**

`DELETE /api/v1/admin/credentials/{id}/files/{fileId}`

Audit required.

No public file endpoint.

---

# **26\. Credential Type API**

Roles:

* Super Admin for mutations;  
* Credential Manager read-only.

## **List**

`GET /api/v1/admin/credential-types`

## **Create**

`POST /api/v1/admin/credential-types`

## **Detail**

`GET /api/v1/admin/credential-types/{id}`

## **Update**

`PATCH /api/v1/admin/credential-types/{id}`

## **Deactivate**

`POST /api/v1/admin/credential-types/{id}/deactivate`

No physical delete if used.

---

# **27\. Credential Issuer API**

## **List**

`GET /api/v1/admin/credential-issuers`

Credential Manager sees active issuers.

## **Create**

`POST /api/v1/admin/credential-issuers`

Super Admin only.

## **Update**

`PATCH /api/v1/admin/credential-issuers/{id}`

## **Deactivate**

`POST /api/v1/admin/credential-issuers/{id}/deactivate`

No physical delete if used.

---

# **28\. Audit API**

## **List audit events**

`GET /api/v1/admin/audit`

Role:

* Super Admin only.

Requires MFA/AAL2.

Filters:

* actor;  
* action;  
* entity type;  
* entity ID;  
* date range.

Response excludes sensitive metadata.

No mutation endpoints.

---

# **29\. User Administration API**

## **List users**

`GET /api/v1/admin/users`

## **User detail**

`GET /api/v1/admin/users/{id}`

## **Change role**

`POST /api/v1/admin/users/{id}/role`

Request:

{  
  "role": "credential\_manager"  
}

## **Activate/deactivate**

`POST /api/v1/admin/users/{id}/status`

Request:

{  
  "isActive": false  
}

Role:

* Super Admin only;  
* MFA/AAL2 required.

---

# **30\. Scheduled Internal API**

## **30.1. Expire credentials**

`POST /api/v1/internal/jobs/expire-credentials`

Auth:

* server secret;  
* scheduler identity.

Behavior:

* select Valid credentials with expired date;  
* call internal expiration function;  
* return aggregate result.

Response:

{  
  "data": {  
    "processed": 100,  
    "expired": 4,  
    "failed": 0  
  }  
}

Not browser-accessible.

## **30.2. Notification jobs**

May be added later for:

* contact notification;  
* credential email;  
* monitoring.

---

# **31\. Idempotency**

## **Required endpoints**

* create Credential Group;  
* create Pending Credential;  
* create Reissue successor;  
* file upload initiation if retryable;  
* contact submission — optional.

## **Header**

`Idempotency-Key: UUID`

## **Rules**

* stored with payload hash;  
* same key \+ same payload → original response;  
* same key \+ different payload → `409 IDEMPOTENCY_CONFLICT`;  
* key scoped to operation type and actor;  
* recommended retention: indefinite for credential creation records.

---

# **32\. Validation rules**

## **General**

* reject unknown fields where practical;  
* trim text;  
* normalize email;  
* validate UUID;  
* validate enum values;  
* validate language/country/currency;  
* enforce max lengths;  
* reject HTML/script in plain text fields;  
* sanitize rich content separately.

## **Credential**

* dates consistent;  
* issuer active;  
* type active;  
* group not cancelled;  
* type allowed in group;  
* snapshot complete;  
* multilingual names valid;  
* partner fields rejected.

## **Programme**

* slug valid;  
* no duplicate slug;  
* JSON arrays valid;  
* EN/UA required before publish;  
* Leeloo URL HTTPS.

---

# **33\. Rate limiting**

Values are configurable, not schema constants.

## **Public programme content**

Generous CDN/application limits.

## **Credential token verification**

Initial default:

* 60 requests per 10 minutes per IP hash.

## **Manual verification**

Initial default:

* 10 per 10 minutes;  
* CAPTCHA after 5 failed attempts.

## **Contact**

Initial default:

* 5 per 30 minutes.

## **Admin mutations**

Rate limited per user and route to prevent accidental repetition.

Idempotency remains required for critical create operations.

---

# **34\. CAPTCHA interface**

Provider-independent request field:

`captchaToken`

Backend uses adapter:

verifyCaptcha(token, context)

Contexts:

* contact;  
* manual verification;  
* suspicious credential verification.

Provider can change without API contract change.

---

# **35\. Cache policy**

## **Public content**

Short CDN cache allowed.

## **Credential verification**

`no-store`.

## **Admin**

`private, no-store`.

## **Static dictionaries**

Longer cache allowed with revalidation.

---

# **36\. Logging**

Log:

* request ID;  
* route;  
* method;  
* response status;  
* actor ID for admin;  
* actor role;  
* duration;  
* rate-limit result;  
* safe error code.

Never log:

* raw token;  
* encrypted token;  
* lookup hash;  
* password;  
* MFA secret;  
* full learner profile;  
* full contact message;  
* signed URL;  
* private file path.

Document number may be masked in security logs.

---

# **37\. Error codes**

## **General**

* `VALIDATION_ERROR`  
* `NOT_FOUND`  
* `CONFLICT`  
* `RATE_LIMITED`  
* `INTERNAL_ERROR`  
* `MAINTENANCE`

## **Authentication**

* `AUTH_UNAUTHENTICATED`  
* `AUTH_PROFILE_MISSING`  
* `AUTH_USER_INACTIVE`  
* `AUTH_ROLE_FORBIDDEN`  
* `AUTH_MFA_REQUIRED`

## **Programme**

* `PROGRAMME_NOT_FOUND`  
* `PROGRAMME_SLUG_CONFLICT`  
* `PROGRAMME_TRANSLATION_REQUIRED`  
* `PROGRAMME_INVALID_STATUS`  
* `PROGRAMME_RUN_INVALID`  
* `PROGRAMME_PRIMARY_RUN_INVALID`

## **Credential**

* `CRED_GROUP_NOT_FOUND`  
* `CRED_GROUP_CANCELLED`  
* `CRED_TYPE_INACTIVE`  
* `CRED_ISSUER_INACTIVE`  
* `CRED_DUPLICATE_TYPE_IN_GROUP`  
* `CRED_IDEMPOTENCY_CONFLICT`  
* `CRED_SNAPSHOT_INCOMPLETE`  
* `CRED_INVALID_STATUS_TRANSITION`  
* `CRED_ALREADY_ACTIVATED`  
* `CRED_REVOKE_REASON_REQUIRED`  
* `CRED_SUCCESSOR_EXISTS`  
* `CRED_REISSUE_TYPE_APPROVAL_REQUIRED`  
* `CRED_NUMBER_COLLISION`  
* `CRED_TOKEN_GENERATION_FAILED`  
* `CRED_NOT_FOUND`  
* `CRED_PENDING`  
* `CRED_RATE_LIMITED`

## **Storage**

* `FILE_TYPE_NOT_ALLOWED`  
* `FILE_TOO_LARGE`  
* `FILE_NOT_FOUND`  
* `FILE_ACCESS_DENIED`  
* `FILE_UPLOAD_FAILED`

---

# **38\. HTTP status mapping**

| Situation | HTTP |
| ----- | ----- |
| Success | 200 |
| Created | 201 |
| Accepted async processing | 202 |
| No content | 204 |
| Validation error | 400 |
| Unauthenticated | 401 |
| Forbidden/MFA | 403 |
| Not found | 404 |
| Conflict/idempotency | 409 |
| Payload too large | 413 |
| Unsupported media type | 415 |
| Rate limited | 429 |
| Internal error | 500 |
| Maintenance | 503 |

Business credential statuses are returned with 200\.

---

# **39\. API security requirements**

* TLS only;  
* secure cookies/session;  
* CSRF protection for cookie-based mutations;  
* Authorization header for bearer flow;  
* MFA/AAL2 for sensitive mutations;  
* no service key in browser;  
* schema validation;  
* parameterized queries;  
* RLS;  
* controlled RPC;  
* strict CORS;  
* no wildcard production CORS;  
* response data minimization;  
* no token in logs;  
* no private file paths in public responses;  
* generic public errors;  
* rate limiting;  
* CAPTCHA;  
* request body size limits.

---

# **40\. API tests**

## **Public content**

* published content returned;  
* draft/archived hidden;  
* language fallback correct;  
* Leeloo priority correct.

## **Contact**

* valid accepted;  
* invalid email rejected;  
* no consent rejected;  
* CAPTCHA required;  
* rate limit works.

## **Verification**

* valid;  
* pending without PII;  
* revoked;  
* reissued with replacement;  
* expired;  
* cancelled as not found;  
* wrong token;  
* malformed token;  
* no internal IDs;  
* no partner data.

## **Admin auth**

* unauthenticated denied;  
* wrong role denied;  
* inactive denied;  
* MFA insufficient denied.

## **Credential**

* idempotent create;  
* duplicate payload conflict;  
* activation;  
* revoke;  
* reissue;  
* terminal state protection;  
* no direct token exposure.

## **Files**

* MIME validation;  
* size validation;  
* signed URL expiry;  
* public denied.

---

# **41\. API acceptance criteria**

API Specification вважається реалізованою, якщо:

* endpoints follow versioned naming;  
* public/admin/internal routes separated;  
* all admin routes authenticate user;  
* permissions match RLS Specification;  
* sensitive actions require MFA/AAL2;  
* public content exposes only published data;  
* Leeloo fallback works;  
* credential verification is server-mediated;  
* token HMAC is application-side;  
* token is not logged or returned separately;  
* manual number verification does not decrypt token;  
* business statuses use consistent response model;  
* idempotency works;  
* error codes stable;  
* rate limits configurable;  
* CAPTCHA provider-independent;  
* private files remain private;  
* audit endpoint read-only;  
* Partners never enter credential verification;  
* API tests cover critical flows;  
* no endpoint exposes raw database errors or internal IDs.

---

# **42\. Open implementation confirmations**

Перед final implementation потрібно підтвердити:

1. Чи API version prefix `/api/v1` використовується відразу.  
2. Чи public content читається через API routes або напряму через Supabase views.  
3. Чи admin read endpoints використовують browser Supabase client або тільки Next.js server.  
4. Максимальний file size для private credential PDF.  
5. Чи Expert detail endpoint входить у Release 1\.  
6. Чи контактні звернення мають окремий admin UI в Release 1\.  
7. Чи manual verification повертає 404 або завжди 200 із `not_found`.  
8. Чи QR endpoint дозволяє PNG і SVG одразу.

Рекомендовані рішення:

1. Використовувати `/api/v1` відразу.  
2. Public content можна читати через cached Next.js server/API layer.  
3. Admin sensitive reads — server; low-risk reads можуть використовувати RLS client.  
4. Private PDF max 10 MB.  
5. Expert detail endpoint не включати без public route.  
6. Contact admin UI — Super Admin only.  
7. Manual verification повертати 200 із generic `not_found`.  
8. Підтримати SVG і PNG.

