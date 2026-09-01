# ADM-SEC-CACHE Private Admin API Responses

Date: 2026-09-01  
Branch: `codex/adm-sec-cache`  
Status: local implementation accepted; Preview/Production acceptance pending review and merge

## Scope

This ticket applies one centralized cache policy to every `/api/v1/admin`
response without changing public API caching, role permissions, MFA, RLS,
business data, or database objects.

The policy covers:

- successful and unsuccessful route responses;
- JSON, file, and redirect responses;
- browser caches through `Cache-Control`;
- generic and Vercel CDN caches through explicit no-store headers.

## Implementation

`proxy.ts` now identifies only the exact `/api/v1/admin` namespace and applies:

```text
Cache-Control: private, no-store, max-age=0, must-revalidate
CDN-Cache-Control: no-store
Vercel-CDN-Cache-Control: no-store
X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex
```

The same policy is applied before returning canonical-host or trailing-slash
redirects. The existing public-page cache policy remains unchanged.

## Automated Verification

Passed:

- `npm run verify:adm-sec-cache` — all 71 admin API route files are covered and
  none declares a cacheable `public` or `s-maxage` response;
- `npm run verify:qa-005:public-admin-boundary`;
- `npm run verify:qa-005:security-headers`;
- `npm run lint`;
- `npx tsc --noEmit`;
- `npm run build` — 60 pages/routes generated successfully after network access
  was allowed for the existing Google-hosted Manrope build dependency.

## Local Production HTTP Verification

A temporary `next start` server was checked without an authenticated session.

Results:

- `GET /api/v1/admin/me` returned `401` with all three private/no-store headers;
- `GET /api/v1/admin/credentials` returned `401` with all three private/no-store headers;
- `GET /api/v1/admin/me/` returned a `301` redirect with all three
  private/no-store headers;
- `GET /api/v1/public/programmes?locale=en` did not receive the admin cache
  headers, confirming that the public API boundary was not broadened.

The public request could not load Supabase from the isolated local runtime and
returned `500`; this did not affect the header-boundary assertion and no data
was written.

## Security Notes

- No service-role behavior changed.
- No token, credential, learner, contact, PDF, email, or audit payload was used.
- No authenticated mutation or external delivery was performed.
- Preview and Production must be checked after deployment because the current
  production version still reflects the pre-ticket cache policy.

## Database Objects

None.

## Deviations / Open Questions

None for the implementation scope. Authenticated `200` response-header smoke is
reserved for the deployed Preview/Production acceptance step; the centralized
proxy policy is independent of route status and passed local `401` and `301`
runtime checks.

## Next Dependency

Review and merge this ticket, then verify one unauthenticated admin endpoint and
one authenticated read-only admin endpoint on the deployed Preview before the
separate `AUTH-007-QA-FIX` ticket begins.
