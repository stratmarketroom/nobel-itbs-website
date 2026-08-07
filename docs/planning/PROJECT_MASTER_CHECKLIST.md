# Nobel ITBS Release 1 — Project Master Checklist

Last reviewed: 2026-08-07
Baseline: v2 product, technical, security, sitemap, and implementation documents
Purpose: keep implementation aligned with Release 1 and make the next non-design step unambiguous.

## Status Legend

- `[x]` the explicitly described checklist item is implemented and verified at the current dev level;
- `[-]` partially implemented or waiting for operational/external completion;
- `[ ]` not started;
- `BLOCKED` requires a value, account, provider, or decision outside the repository.

## How Completion Is Measured

For modules that appear both on the public website and in the admin panel, completion has three separate layers:

1. **Data and security** — schema, migrations, RLS, permissions, audit, and server-side rules.
2. **Public delivery** — public API, localized routes, rendering, SEO, forms, and CTA behaviour.
3. **Manager operations** — protected admin API, manager CRUD interface, role-aware navigation, validation, and an authenticated end-to-end smoke test.

An `[x]` beside a data/public ticket means that the described data/public capability is complete. It does **not** close the whole stage when the v2 API specification, admin sitemap, or implementation plan also requires manager operations. A stage is complete only when every required layer and its verification are complete.

## Release 1 Guardrails

- [x] EN uses no prefix; UA uses `/ua`; CZ uses `/cz`.
- [x] News/Blog is absent from Release 1 navigation and implementation.
- [x] Public programme catalogue has no visible filters.
- [x] Programme pages are sales-oriented and support 1–3 pricing options.
- [x] Partner-site and Leeloo destinations use the documented CTA hierarchy.
- [x] Partners are separate from the future credential-verification result.
- [x] Service-role credentials remain server-only.
- [ ] Credential-specific guardrails become testable only after CRD/WF implementation.

## Stage 0 — Specification Alignment

- [x] v2 product decisions and Release 1 scope.
- [x] v2 sitemap, credential, database, API, RLS, and migration specifications.
- [x] approved multilingual content inventory and programme decision matrix.
- [x] implementation plan, ticket pack, security rules, and agent sequence.

Stage status: **complete**.

## Stage 1 — Database Foundation

- [x] DBF-001 Supabase foundation.
- [x] DBF-002 migration standards and safe environment runner.
- [x] DBF-003 internal schema and extensions.
- [x] DBF-004 append-only audit foundation.
- [-] Full pgTAP execution — SQL tests exist; local execution requires Docker.

Stage status: **implemented; full automated DB test run pending environment support**.

## Stage 2 — Auth, Roles, MFA, Admin Shell

- [x] AUTH-001 user profiles.
- [x] AUTH-002 multi-role model.
- [x] AUTH-003 Owner uniqueness/minimum-owner rules.
- [x] AUTH-004 role and active-admin helpers.
- [x] AUTH-005 protected user-management API and operational UI: list/search/filter, create, activate/deactivate, MFA policy, and multi-role assignment.
- [x] AUTH-005 authenticated UI mutation smoke: Owner/AAL2 create, role change, deactivate/reactivate, cleanup, and audit confirmation.
- [x] AUTH-006 MFA/AAL2 enforcement for sensitive roles/actions.
- [x] AUTH-007 sign-in, TOTP enrolment/challenge, and Owner browser smoke.
- [x] Shared protected admin shell, role-aware navigation, signed-out/MFA/access-denied states, and responsive layout.
- [x] Authenticated role/access smoke for Owner, Super Admin, Content Manager, Credential Manager, and a multi-role account, including AAL1/AAL2 boundaries.

Stage status: **complete and accepted at the current dev level**.

## Stage 3 — Content Model and Public Website Foundation

- [x] CNT-001 EN/UA/CZ language model and fallback.
- [x] CNT-002 structured content pages, translations, permissions, audit, admin API/editor.
- [x] CNT-003 Home, About, Partnerships, For Organisations, public shell/navigation.
- [x] CNT-004 protected Site Settings and For Organisations URL override.
- [x] CNT-005 full Privacy Policy, Terms of Use, Refund Policy in three languages.
- [x] localized cookie consent with accept/decline; no optional trackers load before consent because none are installed.
- [x] Manager-friendly structured fields/forms replace raw JSON editing across fixed page sections and legal documents.
- [x] Authenticated Content Manager and Super Admin content-edit smoke, including controlled-field persistence and MFA enforcement.
- `BLOCKED`: final For Organisations application URL.

