# LRN-001 Learner Core QA Report

Date: 2026-08-07
Scope: private learner identity table, grants, RLS, MFA boundaries, soft archive, and migration integrity

## Summary

LRN-001 is complete at the database and dev-QA level. The remote dev database now contains the private `public.learners` table with Latin first/last name, Ukrainian full name, optional internal note, soft-archive timestamp, UUID, and managed timestamps.

The ticket intentionally does not add learner emails, phones, credentials, API routes, or admin UI. Those remain LRN-002, LRN-003, LRN-004, and later credential tickets.

## Database and Security

- RLS is enabled and forced.
- `PUBLIC` and `anon` receive no learner privileges.
- Owner, Super Admin, and Credential Manager are the only application roles named by learner policies.
- Every learner read/insert/update policy also requires the current MFA requirement to be satisfied.
- Content Manager is excluded from all learner policies.
- Authenticated admins receive controlled-column insert/update privileges and cannot supply learner IDs, rewrite creation timestamps, or hard-delete learners.
- `archived_at` is the supported removal mechanism for authenticated admin workflows.
- Learner data has no public route, public policy, or public projection.

## Live Dev Results

The live test used temporary Content Manager and Credential Manager accounts:

- anonymous learner read: denied;
- Content Manager learner rows visible: `0`;
- Credential Manager at AAL1 learner rows visible: `0`;
- Credential Manager at AAL1 insert: denied;
- Credential Manager at AAL2 read: passed;
- Credential Manager at AAL2 insert: passed;
- Credential Manager at AAL2 update: passed;
- Credential Manager hard delete: denied.

All temporary learner rows, role records, profiles, MFA factors, and auth users were removed. Final cleanup verification returned zero `qa-lrn001-*` users and zero LRN-001 fixture learners.

## Automated Verification

- `npm run verify:lrn-001` passed.
- ESLint passed.
- `git diff --check` passed.
- migration dry-run identified only `20260807100000_lrn_001_learner_core.sql`;
- the migration applied successfully to remote dev.

The pgTAP contract test is included at `supabase/tests/database/lrn_001_learner_core.test.sql`. The complete pgTAP runner remains unavailable because the installed Supabase CLI requires Docker, which is not available in this workspace.

## Remediation Note

The migration is additive and currently contains no production learner data. If a defect is found after sharing, correct it with a forward-only follow-up migration; do not rewrite the applied migration. Hard deletion remains reserved for controlled service/maintenance operations, not authenticated admins.

## Result

LRN-001 is accepted in dev. The next dependency is LRN-002 Learner Emails.
