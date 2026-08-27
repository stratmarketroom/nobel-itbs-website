# Agent Execution Sequence

Product: Nobel ITBS Website and Credential Registry
Status: orchestration baseline for implementation

## 1. Purpose

This document defines how implementation agents should be sequenced, which agents may work in parallel, what each agent owns, and where Owner/orchestrator checkpoints happen.

It complements:

- `IMPLEMENTATION_PLAN_RELEASE_1.md`
- `CODEX_TICKET_PACK_v2.md`
- `AGENT_OPERATING_MANUAL.md`

## 2. Agent Roles

### Foundation / DevOps Agent

Owns:

- project scaffold;
- Supabase local structure;
- migration/test folders;
- scripts;
- local setup instructions;
- environment examples without secrets.

First tickets:

- DBF-001;
- DBF-002;
- DBF-003.

### Database / Security Agent

Owns:

- PostgreSQL schema;
- RLS;
- role helper functions;
- audit foundation;
- database tests;
- migration safety.

Starts after Foundation basics exist.

### Auth / Admin Foundation Agent

Owns:

- Supabase Auth integration;
- Owner/Super Admin/Content Manager/Credential Manager model;
- multi-role user model;
- MFA enforcement;
- admin shell access gates.

Starts after database foundation exists.

### Public Frontend Agent

Owns:

- public layout;
- navigation;
- responsive design system;
- public pages;
- programme page UI;
- verification UI.

Can start after project scaffold exists, but must not invent API/data models.

### Admin UI Agent

Owns:

- admin shell;
- users UI;
- content editor UI;
- programme admin UI;
- learner admin UI;
- credential admin UI.

Starts after Auth/Admin Foundation has basic route protection and role model.

### Backend/API Agent

Owns:

- Next.js server routes/actions;
- validation;
- Supabase data access layer;
- public verification routes;
- credential workflows;
- VEDOS SMTP integration for credential delivery;
- Leeloo and partner-site CTA support.

Starts after relevant database schema exists.

### QA / Security Review Agent

Owns:

- RLS tests;
- permission tests;
- public privacy tests;
- Playwright/smoke tests;
- responsive checks;
- launch hardening checks.

Runs after each completed module, not only at the end.

## 3. Execution Phases

### Phase 1 - Single-Agent Start

Active agent:

- Foundation / DevOps Agent.

Tickets:

- DBF-001 Supabase Foundation;
- DBF-002 Migration Standards;
- DBF-003 Internal Schema and Extensions, if DBF-001/002 are complete.

Parallel work:

- none.

Reason:

- repo currently contains documentation only;
- all other agents need scaffold and conventions.

Owner checkpoint:

- confirm local project scaffold direction if the agent finds more than one viable setup.

Orchestrator checks:

- no business tables created;
- no frontend feature work;
- no secrets committed;
- scripts are clear;
- setup is reproducible.

### Phase 2 - Foundation + Auth

Active agents:

- Database / Security Agent;
- Auth / Admin Foundation Agent, if schema foundation is ready.

Tickets:

- DBF-004 Audit Foundation;
- AUTH-001 User Profiles;
- AUTH-002 Multi-Role Model;
- AUTH-003 Owner Rules;
- AUTH-004 Role Helpers;
- AUTH-006 MFA Enforcement foundation.

Parallel work:

- limited.

Allowed parallelism:

- Database/Security may work on SQL migrations;
- Auth agent may work on server/auth shell only after role schema contracts are stable.

Blocked:

- content/programme/credential modules.

Owner checkpoint:

- confirm first Owner bootstrap method if needed.

Orchestrator checks:

- one active Owner rule;
- roles are multi-role;
- Content Manager isolation;
- Credential Manager boundaries;
- MFA checks present for sensitive paths.

### Phase 3 - Content and Public Shell

Active agents:

- Database / Security Agent;
- Public Frontend Agent;
- Admin UI Agent for content shell, if auth is ready.

Tickets:

- CNT-001 Languages;
- CNT-002 Structured Content Pages;
- CNT-003 Public Layout and Navigation;
- CNT-004 Site Settings;
- CNT-005 Legal Pages.

Parallel work:

- yes, with coordination.

Allowed parallelism:

- database/content schema;
- public layout/design system;
- admin content UI after API/schema contract is stable.

Blocked:

- credential registry workflows;
- credential-email provider integration.

Owner checkpoint:

- review first public layout direction before broad page implementation.

Orchestrator checks:

- `/ua` and `/cz`;
- English fallback;
- no News;
- structured sections, not page builder;
- design follows guidelines.

### Phase 4 - Programmes

Active agents:

- Database / Security Agent;
- Backend/API Agent;
- Public Frontend Agent;
- Admin UI Agent.

Tickets:

