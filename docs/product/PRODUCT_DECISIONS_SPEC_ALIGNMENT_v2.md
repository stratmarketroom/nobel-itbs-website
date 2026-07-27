# Product Decisions / Spec Alignment v2

Product: Nobel ITBS Website and Credential Registry
Owner: Nobel ITBS s.r.o.
Decision source: product owner interview, July 2026
Status: approved working alignment for Release 1 planning

## 1. Purpose

This document aligns the original Release 1 specifications with product decisions made after review.

It supersedes conflicting parts of the earlier v1 documents where explicitly stated here. It does not replace detailed API, database, RLS, sitemap, or ticket specifications; it defines the corrected product logic that those documents must follow.

## 2. Core Product Model

Release 1 is a corporate education platform with:

- public content website;
- programme catalogue and sales-oriented programme pages;
- Leeloo transitions for applications/payments;
- credential registry and public verification;
- admin panel for content, programmes, learners, credentials, email, and users.

Release 1 does not include:

- LMS;
- student cabinet;
- payment module inside the site;
- full CRM;
- public document PDF download;
- news/blog;
- automatic Moodle-based document issuing.

## 3. Public Website

### 3.1 Languages and URLs

Release 1 supports three public languages:

- English: no URL prefix;
- Ukrainian: `/ua`;
- Czech: `/cz`.

Examples:

- `/programmes`
- `/ua/programmes`
- `/cz/programmes`

English is the canonical fallback language. If UA or CZ translation is missing or draft, the public site shows English content without displaying a fallback warning to the user.

The admin panel must show simple translation statuses per language:

- `missing`;
- `draft`;
- `published`.

### 3.2 Public Pages

All public pages are content-managed in the admin panel, except verification pages, which are system pages.

Release 1 public pages include:

- Home;
- Programmes catalogue;
- Programme Area landing pages;
- Programme Type landing pages;
- Programme sales pages;
- About Us;
- Partnerships;
- For Organisations;
- Verify document;
- Legal pages;
- system pages such as 404.

News/Blog is not included in Release 1 and must be removed from public navigation.

### 3.3 Content Editing Model

Release 1 uses structured editable sections, not a full page builder.

Each page type has controlled sections and fields. Blocks may be hidden if not needed or not filled.

### 3.4 Navigation

The main menu keeps Programmes as a primary item. Programme Areas are shown inside the Programmes section, not as separate top-level navigation items.

The public navigation should not include News in Release 1.

## 4. Programmes

### 4.1 Programme Areas

Release 1 Programme Areas:

- Business & Management;
- Technology & Innovation;
- Human & Behavioral Sciences.

The third area should mention psychology clearly in its description, without narrowing the area name.

The public label for areas is `Programme Areas`, not `Tracks`.

### 4.2 Programme Types

Release 1 programme types:

- Certificate programme;
- Mini-MBA;
- Professional development course.

The system must allow new programme types to be added later without code changes.

### 4.3 Catalogue

Release 1 public catalogue shows a simple list/grid of programmes without visible filters.

The data model should still support future filtering by:

- area;
- type;
- language;
- format.

Programme cards may show an enrolment badge with three public states:

- Enrolment open / ongoing;
- Coming soon;
- Enrolment inactive.

Badge state is calculated automatically from programme runs, but admins may correct programme presentation when needed.

### 4.4 SEO Landing Pages

Release 1 includes SEO landing pages for:

- Programme Areas;
- Programme Types.

They live under `/programmes/[slug]`, sharing the same URL namespace as individual programme pages. Slugs must be globally unique inside this namespace.

Each SEO landing page is editable in admin:

- H1;
- SEO title;
- SEO description;
- intro text;
- related area/type;
- automatic list of matching programmes.

If an already published slug changes, the system should preserve an automatic 301 redirect from the old slug.

### 4.5 Programme Sales Pages

Programme pages are sales-oriented landing pages. Their main goal is applications and payments through Leeloo.

