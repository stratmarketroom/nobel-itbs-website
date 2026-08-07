# CRD-001 Credential Types QA — 2026-08-07

## Summary

CRD-001 is implemented and accepted in the linked Supabase dev project. The ticket adds the credential/document type reference model only; credential sets, document-number reservation, credentials, files, and workflows remain outside this ticket.

## Files and Database Objects

- Migration: `supabase/migrations/20260807130000_crd_001_credential_types.sql`.
- Database test: `supabase/tests/database/crd_001_credential_types.test.sql`.
- Static verifier: `scripts/verify-crd-001.mjs` and `npm run verify:crd-001`.
- Tables: `public.credential_types` and `public.credential_type_translations`.
- Supporting objects: language lookup index, `updated_at` triggers, constraints, grants, and forced RLS policies.

Seeded reference values:

| Code | Letter | EN | UA | CZ |
| --- | --- | --- | --- | --- |
| `certificate` | `C` | Certificate | Сертифікат | Certifikát |
| `diploma` | `D` | Diploma | Диплом | Diplom |

## Permission and Security Verification

Live role checks against dev confirmed:

- anonymous access is denied;
- Content Manager receives no credential-type rows;
- Credential Manager at AAL1 receives no rows;
- Credential Manager at AAL2 can read both types and all three translations but cannot mutate them;
- Owner at AAL2 can insert a temporary type and EN/UA/CZ translations, then deactivate it;
- authenticated hard delete is denied;
- invalid machine-code and document-letter formats are rejected;
- all temporary users and records were removed or transactionally rolled back.

Owner/Super Admin mutations remain protected by the existing active-admin and MFA helpers. Credential Manager access is deliberately read-only. No service-role secret is exposed to browser code, and no public/anonymous grant is present.

## Automated Verification

Passed:

- `npm run verify:crd-001`;
- migration dry-run and application to the linked dev project;
- live RLS/MFA and transactional mutation checks;
- lint, TypeScript, production build, and whitespace verification as recorded at ticket closure.

The pgTAP specification contains 38 assertions covering schema, seed data, keys, checks, index, triggers, RLS, policies, grants, and role boundaries.

## Limitation

The full local pgTAP runner was not executed because Supabase CLI database tests require Docker and no compatible runtime is available. The SQL test remains committed for the next compatible database-test environment; this limitation is not treated as a hidden pass.

## Deviations and Open Questions

- No `translation_status` was added because v2 defines these as localized reference labels rather than independently published editorial content.
- `document_letter` is format-constrained but intentionally not unique; v2 does not require uniqueness and future credential subtypes may share a document letter.
- No admin UI or API was added in CRD-001. Those are not required by this database-foundation ticket.
- No external provider, email, Telegram, or CAPTCHA configuration is required.

## Result and Next Dependency

CRD-001 is complete. The next ticket is CRD-002 Credential Sets, which depends on these stable credential-type identifiers and localized labels.
