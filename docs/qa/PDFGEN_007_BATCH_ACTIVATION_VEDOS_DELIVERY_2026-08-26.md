# PDFGEN-007 Batch Activation and VEDOS Delivery

Date: 2026-08-26

Status: implemented and locally verified; development migration and environment
acceptance pending explicit publication approval

## Summary

PDFGEN-007 extends the private PDFGEN-006 review boundary with explicit
reviewed-item selection, independent per-credential activation, and delivery of
every current package PDF through the existing VEDOS SMTP transport. Processing
uses bounded, resumable chunks under one idempotent aggregate request. A failed
activation or delivery never rolls back another item, and an email failure never
rolls back a credential that already became valid.

This ticket does not generate new PDFs, choose learners automatically, change
the public verification projection, add a public PDF route, introduce an
external queue, or change the credential lifecycle.

## Implemented Contract

- Only explicitly checked PDFGEN-006 items that remain `reviewed`, whose linked
  credential remains `pending`, and whose private package has one primary PDF
  may enter an activation request.
- One UUID idempotency key is permanently bound to the exact ordered selection.
  Repeating the same request resumes it; reusing the key for another batch or
  selection is rejected.
- The selected cohort has no fixed product-facing maximum. The server processes
  at most the batch's bounded internal chunk size, capped at 250 operations per
  request, and resumes queued work through the same activation request.
- Every activation item has an attempt counter, unique 15-minute lease, and a
  safe retry path. Another worker cannot complete or finalize delivery for an
  active lease.
- The existing WF-003 activation transaction remains the only operation that
  changes a credential from `pending` to `valid` and creates its immutable email
  history entry.
- The created email history row is bound to the leased activation item before
  SMTP delivery. A resumed valid credential reuses that same delivery record
  rather than invoking activation again.
- The existing server-only delivery bridge loads all current files from the
  private credential bucket and submits them together in one VEDOS message.
- Empty recipient, VEDOS failure, or missing VEDOS configuration produces an
  `activated_not_sent` outcome while the credential remains valid. A database
  finalization interruption produces `delivery_retryable`; an activation error
  while the credential remains pending produces `activation_failed` and returns
  that item to explicit review.
- Aggregate and per-item outcomes clearly separate activated/sent,
  activated/not-sent, activation failed, and valid-with-delivery-retry states.
- The protected admin UI shows exact eligibility, requires an explicit
  checkbox selection and irreversible confirmation, reports independent
  outcomes, and provides only per-item retry actions.

## API and Database Objects

Protected routes:

- `POST /api/v1/admin/credential-generation-batches/{id}/activate`;
- `POST /api/v1/admin/credential-generation-batches/{id}/activation-requests/{activationRequestId}/process`;
- `POST /api/v1/admin/credential-generation-batches/{id}/activation-items/{activationItemId}/retry`.

Forward-only migration
`20260826140000_pdfgen_007_batch_activation_delivery.sql` adds:

- private `credential_generation_batch_activation_requests` and
  `credential_generation_batch_activation_items` ledgers;
- private request/item outcome enums that do not alter `credential_status`;
- exact-selection preparation, bounded claim, delivery-record binding,
  activation completion/failure, lease-bound email finalization, retry, and
  aggregate state refresh functions;
- forced RLS and read-only Owner/Super Admin/Credential Manager + MFA policies;
- request and per-credential result audit events containing only bounded IDs,
  counts, statuses, attempts, and safe error codes.

Authenticated browser code has no direct DML on either ledger and no direct
Storage access. Private PDF download and VEDOS credentials remain server-only.

## Tests / Verification

Passed locally during implementation:

- `npx tsc --noEmit`;
- `npm run verify:wf-003` regression;
- `npm run verify:wf-004` regression;
- `npm run verify:pdfgen-005` regression;
- `npm run verify:pdfgen-006` regression;
- `npm run verify:pdfgen-007`;
- `npm run lint -- --max-warnings=0`;
- `npm run build`;
- `git diff --check`;
- `npx supabase db push --dry-run --linked` connected to development and
  reported exactly one pending migration,
  `20260826140000_pdfgen_007_batch_activation_delivery.sql`, without applying
  it.

No credential was activated, no permanent number was consumed, no PDF was
generated, and no email was sent during local QA. Focused authenticated browser
acceptance remains pending because the development migration is intentionally
not applied before publication approval and the environment has no approved
generated/reviewed non-production cohort.

A focused 30-assertion pgTAP suite is committed at
`supabase/tests/database/pdfgen_007_batch_activation_delivery.test.sql`. It
covers the private ledgers, forced RLS, role/MFA guard, grants, unchanged
credential lifecycle, sensitive-data exclusion, exact idempotency, explicit
review/pending/primary validation, bounded leases, linked delivery history,
independent outcomes, safe failure, audit, no hard delete, and no browser
Storage policy. It has not run because Docker or another compatible local
PostgreSQL/pgTAP runner is unavailable.

## Security Notes

- All reads and mutations require the existing active Owner, Super Admin, or
  Credential Manager role and MFA/AAL2 boundary.
- Service-role credentials, SMTP credentials, recipient contact data, email
  content, raw verification tokens, hashes/ciphertext, keys, private paths, and
  PDF bytes are not returned in the batch API or written to its audit metadata.
- Delivery finalization is tied to the same non-expired activation-item lease
  that bound the immutable email-send entry.
- Credential numbers are never released or reused, and this workflow contains
  no hard-delete path.
- Generated files stay private and public verification behavior remains
  unchanged.

## Deviations / Open Questions

- Full pgTAP execution remains pending because Docker or another compatible
  PostgreSQL/pgTAP runner is unavailable.
- Development migration application and authenticated environment acceptance
  are not part of the current un-published local state.
- Full mutation acceptance requires an explicitly approved non-production
  cohort that has completed PDFGEN-006 generation and private review. Until
  then, environment acceptance must remain read-only and must not activate a
  real credential or send a real message.
- SMTP cannot provide transactional exactly-once delivery across a process
  crash after provider acceptance. The database guarantees idempotent
  activation and a single immutable delivery record; operational delivery is
  resumable and may be at-least-once only in that narrow provider-acknowledged,
  unrecorded crash window.

## Next Dependency

After explicit publication approval, apply the migration in development and
perform read-only environment acceptance. Mutation acceptance remains gated on
an approved non-production cohort. `PDFGEN-008 Generation Security and
End-to-End Acceptance` is the next implementation ticket after PDFGEN-007 is
merged and accepted at the available environment level.
