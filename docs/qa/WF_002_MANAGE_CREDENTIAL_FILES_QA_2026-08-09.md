# WF-002 Upload and Manage Credential PDFs QA — 2026-08-09

## Summary

WF-002 is implemented and accepted in the linked Supabase dev project. It provides actor-scoped admin routes and controlled database functions for listing, uploading, replacing, editing, downloading, and deleting current private credential PDFs while preserving the CRD-005 no-version model.

## API and Database Objects

- Migration: `supabase/migrations/20260809110000_wf_002_manage_credential_files.sql`.
- Database test: `supabase/tests/database/wf_002_manage_credential_files.test.sql`.
- Static verifier: `scripts/verify-wf-002.mjs` and `npm run verify:wf-002`.
- Routes:
  - `GET|POST /api/v1/admin/credentials/{id}/files`;
  - `GET|PUT|PATCH|DELETE /api/v1/admin/credentials/{id}/files/{fileId}`.
- Controlled functions:
  - `public.attach_credential_file(...)`;
  - `public.replace_credential_file(...)`;
  - `public.update_credential_file(...)`;
  - `public.delete_credential_file(...)`.
- Supporting guard/reason helpers and updated History/Audit trigger functions.

## File and Lifecycle Rules

- only `application/pdf` is accepted;
- file size is 1 byte through 20 MB;
- upload body must contain a `%PDF-` header within the first 1024 bytes;
- canonical private path remains `{credentialId}/{fileId}.pdf`;
- at most one primary file exists per credential;
- selecting a new primary clears the previous primary atomically;
- pending credentials allow attach, replace, metadata/primary changes, and deletion;
- valid credentials allow attach, replace, and metadata/primary changes only with a mandatory reason;
- a valid credential cannot lose its only primary PDF;
- valid files cannot be deleted;
- revoked and voided credential files cannot be mutated;
- replacement uses the same object and metadata identity and creates no stored old version;
- replacement does not trigger automatic resend.

## Storage Coordination and Privacy

- browser JWTs still receive no `storage.objects` policy for `private-credentials`;
- every route first validates the active actor role and MFA through the request JWT;
- service role is used only server-side for physical private Storage operations;
- upload removes the object if metadata attach fails;
- replacement downloads the previous PDF into request memory, overwrites the same object, and restores the prior bytes if metadata update fails;
- deletion downloads the current PDF into request memory, removes it, and restores it if metadata deletion fails;
- in-memory rollback bytes are not persisted as versions;
- admin preview/download uses a 60-second signed URL;
- API responses never expose private Storage paths;
- History/Audit store file IDs, types, size, primary state, operation, and controlled reason, but never PDF content or private path.

## Live Database QA

All 16 rollback-only database checks passed:

- Content Manager denied;
- Credential Manager AAL1 denied;
- Credential Manager AAL2 pending attach/replace/update/delete passed;
- primary switch passed;
- same-size physical replacement was still recorded as `credential_file.replaced`;
- valid replacement without reason denied;
- valid replacement, new current file, and primary switch with reasons passed;
- valid credential cannot lose its primary file;
- valid deletion denied;
- revoked mutation denied;
- controlled reasons appeared in History and Audit;
- private paths/content remained absent from History and Audit;
- direct metadata deletion denied;
- all learner, set, number, credential, file, History, Audit, profile, and role test records rolled back;
- temporary Auth users deleted.

The automatic sequence remained untouched:

```text
last_value = 1
is_called = false
```

## Live Storage QA

All 6 Storage checks passed:

- service-side PDF upload;
- anonymous private download denied;
- short signed URL returned the PDF;
- replacement-in-place returned the new bytes;
- only one current object remained after replacement;
- `text/plain` upload was rejected;
- every temporary Storage object was removed.

## Automated Verification

Passed:

- `npm run verify:wf-002`;
- migration dry-run and application to linked dev;
- live database role/MFA/lifecycle/reason/History/Audit/cleanup checks;
- live private Storage upload/download/signed URL/replacement/MIME/cleanup checks;
- lint, TypeScript, production build, and whitespace checks;
- collection and item route smoke without a bearer session returned `401 Unauthorized` before file access;
- final migration dry-run reported the linked remote dev database up to date at 40 migrations.

The pgTAP specification contains 38 assertions covering controlled functions, grants, security definer/search paths, approved roles, MFA, pending/valid/revoked/voided rules, valid reasons, primary integrity, canonical paths, replacement events, History/Audit privacy, direct-mutation denial, and absence of private browser Storage policies.

## Limitations and Open Questions

- The full pgTAP runner remains unavailable locally because it requires Docker. The SQL test is committed for a compatible runner.
- Physical object and PostgreSQL metadata cannot share one native transaction. WF-002 implements compensating cleanup/restore. Simultaneous replacements of the same file remain an operational race to revisit during final concurrency hardening; routine manager use is serialized by the UI workflow.
- Signed URLs last 60 seconds and are created only after actor/MFA and credential/file ownership checks.
- The credential-detail admin UI is not part of this backend workflow ticket.
- Activation, Gmail delivery, resend, revoke, void, valid public-data editing, and public verification remain out of WF-002.

## Result and Next Dependency

WF-002 is complete. The next ticket is WF-003 Activate and Email: enforce pending plus primary PDF, atomically activate/issue, attempt delivery of all current PDFs, and preserve successful activation when email sending fails.
