# Implementation Status

Last updated: 2026-08-05

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

All 26 local SQL migrations through `20260805140000_cnt_005_legal_pages.sql` are applied to the remote dev database. The local and remote migration histories match.

## Implemented Foundation

- Supabase/PostgreSQL foundation, audit log, RLS helpers, multi-role admin model, Owner safeguards, MFA enforcement, and protected admin APIs.
- Next.js App Router application with English at unprefixed URLs, Ukrainian under `/ua`, and Czech under `/cz`.
- Structured core pages, legal pages, site settings, public navigation, locale fallback, and explicit Supabase-versus-seed data-source selection.
- Programme areas, types, five programme records, runs, flexible pricing, public catalogue, programme/area/type pages, redirects, and programme-question flow.
- Partner and expert records and their public Partnerships rendering.
- Private contact-submission storage, protected manager list/status workflow, audit logging, rate-limit/CAPTCHA hooks, and Google Workspace notification code.
- Shared protected admin shell with role-aware desktop/mobile navigation, account context, and explicit signed-out, MFA-required, and access-denied states.
- Actor-scoped Admin Programme API for areas, types, programmes/translations, runs, pricing options/translations, and read-only slug redirect review.
- Manager interfaces for users and roles, content pages, site settings, and contact submissions.

## Verified in Dev

- Remote database contains 3 languages, 3 programme areas, 3 programme types, 5 programmes, 5 runs, 5 partners, 3 experts, 7 structured page records, and 21 published page translations.
- Public application reads real Supabase content by default and does not silently replace database failures with seed content.
- Anonymous write attempts and unauthorized contact reads are denied; protected admin APIs reject unauthenticated requests.
- Production build, TypeScript, lint, ticket verification scripts, public API smoke checks, and browser checks pass.
- Signed-out admin-shell and login-route browser checks pass; authenticated navigation still needs a smoke pass with each of the four admin roles.
- All nine legal routes render full localized documents; their metadata is `noindex, follow`.

## Verification Limitation

The SQL migrations are applied and smoke-tested against dev, but the complete local pgTAP suite was not executed because the Supabase CLI database test command requires Docker and no Docker-compatible runtime is available. This remains an explicit QA item, not a hidden pass.

## Operational Dependencies

- Leeloo URLs are still required for General Psychology, Child Psychology, and Space Business.
- The AI Production partner URL is intentionally pending; its CTA currently uses the question fallback.
- The For Organisations application URL remains an Owner/Super Admin setting and needs its final destination.
- Production contact notifications require Google Workspace server credentials and destination inbox configuration.
- Production forms require a strong rate-limit secret and the chosen CAPTCHA provider configuration.
- Czech native-language review remains an external editorial check where noted in the approved source files.

## Important Remaining Product Work

- Programmes, partners, and experts have secure data/public layers but no manager CRUD interface yet.
- The structured page editor exposes controlled JSON; it is functional but not yet a manager-friendly field/form experience.
- Learners, credentials, issuance/email, and public credential verification have not started.
- Launch hardening, production environment setup, full role/RLS QA, responsive QA, and email/CAPTCHA end-to-end tests remain ahead.
