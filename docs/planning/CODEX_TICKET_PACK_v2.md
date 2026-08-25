# Codex Ticket Pack v2

Product: Nobel ITBS Website and Credential Registry
Status: Release 1 implementation ticket baseline

## 1. Rule

Codex must work one ticket at a time.

Each ticket requires:

- scoped implementation;
- verification/tests;
- short report;
- no unrelated feature expansion.

## 2. Ticket Groups

### Group A - Project and Database Foundation

DBF-001 Supabase Foundation

- initialize Supabase structure;
- config;
- migrations/tests folders;
- scripts.

DBF-002 Migration Standards

- naming conventions;
- docs;
- migration checklist.

DBF-003 Internal Schema and Extensions

- internal schema;
- pgcrypto/citext/pg_trgm;
- default privilege hardening.

DBF-004 Audit Foundation

- audit_log;
- append-only policy;
- audit writer helper.

### Group B - Auth, Roles, MFA

AUTH-001 User Profiles

- user_profiles;
- active status;
- Owner flag.

AUTH-002 Multi-Role Model

- user_roles;
- app_role enum;
- users may have multiple roles.

AUTH-003 Owner Rules

- only one active Owner;
- Owner-only Super Admin management.

AUTH-004 Role Helpers

- has_role;
- is_owner;
- is_active_admin;
- MFA/AAL helper.

AUTH-005 Admin User Management API/UI

- create admin users;
- assign roles;
- activate/deactivate;
- enforce Owner/Super Admin restrictions.

AUTH-006 MFA Enforcement

- Owner/Super Admin/Credential Manager required;
- sensitive route checks.

### Group C - Public Content and Site Shell

CNT-001 Languages

- seed en/ua/cz;
- URL prefix model;
- fallback logic.

CNT-002 Structured Content Pages

- content_pages;
- translations;
- structured sections.

CNT-003 Public Layout and Navigation

- no News;
- Programmes;
- For Organisations;
- Partnerships;
- Verify;
- About.

CNT-004 Site Settings

- For Organisations Leeloo URL;
- settings permissions.

CNT-005 Legal Pages

- content-managed legal pages.

### Group D - Programmes

PRG-001 Programme Areas

- areas;
- translations;
- seed three areas.

PRG-002 Programme Types

- types;
- translations;
- seed three types.

PRG-003 Programme Core

- programmes;
- translations;
- structured sales sections.

PRG-004 Programme Runs and Enrolment Badge

- runs;
- badge calculation;
- admin correction.

PRG-005 Pricing Options

- flexible pricing options;
- language/currency support;
- Leeloo/partner-site application fallback.

PRG-006 Programme Catalogue

- simple grid/list;
- no visible filters;
- fields ready for future filters;
- manager-controlled catalogue order;
- localized comparison facts and document summary;
- no pricing in the catalogue projection.

PRG-007 SEO Landing Pages

- area/type landing pages;
- shared `/programmes/[slug]` namespace;
- programme detail rendering through the same namespace resolver;
- slug collision prevention;
- localized canonical, hreflang, and Open Graph metadata.

PRG-008 Slug Redirects

- 301 redirects on published slug changes.

PRG-009 Programme Question Form

- secondary CTA;
- programme-linked contact submission.

### Group E - Partners, Experts, Contact

PCE-001 Partners

- partner cards;
- translations;
- no public detail page.

PCE-002 Experts

- expert cards;
- translations;
- no public detail page.

PCE-003 Partnerships Page

- organisations and experts.

PCE-004 Contact Submissions

- new/processed/archived;
- permissions;
- protected admin as source of truth;
- notification channel contract remains non-blocking.

PCE-005 Telegram Manager Notifications (deferred until pre-launch)

- one-way Telegram Bot API notification after successful storage;
- server-only bot token and manager chat ID;
- submission type, locale, optional programme context, timestamp, and protected-admin link only;
- no visitor message, email, or phone in Telegram;
- notification failure never rejects or deletes the submission;
- no webhook or inbound bot workflow in Release 1.

### Group F - Learners

LRN-001 Learner Core

- Latin names;
- Ukrainian full name.

LRN-002 Learner Emails

- multiple emails;
- primary email;
- global uniqueness.

LRN-003 Learner Phones

- multiple phones;
- global uniqueness;
- Telegram/Viber/WhatsApp flags;
- Telegram username.

LRN-004 Learner Admin UI

- profile;
- contact management;
- credential list.

LRN-005 Learner List Import