Stage status: **implementation and manager QA complete; final production CTA value remains externally blocked**.

## Stage 4 — Programme Catalogue and Sales Pages

### Data and public delivery

- [x] PRG-001 Programme Area schema, RLS, three approved records, translations, and public projection.
- [x] PRG-002 Programme Type schema, RLS, three approved records, translations, and public projection.
- [x] PRG-003 Programme schema, RLS, five multilingual records, structured sales content, and public detail projection.
- [x] PRG-004 Programme Run schema, RLS, launch data, and enrolment-state calculation.
- [x] PRG-005 Pricing schema, RLS, flexible 1–3 option support, and application destination hierarchy.
- [x] PRG-006 public catalogue without visible filters.
- [x] PRG-007 programme, area, and type routes plus localized SEO metadata.
- [x] PRG-008 redirect registry and automatic published slug-change handling.
- [x] PRG-009 programme-linked question form.

These checks confirm the database and public-site implementation. They do not close Stage 4 manager operations.

### Manager operations required by v2

- [x] Protected Admin Programme API for Programme Areas.
- [x] Protected Admin Programme API for Programme Types.
- [x] Protected Admin Programme API for Programmes and translation publication states.
- [x] Protected Admin Programme API for Programme Runs and enrolment corrections.
- [x] Protected Admin Programme API for Pricing Options and application URLs.
- [x] Read-only admin access to the trigger-managed slug redirect registry.
- [x] Manager UI for programme list, create/edit, publication state, catalogue order, provider, and instruction languages.
- [x] Manager UI for localized page copy, controlled sales sections, SEO fields, and translation states.
- [x] Manager UI for runs, 1–3 localized pricing options, enrolment correction context, and application URL hierarchy.
- [x] Manager UI for Programme Areas and Programme Types, including EN/UA/CZ landing copy, controlled sections, SEO, order, and publication state.
- [x] Authenticated Content Manager/Super Admin/Owner CRUD smoke, including draft taxonomy, programme, translation, run, 1–3 pricing options, validation, and cleanup.
- [x] Credential Manager read-only published programme/run reference smoke; mutation is denied by API and RLS.
- `BLOCKED`: Leeloo destinations for General Psychology, Child Psychology, and Space Business.
- `BLOCKED`: partner-site destination for AI Production, expected later.

Stage status: **implementation and manager/RLS QA complete; production acceptance still depends on the blocked application destinations**.

## Partners, Experts, and Contacts

- [x] PCE-001 partner schema/RLS, multilingual public cards, and expandable data model.
- [x] PCE-002 expert schema/RLS and multilingual public cards, including Alina Yudina’s supplied photo.
- [x] PCE-003 Partnerships page combines approved organisations and experts.
- [x] PCE-004 database, all required public entry points, protected manager workflow, audit, database-backed rate limiting, CAPTCHA hooks, and notification code.
- [x] Protected Admin API for partners and partner translations.
- [x] Protected Admin API for experts and expert translations.
- [x] Manager CRUD UI for partners, experts, order, publication states, and approved logo/photo paths.
- [x] Authenticated Content Manager/Super Admin/Owner partner/expert CRUD smoke, including translations, asset-path validation, and cleanup.
- [x] General, organisation, and partnership public forms in EN/UA/CZ with validation, privacy acknowledgement, and honeypot handling.
- [x] Contact notification channel decision: protected admin is the source of truth; email is replaced by a deferred one-way Telegram manager notification.
- [ ] PCE-005 Telegram manager notification — intentionally deferred until pre-launch and not a blocker for LRN/CRD work.
- [x] Product decision: CAPTCHA is conditional, is not connected now, and is not a Release 1 blocker; honeypot and database-backed rate limiting remain active.

Module status: **implementation and dev QA complete; Telegram notification is a deferred pre-launch enhancement, the production rate-limit secret remains an operational dependency, and CAPTCHA is intentionally deferred**.

## Admin Module Coverage

This matrix follows the Release 1 admin sitemap and prevents public implementation from being mistaken for admin completion.

