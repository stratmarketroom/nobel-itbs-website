# WF-003 Activate and Email QA — 2026-08-09

## Summary

WF-003 is implemented and accepted at the current dev level. A credential manager can review an editable EN/UA delivery message and activate a pending credential only when a primary PDF exists. The database atomically changes the credential to `valid`, marks its permanent document number `issued`, and creates a private delivery-history record before any external provider call. Activation remains successful when the recipient is empty, Google Workspace is not configured, or delivery fails.

Real Google Workspace delivery acceptance is intentionally deferred until the Owner supplies the service-account/domain-delegation credentials and delegated Nobel ITBS sender. No test credential was created and no permanent document number was consumed during this ticket QA.

## Files Changed

- migration and pgTAP contract: `supabase/migrations/20260809120000_wf_003_activate_and_email.sql`, `supabase/tests/database/wf_003_activate_and_email.test.sql`;
- protected route and server workflow: `app/api/v1/admin/credentials/[id]/activate/route.ts`, `lib/credentials/activation.ts`, `lib/credentials/activation-input.ts`, `lib/credentials/activation-types.ts`;
- secure verification-link and mail delivery: `lib/credentials/token.ts`, `lib/email/google-workspace.ts`;
- admin workspace integration: `lib/credentials/workspace.ts`, `lib/credentials/workspace-types.ts`, `app/api/v1/admin/credentials/[id]/route.ts`, `components/admin-credentials.tsx`, `app/globals.css`;
- configuration and verification: `.env.example`, `scripts/verify-wf-003.mjs`, `package.json`.

## Database Objects Changed

- enum `public.credential_email_send_status` with `pending`, `sent`, `failed`, `skipped_empty_recipient`, and `not_configured`;
- private `public.email_templates` with seeded `credential_delivery` templates for English and Ukrainian;
- private `public.credential_email_sends` with actual recipient, subject/body, terminal outcome, technical error, actor, timestamp, and a safe manifest of all current files;
- controlled `public.activate_credential(...)` and `public.complete_credential_email_send(...)` security-definer functions;
- forced RLS, role/MFA read policies, deny-direct-mutation grants, immutable-content enforcement, History events, and Audit events.

The migration is additive. It does not expose private Storage, add public PDF access, introduce another credential status, or change the no-reuse number model.

## Implemented Behaviour

- activation is available only for `pending` credentials and requires Owner, Super Admin, or Credential Manager with MFA;
- a primary PDF and a manifest matching every current credential file are required;
- number issuance, `valid` status, activation timestamp, and the initial send-history row are one database transaction;
- empty recipient creates `skipped_empty_recipient` and does not call Google Workspace;
- configured delivery attaches every current private PDF as MIME attachments;
- missing configuration records `not_configured`; provider/Storage failure records `failed`;
- a failed attempt to finalize the provider result leaves the credential valid and reports `pending` with an explicit “do not activate again” warning;
- the draft uses the Ukrainian template only for a Ukrainian credential; English is the approved fallback for English and Czech;
- the recipient defaults from the learner primary email and subject/body remain editable for the actual attempt;
- the private admin detail shows delivery status, actual message, error, and safe file manifest.

## Security Notes

- browser code never receives the service-role key, private Storage path, PDF bytes, token hash, or standalone raw verification token;
- AES-256-GCM token decryption is server-only, version-checked, and used only to render the protected email draft;
- actor authorization is established before server-only Storage access;
- external Google calls happen only after the activation transaction commits;
- direct authenticated insert/update/delete on delivery tables is denied;
- delivery content is immutable, with one controlled `pending` to terminal transition;
- History/Audit contain outcome metadata and file counts only, not recipient/message text, private paths, PDF content, or token material.

## Verification

Passed:

- `npm run verify:wf-003`;
- `npm run verify:adm-crd-001` regression;
- `npm run verify:pce-004` Google Workspace adapter regression;
- all 51 repository ticket-verifier scripts;
- `npx tsc --noEmit`;
- `npm run lint`;
- `npm run build`;
- Supabase migration dry-run, migration push, and 41/41 local/remote history comparison;
- authenticated Owner/AAL2 browser smoke on `/admin/credentials` after migration: protected navigation, zero-alert load, empty real registries, guarded pending form, and no database mutation;
- unauthenticated activation endpoint smoke: `401 Bearer session is required`.

The isolated 40-assertion pgTAP file is committed. Supabase CLI could not execute it because this machine has no Docker Desktop, even with `--linked`; this is the same documented infrastructure limitation as the full pgTAP suite.

## QA-004 Follow-up — 2026-08-10

The first real retained credential exposed a defect in the original manifest guard: its broad `bytes` text match also rejected the approved `size_bytes` metadata key. Migration `20260810181500_qa_004_fix_activation_manifest_keys.sql` now checks forbidden manifest keys exactly, preserving the Storage/privacy boundary while allowing `size_bytes`. Focused verification, migration parity/push, real activation, number issuance, and valid public verification passed. See `docs/qa/QA_002_004_FIRST_CREDENTIAL_LIFECYCLE_2026-08-10.md`.

## Deviations and Open Questions

- No real activation was performed because the dev registry has no approved learner credential with an approved primary PDF, and a test activation would consume a permanent document number. The later end-to-end credential flow will exercise the mutation with real approved data.
- No real email was sent because Google Workspace credentials are intentionally not connected yet. This is an operational acceptance dependency, not a code blocker.
- Email-template editing UI/API remains a separate admin capability; WF-003 seeds and reads the approved templates.
- Resend, revoke, void, valid-public-data update, and public verification are outside this ticket.

## Post-ticket Scheduling Decision

On 2026-08-10 the Owner deferred `WF-004 Resend Credential` until after WF-008 or pre-launch hardening. During the interim period, a manager may correct the learner email and resend manually from the manager mailbox; the original delivery-history row remains immutable. The next implementation ticket is `WF-005 Revoke`.
