# Credential Module Specification v2

Product: Nobel ITBS Website and Credential Registry
Status: Release 1 implementation baseline
Supersedes: source v1 credential module where conflicting with Product Decisions / Spec Alignment v2

## 1. Purpose

The credential module registers issued educational documents, manages private PDF delivery to learners, and provides simple public verification by QR token or document number.

The module does not determine whether a learner has earned a document. It records an administrative issuing decision and verifies the document after activation.

## 2. Release 1 Boundaries

Included:

- learner management;
- credential set grouping;
- credential creation;
- document number reservation;
- QR token generation;
- private PDF upload;
- activation;
- Gmail/Google Workspace email sending;
- resend;
- public verification;
- revoke;
- void pending credential;
- current public credential data corrections;
- credential history;
- audit log;
- role-based access;
- MFA for sensitive roles;
- rate limiting/CAPTCHA where needed.

Not included:

- automatic PDF generation;
- public PDF download;
- student cabinet;
- Moodle-triggered issuing;
- expiration;
- public reissue status;
- name-based public search;
- old PDF version retention.

## 3. Entities

### Learner

Internal person receiving credentials.

Fields:

- Latin first name;
- Latin last name;
- Ukrainian full name;
- emails;
- phones;
- internal notes/comments.

Learner is never public.

### Learner Emails

Learner may have multiple emails.

Rules:

- one primary email may be set;
- email is unique across all learners;
- duplicate email entry is rejected and points admin to existing learner.

### Learner Phones

Learner may have multiple phones.

Rules:

- phone is unique across all learners;
- each phone can have flags for Telegram, Viber, WhatsApp;
- optional Telegram username may be stored.

### Credential Set

Internal grouping entity for related credentials of the same learner/programme/completion context.

Credential Set:

- has no public page;
- has no QR/token;
- has no own lifecycle status;
- is not verified publicly;
- groups related credentials for admin convenience.

Credential Set is usually created automatically when the first credential is created. Admin may manually add/move credentials between sets with audit log.

### Credential

One credential is one verifiable document identity:

- one document number;
- one verification token;
- one QR URL;
- one language;
- one status;
- one public verification result.

Certificate + Supplement in the same language can be multiple PDF files inside one credential.

Documents in different languages with different numbers/QR are separate credentials.

### Credential File

Private PDF attached to credential.

Rules:

- one credential may have multiple PDF files;
- all files must match credential language;
- exactly one file can be primary/main;
- at least one primary/main PDF is required for activation;
- old file versions are not retained;
- replacement is audited.

### Document Number Log

Tracks all reserved, issued, and voided numbers.

Fields:

- document number;
- document type;
- status: `reserved`, `issued`, `voided`;
- linked credential;
- created by;
- voided by;
- void reason;
- timestamps.

## 4. Credential Statuses

Release 1 internal statuses:

- `pending`;
- `valid`;
- `revoked`;
- `voided`.

No `expired`.

No `cancelled`.

No `reissued` public/internal lifecycle status in Release 1.

### Pending

Credential is being prepared.

Document number and QR token may already exist because they are needed in the PDF.

Public verification must not reveal pending credentials.

### Valid

Credential is active and publicly verifiable.

Valid credentials may have current public data or PDF corrected through controlled admin actions with mandatory reason and history.

Valid cannot return to pending.

### Revoked

Credential was valid but is withdrawn.

Revocation:

- requires reason;
- is irreversible in standard workflow;
- is visible publicly only as status `Відкликаний`;
- does not reveal document data publicly.

### Voided

Pending credential with reserved number was cancelled before activation.

Voiding:

- requires reason;
- keeps document number permanently unused;
- behaves as not found publicly.

## 5. Document Number

Document number is generated automatically.

Super Admin may perform rare manual override with audit log.

Format:

- `NITBS-C-YYYY-000123` for Certificate;
- `NITBS-D-YYYY-000124` for Diploma.

Rules:

- one shared sequence for all document types;
- sequence does not reset each year;
- year comes from credential issue date;
- number is generated during pending creation/preparation;
- number is never reused, even if credential is voided.

## 6. Verification Token and QR

Verification token is separate from document number.

Document number is human-readable and printed on the document.

Verification token is random, non-guessable, and used in QR URL.

QR URL:

`/verify/[token]`

Token security:

- lookup uses HMAC-SHA-256;
- raw token is not logged;
- raw token is not returned separately;
- service role is never exposed to browser.

## 7. Current Public Record and History

Release 1 does not use immutable snapshot as the public source of truth.

It uses:

