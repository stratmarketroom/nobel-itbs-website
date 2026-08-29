# SEC-DEV-SECRET-ROTATION-001 Development Secret Rotation

Date: 2026-08-29

Status: implemented, applied, and accepted in Development; Production untouched

## Summary

This ticket adds a controlled credential verification-token secret rotation
path and completes one hosted Development rotation without exposing raw token,
hash, ciphertext, encryption-key, HMAC, or service-key material.

All 1,741 existing Development credentials were rotated from encryption key
version 1 to version 2. The operation preserved every credential identity,
document number, lifecycle status, generation batch, private PDF, and generated
file record. No review, activation, email, or Production mutation was executed.

The Development Supabase client credentials were also moved from the legacy
JWT-based `anon` and `service_role` keys to the modern publishable and secret
keys before the Owner disabled both legacy JWT keys in the Supabase dashboard.

## Files Changed

- `.env.example` documents current and optional legacy token-key variables;
- `lib/credentials/public-verification.ts` supports bounded current-then-legacy
  HMAC lookup during the transition;
- `lib/credentials/token.ts` supports a current and one optional legacy
  encryption key version for server-side decryption;
- `scripts/rotate-credential-token-secrets.mjs` provides exact-project,
  modern-service-key, dry-run-by-default, bounded rotation orchestration;
- `scripts/verify-sec-dev-secret-rotation-001.mjs` provides focused static
  contract verification;
- `scripts/verify-wf-008.mjs` accepts the intentional dual-read verification
  path while continuing to reject raw/encrypted token lookup;
- `supabase/migrations/20260829100000_sec_001_credential_token_rotation.sql`
  adds the guarded rotation database boundary;
- `supabase/tests/database/sec_001_credential_token_rotation.test.sql` covers
  the database contract;
- `package.json` exposes the focused verifier;
- this QA report and the current implementation/sequence status records.

No secret value is stored in the repository.

## Database Objects Changed

Migration `20260829100000_sec_001_credential_token_rotation.sql` adds:

- private transaction-local rotation authorization used only by the guarded
  function;
- a service-role-only, maximum-100-item
  `public.rotate_credential_token_material_batch(jsonb)` RPC;
- a narrowly scoped credential token-material update allowance that requires a
  strictly higher encryption key version;
- privacy-minimal audit events containing only counts and key versions.

The RPC is not executable by `anon` or `authenticated`; `service_role` retains
the controlled execution grant. The migration is applied and recorded in
hosted Development as version `20260829100000` with name
`sec_001_credential_token_rotation`.

No Production database object changed.

## Rotation Procedure And Result

The hosted operation used the exact Development project ref
`flswzhgjbpagohbwehcz` and a modern `sb_secret_...` key. The runner rejected
implicit writes and required explicit `--apply` after a successful dry run.

Dry run:

- credentials: 1,741;
- prepared: 1,741;
- already current: 0;
- from key version: 1;
- to key version: 2.

Apply:

- rotated: 1,741;
- already rotated: 0;
- remaining legacy: 0;
- current version: 1,741;
- bounded database calls: 18;
- audited rotated total: 1,741;
- unsafe audit rows: 0.

Independent post-rotation acceptance confirmed:

- credentials: 1,741;
- version 1: 0;
- version 2: 1,741;
- distinct lookup hashes: 1,741;
- malformed lookup hashes: 0;
- malformed encrypted envelopes: 0;
- statuses: 1,740 `pending`, 1 `revoked`;
- generation batches: 3;
- generation batch items: 1,740;
- exact migration ledger rows: 1.

The local ignored Development `.env.local` contains only the current token
HMAC/encryption values at version 2, uses the modern Supabase publishable and
secret keys, contains no legacy token-key variables, and remains mode `0600`.

## Vercel Preview Acceptance

Only Preview configuration was changed. Production variables were not opened
for editing or changed.

For branch `codex/sec-dev-secret-rotation-001`:

- current credential HMAC/encryption/version values were installed;
- the three temporary legacy credential-token variables were removed after all
  rows reached version 2;