| Admin module | Current implementation | Verification still required |
| --- | --- | --- |
| Dashboard | Not started | Route, role-aware summary, authenticated smoke |
| Content Pages | Protected API plus responsive controlled fields for fixed sections, nested cards/lists, legal paragraphs, H1, SEO, and EN/UA/CZ publication | Authenticated edit and role/MFA smoke passed; final editorial publication review remains operational |
| Programmes | Protected CRUD API plus responsive list/create/edit UI for record fields, localized copy, controlled sales sections, and SEO | Authenticated create/edit/order/translation/cleanup smoke passed |
| Programme Areas | Protected CRUD API plus responsive list/create/edit UI with controlled localized landing sections | Authenticated draft record/translation/validation/cleanup smoke passed |
| Programme Types | Protected CRUD API plus responsive list/create/edit UI with controlled localized landing sections | Authenticated draft record/translation/cleanup smoke passed |
| Programme Runs | Protected CRUD API plus inline create/edit/remove UI for status, dates, and run URL | Authenticated create/update/date-validation/delete smoke passed |
| Pricing Options | Protected CRUD API plus 1–3 option UI, localized copy, activation guard, and visible URL hierarchy | Authenticated 1–3 options, translation, fourth-option guard, and cleanup smoke passed |
| Partners | Protected CRUD API plus responsive record, EN/UA/CZ copy, classification, URL, order, and logo-path UI | Authenticated CRUD/translation/asset-path validation/cleanup smoke passed |
| Experts | Protected CRUD API plus responsive record, EN/UA/CZ copy, order, and optional photo-path UI | Authenticated CRUD/translation/cleanup smoke passed |
| Contact Submissions | Public programme/general/partner/organisation entry points plus protected API and processing UI implemented | Role/RLS, MFA, status mutation, rate-limit, optional CAPTCHA fail-closed contract, audit, and cleanup smoke passed; privacy-minimised Telegram notification is deferred to PCE-005 |
| Learners | Planned for Stage 5 | LRN-001..004 |
| Credential Sets / Credentials / Number Log | Planned for Stages 6–7 | CRD/WF sequence |
| Email Templates | Planned with credential workflow | Protected editing and audit smoke |
| Site Settings | Protected API/UI implemented | Authenticated AAL2 save/audit smoke passed; final For Organisations URL remains |
| Users and Roles | Protected API/UI implemented | Authenticated create/roles/deactivate/reactivate/audit/cleanup smoke passed |
| Audit/History | Audit storage implemented; admin view not started | Protected list/detail and privacy review |
| Unified admin shell/navigation | Shared protected layout, role-aware desktop/mobile navigation, account context, and signed-out/MFA/access-denied states implemented | Authenticated access matrix passed for all four roles and a multi-role account |

## Stage 5 — Learner Foundation

- [x] LRN-001 learner core: private identity fields, soft archive, controlled grants, forced RLS, MFA, live role test, and cleanup.
- [x] LRN-002 multiple globally unique learner emails and optional primary email: citext uniqueness, one-primary constraint, forced RLS/MFA, conflict tests, and cleanup.
- [ ] LRN-003 globally unique phones and messenger flags.
- [ ] LRN-004 protected learner admin UI and credential placeholder.

Stage status: **in progress; LRN-001 and LRN-002 complete, LRN-003 is next**.

## Stage 6 — Credential Core

- [ ] CRD-001 credential/document types.
- [ ] CRD-002 credential sets.
- [ ] CRD-003 permanent document-number log and no-reuse sequence.
- [ ] CRD-004 credentials with only `pending`, `valid`, `revoked`, `voided`.
- [ ] CRD-005 private PDF storage and primary-file rules.
- [ ] CRD-006 credential history, notes, and edit/delete rules.

Stage status: **not started**.

## Stage 7 — Credential Workflows and Public Verification

- [ ] WF-001 create pending credential, reserve number, generate token.
- [ ] WF-002 upload/manage private PDFs.
- [ ] WF-003 activate and send via Google Workspace; activation independent of mail result.
- [ ] WF-004 resend with recipient override and history.
- [ ] WF-005 irreversible revoke with mandatory reason.
- [ ] WF-006 void pending credential and permanently void its number.
- [ ] WF-007 controlled valid-public-data update with reason/history.
- [ ] WF-008 verification by QR token or document number only.

Stage status: **not started**.

## Stage 8 — Contact Operations

