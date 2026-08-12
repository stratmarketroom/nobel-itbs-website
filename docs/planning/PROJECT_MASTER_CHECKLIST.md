# Nobel ITBS Release 1 — Project Master Checklist

Last reviewed: 2026-08-12
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
- [x] Credential-specific guardrails are implemented through WF-008: four statuses only, permanent numbers, private PDFs, server-mediated verification, valid details only, revoked status only, and pending/voided not found.

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
- [x] CNT-003 data/public foundation: Home, About, Partnerships, For Organisations, localized routes, public shell, and navigation.
- [x] CNT-003 approved Home visual baseline preserved in branch `codex/cnt-003-approved-home-visual-baseline` at commit `24f728b`; see `docs/design/HOME_VISUAL_BASELINE.md`.
- [-] CNT-003 Home visual integration: code integration and local EN/UA/CZ responsive QA are complete. The 2026-08-12 production audit confirmed the correct Supabase project and restored 3 programme areas plus 4 trust cards in EN/UA/CZ; merge, Production redeployment, and final Owner acceptance remain open. See `docs/qa/CNT_003_HOME_VISUAL_INTEGRATION_QA_2026-08-11.md` and `docs/qa/CNT_003_PRODUCTION_HOME_REPAIR_QA_2026-08-12.md`.
- [-] QA-005 HTML language: server-side EN/UA/CZ document-language correction implemented; Vercel Preview DOM acceptance remains open. See `docs/qa/QA_005_HTML_LANGUAGE_2026-08-12.md`.
- [x] CNT-004 protected Site Settings and For Organisations URL override.
- [x] CNT-005 full Privacy Policy, Terms of Use, Refund Policy in three languages.
- [x] localized cookie consent with accept/decline; no optional trackers load before consent because none are installed.
- [x] Manager-friendly structured fields/forms replace raw JSON editing across fixed page sections and legal documents.
- [x] Authenticated Content Manager and Super Admin content-edit smoke, including controlled-field persistence and MFA enforcement.
- `BLOCKED`: final For Organisations application URL.

Stage status: **Home visual code integration and production content correction are complete; Owner Preview acceptance and the final production CTA value remain open**.

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
| Learners | Private identity, globally unique contacts, protected API, responsive manager UI, archive workflow, and real linked credential summaries implemented | Stage 5 plus ADM-CRD-001 authenticated smoke passed |
| Credential Types / Sets / Credentials / Number Log | Core schema plus protected manager workspace for pending creation, list/detail, private PDFs, activation, irreversible valid revocation, irreversible pending void with permanent number voiding, controlled valid public-data correction, server-mediated public verification, delivery history, Sets, Number Log, History, and Notes | ADM-CRD-001, WF-003, and WF-005..008 passed at the current dev level; WF-004 is deferred |
| Email Templates | Private seeded EN/UA credential-delivery templates are implemented and used by activation | Protected editing UI/API and audit smoke remain |
| Site Settings | Protected API/UI implemented | Authenticated AAL2 save/audit smoke passed; final For Organisations URL remains |
| Users and Roles | Protected API/UI implemented | Authenticated create/roles/deactivate/reactivate/audit/cleanup smoke passed |
| Audit/History | Audit storage implemented; admin view not started | Protected list/detail and privacy review |
| Unified admin shell/navigation | Shared protected layout, role-aware desktop/mobile navigation, account context, and signed-out/MFA/access-denied states implemented | Authenticated access matrix passed for all four roles and a multi-role account |

## Stage 5 — Learner Foundation

- [x] LRN-001 learner core: private identity fields, soft archive, controlled grants, forced RLS, MFA, live role test, and cleanup.
- [x] LRN-002 multiple globally unique learner emails and optional primary email: citext uniqueness, one-primary constraint, forced RLS/MFA, conflict tests, and cleanup.
- [x] LRN-003 globally unique canonical phones, messenger flags, optional primary phone, forced RLS/MFA, live conflict tests, and cleanup.
- [x] LRN-004 protected learner API/UI, contact search and management, duplicate navigation, archive workflow, role/MFA and desktop/mobile QA; ADM-CRD-001 later replaced the credential placeholder with real linked summaries.

