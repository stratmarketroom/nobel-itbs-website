# LRN-002 Learner Emails QA Report

Date: 2026-08-07
Scope: multiple learner emails, global uniqueness, optional primary email, grants, RLS, MFA, and cleanup

## Summary

LRN-002 is complete at the database and dev-QA level. The remote dev database now contains private learner email records linked to Learner Core. A learner may have multiple addresses, while every email is case-insensitively unique across the entire system and at most one address may be primary per learner.

This ticket intentionally does not add learner phones, messenger flags, admin API routes, or UI. Duplicate conflicts are enforced by the database; the later protected learner API/UI will translate the conflict and show the existing learner to an authorized manager.

## Database and Security

- `email` uses `extensions.citext` with a global unique constraint.
- stored email values must be trimmed and non-empty.
- `learner_id` references `public.learners(id)`.
- `learner_emails_one_primary_idx` permits at most one primary address per learner.
- learner ownership cannot be changed through authenticated column updates.
- RLS is enabled and forced.
- only Owner, Super Admin, and Credential Manager policies exist, all with MFA checks.
- Content Manager and anonymous clients have no learner-email visibility.
- authorized managers may add, edit, set primary, and remove email entries after MFA.

## Live Dev Results

- anonymous read: denied;
- Content Manager visible rows: `0`;
- Credential Manager AAL1 visible rows: `0`;
- Credential Manager AAL1 insert: denied;
- Credential Manager AAL2 insert: passed;
- duplicate address with different letter case on another learner: denied with unique conflict;
- second primary address for one learner: denied with unique conflict;
- primary-address switch: passed;
- changing `learner_id` through update: denied;
- removing an email entry after AAL2: passed.

All temporary learners, learner emails, profiles, role assignments, MFA factors, and auth users were removed. Cleanup verification returned zero LRN-002 fixture rows and zero `qa-lrn002-*` users.

## Automated Verification

- `npm run verify:lrn-002` passed.
- ESLint passed.
- `git diff --check` passed.
- migration dry-run identified only `20260807110000_lrn_002_learner_emails.sql`;
- the migration applied successfully to remote dev.

The pgTAP contract is included at `supabase/tests/database/lrn_002_learner_emails.test.sql`. The full database test runner remains unavailable because the installed Supabase CLI requires Docker.

## Remediation Note

The migration is additive. If a defect is found after sharing, correct it with a forward-only follow-up migration. Do not remove or weaken the global email uniqueness or one-primary-per-learner constraints.

## Result

LRN-002 is accepted in dev. The next dependency is LRN-003 Learner Phones.
