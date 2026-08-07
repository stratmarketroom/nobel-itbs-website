# LRN-003 Learner Phones QA Report

Date: 2026-08-07
Scope: multiple learner phones, global uniqueness, messenger flags, optional primary phone, grants, RLS, MFA, and cleanup

## Summary

LRN-003 is complete at the database and dev-QA level. The remote dev database now contains private learner phone records linked to Learner Core. A learner may have multiple numbers, every canonical number is globally unique, and at most one number may be primary per learner.

This ticket intentionally does not add learner API routes, admin UI, or credential placeholders. Those remain LRN-004.

## Database and Security

- `phone` stores a canonical international value: `+` followed by 7–15 digits.
- `phone` is globally unique.
- `learner_id` references `public.learners(id)` with cascade cleanup.
- `learner_phones_one_primary_idx` permits at most one primary number per learner.
- Telegram, Viber, and WhatsApp availability is stored separately; a Telegram username is allowed only when Telegram is enabled.
- learner ownership cannot be changed through authenticated column updates.
- RLS is enabled and forced.
- only Owner, Super Admin, and Credential Manager policies exist, all with MFA checks.
- Content Manager and anonymous clients have no learner-phone visibility.

## Live Dev Results

- anonymous read: denied with `42501`;
- Content Manager visible rows: `0`;
- Credential Manager AAL1 visible rows: `0`;
- Credential Manager AAL1 insert: denied with `42501`;
- Credential Manager AAL2 insert: passed;
- duplicate phone on another learner: denied with `23505`;
- second primary phone for one learner: denied with `23505`;
- Telegram, Viber, and WhatsApp flags: stored successfully;
- non-canonical phone format: denied with `23514`;
- Telegram username/flag inconsistency: denied with `23514`;
- primary-phone switch: passed;
- changing `learner_id` through update: denied with `42501`;
- removing a phone entry after AAL2: passed.

All temporary learners, learner phones, profiles, role assignments, MFA factors, and auth users were removed. Cleanup verification returned zero LRN-003 phone rows and zero `qa-lrn003-*` users.

## Automated Verification

- `npm run verify:lrn-003` passed.
- ESLint passed.
- `git diff --check` passed.
- migration dry-run identified only `20260807120000_lrn_003_learner_phones.sql`;
- the migration applied successfully to remote dev.

The pgTAP contract is included at `supabase/tests/database/lrn_003_learner_phones.test.sql`. The full database test runner remains unavailable because the installed Supabase CLI requires Docker.

## Clarification

The v2 specification requires global phone uniqueness but does not prescribe normalization. LRN-003 stores only canonical international values so formatting variants cannot bypass uniqueness. LRN-004 should normalize manager input before saving and display a clear duplicate conflict.

## Result

LRN-003 is accepted in dev. The next dependency is LRN-004 Learner Admin UI.
