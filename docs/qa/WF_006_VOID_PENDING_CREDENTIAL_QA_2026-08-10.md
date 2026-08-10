# WF-006 Void Pending Credential QA — 2026-08-10

## Summary

WF-006 is implemented and accepted at the current dev level. Owner, Super Admin, and Credential Manager actors with MFA can irreversibly void only a `pending` credential through the protected admin workflow. The same transaction permanently changes its exact linked document number from `reserved` to `voided`. A trimmed private reason is mandatory and is recorded with actor/time, two private History events, and privacy-minimal Audit events.

WF-006 does not implement public verification. WF-008 remains responsible for making both pending and voided credentials behave as not found.

## Files Changed

- migration and pgTAP contract: `supabase/migrations/20260810110000_wf_006_void_pending_credential.sql`, `supabase/tests/database/wf_006_void_pending_credential.test.sql`;
- protected route and server workflow: `app/api/v1/admin/credentials/[id]/void/route.ts`, `lib/credentials/void.ts`, `lib/credentials/void-input.ts`, `lib/credentials/void-types.ts`;
- manager UI: `components/admin-credentials.tsx`, `app/globals.css`;
- verification and planning: `scripts/verify-wf-006.mjs`, shared-component verifier updates, `package.json`, Project Master Checklist, and Agent Execution Sequence.

## Database Objects Changed

- added security-definer function `public.void_pending_credential(uuid, text)`;
- granted execution only to authenticated/server database roles while retaining role and MFA checks inside the function;
- no table, enum, RLS policy, Storage object, email object, or public verification object was added or changed.

The existing credential lifecycle permits only `pending` to `voided`; the Number Log permanence guard permits only `reserved` to `voided` and never removes its sequence value. Existing deferred cross-table integrity verifies that the two records finish the transaction in matching states.

## Implemented Behaviour

- rejects missing, blank, or longer-than-4,000-character reasons;
- locks both the credential and its matching reserved number before mutation;
- rejects valid, revoked, and already-voided credentials;
- rejects a pending credential without its exact linked `reserved` Number Log row;
- writes credential status/time/actor/reason and number status/actor/reason atomically;
- records both lifecycle changes in private History with the reason;
- audits both registry records without copying free-text reason into Audit metadata;
- exposes the rare Void action as a collapsed progressive section only for pending credentials;
- requires explicit confirmation that the reserved number can never be reused;
- shows the private void date and reason after completion and refreshes list/detail state.

## Security Notes

- browser code receives no service-role key, token material, private Storage path, or PDF content;
- server and database layers both enforce Owner, Super Admin, or Credential Manager plus MFA;
- Content Manager and anonymous actors cannot void credentials;
- the free-text reason stays in private lifecycle fields and History, not public output or Audit metadata;
- no function restores a voided credential or number, and the shared sequence never cycles backwards;
- WF-006 does not add public PDF access, partner data, email actions, revocation, valid-data editing, or verification output.

## Verification

Passed:

- `npm run verify:wf-006`;
- `npm run verify:crd-003`, `verify:crd-004`, `verify:crd-006`, `verify:wf-001`, `verify:wf-002`, `verify:wf-003`, `verify:wf-005`, and `verify:adm-crd-001` regression;
- `npx tsc --noEmit`;
- `npm run lint`;
- `npm run build`, including `/api/v1/admin/credentials/[id]/void`;
- Supabase migration push and 43/43 local/remote migration-history comparison.

The 18-assertion pgTAP contract is committed. It could not be executed because Docker Desktop is not running and the current Supabase CLI requires Docker for the test runner, including linked mode.

## Deviations or Open Questions

- No real pending credential was voided during QA. The action is destructive and permanently consumes the reserved number, and no specific record was authorized as a test target. The first approved operational void should include a private Credential History, Number Log, and Audit review.
- Automated in-app browser interaction with localhost remains unavailable under the current browser-runner policy. UI correctness was checked through code review, responsive rules, TypeScript, ESLint, and production build.
- Public not-found behaviour remains intentionally absent until WF-008.

## Next Dependency

Proceed with `WF-007 Update Valid Public Data`: controlled corrections to the approved public holder name, programme title, and credential type for valid credentials only, with a mandatory reason and History/Audit. WF-004 resend remains deferred until after WF-008 or pre-launch hardening.