- [x] Programme-question capture and protected processing are implemented under PCE-004.
- [x] General, partnership, and organisation public entry points are implemented in EN/UA/CZ.
- [x] Authenticated status processing, MFA/RLS boundaries, privacy-safe audit, validation, honeypot, and cleanup passed live dev QA.
- [x] Database-backed five-per-15-minute rate limiting and CAPTCHA fail-closed server contract passed live dev QA.
- [x] Notification-channel decision: contact alerts use Telegram, while Google Workspace is reserved for the later credential-delivery workflow.
- [ ] PCE-005: configure/test the one-way Telegram manager notification before launch; no webhook or inbound bot workflow is required.
- [x] CAPTCHA remains an optional conditional control and is intentionally not connected now; configure/test it only if later enabled because of abuse signals.

Stage status: **core implementation and dev QA complete; Telegram notification is intentionally deferred until pre-launch and does not block Stage 5**.

## Stage 9 — Security, QA, and Launch Hardening

- [-] Ticket-level migration/static verifiers, lint, TypeScript, builds, browser smoke, and selected RLS/API smoke checks pass.
- [-] QA-001 live Stage 2–4 matrix plus LRN-001/002 learner core/email RLS passed; future learner phone/credential tables and the Docker-dependent full pgTAP suite remain.
- [ ] QA-002 credential verification privacy tests after credentials exist.
- [-] QA-003 MFA matrix passed for current admin/content/programme/contact/settings and learner core/email actions; future learner phone and credential actions remain.
- [ ] QA-004 end-to-end learner → credential → PDF → activation → verify → revoke flow.
- [ ] QA-005 production environment, credential Gmail delivery, Leeloo, Telegram contact alert, analytics, backup, launch checklist, and confirmation that conditional CAPTCHA remains disabled unless abuse signals require it.
- [ ] Responsive/mobile, accessibility, metadata, error-state, and production-browser QA.

Stage status: **foundation checks active; launch QA not started**.

## Verified Current Dev Baseline

- [x] One ordered chain of 29 local migrations matches the remote dev history.
- [x] Pre-integration dev backup exists in the ignored backup directory.
- [x] Public reads use Supabase by default; seed content is explicit offline mode only.
- [x] Dev data: 3 languages, 3 areas, 3 types, 5 programmes, 5 runs, 5 partners, 3 experts.
- [x] Structured public data: 7 pages and 21 published translations.
- [x] Nine localized legal routes render complete page bodies.
- [x] Anonymous content writes and anonymous protected-contact reads are denied.
- [x] Unauthenticated admin APIs return `401`.
- [x] Current production build and lint pass.

## Next Implementation Sequence

The learner module is now open; external production integrations remain tracked for launch readiness:

1. [x] **Authenticated manager and live RLS QA for Stages 2–4** — completed on 2026-08-06; see `docs/qa/STAGE_2_4_E2E_RLS_QA_2026-08-06.md`.
2. [x] **Finish contact operations in code and dev QA** — required entry points, rate limiting, CAPTCHA fail-closed contract, contact-status mutation, audit, and cleanup passed on 2026-08-06; see `docs/qa/PCE_004_CONTACT_OPERATIONS_QA_2026-08-06.md`.
3. [x] **LRN-001 Learner Core** — schema, grants, forced RLS, MFA, live role checks, and cleanup completed on 2026-08-07; see `docs/qa/LRN_001_LEARNER_CORE_QA_2026-08-07.md`.
4. [x] **LRN-002 Learner Emails** — global case-insensitive uniqueness, one-primary constraint, forced RLS/MFA, live conflict checks, and cleanup completed on 2026-08-07; see `docs/qa/LRN_002_LEARNER_EMAILS_QA_2026-08-07.md`.
5. **Continue Stage 5 with LRN-003 Learner Phones**.
6. Only after Stage 5 acceptance, begin CRD-001 and the credential sequence.
7. Before launch, complete PCE-005 Telegram manager notifications; configure Google Workspace separately only for credential PDF delivery; revisit conditional CAPTCHA only if abuse signals justify enabling it.
8. Run the full automated pgTAP suite when Docker or another compatible runner is available; this remains an infrastructure check, not a blocker for the accepted manager, contact, and learner core/email layers.

This sequence is primarily backend, permissions, workflows, and operational administration. It does not depend on final visual design.
