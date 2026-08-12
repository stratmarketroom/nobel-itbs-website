# LRN-005 Learner List Import QA Report

Date: 2026-08-12
Scope: controlled spreadsheet import, preview, validation, duplicate protection, atomic persistence, role/MFA enforcement, responsive manager UI, audit privacy, and cleanup

## Summary

LRN-005 is complete and accepted in dev. Authorized managers can download the controlled Excel template, check `.xlsx` or `.csv` learner lists before saving, separate valid and invalid rows, download a CSV error report, and explicitly confirm one atomic import of valid rows only.

Existing learner identities and contacts are never overwritten. Duplicate Latin identity, email, and phone values are detected both inside the uploaded file and against the database. Invalid rows remain unsaved.

## Product Behaviour

- supported formats: `.xlsx` and `.csv`;
- maximum file size: 5 MB;
- maximum data rows: 500;
- controlled downloadable Excel template;
- preview is read-only and shows total, valid, and invalid counts;
- field-level issues are visible before confirmation;
- invalid rows can be downloaded as CSV;
- only previewed valid rows are sent to the atomic import;
- stale or duplicate confirmation is rejected with HTTP `409`;
- existing learner, email, and phone records are never changed by import.

## Security Results

- Content Manager preview: `403`;
- Credential Manager at AAL1 preview: `403`;
- Credential Manager at AAL2 preview/import: allowed;
- Owner and Super Admin are allowed by the same protected actor guard;
- browser and route code do not use the Supabase service role;
- database reads remain actor-scoped and subject to RLS;
- persistence occurs through one security-invoker RPC and one database transaction;
- the audit event stores only `{ "count": 1 }`, without learner PII or uploaded file contents.

## Live Dev Results

- the linked dev migration chain matches local through `20260812110000`;
- controlled XLSX template download and parse-back preview: passed;
- CSV `+420` phone preservation: passed after disabling spreadsheet-style CSV coercion;
- mixed CSV preview: 1 valid and 1 invalid row;
- confirmed import: HTTP `201`, exactly 1 learner;
- repeated stale commit: HTTP `409`;
- post-import duplicate preview: both rows invalid;
- learner identity, primary email, and primary phone persisted exactly once;
- temporary learner and auth-user cleanup: passed.

## Browser Results

The authenticated Credential Manager interface was checked on desktop and at `390 x 844`:

- import workflow opens inline from Learners;
- controlled template and file constraints are visible;
- real CSV preview showed 2 total, 1 valid, and 1 invalid row;
- the invalid email issue appeared in the correction table;
- confirmation remained disabled until explicit consent;
- the browser preview did not persist any learner;
- no horizontal overflow at 390 px;
- learner toolbar, file input, and import actions meet the 44 px mobile target; the native checkbox is paired with a 44 px clickable label.

## Automated Verification

- `npm run verify:lrn-005` passed;
- `QA_BASE_URL=http://localhost:3011 npm run verify:lrn-005:live` passed;
- ESLint passed;
- TypeScript passed;
- production build passed;
- production dependency audit passed with 0 vulnerabilities;
- `git diff --check` passed.

## Database Objects

Migration: `20260812110000_lrn_005_learner_import.sql`

- helper `private.parse_import_boolean(text)`;
- actor-scoped RPC `public.import_learners(jsonb)`;
- execute grant limited to `authenticated`;
- deny-by-default table RLS remains unchanged;
- existing uniqueness and primary-contact constraints remain the final authority.

The immediately preceding approved CNT-003 migration was also pending in dev and was applied first to preserve the migration chain. Production was not modified.

## Result

LRN-005 and Stage 5 Learner Foundation are accepted in dev. Promotion to production must follow the normal reviewed migration and deployment path. The next release dependency should be selected from the remaining Master Checklist priorities rather than expanding LRN-005.
