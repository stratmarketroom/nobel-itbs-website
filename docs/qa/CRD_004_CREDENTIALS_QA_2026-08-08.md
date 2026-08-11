# CRD-004 Credentials QA — 2026-08-08

## Summary

CRD-004 is implemented and accepted in the linked Supabase dev project. It introduces the private credential identity and its corrected Release 1 lifecycle without implementing PDF storage, activation, email, or public verification.

The ticket also activates the previously deferred Credential Set move operation now that a credential record exists.

## Files and Database Objects

- Migrations:
  - `supabase/migrations/20260808110000_crd_004_credentials.sql`;
  - `supabase/migrations/20260808111000_crd_004_credential_set_move.sql`.
- Database test: `supabase/tests/database/crd_004_credentials.test.sql`.
- Static verifier: `scripts/verify-crd-004.mjs` and `npm run verify:crd-004`.
- Enum: `public.credential_status` with only `pending`, `valid`, `revoked`, and `voided`.
- Table: `public.credentials`.
- Controlled function: `public.move_credential_to_set(uuid, uuid)`.
- Document Number Log now has a real foreign key and unique link to `public.credentials`.
- Supporting objects: context/lifecycle/public-field/token constraints, listing indexes, immutable/no-delete trigger, creation/set-move audit trigger, deferred two-way number-link triggers, grants, and forced RLS.

## Implemented Integrity Rules

- credential learner/programme/run must match its Credential Set;
- programme run must belong to the selected programme;
- reserved number type and year must match credential type and issue date;
- credential and Number Log must link to each other before transaction completion;
- `pending` maps to number `reserved`;
- `valid` and `revoked` map to number `issued`;
- credential `voided` maps to number `voided`;
- allowed credential transitions are only `pending → valid`, `pending → voided`, and `valid → revoked`;
- credential identity, number, token material, language, type, learner, programme, run, and issue date are immutable;
- hard delete is forbidden;
- set movement is allowed only through the controlled MFA function and only to a matching learner/programme/run set;
- partner data, raw verification token, expiration, cancelled, and reissued lifecycle fields are absent.

## Permission and Security Verification

Live dev checks confirmed:

- anonymous direct read fails with PostgreSQL `42501`;
- Content Manager at AAL2 receives zero rows;
- Credential Manager at AAL1 receives zero rows;
- Credential Manager at AAL2 can read but direct insert fails with `42501`;
- service role has no direct insert/update grant;
- a complete pending credential plus Number Log mutual link passes forced deferred checks;
- invalid document year, invalid lifecycle, hard delete, and token-identity rewrite are rejected;
- pending creation writes one audit event without token material;
- controlled set movement succeeds, writes one `credential.set_moved` event, and preserves the Number Log link;
- all credential, learner, set, number, and audit QA records were transactionally rolled back;
- temporary Content Manager and Credential Manager Auth users were deleted.

The automatic number sequence was not consumed. Before and after both QA flows it remained:

```text
last_value = 1
is_called = false
```

The first real automatic reservation therefore remains `000001`.

## Automated Verification

Passed:

- `npm run verify:crd-004`;
- migration dry-runs and application to the linked dev project;
- live role/MFA, context, lifecycle, mutual-link, audit, token-privacy, delete/identity protection, and set-move checks;
- lint, TypeScript, production build, and whitespace verification as recorded at ticket closure.

The pgTAP specification contains 54 assertions covering lifecycle values, schema, foreign keys, uniqueness, constraints, indexes, triggers, controlled set move, RLS, grants, MFA, role boundaries, and forbidden fields.

## Limitation

The full local pgTAP runner was not executed because Supabase CLI database tests require Docker and no compatible runtime is available. The SQL test remains committed for a compatible database-test environment.

## Deviations and Open Questions

- Token generation and encryption are not executed in CRD-004. WF-001 will use server-held HMAC/encryption secrets and the protected schema fields introduced here.
- The lookup hash is stored as lowercase 64-character hexadecimal HMAC-SHA-256; encrypted token material remains opaque and versioned.
- No pending-credential creation API/function is added here because that atomic workflow belongs to WF-001.
- No activation, revoke, credential void, public-data correction, or public verification function is added here; those remain WF-003/005/006/007/008.
- No PDF/file objects are added; CRD-005 is next.
- No external provider, Gmail, Telegram, or CAPTCHA configuration is required.

## Result and Next Dependency

CRD-004 is complete. The next ticket is CRD-005 Credential Files: private Supabase Storage metadata, configurable file types, one-primary rules, and pending-file management boundaries.
