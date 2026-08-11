# Implementation Status

Last updated: 2026-08-11

This is the current implementation record. The v2 product and technical specifications remain the source of truth. The ticket-level view and next sequence are maintained in `docs/planning/PROJECT_MASTER_CHECKLIST.md`.

## Current Branch

- The stabilization branch was merged into `main` through PR #1.
- Current focused branch: `codex/qa-005-production-grants`.
- No direct push to `main` is used.

## Supabase Dev Project

- Project: `nobel-itbs-dev`
- Project ref: `flswzhgjbpagohbwehcz`
- Region observed in dashboard: West EU (Ireland)
- Local secrets remain in ignored environment files and must never be committed.
- A pre-integration backup is available under the ignored `backups/supabase/2026-08-05-pre-content/` directory.

All 47 local SQL migrations through `20260811120000_qa_005_restore_partnership_service_grants.sql` are applied to the remote dev and production databases. Both local/remote migration histories match. The separate `nobel-itbs-prod` project is in Frankfurt; its secrets remain outside Git.

## Implemented Foundation

- Supabase/PostgreSQL foundation, audit log, RLS helpers, multi-role admin model, Owner safeguards, MFA enforcement, and protected admin APIs.
- Next.js App Router application with English at unprefixed URLs, Ukrainian under `/ua`, and Czech under `/cz`.
- Structured core pages, legal pages, site settings, public navigation, locale fallback, and explicit Supabase-versus-seed data-source selection.
- Programme areas, types, five programme records, runs, flexible pricing, public catalogue, programme/area/type pages, redirects, and programme-question flow.
- Partner and expert records and their public Partnerships rendering.
- Private contact-submission storage, programme-question plus general/partnership/organisation public forms, protected manager list/status workflow, audit logging, database-backed rate limiting, and CAPTCHA hooks. The existing contact-email adapter is dormant and scheduled to be replaced by PCE-005 Telegram notifications before launch.
- Shared protected admin shell with role-aware desktop/mobile navigation, account context, and explicit signed-out, MFA-required, and access-denied states.
- Actor-scoped Admin Programme API for areas, types, programmes/translations, runs, pricing options/translations, and read-only slug redirect review.
- Responsive programme manager for list/create/edit, publication and catalogue settings, localized page copy, controlled sales sections, and SEO.
- Responsive Programme Area and Programme Type managers with controlled EN/UA/CZ landing sections, SEO, ordering, and publication guards.
- Inline programme-run and 1–3 pricing-option management with localized tariff copy, activation guards, and explicit application-URL priority.
- Actor-scoped partner/expert APIs and responsive managers for records, EN/UA/CZ public copy, publication, ordering, destinations, and approved WebP paths.
- Manager-friendly Content Pages editor for fixed sections, nested cards/lists, legal paragraphs, H1, SEO, and EN/UA/CZ publication without raw JSON editing.
- Manager interfaces for users and roles, content pages, site settings, and contact submissions.
- Private Learner Core identity records with Latin first/last name, Ukrainian full name, internal note, soft archive, controlled column grants, forced RLS, and MFA-protected Owner/Super Admin/Credential Manager access.
- Private learner emails with case-insensitive global uniqueness, at most one primary address per learner, immutable learner ownership, controlled grants, forced RLS, and MFA-protected management.
- Private learner phones with canonical global uniqueness, at most one primary number per learner, Telegram/Viber/WhatsApp flags, immutable learner ownership, controlled grants, forced RLS, and MFA-protected management.
- Protected learner API and responsive manager UI for profile creation/editing, archive/restore, contact search and management, primary contacts, messenger flags, protected duplicate navigation, and real linked credential summaries.
- Credential type reference data for Certificate and Diploma, localized EN/UA/CZ labels, stable machine codes and document letters, deactivation support, forced RLS, MFA-protected reference access, and Owner/Super Admin-only configuration changes.
- Private status-free Credential Sets with exact learner/programme/run/completion-context matching, programme-run consistency, idempotent automatic find/create, creation audit, forced RLS, MFA, and no authenticated context mutation or hard delete.
- Permanent Document Number Log with `reserved`/`issued`/`voided` states, a shared non-cycling sequence starting at `000001`, automatic and rare audited manual reservation, controlled voiding, immutable identity/no-delete enforcement, forced RLS, and MFA-protected reads.
- Private Credential identities with only `pending`/`valid`/`revoked`/`voided`, current curated public fields, HMAC lookup plus encrypted token storage, immutable identity/lifecycle checks, two-way deferred Number Log integrity, set/programme/run/type/year validation, controlled audited set moves, forced RLS, and no direct mutation grants.
- Private `private-credentials` Storage bucket restricted to PDF and 20 MB, configurable seeded file types, canonical credential/file object paths, one-primary metadata rule, replacement-in-place/no-version model, file-change audit without paths/content, forced RLS, and no browser Storage policies or direct metadata mutations.
- Private append-only credential history plus current-text internal notes with controlled author edit/soft-delete, Owner/Super Admin deletion of others' notes, privacy-minimal History/Audit events, forced RLS, MFA, and no direct note/history mutations.
- Actor-scoped pending-credential creation API and controlled database workflow for exact Credential Set reuse, automatic or Owner/Super Admin manual number reservation, pending identity creation, Number Log linkage, and privacy-safe History/Audit.
- Server-only verification-token protection with 256-bit random tokens, HMAC-SHA-256 lookup, independent AES-256-GCM encryption, key versioning, and ready QR verification paths without separate token/hash/ciphertext response fields.
- Actor-scoped credential PDF routes for private upload/list, replacement-in-place with compensating restore, metadata/primary management, pending-only deletion, and 60-second admin signed URLs.
- Lifecycle-aware PDF rules: valid changes require History/Audit reason and retain a primary PDF; revoked/voided mutations and valid deletion are denied.
- Protected Credential Admin Workspace with role-aware navigation, actor-scoped list/detail/reference APIs, pending creation form, current private PDF controls, read-only Credential Sets and permanent Number Log, append-only History, controlled Notes, and no premature activation/revoke/void/resend/public-verification actions.
- Atomic pending-to-valid credential activation with primary-PDF and complete-current-file guards, permanent number issuance, editable EN/UA delivery drafts, and permanent private delivery outcome/file manifests.
- Server-only AES-256-GCM verification-token decryption for the email verification URL and Google Workspace MIME delivery of all current private PDFs. Missing recipient, missing provider configuration, or provider failure never rolls back an already successful activation.
- Pending-only activation, irreversible valid revocation, irreversible pending void, controlled valid public-data correction, and private email-delivery history are integrated into the protected Credential Admin Workspace. Resend remains intentionally deferred.
- Server-mediated public verification by document number or QR token with HMAC lookup, persistent rate limiting, strict valid/revoked/not-found privacy projection, localized EN/UA/CZ pages, and noindex QR/results.