- current public credential record;
- credential history;
- audit log.

Public verification always reads current public data for valid credentials.

Changing public data of a valid credential:

- is allowed to Owner, Super Admin, Credential Manager;
- requires reason;
- is recorded in History/Audit;
- is not shown publicly as a revision.

## 8. Public Verification

Inputs:

- QR token;
- document number.

No name/surname search in Release 1.

### Public Result Mapping

`valid`:

- public status: `Дійсний`;
- show document details.

`revoked`:

- public status: `Відкликаний`;
- do not show document details.

`pending`:

- public result: not found.

`voided`:

- public result: not found.

Wrong number/token:

- public result: not found.

`Не підтверджено` is reserved for future intentionally public inactive states. It is not normally returned by the Release 1 lifecycle because pending and voided are hidden as not found.

### Valid Public Fields

Show only:

- status;
- document number;
- holder name;
- programme title;
- document type;
- issue date.

Never show:

- partner;
- email;
- phone;
- learner ID;
- credential UUID;
- private files;
- PDF download;
- notes;
- history;
- reason fields.

Wrong number/token message:

`За цим кодом/номером документ не знайдено.`

## 9. Credential Creation

Actor:

- Owner;
- Super Admin;
- Credential Manager.

Inputs:

- learner;
- programme;
- programme run, optional;
- completion context/date where applicable;
- credential type;
- credential language;
- issue date;
- current public holder name;
- current public programme title;
- current public document type label.

System:

- creates or finds Credential Set;
- reserves document number;
- generates verification token;
- creates pending credential;
- creates Document Number Log entry.

## 10. Activation

Preconditions:

- credential is pending;
- primary/main PDF exists;
- credential has document number;
- credential has verification token;
- admin has required role and MFA.

Activation:

- changes status to valid;
- marks number as issued;
- attempts to send all current PDFs to recipient email;
- records send history.

Activation succeeds even if:

- recipient email is empty;
- email provider fails;
- delivery is not confirmed.

If recipient email is empty, send history records that no email was sent because recipient was empty.

## 11. Email Sending

Provider:

- Gmail / Google Workspace.

Sender:

- one general Nobel ITBS email address.

Recipient:

- prefilled from learner primary email;
- editable by admin before activation/resend;
- may be empty.

Email templates:

- EN template;
- UA template;
- selected by credential language;
- admin may edit text before send.

Send history stores:

- timestamp;
- recipient email;
- admin user;
- subject/body actually sent;
- status;
- technical error;
- list of sent file names/types.

No PDF copy is stored per send event.

## 12. Resend

Valid credential can be resent by:

- Owner;
- Super Admin;
- Credential Manager.

Admin may enter recipient email manually.

All current PDF files are sent.

Resend is recorded in send history.

## 13. PDF Replacement

Allowed for:

- Owner;
- Super Admin;
- Credential Manager.

Rules:

- reason recommended or required by implementation policy;
- replacement recorded in History/Audit;
- old PDF file version not retained;
- no automatic resend.

## 14. Revoke

Allowed for:

- Owner;
- Super Admin;
- Credential Manager.

Rules:

- only valid credential can be revoked;
- reason is mandatory;
- action is audited;
- revoked is irreversible in standard workflow.

## 15. Void Pending Credential

Allowed for:

- Owner;
- Super Admin;
- Credential Manager.

Rules:

- only pending credential can be voided;
- reason is mandatory;
- document number becomes permanently voided;
- public verification returns not found.

## 16. Internal Notes

Credential supports internal notes/comments.

Rules:

- visible only in admin;
- author can edit own comment;
- Owner/Super Admin can delete others' comments;
- no full version history;
- edit/delete audit events are stored.

## 17. Permissions Summary

Content Manager:

- no credential access.

Credential Manager:

- create pending credential;
- upload/replace PDFs;
- activate;
- resend;
- revoke;
- void pending;
- edit current public credential data with reason;
- move credential between sets.

Super Admin:

- same as Credential Manager;
- broader admin/system rights.

Owner:

- all rights;
- Owner-only user/Super Admin control.

## 18. Acceptance Criteria

Credential module is implemented when:

- document number and QR are generated before activation;
- PDF primary requirement blocks activation when missing;
- activation makes credential valid regardless of email send result;
- email send history records success/failure/empty recipient;
- public verification shows details only for valid credentials;
- revoked shows status only;
- pending and voided are not found publicly;
- partners never appear in verification;
- current public data changes require reason and history;
- document numbers are never reused;
- MFA is enforced for sensitive credential actions.
