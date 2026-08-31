# QA-005 Google Analytics — 2026-08-31

Status: implemented and locally verified; Preview/Production acceptance pending review and merge

## Summary

The Owner-approved Google Analytics 4 measurement ID `G-RT0GQGPC6V` is connected through the existing localized cookie-consent decision. The Google tag is not requested and no analytics event is queued before explicit acceptance. Declining leaves analytics disabled.

The integration records privacy-minimal page views only. Advertising storage and signals are disabled, admin routes are excluded, query strings are not sent, and QR verification token routes are projected to token-free `/verify/result` paths before any analytics configuration or event.

## Files Changed

- `components/google-analytics.tsx`
- `components/cookie-consent.tsx`
- `lib/analytics/google-analytics.ts`
- `lib/privacy/cookie-consent.ts`
- `app/layout.tsx`
- `next.config.mjs`
- `scripts/verify-qa-005-google-analytics.mjs`
- `scripts/verify-qa-005-security-headers.mjs`
- `package.json`
- this report

## Database Objects

None.

## Tests / Verification

- `npm run verify:qa-005:google-analytics`
- `npm run verify:qa-005:security-headers`
- `npx tsc --noEmit`
- `npm run lint`
- `npm run build`
- local Production browser smoke with offline seed data:
  - Google tag count before consent: `0`;
  - after EN `Accept`: `1`, with `G-RT0GQGPC6V` in the script URL;
  - after UA `Не приймаю` on a fresh origin: `0`;
  - the localized consent banner closed after either decision.

## Security Notes

- The GA measurement ID is a public client identifier, not a secret.
- No Supabase keys, credential data, contact data, or verification tokens are sent.
- Google scripts and collection endpoints are restricted to the minimum non-advertising Analytics CSP sources documented by Google.
- The tag uses basic consent mode: it is absent before acceptance rather than sending cookieless pings after decline.

## Deviations / Open Questions

- No custom CTA, contact-submit, or verification-success events are added in this ticket; it establishes consent-gated page-view analytics only.
- Preview and Production network acceptance must confirm zero Google requests before consent, requests after acceptance, and the measurement ID in GA Realtime/DebugView.

## Next Dependency

Review the Vercel Preview, merge after approval, and run the documented Production consent/network acceptance.
