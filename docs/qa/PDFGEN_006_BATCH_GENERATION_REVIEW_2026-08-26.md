# PDFGEN-006 Batch Generation and Review

Date: 2026-08-26

Status: implementation complete in dev; migration and environment acceptance pending

## Summary

PDFGEN-006 extends the accepted single-credential renderer into one protected,
aggregate cohort workflow. An authorized Owner, Super Admin, or Credential
Manager with MFA may explicitly select the complete cohort, preview archived
learners and exact-context credential conflicts, confirm once, generate every
accepted pending credential in automatic bounded chunks, retry a failed item
without changing its permanent number, privately inspect every generated PDF,
and mark the complete package reviewed.

This ticket does not activate credentials, send email, publish PDFs, or add an
external queue provider. Explicit reviewed-item activation and VEDOS delivery
remain assigned to PDFGEN-007.

## Implemented Contract

- The admin workflow has no product-facing cohort cap. The request accepts the
  entire explicit UUID selection, including cohorts larger than 500; an
  internal five-item chunk controls one serverless processing request.
- One shared context fixes the published Template Package version, programme,
  optional run, credential type, language, issue date, completion date, and
  ordered learner selection.
- Read-only preview classifies every selected learner as accepted, archived, or
  conflicting. A non-voided credential for the exact learner/programme/run/
  completion/type/language context is a conflict and is never silently
  duplicated.
- Confirmation rejects archived learners and repeats all preview validation in
  the database transaction. The idempotency key is bound to the exact immutable
  context and ordered cohort.
- Each accepted item independently creates one pending credential, permanent
  document number, protected verification token, and complete multi-document
  PDF package. Token generation, decryption, rendering, and Storage access stay
  server-only.
- Each item has a bounded 15-minute lease and attempt counter. Processing can
  resume from queued items after interruption; a competing or stale worker
  cannot complete another item's lease.
- Failure removes only uncommitted private Storage objects, records a bounded
  safe error code, and leaves the item retryable. If the pending credential and
  number were already reserved, the immutable item link preserves them for the
  next attempt.
- One failed item does not roll back or delete successful items. Retry is an
  explicit per-item action so persistent errors cannot create an automatic
  retry loop.
- Atomic completion attaches exactly one primary PDF plus every configured
  additional document and appends batch-linked generation provenance.
- The aggregate review shows learner, permanent number, immutable template
  version, item state, validation error code, attempt, file/page count, primary
  file, and 60-second private preview actions.
- Marking an item reviewed repeats pending-status, file-count, provenance, and
  exactly-one-primary validation in the database. The UI reports future
  activation eligibility but exposes no activation action.

## API and Database Objects

Protected routes:

- `GET /api/v1/admin/credential-generation-batches`;
- `POST /api/v1/admin/credential-generation-batches/preview`;
- `POST /api/v1/admin/credential-generation-batches/confirm`;
- `GET /api/v1/admin/credential-generation-batches/{id}`;
- `POST /api/v1/admin/credential-generation-batches/{id}/process`;
- `POST /api/v1/admin/credential-generation-batches/{id}/items/{itemId}/retry`;
- `POST /api/v1/admin/credential-generation-batches/{id}/items/{itemId}/review`.

Migration `20260826120000_pdfgen_006_batch_generation.sql` adds controlled
functions over the forced-RLS batch foundation:

- `internal.assert_batch_generation_actor()`;
- `public.preview_credential_generation_batch(...)`;
- `public.confirm_credential_generation_batch(...)`;
- `public.begin_credential_generation_batch_item(...)`;
- `public.prepare_credential_generation_batch_item(...)`;
- `public.refresh_credential_generation_batch_item(...)`;
- `public.complete_credential_generation_batch_item(...)`;
- `public.fail_credential_generation_batch_item(...)`;
- `public.queue_credential_generation_batch_item(...)`;
- `public.review_credential_generation_batch_item(...)`.

The migration adds no new table, Storage policy, public route, external queue,
credential lifecycle status, or hard-delete path. Authenticated clients retain
read-only RLS access to batch state and no direct DML on batches, items, or
generation provenance.

## Tests / Verification

Passed locally:

- `npx tsc --noEmit`;
- `npm run lint -- --max-warnings=0`;
- `npm run build`;
- `git diff --check`;
- authenticated Owner/AAL2 local browser QA at the existing protected
  `/admin/credentials` workspace;
- desktop visual review of the batch list, context form, full-cohort selector,
  and disabled confirmation boundary;
- 390-pixel responsive review of the same workflow;
- zero application console warnings or errors while opening the batch tab,
  creating an unsaved form, selecting one published package, and selecting one
  learner.

The local QA did not submit Preview or Confirmation because the new migration
has not yet been applied to the connected development database. No credential,
number, token, PDF, batch, or Storage object was created.

A focused 27-assertion pgTAP suite is committed at
`supabase/tests/database/pdfgen_006_batch_generation.test.sql`. It covers the
guarded function surface, anonymous denial, retained no-DML/no-Storage-policy
boundary, unchanged credential lifecycle, no sensitive batch columns, no fixed
500-person cap, archived/conflict validation, exact idempotency, atomic
credential linkage, batch provenance, retry preservation, complete-package
review, no hard delete, and no activation. It has not run because Docker or
another compatible local PostgreSQL/pgTAP runner is unavailable.

## Security Notes

- All batch mutations require the existing active role and MFA/AAL2 boundary.
- Raw verification tokens, lookup hashes/ciphertext, keys, PDF bytes, private
  paths, contacts, and learner identities are absent from browser responses and
  audit metadata.
- Server-only code creates token material and uses the service-role client only
  for private template/output Storage operations and protected render data.
- Conflict preview exposes learner identity only inside the already protected
  admin workspace.
- Batch/item audit events contain bounded identifiers, attempt/count metadata,
  and safe error codes; credential History records generation provenance but no
  token or Storage material.
- Permanent numbers are never reused. Failure after reservation preserves the
  same pending credential; the workflow never hard-deletes a credential or
  number log.
- Generated PDFs remain private and continue to use the existing short-lived,
  MFA-protected preview route.

## Deviations / Open Questions

- Database syntax/behaviour and pgTAP acceptance remain pending until the
  forward migration is applied in the development environment. Production has
  not been changed.
- Full mutation acceptance needs an explicitly approved non-production cohort
  because confirmation/generation consumes real permanent numbers even when a
  later PDF attempt fails.
- The stale `.agents/context/PRODUCT.md` statement that automatic PDF
  generation is out of scope still conflicts with the approved v2 generation
  specification dated 2026-08-25. Per `AGENTS.md`, the v2 specification was
  used; the context file was not changed in this ticket.

## Next Dependency

After dev migration and read-only/mutation acceptance, PDFGEN-007 may add
explicit reviewed-item batch activation and independent VEDOS delivery. It
must reuse the `reviewed` item boundary and must not merge activation into the
PDFGEN-006 processing loop.
