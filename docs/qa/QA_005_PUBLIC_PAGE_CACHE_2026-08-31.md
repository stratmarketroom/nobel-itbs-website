# QA-005 Public Page Edge Cache — 2026-08-31

Status: implemented and locally verified; Preview/Production verification pending

## Summary

The public website no longer reads the consent cookie in the shared public
layout. Consent is resolved after hydration from the existing necessary cookie
and localStorage contract, so public HTML no longer varies by visitor.

Public `GET` and `HEAD` page responses now declare a five-minute CDN freshness
window with one hour of stale-while-revalidate. The explicit targeted CDN
headers override the private framework cache policy caused by the request-scoped
HTML-language header. Admin pages and all API routes remain outside this cache
path.

The previous Production baseline returned
`Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate` for
every public page and `x-vercel-cache: MISS` on each uncached request.

## Scope

- restore shared edge caching for public EN/UA/CZ pages;
- preserve server-rendered `html lang` values;
- preserve the localized consent banner and its accepted/declined persistence;
- preserve the GA rule that no Google script loads before explicit acceptance;
- keep `/admin` and `/api` private and uncached;
- no copy, layout, analytics-event, database, or business-logic changes.

## Implementation

- `app/(public)/layout.tsx` no longer calls the dynamic `cookies()` API;
- `CookieConsent` and `GoogleAnalytics` use an `initializing` server snapshot,
  then resolve the persisted decision in the browser;
- the server does not render the consent banner into cached shared HTML;
- `proxy.ts` adds `Vercel-CDN-Cache-Control` and `CDN-Cache-Control` only to
  public `GET` and `HEAD` page responses:
  `max-age=300, stale-while-revalidate=3600`;
- the existing request-derived language header remains in place, so initial
  EN, UA, and CZ HTML continues to use `en`, `uk`, and `cs` respectively.

## Files Changed

- `app/(public)/layout.tsx`
- `components/cookie-consent.tsx`
- `components/google-analytics.tsx`
- `proxy.ts`
- `scripts/verify-qa-005-cookie-lcp.mjs`
- `scripts/verify-qa-005-google-analytics.mjs`
- `scripts/verify-qa-005-public-admin-boundary.mjs`
- this report

## Database Objects

None.

## Tests / Verification

- `npm run verify:qa-005:cookie-lcp` passed;
- `npm run verify:qa-005:google-analytics` passed;
- `npm run verify:qa-005:public-admin-boundary` passed;
- `npx tsc --noEmit` passed;
- `npm run lint` passed with no warnings;
- `npm run build` passed;
- local production response inspection confirmed the targeted CDN headers on
  `/`, `/ua/about`, and `/verify`, with no CDN cache header on `/admin/login`
  or `/api/v1/public/programmes`;
- local browser smoke on a fresh origin confirmed banner `1` and Google tag `0`;
- after Decline, banner `0` and Google tag `0`, including after reload;
- on a second fresh origin after Accept, banner `0` and Google tag `1` with
  measurement ID `G-RT0GQGPC6V`, including after reload.

Local Supabase-backed content and admin routes return configuration errors in
this worktree because deployed environment variables are unavailable. The
cache-header boundary was still observable, and `/verify` provided the complete
consent/analytics browser smoke surface.

## Security Notes

- Cached public HTML contains no visitor-specific consent decision.
- The decision cookie still contains only `accepted` or `declined` and no PII.
- GA remains basic-consent-mode only and is absent before acceptance.
- Admin and API responses retain their noindex/private paths and never receive
  the public CDN cache headers.
- Vercel caches only eligible successful/redirect/not-found responses; `5xx`
  responses are not cacheable under the platform criteria.

## Deviations / Open Questions

- Next.js still classifies the routes as dynamic because the root layout reads
  the request-derived HTML-language header. Moving EN/UA/CZ into multiple root
  layouts would permit fully static output but would require a broad routing
  restructure and full document navigations between language roots. The scoped
  edge-cache solution preserves current routing and server language semantics.
- Content changes may remain fresh for five minutes and may be served stale
  while one background revalidation runs for up to one hour. This matches the
  existing public content API cache contract. Immediate purge-on-publish can be
  considered as a separate future ticket if Owner workflows require it.

## Next Dependency

Create the Vercel Preview, confirm `x-vercel-cache: MISS` followed by `HIT` for
the same public URL, and confirm no cache hit on `/admin` or `/api` before merge.
