# WF-001 Create Pending Credential QA — 2026-08-09

## Summary

WF-001 is implemented and accepted in the linked Supabase dev project. It provides the actor-scoped admin endpoint and controlled database workflow for creating a pending credential, finding or creating its exact Credential Set, permanently reserving and linking its document number, and protecting its QR verification token.

## Files and Database Objects

- Migration: `supabase/migrations/20260809100000_wf_001_create_pending_credential.sql`.
- Database test: `supabase/tests/database/wf_001_create_pending_credential.test.sql`.
- Static verifier: `scripts/verify-wf-001.mjs` and `npm run verify:wf-001`.
- Admin route: `POST /api/v1/admin/credentials`.
- Credential server modules:
  - `lib/credentials/admin.ts`;
  - `lib/credentials/admin-input.ts`;
  - `lib/credentials/token.ts`;
  - `lib/credentials/types.ts`.
- Controlled function: `public.create_pending_credential(...)`.
- New server-only environment contract:
  - `CREDENTIAL_TOKEN_HMAC_SECRET`;
  - `CREDENTIAL_TOKEN_ENCRYPTION_KEY`;
  - `CREDENTIAL_TOKEN_ENCRYPTION_KEY_VERSION`.

## Workflow Rules

- Owner, Super Admin, and Credential Manager may create a pending credential only with satisfied MFA/AAL2;
- Content Manager and anonymous users are denied;
- exact learner/programme/run/completion context finds or creates one reusable Credential Set;
- automatic numbering uses the existing shared non-cycling sequence;
- rare manual numbering remains restricted to Owner/Super Admin and requires a reason;
- number and reason must be supplied together;
- the number is linked to the new credential in `reserved` state;
- credential status is always `pending` and activation fields remain empty;
- credential creation and linked number reservation write History/Audit events;
- partner data is not accepted or stored.

## Token Security

- server generates 32 random bytes and encodes the token as base64url;
- token lookup uses HMAC-SHA-256 with an independent server-only secret;
- recoverable token material uses AES-256-GCM with a random 12-byte IV and authentication tag;
- encryption key is exactly 32 random bytes encoded as base64;
- encryption key version is stored with the credential;
- HMAC and encryption values must be independent;
- raw token is never sent to the database, logs, History, or Audit;
- API returns a ready `/verify/{token}` URL needed for QR generation but does not return a separate token, lookup hash, or encrypted value;
- service role is not used by the WF-001 route or data layer;
- independent dev-only secrets were generated into ignored `.env.local` and were not printed or committed.

## Live Permission and Integrity Verification

The rollback-only live dev QA passed all 16 checks:

- Content Manager at AAL2 is denied;
- Credential Manager at AAL1 is denied;
- Credential Manager at AAL2 cannot use manual number override;
- incomplete manual number/reason input is rejected;
- Super Admin at AAL2 creates pending credentials through the controlled workflow;
- returned manual number matches the reserved number;
- two credentials with the same completion context reuse one Credential Set;
- both credentials remain pending;
- both permanent Number Log rows are linked and reserved;
- credential creation and number reservation produce four History events;
- both credential creations produce Audit events;
- HMAC/ciphertext test values are absent from History and Audit;
- direct credential insert remains denied;
- anonymous workflow execution is denied;
- all learner, set, number, credential, History, Audit, profile, and role QA records were transactionally rolled back;
- temporary Auth users were deleted.

The automatic document-number sequence remained untouched:

```text
last_value = 1
is_called = false
```

The local API smoke confirmed that unauthenticated `POST /api/v1/admin/credentials` returns `401 unauthorized`.

## Automated Verification

Passed:

- `npm run verify:wf-001`;
- migration dry-run and application to linked dev;
- live RLS/MFA, manual reservation, set reuse, Number Log, History/Audit, privacy, and rollback checks;
- ignored dev secret length/format validation;
- local HTTP authorization smoke;
- final lint, TypeScript, production build, migration parity, and whitespace checks recorded at ticket closure.

The pgTAP specification contains 22 assertions covering function signature, security definer/search path, grants, roles, MFA, automatic/manual reservation branches, set creation, pending insert, Number Log linkage, History, safe token inputs/result, absence of partner data, and denial of direct inserts.

## Limitations and Open Questions

- The live dev test intentionally used rollback-only manual numbers and did not call `nextval`, preserving the first real automatic number `000001`. The automatic branch reuses the already accepted CRD-003 reservation function and is covered structurally by migration/static/pgTAP checks. It will receive its first irreversible end-to-end confirmation when the Owner creates the first retained dev/staging credential.
- The complete pgTAP runner remains unavailable locally because Supabase CLI database tests require Docker. The SQL test is committed for a compatible runner.
- This ticket creates the pending identity and QR URL only. It does not upload PDFs, activate, email, revoke, void, update valid public data, or expose public verification.
- The credential-detail admin UI is not implemented in WF-001. Its backend contract is now stable for the following workflow/UI tickets.
- Production must receive different HMAC and AES keys through the hosting secret manager; dev secrets must never be copied to production.

## Result and Next Dependency

WF-001 is complete. The next ticket is WF-002 Upload and Manage PDFs: controlled private Storage operations, metadata coordination, replacement, deletion rules, and primary-file management.
