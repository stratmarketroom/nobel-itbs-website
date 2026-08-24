# WF-004 Resend Credential QA

Date: 2026-08-24
Branch: `codex/wf-004-resend-credential`

## Summary

WF-004 is implemented at the code and dev-database QA level. An Owner, Super Admin, or Credential Manager with MFA can resend every current private PDF of a `valid` credential to an editable recipient using an editable rendered EN/UA subject and body. Every request first creates a permanent private delivery-history row. Provider or finalization failure does not change credential status or the permanent document-number ledger.

The migration compiled and was applied to `nobel-itbs-dev` through the authenticated Supabase SQL Editor because this worktree has no Supabase CLI access token. Version `20260824130000` is present in the dev migration ledger. Production was not changed. No real resend was attempted because the retained dev credential is revoked and Production has no approved valid credential suitable for this action.

## Files Changed

- `supabase/migrations/20260824130000_wf_004_resend_credential.sql`
- `supabase/tests/database/wf_004_resend_credential.test.sql`
- `scripts/verify-wf-004.mjs`
- `lib/credentials/resend.ts`
- `lib/credentials/resend-input.ts`
- `lib/credentials/resend-types.ts`
- `lib/credentials/workspace.ts`
- `lib/credentials/workspace-types.ts`
- `app/api/v1/admin/credentials/[id]/resend/route.ts`
- `components/admin-credentials.tsx`
- `app/globals.css`
- aggregate QA matrices, historical verifier compatibility, package script, and active status documentation.

## Database Objects

Added controlled function:

- `public.resend_credential(uuid, text, text, text, jsonb)`.

The function:

- is `security definer` with a fixed search path;
- requires Owner, Super Admin, or Credential Manager plus MFA;
- accepts only a `valid` credential;
- locks the credential while validating the current file manifest;
- requires every current credential file exactly once;
- allows only the approved safe manifest fields and rejects Storage paths, buckets, bytes, content, and arbitrary extra fields;
- creates `pending` or `skipped_empty_recipient` delivery history before external SMTP work;
- records privacy-minimal History and Audit events;
- does not update `credentials` or `document_number_log`;
- reuses the existing actor-owned `complete_credential_email_send` finalizer and immutable delivery-history trigger.

No table, enum, bucket, Storage policy, or public verification object changed.

## API and Admin Behaviour

- New protected endpoint: `POST /api/v1/admin/credentials/{id}/resend`.
- Exact request keys: `recipientEmail`, `emailSubject`, and `emailBody`.
- Recipient may be changed or left empty; subject and body are editable for the attempt.
- The server downloads canonical objects from `private-credentials/{credentialId}/{fileId}.pdf` only after authorization and the database queue record succeed.
- All files are submitted together through the existing server-only VEDOS SMTP adapter.
- The resend control appears only for `valid` credentials and is blocked when there are no current files.
- Delivery outcomes are shown without implying that mail-server acceptance guarantees final inbox delivery.

## Tests and Verification

Passed locally:

- all 69 non-live `scripts/verify-*.mjs` verifiers;
- `npm run verify:wf-004`;
- WF-003, WF-005, ADM-CRD-001, QA-001, QA-003, and VEDOS SMTP regression verifiers;
- `npm run lint`;
- `npx tsc --noEmit`;
- `npm run build`;
- `git diff --check`.

Passed against `nobel-itbs-dev`:

- migration execution returned success;
- migration ledger contains `20260824130000 / wf_004_resend_credential`;
- `public.resend_credential(uuid,text,text,text,jsonb)` is `security definer` with `search_path=public, internal, pg_temp`;
- anonymous execution is false and authenticated execution is true;
- the installed function contains the valid-only guard and no `update public.credentials` statement.

Passed in PR #22 Preview:

- Vercel deployment/check completed successfully;
- `/admin/credentials` rendered the protected signed-out state and exposed no credential data;
- the authenticated valid-record UI and application-level endpoint mutation were not exercised because Preview has no active Nobel ITBS admin session or approved valid credential.

The focused pgTAP file has 24 planned assertions covering function security, grants, MFA, valid-only behavior, custom recipient validation, complete current-file binding, manifest privacy, empty-recipient history, Audit/History, lifecycle/number immutability, and the existing permanence/finalization controls.

The focused pgTAP file was attempted in the dev SQL Editor with an explicit `public, extensions` search path, but dev does not expose the pgTAP `plan(integer)` function. The transaction did not proceed past planning. A Docker-compatible local runner is also unavailable, so the full pgTAP suite remains pending rather than recorded as passed.

## Security Notes

- Service-role access remains in server-only code and is used only to read canonical private PDF objects.
- Browser code receives neither Storage paths nor PDF bytes.
- Recipient, subject, body, and safe file manifest are stored only in the private immutable delivery table as required; Audit and credential History contain only send ID, status, and file count.
- No credential content, recipient, token, provider response, or technical failure is logged.
- An SMTP/storage failure is finalized as a private delivery outcome and never changes the `valid` credential.
- A finalization failure leaves the send row `pending`; UI copy tells the manager to inspect delivery history before retrying.

## Deviations and Open Questions

- The existing EN template is used for Czech credentials, matching WF-003 and the approved EN/UA Release 1 email-template scope.
- There is no automatic resend when a valid PDF is replaced; resend remains an explicit manager action.
- Email-template editing UI/API, bounce processing, public PDFs, and credential lifecycle expansion remain outside WF-004.
- Real acceptance needs one explicitly approved valid credential and recipient; no permanent registry data was created solely for this test.

## Rollback / Remediation

The migration is forward-only and has been shared with dev, so it must not be deleted or rewritten after merge. It only adds/replaces one otherwise-unused controlled function. If a defect is found before Production, add a later corrective migration that `create or replace`s or revokes `public.resend_credential`; do not mutate credential, delivery-history, or document-number data to simulate rollback.

## Next Dependency

Review the ready PR #22, then verify the authenticated valid-only UI and non-valid rejection using an approved admin session/record. Run one real VEDOS resend only when the Owner approves an existing valid credential and recipient. Production migration and application deployment follow successful authenticated Preview/dev acceptance.