## Verified in Dev

- Remote database contains 3 languages, 3 programme areas, 3 programme types, 5 programmes, 5 runs, 5 partners, 3 experts, 7 structured page records, and 21 published page translations.
- Public application reads real Supabase content by default and does not silently replace database failures with seed content.
- Anonymous write attempts and unauthorized contact reads are denied; protected admin APIs reject unauthenticated requests.
- Production build, TypeScript, lint, ticket verification scripts, public API smoke checks, and browser checks pass.
- Signed-out admin-shell and login-route browser checks pass; the authenticated access matrix passed for all four roles and a multi-role account.
- Public contact entry points, validation, honeypot, five-per-15-minute rate limit, CAPTCHA fail-closed contract, Credential Manager MFA, status transitions, and privacy-safe audit passed live dev QA.
- Learner Core live RLS/MFA QA passed: anonymous and Content Manager denied, Credential Manager denied at AAL1 and allowed at AAL2, hard delete denied, and temporary data cleaned.
- Learner Email live QA passed: case-insensitive duplicate and second-primary conflicts enforced, primary switching and authorized removal work, ownership changes are denied, and temporary data is cleaned.
- Learner Phone live QA passed: canonical uniqueness, second-primary and messenger-consistency constraints are enforced, primary switching and authorized removal work, ownership changes are denied, and temporary data is cleaned.
- Learner Admin API/UI live QA passed: role/MFA boundaries, profile and contact operations, protected duplicate references, archive filtering, desktop/mobile workflows, cleanup, and browser console checks passed.
- Credential Type live QA passed: anonymous and Content Manager access is denied, Credential Manager access requires AAL2 and is read-only, Owner AAL2 can create/localize/deactivate, hard delete is denied, format constraints are enforced, and temporary data is cleaned.
- Credential Set live QA passed: anonymous and Content Manager access is denied, Credential Manager is denied at AAL1 and allowed at AAL2, exact-context find/create is idempotent, a mismatched programme run is rejected, and all temporary operations were rolled back or cleaned.
- Document Number Log live QA passed: anonymous, Content Manager, and AAL1 access is denied; Credential Manager AAL2 can read but cannot manually override; Owner AAL2 manual reservation, duplicate denial, void reason, audit, and delete denial passed transactionally; the automatic sequence remains unused at `000001`.
- Credential Core live QA passed: anonymous/Content Manager/AAL1 denied, Credential Manager AAL2 read-only, direct insert denied, a linked pending credential passed forced deferred integrity, invalid year/lifecycle/delete/identity rewrite were rejected, token material stayed out of audit, controlled set move preserved the number link and wrote one audit event, and all records were rolled back.
- Credential File live QA passed: bucket is private/PDF-only/20 MB, service-side upload/download works, anonymous download and invalid MIME are denied, one-primary uniqueness and replacement-in-place metadata work, audit excludes private paths, test metadata rolled back, the temporary Storage object was deleted, and the automatic number sequence remained unused.
- Credential History/Notes live QA passed: anonymous/Content Manager/AAL1 access is denied, AAL2 Credential Manager read and own-note operations work, another Credential Manager cannot edit/delete the note, Super Admin soft deletion works, History is append-only, note text/private paths stay out of journals, event hooks passed, all records rolled back, and the automatic number sequence remained unused.
- Pending Credential live QA passed: Content Manager/AAL1/anonymous denied, manual override restricted, AAL2 Super Admin creation and exact Set reuse work, reserved numbers link correctly, History/Audit exclude protected token material, all QA records rolled back, and automatic `000001` remains unused; local unauthenticated API smoke returns `401`.
- Credential PDF Workflow live QA passed: 16 database role/lifecycle/primary/reason/privacy checks and 6 private Storage upload/signed URL/replacement/MIME checks passed; rollback/cleanup completed and automatic `000001` remains unused.
- Credential Admin Workspace QA passed in an authenticated Owner/AAL2 browser session: empty real registries, five programme/two document-type references, pending-form guards, Sets/Number Log navigation, clean console, responsive 390 px layout without horizontal overflow, and `401` on all new list APIs without a Bearer token. No test record was created, so the automatic number remains unused.
- WF-003 and WF-005..008 static verifiers, ADM-CRD-001/PCE-004 regressions, TypeScript, ESLint, and production build pass. Additive migration pushes succeeded, and dev/production histories match all 47 local migrations.
- WF-003 authenticated Owner/AAL2 browser smoke passed after migration: the real credential workspace loads without alerts, exposes the protected registry and guarded pending form, and creates no test record. The activation mutation was intentionally not exercised because no approved credential/PDF exists and document numbers are permanent; unauthenticated activation returns `401`.
- All nine legal routes render full localized documents; their metadata is `noindex, follow`.
- WF-008 real dev smoke passed for unknown number/token parity, no-store/noindex headers, anonymous direct-access denial, the 30-per-15-minute database limit, EN/UA/CZ routing, localized manual UI, 390 px responsive layout without horizontal overflow, and clean browser console. The dev registry is empty, so valid/revoked rendering awaits the first approved lifecycle E2E rather than consuming a fake permanent number.

