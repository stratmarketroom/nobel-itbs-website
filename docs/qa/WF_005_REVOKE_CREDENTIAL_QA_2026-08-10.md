# WF-005 Revoke Credential QA — 2026-08-10

## Summary

WF-005 is implemented and accepted at the current dev level. Owner, Super Admin, and Credential Manager actors with MFA can irreversibly move only a `valid` credential to `revoked` through the protected admin workflow. A trimmed private reason is mandatory; the database records the actor, timestamp, reason, History event, and privacy-minimal Audit event in one transaction. The already-issued document number is unchanged and can never be reused.

WF-005 does not implement public verification. The later WF-008 route remains responsible for returning revoked status only, without document details or the private reason.

## Files Changed

- migration and pgTAP contract: `supabase/migrations/20260810100000_wf_005_revoke_credential.sql`, `supabase/tests/database/wf_005_revoke_credential.test.sql`;
- protected route and server workflow: `app/api/v1/admin/credentials/[id]/revoke/route.ts`, `lib/credentials/revoke.ts`, `lib/credentials/revoke-input.ts`, `lib/credentials/revoke-types.ts`;
- manager UI: `components/admin-credentials.tsx`, `app/globals.css`;
- verification and planning: `scripts/verify-wf-005.mjs`, historical shared-component verifier updates, `package.json`, Project Master Checklist, and Agent Execution Sequence.

## Database Objects Changed

- added controlled security-definer function `public.revoke_credential(uuid, text)`;
- granted execution only to authenticated/server database roles while retaining in-function role and MFA checks;
- no table, enum, public policy, Storage object, email object, or document-number object was added or changed.

The existing credential lifecycle constraint permits only `valid` to `revoked`, the existing History trigger records the status transition and private reason, and the existing deferred Number Log integrity trigger requires the number to remain `issued`.

## Implemented Behaviour

- rejects missing, blank, or longer-than-4,000-character reasons;
- locks the credential row before checking and changing lifecycle state;
- rejects pending, revoked, and voided credentials;
- writes `status = revoked`, `revoked_at`, `revoked_by`, and `revocation_reason` atomically;
- writes a privacy-minimal `credential.revoked` Audit event without copying the free-text reason into Audit metadata;
- keeps the reason in the private append-only credential History;
- exposes the manager form only for a `valid` credential and requires explicit irreversible-action confirmation;
- shows the private revocation date and reason after completion;
- refreshes both credential detail and list so the status badge and filters reflect the new state.

## Security Notes

- browser code receives no service-role key, token material, private Storage path, or PDF content;
- the request uses the actor-scoped Supabase client, and authorization is enforced in both the server layer and database function;
- Content Manager and anonymous actors cannot perform revocation;
- the reason is never written to public output or Audit metadata;
- no reverse lifecycle function exists, and the issued number is never released or reused;
- WF-005 does not add public PDF access, partner data, public credential details, email sending, resend, void, or public-data editing.

## Verification

Passed:

- `npm run verify:wf-005`;
- `npm run verify:crd-004`, `verify:crd-006`, `verify:wf-001`, `verify:wf-002`, `verify:wf-003`, and `verify:adm-crd-001` regression;
- `npx tsc --noEmit`;
- `npm run lint`;
- `npm run build`, including the new `/api/v1/admin/credentials/[id]/revoke` route;
- Supabase migration push and 42/42 local/remote migration-history comparison.

The 16-assertion pgTAP contract is committed. Supabase CLI could not execute it because Docker Desktop is not running and the current CLI still requires Docker for its pgTAP runner even with `--linked`. The in-app browser runner also blocked `localhost` access by policy, so no automated visual interaction was claimed as passed in this report.

## Deviations or Open Questions

- The original ticket QA did not revoke a real record because no target had been approved at that time. On 2026-08-10 the Owner explicitly authorized revocation of retained QA credential `NITBS-C-2027-123450`.
- The live transition passed: credential `revoked`, timestamp and private reason present, number still `issued` and linked, History reason present, and one privacy-minimal Audit event recorded.
- WF-008 verification by both document number and QR returned revoked status only, without number, holder, programme, type, issue date, private reason, partner data, IDs, or PDF access.

## Next Dependency

WF-005 now has real operational acceptance evidence. QA-002 and QA-004 are complete; proceed with `QA-005 Launch Checklist`. WF-004 resend remains intentionally deferred to pre-launch hardening.
