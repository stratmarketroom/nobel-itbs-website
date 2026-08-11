# CRD-002 Credential Sets QA — 2026-08-07

## Summary

CRD-002 is implemented and accepted in the linked Supabase dev project. It adds the private, status-free grouping entity for related credentials of one learner/programme/completion context and an idempotent helper for automatic set matching.

This ticket does not create credentials. Adding or moving a credential between sets becomes executable only after CRD-004 introduces the `credentials` table; that later operation must write audit history.

## Files and Database Objects

- Migration: `supabase/migrations/20260807140000_crd_002_credential_sets.sql`.
- Database test: `supabase/tests/database/crd_002_credential_sets.test.sql`.
- Static verifier: `scripts/verify-crd-002.mjs` and `npm run verify:crd-002`.
- Table: `public.credential_sets`.
- Function: `public.find_or_create_credential_set(uuid, uuid, uuid, date)`.
- Supporting objects: exact-context unique index with null equality, learner/programme lookup indexes, programme-run composite reference, `updated_at` trigger, creation-audit trigger, grants, and forced RLS policies.

The set contains only:

- learner;
- programme;
- optional matching programme run;
- optional completion date;
- technical ID and timestamps.

It deliberately has no status, public URL, QR/token, or public verification behaviour.

## Permission and Security Verification

Live dev checks with temporary test roles confirmed:

- anonymous direct read fails with PostgreSQL `42501`;
- Content Manager at AAL2 receives zero rows;
- Credential Manager at AAL1 receives zero rows;
- Credential Manager at AAL2 can find/create a set;
- two calls for the same exact context return the same set ID and produce exactly one set;
- a programme run belonging to another programme is rejected with PostgreSQL `23503`;
- authenticated update and hard delete privileges are absent;
- creation audit contains no learner, programme, or completion details in metadata;
- temporary database work was transactionally rolled back and temporary Auth users were deleted.

Owner, Super Admin, and Credential Manager share the approved MFA-protected read/create boundary. Content Manager and public users have no access. The helper is `security invoker`, so it cannot bypass table grants, RLS, role checks, or MFA.

## Automated Verification

Passed:

- `npm run verify:crd-002`;
- migration dry-run and application to the linked dev project;
- live RLS/MFA, idempotency, uniqueness, and programme-run consistency checks;
- lint, TypeScript, production build, and whitespace verification as recorded at ticket closure.

The pgTAP specification contains 31 assertions covering schema, required/optional fields, references, indexes, triggers, function exposure, RLS, grants, MFA, and role boundaries.

## Limitation

The full local pgTAP runner was not executed because Supabase CLI database tests require Docker and no compatible runtime is available. The SQL test remains committed for a compatible database-test environment.

## Deviations and Open Questions

- The schema follows v2 exactly and adds only integrity/security objects needed to enforce that model.
- Set context is immutable to authenticated clients. If a context is wrong, a correct set is created and credentials will later be moved through the audited credential workflow.
- Automatic set matching is ready now; WF-001 will call it when creating the first pending credential.
- Actual add/move operations are deferred until CRD-004 because no `credentials` table exists before that ticket. This is a dependency boundary, not omitted scope.
- No external provider, email, Telegram, or CAPTCHA configuration is required.

## Result and Next Dependency

CRD-002 is complete. The next ticket is CRD-003 Document Number Log, which introduces permanent no-reuse number reservation before credentials are created in CRD-004.
