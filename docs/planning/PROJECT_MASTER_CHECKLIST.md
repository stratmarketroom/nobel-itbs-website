# Nobel ITBS Release 1 — Project Master Checklist

Last reviewed: 2026-08-05  
Baseline: v2 product, technical, security, sitemap, and implementation documents  
Purpose: keep implementation aligned with Release 1 and make the next non-design step unambiguous.

## Status Legend

- `[x]` implemented and verified at the current dev level;
- `[-]` partially implemented or waiting for operational/external completion;
- `[ ]` not started;
- `BLOCKED` requires a value, account, provider, or decision outside the repository.

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
- [x] AUTH-006 MFA/AAL2 enforcement for sensitive roles/actions.
- [x] AUTH-007 sign-in, TOTP enrolment/challenge, and Owner browser smoke.
- [-] Unified admin shell/navigation and route-level UX completion.

Stage status: **core auth, MFA, and user-management workflow complete; unified admin navigation remains**.

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

- [x] PRG-001 three Programme Areas with translations.
- [x] PRG-002 three Programme Types with translations.
- [x] PRG-003 five multilingual programme records and structured sales content.
- [x] PRG-004 programme runs and enrolment state.
- [x] PRG-005 flexible pricing and application destination hierarchy.
- [x] PRG-006 public catalogue without visible filters.
- [x] PRG-007 programme, area, and type routes plus localized SEO metadata.
- [x] PRG-008 redirect registry and published slug-change handling.
- [x] PRG-009 programme-linked question form.
- [-] Manager CRUD/API/UI for programmes, runs, pricing, order, areas, and types.
- `BLOCKED`: Leeloo destinations for General Psychology, Child Psychology, and Space Business.
- `BLOCKED`: partner-site destination for AI Production, expected later.

Stage status: **public catalogue complete; operational manager tools and final URLs remain**.

## Partners, Experts, and Contacts

- [x] PCE-001 multilingual partner cards and expandable data model.
- [x] PCE-002 multilingual expert cards, including Alina Yudina’s supplied photo.
- [x] PCE-003 Partnerships page combines approved organisations and experts.
- [-] PCE-004 database, programme-question endpoint, protected manager workflow, audit, rate-limit/CAPTCHA hooks, and notification code.
- [-] Manager CRUD/API/UI for partners and experts.
- [ ] General, organisation, and partnership public forms where the final page flows require them.
- `BLOCKED`: Google Workspace notification credentials/destination inbox.
- `BLOCKED`: production CAPTCHA provider and secrets.

Module status: **public presentation and programme-question workflow implemented; operations/configuration incomplete**.

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

1. **Complete manager operations for the modules already public**: programme/run/pricing/area/type management; partner and expert management; manager-friendly structured page forms; unified protected admin navigation.
2. **Finish contact operations**: confirm required public form entry points, then configure/test CAPTCHA, rate limiting, and Google Workspace delivery.
3. **Run the complete role/RLS/admin end-to-end pass** for Stages 2–4 when Docker or another pgTAP-capable environment is available.
4. **Start Stage 5 with LRN-001 Learner Core**, then proceed in ticket order through LRN-004.
5. Only after Stage 5 acceptance, begin CRD-001 and the credential sequence.

This sequence is primarily backend, permissions, workflows, and operational administration. It does not depend on final visual design.