- the final deployment uses commit `d936aa2` and reached `Ready`;
- stable branch alias:
  `https://nobel-itbs-website-git-codex-s-c019f6-stratmarketrooms-projects.vercel.app`.

For the Development-backed Preview environment generally:

- `NEXT_PUBLIC_SUPABASE_ANON_KEY` was moved to the modern Development
  publishable key;
- the Preview Supabase service key uses the modern Development secret key.

Before the legacy Supabase JWT keys were disabled, the final modern-key Preview
deployment passed:

- pending document number `NITBS-C-2026-000001` returned not found and exposed
  no document details;
- the admin login screen loaded without a temporary configuration error;
- both pages produced zero browser console errors;
- a decrypted version-2 control token matched its stored HMAC and the Preview
  rendered the revoked status without document details.

After the Owner disabled the legacy JWT keys, an independent direct read-only
acceptance using only the modern local Development keys returned:

- Auth Health: HTTP 200;
- public programme read with the modern publishable key: HTTP 200;
- service-key credential and batch counts exactly matching the pre-disable
  accepted state above.

The Chrome control extension stopped responding during the final Supabase
confirmation. The Owner completed the exact Development-only disable action in
the visible dashboard and reported completion. A post-disable browser reload
could not be automated; the modern-key HTTP and database acceptance is the
independent post-disable evidence.

## Tests / Verification

Passed:

- `npm run verify:sec-dev-secret-rotation-001`;
- `npm run verify:wf-001`;
- `npm run verify:wf-008`;
- clean `supabase db reset --local` through the new migration;
- focused SEC pgTAP: 17/17;
- selected SEC/PDFGEN/RLS/WF regression: 19 files, 464/464 assertions;
- `npx tsc --noEmit`;
- `npm run lint -- --max-warnings=0`;
- `npm run build`;
- `git diff --check`;
- focused repository secret scan: placeholders only in `.env.example`;
- hosted dry run, hosted apply, independent SQL audit, token decrypt/HMAC check,
  Preview public smoke, and post-disable modern-key API/database audit.

The full historical pgTAP collection executed 60 files and 1,292 assertions
but is not claimed as a clean gate because known phase-local and pgTAP
compatibility expectations outside this ticket remain stale. The selected
current SEC/PDFGEN/RLS/WF gate is green; this ticket does not modify adjacent
historical tests.

## Security Notes

- Raw verification tokens were held only in memory and were never logged or
  written to a regular file.
- Temporary secret files were mode `0600`, overwritten with zero bytes, and
  deleted immediately after their one operation.
- Browser and shell output contained counts and pass/fail evidence only.
- Rotation audit metadata contains no raw token, lookup hash, ciphertext,
  document number, learner identity, private path, or PDF content.
- New tokens continue to use only the current key material; legacy material was
  accepted only during the bounded transition and is now removed.
- Credential numbers remain unique and unchanged; none was reused.
- All credentials remain `pending` or `revoked`; no credential became `valid`,
  `voided`, activated, reviewed, resent, or emailed.
- Production Supabase, Vercel Production, VEDOS, and Production credentials
  were not changed.

## Deviations / Open Questions

- Hosted migration execution and migration-ledger recording were consecutive
  guarded operations rather than one transaction because the SQL editor's
  automatic page translation required an exact copied-buffer verification
  before each execution.
- The Owner performed the final legacy JWT-key disable after the Chrome control
  extension stopped responding. Modern-key post-disable acceptance passed, but
  the final Preview browser reload was not automated.
- Production secret rotation is not authorized by this Development-only
  ticket and remains out of scope.

## Next Dependency

Open and merge the SEC-DEV-SECRET-ROTATION-001 pull request after its normal
checks pass. Then return to the separately scoped authenticated visual
acceptance for `PDFGEN-006-REVIEW-UX-001`. Any real activation, VEDOS delivery,
Production promotion, or Production secret rotation requires a separate
explicit authorization.
