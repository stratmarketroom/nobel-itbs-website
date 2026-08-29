# PDFGEN-008 QA Cohort Activation Guard

Date: 2026-08-29
Status: accepted in hosted Development; Production untouched

## Summary

The approved synthetic PDFGEN-008 cohorts A, B, and C may still be opened and
reviewed, but must never be activated or emailed. This change turns that
operational rule into a permanent database invariant and presents the state in
the private batch workspace.

The three known synthetic learner markers automatically lock any containing
generation batch. Existing matching batches are backfilled when the migration
is applied. Once set, the lock and its `synthetic_qa` reason cannot be removed
or rewritten.

Review and activation remain separate actions. Any currently available
authorized Owner, Super Admin, or Credential Manager satisfying MFA may perform
either action for a real batch. The reviewer and activation requester are
recorded separately; they are not required to be the same person.

## Files Changed

- `supabase/migrations/20260829120000_pdfgen_008_qa_cohort_activation_guard.sql`;
- `supabase/tests/database/pdfgen_008_qa_cohort_activation_guard.test.sql`;
- `lib/credentials/batch-generation.ts`;
- `lib/credentials/batch-generation-types.ts`;
- `components/admin-credential-batches.tsx`;
- `scripts/verify-pdfgen-008-qa-cohort-guard-001.mjs`;
- `package.json`;
- directly related PDFGEN-008 QA and implementation-status documentation.

## Database Objects Changed

- adds `credential_generation_batches.activation_blocked boolean not null
  default false`;
- adds `credential_generation_batches.activation_block_reason text null` and a
  consistency constraint allowing only the paired `synthetic_qa` state;
- replaces `internal.enforce_generation_batch_identity()` so an established
  activation block is irreversible;
- replaces `internal.audit_credential_generation_batch_change()` to record a
  privacy-minimal `credential_generation.batch_activation_blocked` event;
- adds `internal.mark_synthetic_qa_generation_batch()` and an item-insert
  trigger that locks a batch containing one of the three approved PDFGEN-008
  synthetic cohort markers;
- backfills existing matching batches A, B, and C;
- adds `internal.block_synthetic_qa_activation_or_delivery()` at four database
  boundaries: activation-request insert, activation-item processing claim,
  credential transition to `valid`, and credential-email-send insert.

No credential, number, file, provenance, batch item, or learner row is deleted
or rewritten by this ticket.

## Tests / Verification

Passed locally:

- focused static QA cohort guard verifier;
- focused PostgreSQL/pgTAP suite: 27/27 assertions;
- reviewer/activator policy checks: separate attribution, shared
  Owner/Super Admin/Credential Manager MFA gate, and no identity-equality rule;
- existing PDFGEN-006, PDFGEN-006-REVIEW-UX-001, PDFGEN-007, and PDFGEN-008
  static regression verifiers;
- ESLint with zero warnings;
- TypeScript `--noEmit`;
- optimized Next.js production build with 51 pages;
- `git diff --check`.

The forward-only migration applied successfully to the existing local Supabase
database. Supabase CLI's wrapper could not launch its separate Docker test
runner in this shell because the Docker executable was not on its inherited
`PATH`; the same focused SQL file was therefore executed directly with `psql`
inside the healthy local Supabase PostgreSQL container and passed 27/27. This is
a local runner limitation, not a database-test failure.

Passed in hosted Development (`flswzhgjbpagohbwehcz`):

- the pre-apply dry run listed only
  `20260829120000_pdfgen_008_qa_cohort_activation_guard.sql`;
- the migration applied successfully and the second dry run reported the remote
  database up to date, giving repository/Development parity at 66 migrations;
- read-only audit confirmed the 200, 540, and 1000 batches are all permanently
  locked with reason `synthetic_qa`;
- cohort state remains 1,740 `pending`, zero `valid`, zero activation requests,
  zero activation items, and zero cohort email-send rows;
- three privacy-minimal `credential_generation.batch_activation_blocked` audit
  events exist, one for each batch;
- a transaction-scoped negative database test passed 4/4: activation-request
  insert, activation-item processing, `pending -> valid`, and email-send insert
  were each rejected, followed by `ROLLBACK`;
- Vercel Preview for implementation commit `cdbb779` completed successfully;
- authenticated Owner/AAL2 browser acceptance showed `QA locked` on all three
  batches, the permanent warning and review controls in each batch detail, no
  activation controls, and no browser console warnings or errors.

## Security Notes

- enforcement is database-side and does not rely on a disabled button;
- activation is stopped before request creation and again before processing;
- the credential lifecycle itself rejects `pending -> valid` for locked batches;
- email-ledger insertion is independently rejected for locked batches;
- the lock is permanent, while ordinary real batches retain the explicit
  reviewed-item activation workflow;
- no raw token, private path, PDF bytes, learner identity, contact data, or
  internal learner note is copied into audit metadata or returned by the API;
- browser roles retain no direct batch-state DML and cannot execute the new
  internal trigger functions;
- the hosted Development migration changed only the intended batch lock
  metadata and wrote the three corresponding audit events; credentials,
  numbers, private PDFs, provenance, review state, activation state, and email
  state were not changed;
- Production was not accessed or changed.

## Deviations / Open Questions

- No implementation or acceptance deviation remains for the synthetic-cohort
  guard in hosted Development.
- Review is intentionally not blocked. It remains useful for QA evidence and
  does not activate or email a credential.
- Reviewer/activator identity equality is intentionally not enforced. Staff
  availability must not block issuance; authorization, MFA, and separate audit
  attribution are the controls.

## Next Dependency

The synthetic-cohort guard needs no further Development action. Production
promotion is unnecessary for these Development-only synthetic records unless a
separate ticket establishes a reusable Production policy requirement. The next
operational dependency remains one explicitly approved real complete-package
activation and VEDOS delivery acceptance with an authorized MFA actor.
