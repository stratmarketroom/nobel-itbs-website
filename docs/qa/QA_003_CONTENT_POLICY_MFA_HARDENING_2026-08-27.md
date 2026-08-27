# QA-003-MFA-RLS-001 Editorial Content Policy MFA Hardening

Date: 2026-08-27
Status: complete locally and in hosted Development; Production untouched

## Summary

The 45 editorial `INSERT`, `UPDATE`, and `DELETE` RLS policies across 15
programme, partner, expert, and content tables now enforce both the existing
editorial role boundary and `internal.is_mfa_requirement_satisfied()`.

The correction preserves the v2 role contract:

- Owner and Super Admin require AAL2;
- Content Manager remains MFA-optional unless its profile has
  `mfa_required = true`;
- Credential Manager remains excluded from editorial mutations;
- public and authenticated read policies are unchanged.

The forward-only migration applied successfully after both an incremental local
upgrade and a clean rebuild of the complete 62-migration repository chain. A
Development dry-run then listed exactly this migration, it was applied to the
confirmed `nobel-itbs-dev` project, and the post-push dry-run reported full
parity.

## Files Changed

- `supabase/migrations/20260827100000_qa_003_content_policy_mfa_hardening.sql`;
- `supabase/tests/database/qa_003_content_policy_mfa_hardening.test.sql`;
- `scripts/verify-qa-003-content-policy-mfa.mjs`;
- `supabase/tests/database/qa_001_rls_matrix.test.sql` — deterministic catalog
  ordering across local and hosted PostgreSQL collations;
- `package.json`;
- directly related QA, planning, and implementation-status documentation.

## Database Objects Changed

No table, column, function, trigger, type, grant, Storage policy, or application
row was added or changed. One forward-only migration alters 45 existing RLS
policies:

- 15 `*_content_insert` policies: MFA added to `WITH CHECK`;
- 15 `*_content_update` policies: MFA added to both `USING` and `WITH CHECK`;
- 15 `*_content_delete` policies: MFA added to `USING`.

The migration is applied locally and in hosted Development as migration 62.
Production remains at 60 migrations.

## Tests / Verification

Passed locally after a clean `supabase db reset`:

- focused hardening pgTAP: 10/10;
- aggregate QA-003: 31/31;
- aggregate QA-001: 42/42;
- PDFGEN-001/002/003/005/006/007/008: 203/203;
- combined database regression: 286/286 across 10 files;
- `npm run verify:qa-003:content-policy-mfa`;
- `npm run verify:qa-003`;
- `node --check scripts/verify-qa-003-content-policy-mfa.mjs`;
- `npm run lint`;
- `git diff --check`.

Passed against hosted Development:

- pre-push dry-run listed only migration `20260827100000`;
- focused hardening pgTAP: 10/10;
- aggregate QA-003: 31/31;
- aggregate QA-001: 42/42;
- combined hosted policy/RLS gate: 83/83;
- post-push dry-run: remote database is up to date.

## Security Notes

- RLS now provides the intended database-level MFA layer behind existing server
  route guards.
- The shared helper resolves `auth.uid()` against an active database profile;
  it does not trust client-submitted role or MFA flags.
- The change does not grant a new role, broaden table privileges, expose service
  role credentials, or change public-read behavior.
- Hosted Development changed only the 45 policy definitions and migration
  ledger entry. No Auth user, MFA factor, content row, credential, private PDF,
  number reservation, activation, or email was changed.

## Deviations / Open Questions

- The stored Supabase CLI access token was expired, so the confirmed Development
  pooler metadata and ignored Development database password were used directly;
  no secret value was printed or persisted.
- Hosted `db lint --level error` reported two pre-existing issues outside this
  policy ticket. The composite-to-UUID assignment in
  `public.begin_single_credential_generation` is corrected locally and in
  hosted Development by separate migration 63. The `public.import_learners`
  temporary-table finding and its same-transaction runtime defect are corrected
  by separate migration 64. This policy migration creates or modifies neither
  function.

## Next Dependency

Hosted lint is clean after the separately scoped migrations 63 and 64.
Production promotion of migrations 61–64 requires separate explicit
authorization; PDFGEN cohort mutation acceptance remains a separate
Owner-approved dependency.
