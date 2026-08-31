# QA-005 Google Analytics — 2026-08-31

Status: implemented, merged, deployed, and accepted in Preview/Production

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
- PR #65 merged as `5646ac0` and its Production deployment reached Ready;
- Vercel Preview consent/network smoke confirmed zero Google tag requests
  before consent, one tag request after acceptance, and zero after decline;
- the Owner confirmed that Google Analytics detected measurement ID
  `G-RT0GQGPC6V` on the live site;
- the later Production cookie/LCP audit recorded zero Google Analytics network
  requests before consent in all three cold mobile runs.

## Security Notes

- The GA measurement ID is a public client identifier, not a secret.
- No Supabase keys, credential data, contact data, or verification tokens are sent.
- Google scripts and collection endpoints are restricted to the minimum non-advertising Analytics CSP sources documented by Google.
- The tag uses basic consent mode: it is absent before acceptance rather than sending cookieless pings after decline.

## Deviations / Open Questions

- No custom CTA, contact-submit, or verification-success events were added;
  they remain a separate future analytics ticket. Their absence does not
  reopen the accepted basic consent-gated page-view integration.

## Next Dependency

None for the basic GA4 page-view integration. Define and approve privacy-safe
custom events as a separate ticket when required.
