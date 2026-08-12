# Implementation Plan - Release 1

Product: Nobel ITBS Website and Credential Registry
Status: fixed planning baseline

## Guiding Rule

Implementation must proceed by stages. Each stage should finish with:

- migrations/code completed for that stage;
- tests or verification completed;
- brief implementation report;
- no expansion into later stages without explicit approval.

## Stage 0 - Spec Alignment and Project Baseline

Goal: make the repository and documentation ready for implementation.

Deliverables:

- product decisions documented;
- Release 1 scope v2 documented;
- implementation plan documented;
- repository structure agreed;
- original v1 conflicts marked as superseded by v2 decisions.

Status: completed by these documents.

## Stage 1 - Database Foundation

Goal: create safe Supabase/PostgreSQL foundation without business tables.

Scope:

- Supabase project structure;
- migration conventions;
- extensions;
- internal schema;
- helper functions;
- base enums for roles/statuses where stable;
- audit foundation;
- local seed/test harness;
- CI/database checks if project setup supports them.

Important:

- no programme tables yet;
- no credential lifecycle yet;
- no frontend yet.

Primary risk:

- role model changed from single role to multi-role + Owner, so original v1 user profile design must be updated before implementation.

## Stage 2 - Auth, Roles, MFA, and Admin Shell

Goal: make admin access model real before sensitive modules.

Scope:

- Supabase Auth integration;
- Owner role/flag;
- multi-role user model;
- MFA enforcement for Owner, Super Admin, Credential Manager;
- admin layout/shell;
- user management UI;
- permission helpers;
- audit for user/role changes.

Acceptance:

- only one active Owner;
- only Owner can create/change Super Admins;
- users may have multiple roles;
- Content Manager cannot see credentials/learners/contact submissions;
- Credential Manager cannot edit programmes.

## Stage 3 - Content Model and Public Website Foundation

Goal: build multilingual content-managed public site foundation.

Scope:

- language model EN/UA/CZ;
- URL prefixes: none, `/ua`, `/cz`;
- translation statuses;
- structured pages;
- Home;
- About Us;
- Partnerships;
- For Organisations;
- three mandatory full legal pages: Privacy Policy, Terms of Use (Public
  Contract), and Refund Policy;
- minimal localized cookie-consent block with accept/decline actions;
- Site Settings;
- public navigation without News.

Acceptance:

- English fallback works for missing/draft UA/CZ;
- no public fallback warning is shown;
- all public pages except verification are editable through structured admin sections;
- For Organisations Leeloo URL is editable by Owner/Super Admin.

## Stage 4 - Programme Catalogue and Sales Pages

Goal: build programme management and sales-oriented programme pages.

Scope:

- Programme Areas;
- Programme Types;
- Programmes;
- Programme Runs;
- pricing options;
- external application URL hierarchy for Leeloo and partner sites;
- enrolment badge;
- catalogue without visible filters;
- data fields for future filters;
- SEO landing pages for areas/types;
- slug registry and redirects;
- Ask a question form linked to programme.

Acceptance:

- Programme Areas: Business & Management, Technology & Innovation, Psychology & Human;
- Programme Types: Certificate programme, Mini-MBA, Professional development course;
- programme pages are sales-oriented;
- pricing block hides when no prices exist;
- primary CTA goes to the configured Leeloo or partner-site destination;
- secondary CTA opens programme-linked form.

## Stage 5 - Learner Foundation

Goal: build learner records before credentials.

Scope:

- learner profile;
- Latin first/last name;
- Ukrainian full name;
- multiple unique emails;
- primary email;
- multiple unique phones;
- Telegram/Viber/WhatsApp flags;
- optional Telegram username;
- learner credential list linked to the protected credential workspace;
- controlled learner-list import from `.xlsx`/`.csv` with preview, validation, duplicate detection, and an error report;
- learner permissions.

Acceptance:

- same email cannot belong to two learners;
- same phone cannot belong to two learners;
- duplicate contact entry points admin to existing learner;
- imports save only explicitly confirmed valid rows and never overwrite existing learners;
- the database repeats critical validation and persists an accepted import atomically;
- Content Manager cannot access learner data.

## Stage 6 - Credential Core

Goal: implement corrected credential model.

Scope:

- Credential Sets;
- Credentials;
- credential statuses: pending, valid, revoked, voided;
- document types;
- document language;
- document number sequence;
- verification token generation;
- Document Number Log;
- credential file metadata;
- private Storage bucket;
- credential History tab;
- internal notes/comments.

Acceptance:

- Credential Set has no public URL, QR, or lifecycle status;
- one credential has one number/token/language/status;
- document number and token are generated before activation;
- voided numbers are never reused;
- void reason is mandatory;
- at least one primary PDF is required for activation.

## Stage 7 - Credential Activation, Email, and Public Verification

Goal: complete issuance and verification workflow.

Scope:

- activation flow;
- Gmail/Google Workspace sending;
- recipient email override;
- empty recipient handling;
- resend flow;
- send history;
- email templates EN/UA;
- public verification by token;
- public verification by document number;
- revoke flow;
- controlled updates to valid credential public data/PDF.

Acceptance:

- activation makes credential valid even if email fails;
- email failure is recorded;
- resend can use custom recipient email;
- public details are shown only for valid credentials;
- revoked shows only status;
- pending/voided are not found publicly;
- no public PDF download exists.

## Stage 8 - Contact Submissions and Notifications

Goal: handle inbound public forms without building a CRM.

Scope:

- general contact form;
- programme question form;
- organisation/partnership forms if needed by content pages;
- contact submission statuses: new, processed, archived;
- deferred one-way Telegram notification to the manager chat, with minimal metadata and a protected-admin link;
- admin contact submission list/detail.

Acceptance:

- Content Manager cannot access submissions;
- Owner/Super Admin/Credential Manager can access submissions;
- programme question stores source programme;
- Telegram delivery is non-blocking and does not contain the visitor message, email, or phone.

## Stage 9 - Security, QA, and Launch Hardening

Goal: verify the platform before production.

Scope:

- RLS tests;
- credential privacy tests;
- role permission tests;
- MFA tests;
- public verification tests;
- Leeloo and partner-site CTA checks;
- contact form rate limit/CAPTCHA checks;
- email send test;
- responsive frontend QA;
- SEO basics;
- production environment checklist.

Acceptance:

- no service role in browser;
- no private credential data leaks publicly;
- invalid tokens/numbers do not reveal internal records;
- public pages render correctly on mobile/desktop;
- critical admin actions are audited.

## Stage 10 - Post-Launch Backlog

Candidates for after Release 1:

- News/Blog;
- full CRM workflow;
- promotional pricing;
- installments logic;
- student cabinet;
- LMS/Moodle integration;
- automatic PDF generation;
- public expert pages;
- public partner pages;
- public programme filters;
- public name-based verification if legally and privacy-approved;
- old PDF version retention if audit requirements grow.