Suggested structured sections:

- hero with value proposition and primary CTA;
- who it is for;
- outcomes / skills;
- modules / curriculum;
- format and duration;
- document issued;
- expert / teacher cards, if any;
- trust block;
- pricing, if configured;
- FAQ, if configured;
- repeated CTA.

Primary CTA goes to Leeloo.

Secondary CTA is `Ask a question`, opening an on-site form. This form stores the source programme in contact submissions.

### 4.6 Pricing

Programme pages may show pricing, but pricing is not required for publication.

If no price is configured, the pricing block is hidden.

Release 1 supports flexible pricing options:

- option name;
- price;
- currency;
- short description;
- CTA label;
- optional Leeloo URL.

If a pricing option has its own Leeloo URL, use it. Otherwise fall back to the programme-level Leeloo URL.

Prices are shown only on programme pages, not in the catalogue.

Promotional pricing and installment logic are not required in Release 1.

Currency may differ by language/market version:

- EN usually EUR;
- UA may be EUR or UAH;
- CZ may be CZK.

## 5. Partnerships and Experts

Release 1 includes a Partnerships page.

Partnerships page contains:

- partner organisations;
- experts / teachers.

Experts are a separate content entity from partner organisations.

Experts do not need individual public profile pages in Release 1. Cards/sections are enough.

Partner organisations do not need individual public pages in Release 1. Cards/logos are enough.

Partners are public trust/content entities only. Partners must not enter credential verification, credential snapshots, or public verification results.

## 6. For Organisations

Release 1 includes a For Organisations page.

It is a content-managed page with an offer for:

- courses;
- experts;
- online schools.

The primary CTA leads to a dedicated Leeloo funnel.

Release 1 includes simple Site Settings where Owner/Super Admin can edit the For Organisations Leeloo URL.

## 7. Contact Submissions

Public forms are stored in admin and also send email notifications to the general Nobel ITBS email address.

Contact submissions are accessible to:

- Owner;
- Super Admin;
- Credential Manager.

Content Manager has no access to contact submissions.

Release 1 contact submission statuses:

- `new`;
- `processed`;
- `archived`.

No CRM workflow is included in Release 1.

Programme `Ask a question` form is stored as a contact submission with type `programme_question` and linked programme context.

## 8. Credential Registry: Corrected Model

### 8.1 Credential Set

Release 1 uses a simplified internal `Credential Set`.

Credential Set is a service grouping entity for related credentials of the same learner/programme/completion context.

Credential Set:

- has no public URL;
- has no QR/token;
- has no public verification;
- has no own lifecycle status;
- is not shown in public verification.

Credential Set may be created automatically by the system when the first matching credential is created.

Admins may manually add a credential to an existing set or move a credential between sets, with audit log.

Allowed roles for moving credentials between sets:

- Owner;
- Super Admin;
- Credential Manager.

### 8.2 Credential

One credential is one verifiable document identity:

- one document number;
- one verification token/QR;
- one document language;
- one public verification page;
- one status.

Certificate + Supplement in the same language may be multiple PDF files inside one credential.

EN and UA versions with different numbers/QR are separate credentials.

### 8.3 Credential Files

One credential may have multiple PDF files.

All PDF files inside one credential must belong to the credential language.

Each PDF file has:

- file type;
- admin label/name;
- primary/main flag;
- storage metadata.

Exactly one primary/main PDF is allowed per credential.

At least one primary/main PDF is required before activation.

All current PDF files are sent to the learner during activation and resend.

Public users cannot download credential PDFs in Release 1.

Private PDFs are required in Release 1 for sending documents to learners.

After activation, PDF files may be changed only by:

- Owner;
- Super Admin;
- Credential Manager.

Only the current PDF version is stored. Old PDF file versions are not retained. Audit/history records the replacement.

Replacing a PDF does not automatically resend the document. Resend is a separate admin action.