Stage status: **complete; LRN-001..004 accepted in dev**.

## Stage 6 — Credential Core

- [x] CRD-001 credential/document types: Certificate and Diploma reference records, EN/UA/CZ labels, forced RLS, MFA-protected read access, Owner/Super Admin mutation, no hard delete, and live role QA.
- [x] CRD-002 credential sets: private status-free grouping, programme-run consistency, exact-context uniqueness, idempotent automatic find/create, creation audit, forced RLS/MFA, and live role QA.
- [x] CRD-003 permanent document-number log: shared non-cycling sequence from `000001`, automatic and controlled manual reservation, `reserved`/`issued`/`voided`, mandatory void reason, immutable/no-delete enforcement, audit, forced RLS/MFA, and live role QA.
- [x] CRD-004 credentials: only `pending`/`valid`/`revoked`/`voided`, private current public fields, HMAC/encrypted token fields, context and lifecycle integrity, deferred Number Log linkage, controlled audited set move, forced RLS/MFA, and live role/integrity QA.
- [x] CRD-005 private PDF storage and files: private PDF-only 20 MB bucket, configurable file types, canonical paths, one-primary rule, replacement-in-place/no old versions, audit without paths/content, forced RLS/MFA, and live DB/Storage privacy QA.
- [x] CRD-006 private append-only credential history, controlled notes, author-only edit, author/Owner/Super Admin soft-delete rules, privacy-minimal History/Audit events, forced RLS/MFA, and live role QA.

Stage status: **complete at the database/security-foundation level; CRD-001..006 accepted in dev**.

## Stage 7 — Credential Workflows and Public Verification

- [x] WF-001 actor-scoped pending credential creation: exact Set reuse, permanent automatic/manual number reservation, 256-bit token, HMAC lookup, AES-256-GCM encryption, safe QR URL response, History/Audit, MFA/RLS, and live rollback QA.
- [x] WF-002 controlled private PDF list/upload/replace/metadata/primary/delete/signed URL workflow, valid-change reasons, lifecycle guards, compensating Storage rollback, History/Audit, and live DB/Storage QA.
- [x] ADM-CRD-001 manager workspace over the accepted CRD/WF foundation: protected credential list/detail and creation form, private PDF operations, Credential Sets, permanent Number Log, History/Notes, real learner credential summaries, role navigation, authenticated Owner/MFA browser smoke, mobile QA, and unauthenticated `401` checks. No database migration and no later lifecycle action were added.
- [x] WF-003 pending-only activation with primary-PDF/all-current-file guards, permanent number issuance, EN/UA editable delivery draft, private send history, Google Workspace PDF attachments, and failure-independent activation. Dev code/migration/UI QA passed; real provider acceptance remains operational until credentials are supplied.
- [ ] WF-004 resend with recipient override and history — intentionally deferred until after WF-008 or pre-launch. Interim workflow: update the learner email if needed and resend manually from the manager mailbox; the missing system resend-history entry is accepted for this interim period.
- [x] WF-005 valid-only irreversible revoke with a mandatory private reason, actor/time fields, unchanged issued number, protected API/UI, History/Audit, MFA, and dev migration acceptance.
- [x] WF-006 pending-only irreversible void with mandatory private reason, atomic reserved-number voiding, protected API/UI, History/Audit, MFA, and dev migration acceptance.
- [x] WF-007 valid-only current public-data correction with complete bounded fields, mandatory private reason, no-op rejection, protected API/UI, detailed History, PII-minimal Audit, MFA, and dev migration acceptance.
- [x] WF-008 server-mediated verification by QR token or document number only, with HMAC lookup, database-backed rate limiting, EN/UA/CZ UI, QR noindex, valid-only details, revoked status only, and pending/voided/absent not found.