- controlled `.xlsx`/`.csv` template and parser;
- preview before persistence with valid and invalid row separation;
- duplicate detection inside the file and against existing learners, emails, and phones;
- invalid rows are excluded and existing records are never overwritten;
- downloadable error report;
- one explicitly confirmed, atomic import for Owner/Super Admin/Credential Manager with MFA;
- privacy-minimal audit entry containing the imported count only.

### Group G - Credential Core

CRD-001 Credential Types

- type codes;
- document letters;
- translations.

CRD-002 Credential Sets

- simplified set;
- automatic creation;
- move/add operations.

CRD-003 Document Number Log

- reserve/issued/voided;
- shared sequence;
- no reuse.

CRD-004 Credentials

- pending/valid/revoked/voided;
- current public record;
- token fields.

CRD-005 Credential Files

- private PDFs;
- file types;
- one primary;
- no old versions.

CRD-006 Credential History and Notes

- history tab;
- notes/comments;
- edit/delete rules.

### Group G2 - Automatic Credential Document Generation

PDFGEN-001 Template and Generation Database Foundation

- private template package/version/document/placement model;
- private generation batch/item/provenance model;
- one-primary, context, immutable-version, idempotency, RLS, and audit foundation.

PDFGEN-002 Private Template Storage and Validation

- private `credential-templates` bucket;
- source PDF validation/sanitization boundary;
- published object immutability;
- multi-page metadata and private preview access.

PDFGEN-003 Template Package Admin and Field Placement Editor

- programme/run/type/language/variant context;
- multiple Template Documents per package;
- constrained field placement on any page;
- sample preview, validation, publish, and retire workflow;
- Owner/Super Admin mutation only.

PDFGEN-004 Server-Side Multi-Document PDF Generation

- embedded EN/UA/CZ-capable fonts;
- text/date/QR overlay;
- one primary plus optional additional multi-page output PDFs;
- overflow, malformed PDF, and QR scan safety.

PDFGEN-005 Single Credential Generation and Regeneration

- published-template context enforcement;
- server-only QR/token use;
- pending generation/regeneration;
- private review;
- valid correction remains reason/history controlled.

PDFGEN-006 Batch Generation and Review

- the complete explicitly selected cohort without a fixed product-facing cap;
- automatic bounded/configurable technical chunks under one aggregate batch/progress view;
- conflict preview and explicit confirmation;
- bounded resumable/idempotent processing;
- per-item retry with permanent-number preservation;
- private batch review.

PDFGEN-007 Batch Activation and VEDOS Delivery

- explicit reviewed-item selection;
- independent per-credential activation and delivery outcome;
- all current package PDFs sent together;
- email failure never rolls back activation or blocks other items.

PDFGEN-008 Generation Security and End-to-End Acceptance

- RLS/MFA/role matrix;
- private template/generated-file boundary;
- audit/history privacy;
- multi-document, multi-page, multilingual, long-name, QR, retry, batch, activation, and delivery tests.

### Group H - Credential Workflows

WF-001 Create Pending Credential

- set creation;
- number reservation;
- token generation.

WF-002 Upload and Manage PDFs

- primary requirement;
- replacements;
- private storage.

WF-003 Activate and Email

- activation;
- VEDOS SMTP send from the approved Nobel ITBS mailbox;
- success independent of email result.

WF-004 Resend Credential

- custom recipient;
- all current PDFs;
- send history.

WF-005 Revoke

- valid only;
- mandatory reason;
- irreversible.

WF-006 Void Pending

- pending only;
- mandatory reason;
- number voided forever.

WF-007 Update Valid Public Data

- controlled update;
- mandatory reason;
- history.

WF-008 Public Verification

- QR token;
- document number;
- valid details only;
- revoked status only;
- pending/voided not found.

### Group I - Admin and Security QA

QA-001 RLS Tests

- each role;
- each protected table.

QA-002 Verification Privacy Tests

- no partner;
- no PDF;
- no internal ID;
- revoked details hidden.

QA-003 MFA Tests

- sensitive actions blocked without MFA.

QA-004 End-to-End Admin Flows

- create learner;
- create credential;
- upload PDF;
- activate;
- verify;
- revoke.

QA-005 Launch Checklist

- env vars;
- VEDOS SMTP credential delivery;
- Leeloo;
- CAPTCHA/rate limits;
- analytics;
- backups.

## 3. First Implementation Sequence

Start with:

1. DBF-001;
2. DBF-002;
3. DBF-003;
4. DBF-004;
5. AUTH-001.

Do not start programme or credential tables before role model is implemented.

## 4. Out of Scope for First Ticket Group

During Group A, do not implement:

- frontend;
- programmes;
- learners;
- credentials;
- email sending;
- Leeloo;
- public verification.