## 9. Credential Statuses and Public Verification

### 9.1 Internal Statuses

Release 1 internal credential statuses:

- `pending`;
- `valid`;
- `revoked`;
- `voided`.

No `expired` in Release 1.

No `cancelled` in Release 1.

No public `reissued` status in Release 1.

### 9.2 Status Rules

`pending` means the credential is being prepared and is not publicly confirmed.

`valid` means the credential is active and can be publicly verified.

`revoked` means the credential was valid but has been withdrawn. Revocation is irreversible in the standard workflow.

`voided` means a pending credential with reserved document number was cancelled before activation. The number remains permanently unused.

After `valid`, the credential cannot return to `pending`.

If a valid document needs correction, keep status `valid` and update current public data/PDF through a controlled change with required reason and history.

If a document was issued in error, use `revoked`.

### 9.3 Public Status Mapping

Public verification shows:

- `valid` -> `Дійсний`;
- `revoked` -> `Відкликаний`;
- found but not valid/revoked -> `Не підтверджено` only for future inactive states that are intentionally public;
- wrong number/token or pending/voided hidden from public -> `Не знайдено`.

For `valid`, public verification shows only:

- status;
- document number;
- holder name;
- programme title;
- document type;
- issue date.

For `revoked`, public verification shows only:

- status `Відкликаний`.

No document details are shown for revoked documents.

For Release 1, pending, voided, and non-existing documents show not found. Therefore `Не підтверджено` is a reserved public state, not normally used by the Release 1 credential lifecycle.

Partners, private files, email, phone, UUIDs, internal notes, audit history, and PDF links must never be shown publicly.

### 9.4 Verification Inputs

Release 1 public verification supports:

- document number manual input;
- QR-code/token URL.

Search by surname/name is not included in Release 1.

Document number and verification token are separate values:

- document number is printed and human-readable;
- verification token is random, non-guessable, and used in QR URL.

QR URL opens `/verify/[token]` and immediately shows the result.

Manual verification by document number shows the same valid result as QR verification.

Wrong code/number message:

`За цим кодом/номером документ не знайдено.`

## 10. Document Numbering and QR

Document number is generated automatically by the system.

Super Admin may perform rare manual override with audit log.

Format:

- `NITBS-C-YYYY-000123` for Certificate;
- `NITBS-D-YYYY-000124` for Diploma.

Document type letter is included in the number.

There is one shared sequence for all document types.

The sequence does not reset each year.

The year in the document number comes from credential issue date.

Document number and QR-token must be generated during pending credential creation/preparation, not activation, because they must be printed in the PDF before activation.

If pending credential with reserved number is voided, the number is never reused.

Voiding requires a mandatory reason.

Release 1 includes Document Number Log in admin:

- document number;
- document type;
- number status: `reserved`, `issued`, `voided`;
- linked credential, if any;
- created by;
- voided by;
- void reason;
- timestamps.

## 11. Credential Data and Change History

The original immutable snapshot model is replaced in Release 1 by:

- current public credential record;
- controlled change history;
- audit log.

Public verification always shows current public data for valid credentials.

The public site does not show last update date or revision history.

Changing public data of a valid credential is allowed for:

- Owner;
- Super Admin;
- Credential Manager.

Reason is mandatory.

Credential page in admin must include a simple History tab showing:

- status changes;
- public data changes;
- PDF changes;
- email sends/resends;
- document number events;
- important administrative actions.

## 12. Learners

Learner profile stores:

- Latin first name;
- Latin last name;
- Ukrainian full name;
- multiple emails;
- primary email;
- multiple phones;
- Telegram/Viber/WhatsApp availability;
- optional Telegram username;
- internal notes/comments;
- linked credentials.

Email addresses are unique in the system and may belong to only one learner.

Phone numbers are unique in the system and may belong to only one learner.

If an admin enters an email or phone already linked to another learner, the system must prevent duplication and show the existing learner.

