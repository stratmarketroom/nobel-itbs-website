# CRD-003 Document Number Log QA — 2026-08-08

## Summary

CRD-003 is implemented and accepted in the linked Supabase dev project. It introduces the permanent registry and one shared sequence for all Nobel ITBS credential types and years. The sequence starts at `000001`, never cycles, never resets annually, and consumed values are not returned even when a transaction fails or a number is voided.

## Files and Database Objects

- Migration: `supabase/migrations/20260808100000_crd_003_document_number_log.sql`.
- Database test: `supabase/tests/database/crd_003_document_number_log.test.sql`.
- Static verifier: `scripts/verify-crd-003.mjs` and `npm run verify:crd-003`.
- Enum: `public.document_number_status` with only `reserved`, `issued`, and `voided`.
- Sequence: `public.document_number_shared_seq`, start `1`, maximum `999999`, `NO CYCLE`.
- Table: `public.document_number_log`.
- Controlled functions:
  - `public.reserve_document_number(uuid, date)`;
  - `public.reserve_manual_document_number(uuid, date, text, text)`;
  - `public.void_reserved_document_number(uuid, text)`.
- Supporting objects: uniqueness/check constraints, listing indexes, immutable/no-delete trigger, `updated_at` trigger, audit writes, grants, and forced RLS.

Generated format:

- Certificate: `NITBS-C-YYYY-000001`;
- Diploma: `NITBS-D-YYYY-000002`;
- the numeric component is shared across every type and year.

## Permission and Security Verification

Live dev checks confirmed:

- anonymous direct read fails with PostgreSQL `42501`;
- Content Manager at AAL2 receives zero rows;
- Credential Manager at AAL1 receives zero rows;
- Credential Manager at AAL2 can read the private log but manual override fails with `42501`;
- Owner at AAL2 can use the rare manual reservation path with a mandatory reason;
- the same formatted number or shared numeric value cannot be reserved again;
- controlled voiding requires a reason and permanently preserves the row/value;
- reservation and voiding produced two append-only audit events;
- authenticated direct insert, update, delete, and sequence usage are absent;
- direct row deletion is denied and also protected by a permanence trigger;
- temporary Auth users were deleted and all manual-flow records/audit entries were transactionally rolled back.

The automatic sequence was deliberately not called during live QA because PostgreSQL sequence increments do not roll back. Its state was verified before and after QA as:

```text
last_value = 1
is_called = false
```

Therefore the first real automatic reservation will receive `000001`.

## Automated Verification

Passed:

- `npm run verify:crd-003`;
- migration dry-run and application to the linked dev project;
- live role/MFA, manual reservation, duplicate denial, void, audit, permanence, and sequence-state checks;
- lint, TypeScript, production build, and whitespace verification as recorded at ticket closure.

The pgTAP specification contains 46 assertions covering enum values, sequence limits/non-cycling, schema, uniqueness, constraints, indexes, triggers, controlled functions, RLS, grants, MFA, and role boundaries.

## Limitation

The full local pgTAP runner was not executed because Supabase CLI database tests require Docker and no compatible runtime is available. The SQL test remains committed for a compatible database-test environment.

## Deviations and Open Questions

- The current Master Checklist orders CRD-003 before CRD-004, while the older SQL Migration Plan lists credentials before the number log. The approved ticket order is followed.
- `credential_id` is present and nullable, but its foreign key cannot exist until CRD-004 creates `public.credentials`. CRD-004 must add that FK and the controlled `reserved → issued` transition atomically.
- `sequence_value` and `is_manual` are internal integrity metadata added to enforce the shared sequence across automated and manual reservations. They do not alter the public document-number format.
- Manual reservation is restricted to Owner/Super Admin, must match the selected type/year, and requires an audited reason.
- The maximum is intentionally `999999` to preserve the approved six-digit format; exhaustion fails safely rather than generating a malformed number.
- No external provider, email, Telegram, or CAPTCHA configuration is required.

## Result and Next Dependency

CRD-003 is complete. The next ticket is CRD-004 Credentials. It will create pending credential identities, add the log-to-credential foreign key, and connect reservation to the credential lifecycle without exposing pending records publicly.