- PRG-001 Programme Areas;
- PRG-002 Programme Types;
- PRG-003 Programme Core;
- PRG-004 Programme Runs and Enrolment Badge;
- PRG-005 Pricing Options;
- PRG-006 Programme Catalogue;
- PRG-007 SEO Landing Pages;
- PRG-008 Slug Redirects;
- PRG-009 Programme Question Form.

Parallel work:

- yes, after schema contracts are approved.

Owner checkpoint:

- review programme sales page structure and one sample page.

Orchestrator checks:

- no public catalogue filters in Release 1;
- SEO pages under `/programmes/[slug]`;
- slug collision prevention;
- primary CTA to the configured Leeloo or partner site;
- secondary Ask a question form.

### Phase 5 - Learners

Active agents:

- Database / Security Agent;
- Backend/API Agent;
- Admin UI Agent.

Tickets:

- LRN-001 Learner Core;
- LRN-002 Learner Emails;
- LRN-003 Learner Phones;
- LRN-004 Learner Admin UI;
- [x] LRN-005 Learner List Import — accepted in dev on 2026-08-12; see `docs/qa/LRN_005_LEARNER_LIST_IMPORT_QA_2026-08-12.md`.

Parallel work:

- limited.

Owner checkpoint:

- review learner form UX if needed.

Orchestrator checks:

- email uniqueness;
- phone uniqueness;
- primary email;
- Telegram/Viber/WhatsApp flags;
- spreadsheet preview and duplicate/error handling before import;
- atomic confirmed import without overwriting existing learners;
- Content Manager no access.

### Phase 6 - Credential Core

Active agents:

- Database / Security Agent;
- Backend/API Agent;
- Admin UI Agent.

Tickets:

- CRD-001 Credential Types;
- CRD-002 Credential Sets;
- CRD-003 Document Number Log;
- CRD-004 Credentials;
- CRD-005 Credential Files;
- CRD-006 Credential History and Notes.
- PDFGEN-001 Template and Generation Database Foundation;
- PDFGEN-002 Private Template Storage and Validation;
- PDFGEN-003 Template Package Admin and Field Placement Editor.

Parallel work:

- limited and carefully sequenced.

Owner checkpoint:

- review credential create/detail admin workflow before activation/email implementation.

Orchestrator checks:

- statuses are only pending/valid/revoked/voided;
- no expired/cancelled/reissued lifecycle;
- Credential Set has no public lifecycle;
- number generated before activation;
- one Template Package may contain a primary document plus optional additional multi-page documents;
- published template versions are immutable/private and only Owner/Super Admin may manage them;
- no partner in verification data.

### Phase 7 - Credential Workflows

Active agents:

- Backend/API Agent;
- Admin UI Agent;
- QA / Security Review Agent.

Tickets:

- PDFGEN-004 Server-Side Multi-Document PDF Generation;
- PDFGEN-005 Single Credential Generation and Regeneration;
- PDFGEN-006 Batch Generation and Review;
- PDFGEN-007 Batch Activation and VEDOS Delivery;
- PDFGEN-008 Generation Security and End-to-End Acceptance;
- WF-001 Create Pending Credential;
- WF-002 Upload and Manage PDFs;
- WF-003 Activate and Email;
- WF-005 Revoke;
- WF-006 Void Pending;
- WF-007 Update Valid Public Data;
- WF-008 Public Verification;
- WF-004 Resend Credential, implemented during pre-launch hardening, migrated and deployed in dev/Production, and accepted at the currently available operational level.

Parallel work:

- backend and admin UI may overlap only after API contracts are stable.

Owner checkpoint:

- provide/confirm the VEDOS mailbox and server-only SMTP integration path;
- review public verification result UI.

Orchestrator checks:

- activation succeeds even if email fails;
- primary PDF required;
- automatic generation removes manual per-learner PDF composition for configured packages;
- generation supports a primary Certificate/Diploma plus optional multi-page Supplement/Transcript PDFs;
- batches are review-gated, resumable/idempotent, and never reuse a reserved number after failure;
- all current PDFs sent;
- public PDF download absent;
- revoked details hidden;
- pending/voided not found.

### Phase 8 - Contact, Integrations, and Notifications

Active agents:

- Backend/API Agent;
- Admin UI Agent;
- QA / Security Review Agent.

Tickets:

- PCE-004 Contact Submissions;
- PCE-005 one-way Telegram manager notifications, deferred until pre-launch;
- Leeloo and partner-site CTA checks;
- CAPTCHA/rate limiting.

Owner checkpoint:

- create/approve the Telegram bot and private manager chat when PCE-005 starts;
- provide Leeloo URLs/test funnels and approved partner-site URLs when needed.

Orchestrator checks:

- Content Manager cannot access submissions;
- Telegram notification failure does not affect stored submissions;
- Telegram contains no visitor message, email, or phone;
- no CRM expansion.

### Phase 9 - QA and Launch Hardening

Active agents:

- QA / Security Review Agent;
- targeted fix agents as needed.

Tickets:

- QA-001 RLS Tests;
- QA-002 Verification Privacy Tests;
- QA-003 MFA Tests;
- QA-004 End-to-End Admin Flows;
- QA-005 Launch Checklist.

Owner checkpoint:

- review final staging demo;
- approve production launch readiness.

Orchestrator checks:

- all critical flows tested;
- no privacy leaks;
- no unauthorized access;
- deployment checklist complete.

## 4. Parallelism Rules

Do not parallelize before DBF-001 is complete.

Do not run credential workflow work before credential core is complete.

Do not run admin credential UI before backend contracts exist.

Do not run public frontend implementation from invented data structures.

Do allow parallel work when:

- contracts are stable;
- file/module ownership is separate;
- orchestrator assigns explicit boundaries.

## 5. Owner Role During Implementation

The Owner should:

- approve major product decisions;
- provide external service access only when needed;
- review milestone demos;
- decide unclear business rules.

The Owner should not need to:

- answer low-level technical implementation questions;
- choose migration names;
- design RLS policy syntax;
- resolve routine code architecture decisions.

## 6. Orchestrator Role

The orchestrator controls:

- ticket sequencing;
- agent prompts;
- scope boundaries;
- dependency checks;
- review of agent reports;
- security compliance;
- whether a question must go to Owner;
- when to commit/push/PR;
- when to launch the next agent.

## 7. Current Next Step

Current ticket:

- `QA-005-PROD-MIG-001 Production Migration Promotion 61–64` — complete: the exact ordered set passed a clean local rebuild, 168/168 focused pgTAP assertions, Production preflight, promotion, 64/64 parity, no-pending dry run, clean hosted lint, and read-only RLS/function/data acceptance. No cohort, learner, credential, number, template, PDF, activation, email, or Storage object was created.

Next ticket:

- continue PDFGEN-008 mutation acceptance only after the Owner approves a non-production cohort and permanent-number allocation; backup activation/restore and real VEDOS delivery remain separately gated;

Agent:

- Database / Security Agent

Parallel agents:

- none

Owner action needed:

- PDFGEN-001 is implemented, merged through PR #29 as `1b2d224`, and applied in dev and Production: the private schema, forced RLS, role/MFA boundary, immutable versioning, multi-document/multi-page publication, unbounded-cohort batch foundation, provenance, and forward-only trigger correction passed the available checks; Production contains zero PDFGEN fixture rows, while full pgTAP execution remains queued for a compatible runner;
- PDFGEN-002 was merged through PR #31 as `970fd6c`; its private bucket, strict PDF validation, controlled source routes, page metadata/hash extraction, rollback, safe metadata grants, publication source guard, and published-object immutability passed local code/build checks. Preview and Production deployment checks passed, and migration `20260825120000` is applied/recorded and read-only accepted in dev and Production with zero template fixtures. Authenticated real-template workflow acceptance is assigned to PDFGEN-003 because that ticket provides the package UI;
- PDFGEN-006 is merged, deployed, and read-only accepted in dev and Production. Full mutation acceptance remains Owner-gated until an explicitly approved non-production cohort and permanent-number allocation are available;
- PDFGEN-007 was merged through PR #41 as `26d35f2`; migration 61 and its read-only security acceptance are complete in Development and Production. Mutation acceptance and real activation/delivery remain gated by PDFGEN-008 and an approved non-production cohort;
- CRD-PDFGEN-001 scope alignment is approved: Release 1 must generate one or more private, potentially multi-page PDFs per credential from a reusable programme/type/language/variant Template Package and must support controlled batches;
- QA-005-A11Y-FIX-001 is merged, deployed, and accepted at its focused scope through PR #25 and Production merge `083b045`; no real credentials were submitted during browser acceptance;
- QA-005-TELEGRAM-INVITE-001 is complete: the Owner revoked the setup-time Telegram group invitation link, and no change to the accepted bot/chat configuration or Telegram notification payload is required;
- backup activation/restore remains Owner-deferred until real learners and credentials exist; before operational issuance it will still require Supabase Pro and an approved encrypted independent private-PDF destination;
- provide or approve production-only service configuration when its checklist item is reached; do not add VEDOS SMTP, Telegram, analytics, or CAPTCHA credentials before the corresponding launch decision;
- QA-001 and QA-003 full local pgTAP execution is complete; migration 62 is accepted in hosted Development and Production;
- LRN-LINT-001 migration 64 is accepted in hosted Development and Production with clean lint and 64/64 parity;
- QA-002 and QA-004 are complete at the current dev level: the retained credential passed valid verification, irreversible revocation, and status-only revoked verification by number and QR;
- WF-004 resend is implemented, migrated and deployed in dev/Production through merged PR #22; authenticated valid-record smoke and one Owner-approved delivery are deferred until a valid credential exists;
- VEDOS SMTP credentials remain required only in encrypted deployment settings for real credential-email delivery and QA-005 acceptance.