Learner profile includes a simple list of all credentials for that learner:

- document number;
- programme;
- document type;
- status;
- issue date;
- last sent date, if any.

Document language is selected per credential:

- EN;
- UA;
- CZ.

For EN documents use Latin first/last name.

For UA documents use Ukrainian full name.

## 13. Email Sending

Gmail / Google Workspace is used for sending credential PDFs.

Emails are sent from one general Nobel ITBS address, not from the individual admin address.

Activation means:

- credential becomes `valid`;
- system attempts to send all current PDF files to the recipient email.

Activation does not depend on successful email delivery. Once activated, the document is valid and can be verified publicly.

Recipient email:

- is shown on activation screen;
- is prefilled from learner primary email if available;
- may be changed by admin before activation;
- may be left empty.

If recipient email is empty:

- activation still succeeds;
- no email is sent;
- send history records that email was not sent because recipient was empty.

Admins may resend an already activated document.

Before resend, admin may enter a different recipient email without changing learner profile.

Send history stores:

- date/time;
- recipient email;
- admin user;
- send status;
- technical error, if any;
- actual email subject/body;
- list of file names/types sent.

No PDF copies are stored per send event.

Email templates:

- separate EN and UA templates are required;
- template is selected based on credential language;
- admin may edit email text before sending;
- actual sent text is stored in send history.

Admin Email Templates section:

- editable by Owner, Super Admin, Credential Manager;
- not accessible to Content Manager;
- no full template version history, only audit event on change.

## 14. Roles and Permissions

Release 1 roles:

- Owner;
- Super Admin;
- Content Manager;
- Credential Manager.

There is exactly one active Owner.

Only Owner may create or change Super Admins.

Super Admin has broad system rights, excluding Owner-only actions.

Users may have multiple roles, e.g. Content Manager + Credential Manager.

Roles must be stored as a set, not a single `role` field.

MFA is mandatory for:

- Owner;
- Super Admin;
- Credential Manager.

Content Manager MFA is optional.

Content Manager:

- can access content only;
- cannot access learners;
- cannot access credentials;
- cannot access contact submissions.

Credential Manager:

- can manage learners and credentials;
- can see programmes/runs only as read-only reference for credential creation;
- cannot edit programmes;
- can access contact submissions;
- can update PDFs and public credential data with history;
- can revoke documents with mandatory reason.

Owner/Super Admin:

- can manage users according to Owner/Super Admin rules;
- can manage site settings;
- can manage content and credentials according to permissions above.

Release 1 includes admin UI for user management.

## 15. Internal Notes

Credential supports internal notes/comments visible only in admin.

Comment author can edit own comment.

Owner and Super Admin can delete others' comments.

Release 1 stores current comment text and audit events for edit/delete. Full comment version history is not required.

## 16. Specification Changes Required Against Original v1 Documents

The following original v1 assumptions must be updated:

1. Replace complex Credential Group lifecycle with simplified Credential Set without own lifecycle status.
2. Credential status enum becomes `pending`, `valid`, `revoked`, `voided`.
3. Remove `expired`, `cancelled`, and public `reissued` from Release 1.
4. Replace immutable snapshot model with current public record + change history.
5. Partners must not be copied into credential verification or public credential data.
6. Public verification shows document details only for valid credentials.
7. Revoked public result shows status only.
8. Pending/voided public result behaves as not found.
9. Private PDF files are required in Release 1, but public PDF download is not.
10. Activation includes email send attempt but is not blocked by email failure.
11. Gmail/Google Workspace integration is required.
12. Learner emails and phones become multi-value unique contact entities.
13. Roles become multi-role with separate Owner role/flag.
14. Site language prefixes become `/ua` and `/cz`, English without prefix.
15. News/Blog removed from Release 1.
16. Public programme catalogue launches without visible filters.
17. SEO landing pages for Programme Areas and Programme Types are included.