## Verification Limitation

The SQL migrations are applied and smoke-tested against dev, but the complete local pgTAP suite was not executed because the Supabase CLI database test command requires Docker and no Docker-compatible runtime is available. This remains an explicit QA item, not a hidden pass.

## Operational Dependencies

- Leeloo URLs are still required for General Psychology, Child Psychology, and Space Business.
- The AI Production partner URL is intentionally pending; its CTA currently uses the question fallback.
- The For Organisations application URL remains an Owner/Super Admin setting and needs its final destination.
- Contact notifications will use a one-way Telegram bot and private manager chat under deferred pre-launch ticket PCE-005; Google Workspace is not required for contact alerts.
- The Owner approved VEDOS SMTP for credential delivery instead of Google Workspace. Current v2 documents and WF-003 code still use Google Workspace; align them in a separate scoped ticket before the first real delivery acceptance test. Until then, WF-003 records `not_configured` without undoing activation.
- Production forms require a strong rate-limit secret. CAPTCHA is intentionally conditional and remains unconfigured until abuse signals justify enabling it.
- Production verification should use an independent `CREDENTIAL_VERIFICATION_RATE_LIMIT_SECRET`; local development has an ignored dev-only value and the server supports the existing contact secret only as a backward-compatible fallback.
- Czech native-language review remains an external editorial check where noted in the approved source files.

## Important Remaining Product Work

- The Owner-approved Home visual layer is integrated into the structured Supabase-backed Home on branch `codex/cnt-003-home-visual-integration`; local desktop/mobile/tablet and WF-008 checks passed. Production content still needs a forward-only correction because the historical CNT-003 migration omitted the third EN/UA area and several CZ fields. Owner Vercel Preview acceptance remains required; rejected PR #3 must not be merged.
- Programme, partner, expert, content, settings, user/role, and contact manager operations have passed authenticated role and mutation QA.
- Telegram contact-alert delivery remains a deferred pre-launch check. Credential PDF delivery will move from the current Google Workspace implementation to the Owner-approved VEDOS SMTP path in a separate scoped alignment ticket. CAPTCHA provider setup is deferred by product decision and is not a blocker.
- Stage 5 Learner Foundation and Stage 6 Credential Core are complete. Stage 7 has WF-001..003, WF-005..008, and ADM-CRD-001 accepted at the documented dev level. WF-004 resend remains deferred to pre-launch because managers can correct an address and resend manually.
- QA-001..004 are accepted at the documented dev level. QA-005 production foundation now has a separate Supabase project, 47/47 migration parity, approved seed data, anonymous RLS smoke, and required server-table access. Telegram PCE-005, VEDOS delivery alignment/acceptance, analytics, CAPTCHA if later enabled, and final external CTA values remain pre-launch work.
- Next correct and verify the malformed production Home content, deploy the integrated Home to Vercel Preview for Owner acceptance, then continue the existing production configuration without connecting the public domain. Production Auth/Owner/MFA, backup coverage, final cross-browser acceptance, and external integrations still remain before launch.
