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
- Gmail/Google Workspace integration;
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
- Gmail integration.

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
- LRN-004 Learner Admin UI.

Parallel work:

- limited.

Owner checkpoint:

- review learner form UX if needed.

Orchestrator checks:

- email uniqueness;
- phone uniqueness;
- primary email;
- Telegram/Viber/WhatsApp flags;
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

Parallel work:

- limited and carefully sequenced.

Owner checkpoint:

- review credential create/detail admin workflow before activation/email implementation.

Orchestrator checks:

- statuses are only pending/valid/revoked/voided;
- no expired/cancelled/reissued lifecycle;
- Credential Set has no public lifecycle;
- number generated before activation;
- no partner in verification data.

### Phase 7 - Credential Workflows

Active agents:

- Backend/API Agent;
- Admin UI Agent;
- QA / Security Review Agent.

Tickets:

- WF-001 Create Pending Credential;
- WF-002 Upload and Manage PDFs;
- WF-003 Activate and Email;
- WF-004 Resend Credential;
- WF-005 Revoke;
- WF-006 Void Pending;
- WF-007 Update Valid Public Data;
- WF-008 Public Verification.

Parallel work:

- backend and admin UI may overlap only after API contracts are stable.

Owner checkpoint:

- provide/confirm Gmail or Google Workspace integration path;
- review public verification result UI.

Orchestrator checks:

- activation succeeds even if email fails;
- primary PDF required;
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

Next ticket:

- `WF-001 Create Pending Credential`

Agent:

- Backend/API Agent with Database / Security review

Parallel agents:

- none

Owner action needed:

- approve start of WF-001;
- review the credential create/detail workflow before activation and email implementation;
- no external provider access is required for WF-001.
