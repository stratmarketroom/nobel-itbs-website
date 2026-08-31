# WF-008 Public Verification QA

Date: 2026-08-10
Scope: public verification by document number and QR token

## Summary

WF-008 is implemented and accepted at the current dev level. The public website now has localized manual-verification routes for EN, UA, and CZ plus the canonical language-neutral QR route. Both public APIs use a server-mediated service-role lookup and return only the approved v2 response shapes.

The dev database contains no credentials. Therefore the real no-record, privacy boundary, rate-limit, routing, localization, responsive, and noindex states were exercised without creating a fake permanent document number. The `valid` and `revoked` result projections are covered by the focused migration/static checks, while their end-to-end data rendering remains part of QA-002/QA-004 using the first approved credential lifecycle.

## Public Contract

- `POST /api/v1/public/verify` accepts only one `documentNumber` field.
- `GET /api/v1/public/verify/{token}` hashes the normalized raw token server-side before database lookup.
- `valid` returns status, document number, holder name, programme title, document type, and issue date.
- `revoked` returns status only.
- `pending`, `voided`, absent records, invalid tokens, and unknown numbers return the same `not_found` result.
- No public response contains a PDF link, partner data, contact data, internal ID, private file path, history, notes, or revocation reason.
- QR/result routes are `noindex, nofollow`; manual pages remain indexable and localized.

## Database Objects

Migration `20260810130000_wf_008_public_verification.sql` adds:

- `internal.credential_verification_rate_limits`;
- index `credential_verification_rate_limits_window_idx`;
- service-only function `public.verify_public_credential(text, text, text)`.

The rate-limit table stores only an HMAC-derived request key. It stores no raw IP address, token, document number, or credential/learner data. The lookup function is `security definer`, has a fixed `search_path`, and is executable only by `service_role`.

## Tests and Verification

Passed:

- `npm run verify:wf-008`;
- `npm run lint`;
- `npx tsc --noEmit`;
- `npm run build`;
- `git diff --check`;
- remote migration push;
- local/remote migration-history parity at 45 migrations;
- real API smoke: unknown document number returns `200 not_found` with `Cache-Control: no-store`;
- real API smoke: invalid QR token returns the identical `200 not_found` result with `X-Robots-Tag: noindex, nofollow`;
- database-backed limit: requests 1–30 from a synthetic test address returned `200`; request 31 returned `429`;
- anonymous direct RPC invocation is denied;
- anonymous direct `credentials` table read is denied;
- EN, UA, and CZ manual routes return `200`;
- EN manual form submitted an unknown well-formed number and rendered the approved not-found content;
- UA route rendered localized metadata, heading, and field label;
- QR result route rendered `noindex, nofollow`, no result-level partner/PDF copy, and no console errors;
- responsive browser smoke at 390 px reported `scrollWidth = innerWidth = 390`.

The focused pgTAP file `supabase/tests/database/wf_008_public_verification.test.sql` contains 19 database/privacy assertions. `npx supabase test db` could not execute because no local Docker/PostgreSQL Supabase runtime is available.

## Security Notes

- The Supabase service-role key remains server-only.
- Raw QR tokens are not stored, returned separately, or logged.
- The API hashes raw tokens with HMAC-SHA-256 before the database call.
- The rate-limit HMAC uses an independent preferred secret and a dedicated domain prefix; the existing contact limit secret is a backward-compatible fallback.
- Public API responses use `no-store`.
- CAPTCHA remains intentionally unconfigured per Owner decision; database-backed rate limiting is active.

## Deviations and Open Questions

- No real `valid` or `revoked` record exists in dev. Creating one would permanently consume a document number, so no fake credential was created for this ticket.
- Historical note: no analytics provider was installed when this WF-008 QA ran.
  As of 2026-08-31, consent-gated GA4 page-view analytics is deployed and QR
  routes are projected to token-free `/verify/result` paths. A dedicated
  verification-success event is still intentionally absent; if later approved,
  it must contain no PII, document number, or token.
- Production should configure an independent `CREDENTIAL_VERIFICATION_RATE_LIMIT_SECRET` of at least 32 characters. Local development has an ignored dev-only value.

## Next Dependency

Proceed with `QA-001 RLS Tests` while the dev credential registry remains empty. Run `QA-002 Verification Privacy Tests` and the complete create → PDF → activate → verify → revoke → verify lifecycle in `QA-004 End-to-End Admin Flows` when the first approved test credential is available or a transaction-capable database test runner is available. `WF-004 Resend Credential` and `PCE-005 Telegram Manager Notifications` remain intentionally deferred to pre-launch hardening.