Stage status: **implemented at the current dev level except Owner-deferred WF-004 resend and the real Google Workspace delivery acceptance; WF-001..003, WF-005..008, and the manager workspace are complete**.

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
- [-] QA-001 aggregate 38-assertion RLS matrix is implemented for all 36 public tables, four roles, service-only RPCs, and private Storage; the live anonymous boundary passed 18 public reads, 18 private denials, and two RPC denials. Earlier authenticated role evidence was reconciled; only execution of the Docker-dependent full pgTAP file remains.
- [x] QA-002 valid and revoked verification privacy passed with the first approved retained credential by both document number and QR token; revoked output contains status only.
- [x] QA-003 aggregate 27-assertion MFA matrix and fresh Owner AAL1 live test passed: verified TOTP enrollment was detected and all 11 sensitive admin routes returned explicit MFA/AAL2 denials without mutation. Existing AAL2 role/module evidence was reconciled; see `docs/qa/QA_003_MFA_TESTS_2026-08-10.md`.
- [x] QA-004 learner → credential → private PDF → activation → valid verification → irreversible revoke → status-only revoked verification passed with `NITBS-C-2027-123450`.
- [ ] QA-005 production environment, approved credential delivery provider, Leeloo, Telegram contact alert, analytics, backup, launch checklist, and confirmation that conditional CAPTCHA remains disabled unless abuse signals require it.
  - [x] Separate `nobel-itbs-prod` Supabase project created in Frankfurt; all 47 migrations, approved seed data, anonymous RLS boundary, and required server reads passed.
  - [x] Production Supabase secrets are prepared in an ignored local environment file; none are committed.
  - [ ] Add production-only secrets to Vercel, deploy, and run public/admin smoke tests before connecting the domain.
  - [ ] Configure production Auth URLs, bootstrap the single Owner, enroll MFA, and repeat protected-route QA.
  - [ ] Align the approved VEDOS SMTP decision with the v2 documents and WF-003 implementation, then acceptance-test real credential delivery.
  - [ ] Configure final CTA destinations, Telegram alert, analytics/consent, database plus private-PDF backups, canonical domain, and final responsive/accessibility/browser acceptance.
- [-] Responsive/mobile, accessibility, metadata, error-state, and production-browser QA. Home and all shared public page shells now pass the local production build at 390 px with `44 x 44` touch targets, localized UA/CZ navigation and footers, and no horizontal overflow; Vercel Production, accessibility, error-state, and cross-browser acceptance remain open. See `docs/qa/QA_005_MOBILE_TOUCH_TARGETS_2026-08-12.md`.

Stage status: **QA-001..004 are accepted at the current dev level; QA-005 production/launch readiness, full pgTAP execution, and cross-browser/accessibility acceptance remain open**.

## Verified Current Dev Baseline

- [x] One ordered chain of 47 local migrations matches both remote dev and production histories.
- [x] Pre-integration dev backup exists in the ignored backup directory.
- [x] Public reads use Supabase by default; seed content is explicit offline mode only.
- [x] Dev data: 3 languages, 3 areas, 3 types, 5 programmes, 5 runs, 5 partners, 3 experts.
- [x] Structured public data: 7 pages and 21 published translations.
- [x] Nine localized legal routes render complete page bodies.
- [x] Anonymous content writes and anonymous protected-contact reads are denied.
- [x] Unauthenticated admin APIs return `401`.
- [x] Current production build and lint pass.

## Next Implementation Sequence

The credential workflow stage is now open; external production integrations remain tracked for launch readiness:

1. [x] **Authenticated manager and live RLS QA for Stages 2–4** — completed on 2026-08-06; see `docs/qa/STAGE_2_4_E2E_RLS_QA_2026-08-06.md`.
2. [x] **Finish contact operations in code and dev QA** — required entry points, rate limiting, CAPTCHA fail-closed contract, contact-status mutation, audit, and cleanup passed on 2026-08-06; see `docs/qa/PCE_004_CONTACT_OPERATIONS_QA_2026-08-06.md`.
3. [x] **LRN-001 Learner Core** — schema, grants, forced RLS, MFA, live role checks, and cleanup completed on 2026-08-07; see `docs/qa/LRN_001_LEARNER_CORE_QA_2026-08-07.md`.
4. [x] **LRN-002 Learner Emails** — global case-insensitive uniqueness, one-primary constraint, forced RLS/MFA, live conflict checks, and cleanup completed on 2026-08-07; see `docs/qa/LRN_002_LEARNER_EMAILS_QA_2026-08-07.md`.
5. [x] **LRN-003 Learner Phones** — canonical global uniqueness, one-primary constraint, messenger consistency, forced RLS/MFA, live conflict checks, and cleanup completed on 2026-08-07; see `docs/qa/LRN_003_LEARNER_PHONES_QA_2026-08-07.md`.
6. [x] **LRN-004 Learner Admin UI** — protected actor-scoped API, profile/contact/archive UI, duplicate navigation, role/MFA and desktop/mobile QA completed on 2026-08-07; its original credential placeholder was replaced under ADM-CRD-001.
7. [x] **CRD-001 Credential Types** — Certificate/Diploma reference schema, localized labels, forced RLS/MFA, role matrix, live mutation/constraint QA, and cleanup completed on 2026-08-07; see `docs/qa/CRD_001_CREDENTIAL_TYPES_QA_2026-08-07.md`.
8. [x] **CRD-002 Credential Sets** — private status-free schema, exact-context matching, automatic find/create, creation audit, forced RLS/MFA, programme-run consistency, live role QA, and rollback cleanup completed on 2026-08-07; see `docs/qa/CRD_002_CREDENTIAL_SETS_QA_2026-08-07.md`.
9. [x] **CRD-003 Document Number Log** — shared non-cycling sequence from `000001`, controlled automatic/manual reservation, voiding, no-delete/no-reuse protection, audit, forced RLS/MFA, and rollback-only live role QA completed on 2026-08-08; see `docs/qa/CRD_003_DOCUMENT_NUMBER_LOG_QA_2026-08-08.md`.
10. [x] **CRD-004 Credentials** — private credential lifecycle/current-public/token schema, context and immutable transition checks, deferred two-way Number Log link, no direct mutations, creation/set-move audit, controlled set move, and rollback-only live QA completed on 2026-08-08; see `docs/qa/CRD_004_CREDENTIALS_QA_2026-08-08.md`.
11. [x] **CRD-005 Credential Files** — private PDF-only 20 MB bucket, configurable types, canonical current-object metadata, one-primary and no-version rules, audit, forced RLS/MFA, and live DB/Storage privacy QA completed on 2026-08-08; see `docs/qa/CRD_005_CREDENTIAL_FILES_QA_2026-08-08.md`.
12. [x] **CRD-006 Credential History and Notes** — private append-only timeline, author edit/soft-delete, Owner/Super Admin deletion of others' notes, privacy-minimal History/Audit events, forced RLS/MFA, and rollback-only live QA completed on 2026-08-08; see `docs/qa/CRD_006_CREDENTIAL_HISTORY_NOTES_QA_2026-08-08.md`.
13. [x] **WF-001 Create Pending Credential** — actor-scoped API, exact Set reuse, permanent automatic/manual reservation, HMAC/AES-GCM token protection, safe QR URL response, History/Audit, MFA/RLS, and rollback-only live QA completed on 2026-08-09; see `docs/qa/WF_001_CREATE_PENDING_CREDENTIAL_QA_2026-08-09.md`.
14. [x] **WF-002 Upload and Manage PDFs** — actor-scoped private upload/list/signed URL, replacement-in-place with compensating restore, metadata/primary workflow, lifecycle/reason rules, History/Audit, and live DB/Storage QA completed on 2026-08-09; see `docs/qa/WF_002_MANAGE_CREDENTIAL_FILES_QA_2026-08-09.md`.
15. [x] **ADM-CRD-001 Credential Admin Workspace** — protected operational list/detail, pending creation form, private PDF controls, Sets, Number Log, History/Notes, real learner credential links, desktop/mobile browser QA, and `401` checks completed on 2026-08-09; see `docs/qa/ADM_CRD_001_CREDENTIAL_ADMIN_WORKSPACE_QA_2026-08-09.md`.
16. [x] **WF-003 Activate and Email** — atomic pending-to-valid activation and number issuance, primary/all-current-PDF guards, editable EN/UA delivery draft, private outcome/file history, Google Workspace attachments, and failure-independent result handling completed at the current dev level on 2026-08-09; see `docs/qa/WF_003_ACTIVATE_AND_EMAIL_QA_2026-08-09.md`.
17. [x] **WF-005 Revoke** — protected valid-only irreversible transition with a mandatory private reason, actor/time fields, unchanged issued number, History/Audit, UI confirmation, and synced dev migration completed on 2026-08-10; see `docs/qa/WF_005_REVOKE_CREDENTIAL_QA_2026-08-10.md`.
18. [x] **WF-006 Void Pending** — protected pending-only irreversible transition, atomic permanent voiding of its reserved number, mandatory private reason, History/Audit, progressive UI confirmation, and synced dev migration completed on 2026-08-10; see `docs/qa/WF_006_VOID_PENDING_CREDENTIAL_QA_2026-08-10.md`.
19. [x] **WF-007 Update Valid Public Data** — protected valid-only correction of holder name, programme title, and document type, with no-op rejection, mandatory private reason, detailed History, PII-minimal Audit, responsive manager UI, and synced dev migration completed on 2026-08-10; see `docs/qa/WF_007_UPDATE_VALID_PUBLIC_DATA_QA_2026-08-10.md`.
20. [x] **WF-008 Public Verification** — server-mediated QR/document-number API, HMAC token lookup, persistent rate limiting, approved privacy projection, localized UI, QR noindex, and dev smoke completed on 2026-08-10; see `docs/qa/WF_008_PUBLIC_VERIFICATION_QA_2026-08-10.md`.
21. **Return to WF-004 Resend Credential after WF-008 or during pre-launch hardening** — until then, managers may correct the learner email and resend manually from their mailbox; a previous send-history row remains immutable.
22. Before launch, complete PCE-005 Telegram manager notifications; configure and acceptance-test Google Workspace separately only for credential PDF delivery; revisit conditional CAPTCHA only if abuse signals justify enabling it.
23. Run the full automated pgTAP suite when Docker or another compatible runner is available; this remains an infrastructure check, not a blocker for the accepted manager, contact, learner, CRD-001..006, WF-001..003, WF-005..008, and ADM-CRD-001 layers.
24. [x] **QA-001 RLS Tests** — aggregate coverage now protects all 36 public tables, four roles, MFA/service boundaries, private Storage, and controlled RPCs; non-mutating live anonymous QA passed on 2026-08-10. See `docs/qa/QA_001_RLS_MATRIX_2026-08-10.md`; execute its complete pgTAP file when a compatible database runner is available.
25. [x] **QA-003 MFA Tests** — the four-role/AAL matrix, server guards, private RLS policies, credential/PDF functions, fresh Owner AAL1 state, verified TOTP enrollment, and 11 sensitive-route denials passed on 2026-08-10. See `docs/qa/QA_003_MFA_TESTS_2026-08-10.md`.
26. [x] **QA-002 / QA-004 first approved credential lifecycle** — Owner-approved `NITBS-C-2027-123450` completed learner → credential → private PDF → activation → valid verification → irreversible revoke → status-only revoked verification by number and QR on 2026-08-10. The activation-manifest exact-key correction was applied to dev. See `docs/qa/QA_002_004_FIRST_CREDENTIAL_LIFECYCLE_2026-08-10.md`.
27. [x] **Irreversible revoked half** — the retained test credential is permanently revoked; its number remains issued and linked, and public lookup exposes no document details or private reason.
28. [-] **CNT-003 Home visual integration** — the intended production Supabase project is confirmed and its EN/UA/CZ Home data now has 3 programme areas and 4 trust cards; next merge the repair branch, verify the new Vercel Production build, and obtain Owner desktop/mobile acceptance.
29. **Proceed with the remaining QA-005 Launch Checklist** — Supabase production foundation is accepted; after Home integration, continue Auth/Owner/MFA, selected external integrations, canonical-domain verification, backups, analytics/consent, responsive/accessibility/browser acceptance, and the final release decision.

The backend, permissions, workflow, and operational layers remain accepted at their documented level. Production launch now also depends on integrating and approving the preserved Home visual baseline.
