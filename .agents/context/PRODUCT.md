# Product Context

Product: Nobel ITBS Website and Credential Registry

Register: product

## Purpose

Nobel ITBS is a Czech/EU professional education platform for presenting programmes, driving applications/payments through Leeloo, managing public content and programmes, and issuing verifiable credentials through a private admin workflow.

Release 1 combines:

- public multilingual education website;
- programme catalogue and sales-oriented programme pages;
- public credential verification by QR token or document number;
- admin panel for content, programmes, learners, credentials, email templates, users, and audit/history views.

## Users

Primary public users:

- prospective learners evaluating business, technology, innovation, psychology, and professional development programmes;
- company or organisation representatives looking for training options;
- credential verifiers checking whether a document is valid.

Admin users:

- Owner;
- Super Admin;
- Content Manager;
- Credential Manager.

## Release 1 Scope Boundaries

In scope:

- English public site without prefix;
- Ukrainian public site under `/ua`;
- Czech public site under `/cz`;
- English fallback when UA/CZ translations are missing;
- structured content-managed public pages;
- sales-oriented programme pages with Leeloo CTAs;
- minimal public document verification;
- admin user/auth foundation with mandatory MFA for sensitive roles.

Out of scope:

- LMS;
- student cabinet;
- internal payment processing;
- full CRM;
- News/Blog;
- public PDF download;
- public learner-name verification;
- full page builder;
- Moodle completion automation.

## Product Principles

- Trust first: the site must feel credible for education buyers and document verifiers.
- Clarity over flourish: every page should make the user path obvious.
- Sales pages must sell, not read like database records.
- Verification must be fast, serious, and unambiguous.
- Admin tools serve repeated work, auditability, and security.
- Security-sensitive admin workflows must respect role and MFA rules.

## Navigation And Language Rules

- English has no URL prefix.
- Ukrainian uses `/ua`.
- Czech uses `/cz`.
- Public navigation must not include News/Blog in Release 1.
- Programmes remain a primary navigation item.
- Programme Areas live inside the Programmes section.

## Verification Rules

Public verification supports only:

- document number;
- QR token.

Public verification must not expose:

- internal IDs;
- partner data;
- PDF downloads;
- audit/history;
- learner search by name or surname.

Only valid credentials show document details. Revoked credentials show status only. Pending and voided credentials behave as not found publicly.
