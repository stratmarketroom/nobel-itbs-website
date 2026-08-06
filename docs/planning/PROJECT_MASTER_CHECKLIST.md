# Nobel ITBS Release 1 — Project Master Checklist

Last reviewed: 2026-08-05  
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
- [-] AUTH-005 authenticated UI mutation smoke: Owner/AAL2 create, role change, deactivate/reactivate, and audit confirmation have not yet been rerun through the completed interface.
- [x] AUTH-006 MFA/AAL2 enforcement for sensitive roles/actions.
- [x] AUTH-007 sign-in, TOTP enrolment/challenge, and Owner browser smoke.
- [x] Shared protected admin shell, role-aware navigation, signed-out/MFA/access-denied states, and responsive layout.
- [-] Authenticated role-navigation smoke for Owner, Super Admin, Content Manager, and Credential Manager.

Stage status: **implementation complete; authenticated UI mutation and role-navigation smoke remain**.

## Stage 3 — Content Model and Public Website Foundation

- [x] CNT-001 EN/UA/CZ language model and fallback.
- [x] CNT-002 structured content pages, translations, permissions, audit, admin API/editor.
- [x] CNT-003 Home, About, Partnerships, For Organisations, public shell/navigation.
- [x] CNT-004 protected Site Settings and For Organisations URL override.
- [x] CNT-005 full Privacy Policy, Terms of Use, Refund Policy in three languages.
- [x] localized cookie consent with accept/decline; no optional trackers load before consent because none are installed.
- [-] Replace raw JSON editing with manager-friendly structured fields/forms.
- `BLOCKED`: final For Organisations application URL.

Stage status: **public and data layers complete; admin usability and one URL remain**.

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

- [ ] Protected Admin Programme API for Programme Areas.
- [ ] Protected Admin Programme API for Programme Types.
- [ ] Protected Admin Programme API for Programmes and translation publication states.
- [ ] Protected Admin Programme API for Programme Runs and enrolment corrections.
- [ ] Protected Admin Programme API for Pricing Options and application URLs.
- [ ] Admin access to slug redirects where operational review is required.
- [ ] Manager UI for programme list, create/edit, publication state, and catalogue order.
- [ ] Manager UI for localized sales sections and translation states.
- [ ] Manager UI for runs, tariffs, Leeloo URLs, and partner-site URLs.
- [ ] Authenticated Content Manager/Super Admin/Owner CRUD smoke.
- [ ] Credential Manager read-only programme/run reference smoke.
- `BLOCKED`: Leeloo destinations for General Psychology, Child Psychology, and Space Business.
- `BLOCKED`: partner-site destination for AI Production, expected later.

Stage status: **data and public delivery complete; Stage 4 is not accepted until protected manager API/UI and role tests are complete**.

## Partners, Experts, and Contacts

- [x] PCE-001 partner schema/RLS, multilingual public cards, and expandable data model.
- [x] PCE-002 expert schema/RLS and multilingual public cards, including Alina Yudina’s supplied photo.
- [x] PCE-003 Partnerships page combines approved organisations and experts.
- [-] PCE-004 database, programme-question endpoint, protected manager workflow, audit, rate-limit/CAPTCHA hooks, and notification code.
- [ ] Protected Admin API for partners and partner translations.
- [ ] Protected Admin API for experts and expert translations.
- [ ] Manager CRUD UI for partners, experts, order, publication states, logos, and photos.
- [ ] Authenticated Content Manager/Super Admin/Owner partner/expert CRUD smoke.
- [ ] General, organisation, and partnership public forms where the final page flows require them.
- `BLOCKED`: Google Workspace notification credentials/destination inbox.
- `BLOCKED`: production CAPTCHA provider and secrets.

Module status: **public presentation and programme-question workflow implemented; operations/configuration incomplete**.

## Admin Module Coverage

This matrix follows the Release 1 admin sitemap and prevents public implementation from being mistaken for admin completion.

