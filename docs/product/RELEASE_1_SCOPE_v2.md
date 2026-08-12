# Release 1 Scope v2

Product: Nobel ITBS Website and Credential Registry
Status: implementation planning baseline
Based on: original v1 specifications + Product Decisions / Spec Alignment v2

## 1. Release 1 Goal

Release 1 must launch a professional, content-managed education platform that:

- presents Nobel ITBS as a Czech/EU professional education company;
- promotes programmes and drives applications/payments through Leeloo or approved partner websites;
- manages programmes, content, learners, and credentials from an admin panel;
- issues verifiable credentials with QR/document-number verification;
- sends private credential PDFs to learners through Gmail/Google Workspace.

## 2. In Scope

### Public Website

- Home page;
- Programmes catalogue;
- Programme Area landing pages;
- Programme Type landing pages;
- sales-oriented programme detail pages;
- About Us;
- Partnerships;
- For Organisations;
- three mandatory full legal pages: Privacy Policy, Terms of Use (Public
  Contract), and Refund Policy;
- minimal localized cookie-consent block with accept/decline actions;
- Verify document pages;
- Contact / programme question forms.

### Languages

- English without prefix;
- Ukrainian `/ua`;
- Czech `/cz`;
- English fallback for missing UA/CZ translations;
- admin translation statuses.

### Programme Management

- Programme Areas;
- Programme Types;
- Programmes;
- Programme runs;
- structured sales content sections;
- pricing options;
- vendor-neutral external application URLs at programme/run/pricing-option level;
- automatic enrolment badge with admin correction ability;
- SEO landing pages under `/programmes/[slug]`;
- slug uniqueness and redirects.

### Content Management

- structured editable public pages;
- partners;
- experts;
- FAQ blocks where used;
- legal pages;
- site settings, including For Organisations Leeloo URL.

### Credential Registry

- Learners with multiple emails/phones and controlled list import;
- Credential Sets;
- Credentials;
- document number generation;
- QR token generation;
- private PDF files;
- activation;
- email sending;
- resend;
- revoke;
- void pending credential with reserved number;
- Document Number Log;
- credential History tab;
- internal credential notes/comments.

### Public Verification

- verify by QR token;
- verify by document number;
- public status mapping:
  - valid -> Дійсний;
  - revoked -> Відкликаний;
  - future intentionally public inactive states -> Не підтверджено;
  - wrong/pending/voided hidden states -> Не знайдено;
- details shown only for valid credentials:
  - status;
  - document number;
  - holder name;
  - programme title;
  - document type;
  - issue date.

### Admin Panel

- Owner/Super Admin user management;
- Content Manager content tools;
- Credential Manager credential tools;
- contact submissions;
- email templates;
- site settings;
- audit/history views.

### Security

- Supabase Auth;
- RLS;
- no service role in browser;
- mandatory MFA for Owner, Super Admin, Credential Manager;
- controlled server-side credential mutations;
- audit logging;
- rate limiting and CAPTCHA for public forms/verification where needed.

### Integrations

- Leeloo outbound funnels and approved programme partner websites;
- Gmail/Google Workspace sending;
- analytics events for CTA/contact/verification basics;
- private Supabase Storage for credential PDFs.

## 3. Out of Scope

- LMS;
- student cabinet;
- internal payment processing;
- full CRM;
- News/Blog;
- public PDF download;
- automatic Moodle completion integration;
- automatic PDF document generation;
- old PDF version retention;
- search by learner name/surname in public verification;
- full page builder;
- promotional pricing/discount system;
- installment-specific pricing workflow;
- expert public profile pages;
- partner organisation public profile pages.

## 4. Key Release 1 Simplifications

- Public catalogue has no visible filters yet.
- Filters are supported in data model for future use.
- Credential Set has no own lifecycle status.
- Public verification is intentionally minimal and trust-focused.
- Current public credential data can be corrected with reason and history.
- News is removed from navigation and scope.
- Contact submissions have only `new`, `processed`, `archived`.

## 5. Release 1 Success Criteria

Release 1 is successful when:

- all core public pages are content-managed;
- at least EN content can be published, with UA/CZ fallback behavior;
- programmes can be published as sales pages;
- configured Leeloo or partner-site CTAs work from programme pages and pricing options;
- learners and credentials can be managed by authorized admins;
- credential number and QR are generated before activation;
- credential PDF files can be uploaded and emailed;
- valid credentials can be verified by QR and document number;
- revoked/pending/voided documents do not leak document details;
- Owner/Super Admin/Credential Manager MFA is enforced;
- audit/history covers critical credential actions.
