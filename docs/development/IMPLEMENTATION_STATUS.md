# Implementation Status

Last updated: 2026-08-08

This is the current implementation record. The v2 product and technical specifications remain the source of truth. The ticket-level view and next sequence are maintained in `docs/planning/PROJECT_MASTER_CHECKLIST.md`.

## Current Branch

- Active branch: `codex/stabilize-content-integration`
- The stabilization work is committed locally as separate documentation, content, programme, partner/expert/contact, Supabase integration, and CNT-002..005 commits.
- The branch has not been pushed or merged.

## Supabase Dev Project

- Project: `nobel-itbs-dev`
- Project ref: `flswzhgjbpagohbwehcz`
- Region observed in dashboard: West EU (Ireland)
- Local secrets remain in ignored environment files and must never be committed.
- A pre-integration backup is available under the ignored `backups/supabase/2026-08-05-pre-content/` directory.

All 38 local SQL migrations through `20260808130000_crd_006_credential_history_notes.sql` are applied to the remote dev database. The local and remote migration histories match.

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
- Protected learner API and responsive manager UI for profile creation/editing, archive/restore, contact search and management, primary contacts, messenger flags, protected duplicate navigation, and a Credential Core placeholder.
- Credential type reference data for Certificate and Diploma, localized EN/UA/CZ labels, stable machine codes and document letters, deactivation support, forced RLS, MFA-protected reference access, and Owner/Super Admin-only configuration changes.
- Private status-free Credential Sets with exact learner/programme/run/completion-context matching, programme-run consistency, idempotent automatic find/create, creation audit, forced RLS, MFA, and no authenticated context mutation or hard delete.
- Permanent Document Number Log with `reserved`/`issued`/`voided` states, a shared non-cycling sequence starting at `000001`, automatic and rare audited manual reservation, controlled voiding, immutable identity/no-delete enforcement, forced RLS, and MFA-protected reads.
- Private Credential identities with only `pending`/`valid`/`revoked`/`voided`, current curated public fields, HMAC lookup plus encrypted token storage, immutable identity/lifecycle checks, two-way deferred Number Log integrity, set/programme/run/type/year validation, controlled audited set moves, forced RLS, and no direct mutation grants.
- Private `private-credentials` Storage bucket restricted to PDF and 20 MB, configurable seeded file types, canonical credential/file object paths, one-primary metadata rule, replacement-in-place/no-version model, file-change audit without paths/content, forced RLS, and no browser Storage policies or direct metadata mutations.
- Private append-only credential history plus current-text internal notes with controlled author edit/soft-delete, Owner/Super Admin deletion of others' notes, privacy-minimal History/Audit events, forced RLS, MFA, and no direct note/history mutations.

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
- All nine legal routes render full localized documents; their metadata is `noindex, follow`.

## Verification Limitation

The SQL migrations are applied and smoke-tested against dev, but the complete local pgTAP suite was not executed because the Supabase CLI database test command requires Docker and no Docker-compatible runtime is available. This remains an explicit QA item, not a hidden pass.

## Operational Dependencies

- Leeloo URLs are still required for General Psychology, Child Psychology, and Space Business.
- The AI Production partner URL is intentionally pending; its CTA currently uses the question fallback.
- The For Organisations application URL remains an Owner/Super Admin setting and needs its final destination.
- Contact notifications will use a one-way Telegram bot and private manager chat under deferred pre-launch ticket PCE-005; Google Workspace is not required for contact alerts.
- Production forms require a strong rate-limit secret. CAPTCHA is intentionally conditional and remains unconfigured until abuse signals justify enabling it.
- Czech native-language review remains an external editorial check where noted in the approved source files.

## Important Remaining Product Work

- Programme, partner, expert, content, settings, user/role, and contact manager operations have passed authenticated role and mutation QA.
- Telegram contact-alert delivery remains a deferred pre-launch check. Google Workspace remains required later for credential PDF delivery only. CAPTCHA provider setup is deferred by product decision and is not a blocker.
- Stage 5 Learner Foundation and the Stage 6 Credential Core database/security foundation are complete through CRD-006; controlled issuance/email, credential admin workflow UI, and public verification remain.
- Launch hardening, production environment setup, full role/RLS QA, responsive QA, and email end-to-end tests remain ahead; CAPTCHA testing applies only if the conditional control is enabled later.