| Admin module | Current implementation | Verification still required |
| --- | --- | --- |
| Dashboard | Not started | Route, role-aware summary, authenticated smoke |
| Content Pages | Protected API and technical JSON editor implemented | Manager-friendly controlled fields and authenticated edit/publish smoke |
| Programmes | Not started | API, CRUD UI, publication/order smoke |
| Programme Areas | Not started | API, CRUD UI, translation smoke |
| Programme Types | Not started | API, CRUD UI, translation smoke |
| Programme Runs | Not started | API, CRUD UI, enrolment correction smoke |
| Pricing Options | Not started | API, CRUD UI, 1–3 option and URL hierarchy smoke |
| Partners | Not started | API, CRUD UI, translation/asset smoke |
| Experts | Not started | API, CRUD UI, translation/asset smoke |
| Contact Submissions | Protected API and processing UI implemented | Authenticated role/status smoke; production notifications |
| Learners | Planned for Stage 5 | LRN-001..004 |
| Credential Sets / Credentials / Number Log | Planned for Stages 6–7 | CRD/WF sequence |
| Email Templates | Planned with credential workflow | Protected editing and audit smoke |
| Site Settings | Protected API/UI implemented | Authenticated save/audit smoke and final For Organisations URL |
| Users and Roles | Protected API/UI implemented | Authenticated create/roles/activation/audit smoke |
| Audit/History | Audit storage implemented; admin view not started | Protected list/detail and privacy review |
| Unified admin shell/navigation | Shared protected layout, role-aware desktop/mobile navigation, account context, and signed-out/MFA/access-denied states implemented | Authenticated role-navigation smoke for all four roles |

## Stage 5 — Learner Foundation

- [ ] LRN-001 learner core.
- [ ] LRN-002 multiple globally unique learner emails and primary email.
- [ ] LRN-003 globally unique phones and messenger flags.
- [ ] LRN-004 protected learner admin UI and credential placeholder.

Stage status: **not started**.

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

- [-] Programme-question capture and protected processing are implemented under PCE-004.
- [ ] Complete remaining public form entry points after confirming which page flows need them.
- [ ] Configure and test real Google Workspace notification delivery.
- [ ] Configure and test CAPTCHA and production rate limiting.

Stage status: **partially implemented**.

## Stage 9 — Security, QA, and Launch Hardening

- [-] Ticket-level migration/static verifiers, lint, TypeScript, builds, browser smoke, and selected RLS/API smoke checks pass.
- [ ] QA-001 full RLS matrix for every role and protected table.
- [ ] QA-002 credential verification privacy tests after credentials exist.
- [ ] QA-003 complete MFA-sensitive-action matrix.
- [ ] QA-004 end-to-end learner → credential → PDF → activation → verify → revoke flow.
- [ ] QA-005 production environment, Gmail, Leeloo, CAPTCHA, analytics, backup, and launch checklist.
- [ ] Responsive/mobile, accessibility, metadata, error-state, and production-browser QA.

Stage status: **foundation checks active; launch QA not started**.

## Verified Current Dev Baseline

- [x] One ordered chain of 26 local migrations matches the remote dev history.
- [x] Pre-integration dev backup exists in the ignored backup directory.
- [x] Public reads use Supabase by default; seed content is explicit offline mode only.
- [x] Dev data: 3 languages, 3 areas, 3 types, 5 programmes, 5 runs, 5 partners, 3 experts.
- [x] Structured public data: 7 pages and 21 published translations.
- [x] Nine localized legal routes render complete page bodies.
- [x] Anonymous content writes and anonymous protected-contact reads are denied.
- [x] Unauthenticated admin APIs return `401`.
- [x] Current production build and lint pass.

## Next Implementation Sequence

The next step should close existing operational gaps before opening the learner and credential modules:

1. **Complete Stage 4 manager operations**: Admin Programme API first, then programme/run/pricing/area/type UI and authenticated role tests.
2. **Complete partner/expert manager operations**: protected API, CRUD UI, translation and asset fields, and authenticated role tests.
3. **Replace raw content JSON editing with manager-friendly controlled fields** while preserving the structured schema.
4. **Finish contact operations**: confirm required public form entry points, then configure/test CAPTCHA, rate limiting, and Google Workspace delivery.
5. **Run the complete role/RLS/admin end-to-end pass** for Stages 2–4 when Docker or another pgTAP-capable environment is available.
6. **Start Stage 5 with LRN-001 Learner Core** only after the Stage 4 manager layer is accepted.
7. Only after Stage 5 acceptance, begin CRD-001 and the credential sequence.

This sequence is primarily backend, permissions, workflows, and operational administration. It does not depend on final visual design.
