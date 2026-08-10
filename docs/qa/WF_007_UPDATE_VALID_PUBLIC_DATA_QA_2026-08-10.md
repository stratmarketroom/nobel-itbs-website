# WF-007 Update Valid Public Data QA — 2026-08-10

## Summary

WF-007 is implemented and accepted at the current dev level. Owner, Super Admin, and Credential Manager actors with MFA can correct the current public holder name, programme title, and credential type only while a credential is `valid`. The workflow requires complete normalized values and a private reason, rejects unchanged submissions, writes detailed private before/after History, and records only changed field names in Audit.

The workflow changes no credential identity, lifecycle, number, token, learner/programme relation, language, issue date, PDF, or email data. WF-008 will later read these current values for valid public verification without showing a revision notice.

## Files Changed

- migration and pgTAP contract: `supabase/migrations/20260810120000_wf_007_update_valid_public_data.sql`, `supabase/tests/database/wf_007_update_valid_public_data.test.sql`;
- protected route and server workflow: `app/api/v1/admin/credentials/[id]/public-data/route.ts`, `lib/credentials/public-data.ts`, `lib/credentials/public-data-input.ts`, `lib/credentials/public-data-types.ts`;
- manager UI: `components/admin-credentials.tsx`, `app/globals.css`;
- verification and planning: `scripts/verify-wf-007.mjs`, `package.json`, Project Master Checklist, and Agent Execution Sequence.

## Database Objects Changed

- added security-definer function `public.update_valid_credential_public_data(uuid, text, text, text, text)`;
- granted execution only to authenticated/server database roles while retaining role and MFA checks inside the function;
- no table, column, enum, RLS policy, Storage object, email object, Number Log object, or public verification object was added or changed.

## Implemented Behaviour

- accepts the complete current public record: holder name, programme title, and credential type;
- applies the same 320/500/200-character limits used during pending credential creation;
- requires a trimmed private reason up to 4,000 characters;
- locks the credential before status and value checks;
- rejects pending, revoked, and voided credentials;
- rejects submissions where no public value changed;
- updates only the three approved public fields;
- writes `credential.public_data_updated` History with private reason and full before/after public values;
- writes Audit with changed field names only, without public values or free-text reason;
- exposes a collapsed valid-only correction form prefilled with current data;
- refreshes list and detail state after a successful correction.

## Security Notes

- browser code receives no service-role key, token material, private Storage path, or PDF content;
- server and database layers both enforce Owner, Super Admin, or Credential Manager plus MFA;
- Content Manager and anonymous actors cannot use the workflow;
- detailed public-value history remains private behind credential RLS;
- Audit avoids unnecessary PII and records only which fields changed;
- the function does not modify credential identity, lifecycle, Number Log, verification token, PDF, email, partner, or learner records;
- no public verification response or public revision notice is implemented in WF-007.

## Verification

Passed:

- `npm run verify:wf-007`;
- `npm run verify:crd-004`, `verify:crd-006`, `verify:wf-001`, `verify:wf-002`, `verify:wf-003`, `verify:wf-005`, `verify:wf-006`, and `verify:adm-crd-001` regression;
- `npx tsc --noEmit`;
- `npm run lint`;
- `npm run build`, including `/api/v1/admin/credentials/[id]/public-data`;
- Supabase migration push and 44/44 local/remote migration-history comparison.

The 17-assertion pgTAP contract is committed. It could not be executed because Docker Desktop is not running and the current Supabase CLI requires Docker for its test runner, including linked mode.

## Deviations or Open Questions

- No real valid credential was edited during QA because no specific approved record and corrected values were supplied. The first operational correction should include private History and Audit review.
- Automated in-app browser interaction with localhost remains unavailable under the current browser-runner policy. UI correctness was checked through code review, responsive rules, TypeScript, ESLint, and production build.
- Public rendering of the corrected current record remains intentionally absent until WF-008.

## Next Dependency

Proceed with `WF-008 Public Verification`: server-mediated verification by QR token or document number only. Valid returns the current approved public fields; revoked returns status only; pending, voided, wrong token, and wrong number behave as not found. No partner data or PDF links may be exposed. WF-004 resend remains deferred until after WF-008 or pre-launch hardening.
