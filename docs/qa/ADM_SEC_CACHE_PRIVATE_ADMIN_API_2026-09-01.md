# ADM-SEC-CACHE Private Admin API Responses

Date: 2026-09-01  
Branch: `codex/adm-sec-cache`  
Status: accepted in Production

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

## Deployed Production Verification

The merged implementation from PR #78 (`8daf086`) passed the deployed
canonical-origin matrix at `https://nobel-itbs.eu`:

- unauthenticated `GET /api/v1/admin/me` returned `401` with
  `Cache-Control: private, no-store, max-age=0, must-revalidate`,
  `CDN-Cache-Control: no-store`, the complete admin `X-Robots-Tag`, and
  `X-Vercel-Cache: MISS`;
- unauthenticated `GET /api/v1/admin/credentials` returned the same protected
  `401` boundary;
- `GET /api/v1/admin/me/` returned a canonical `301` with the same private and
  CDN no-store controls plus the complete admin `X-Robots-Tag`;
- authenticated read-only Owner/AAL2 `GET /api/v1/admin/me` returned `200 OK`
  with the same private browser cache policy, `CDN-Cache-Control: no-store`,
  the complete admin `X-Robots-Tag`, and `X-Vercel-Cache: BYPASS`;
- public `GET /api/v1/public/programmes?locale=en` returned `200` with
  `Cache-Control: public`, confirming that the admin-private policy does not
  broaden to the public API.

Vercel consumes its platform-specific `Vercel-CDN-Cache-Control` directive at
the edge and does not expose that directive to the client. The externally
visible generic CDN header remained `no-store`, and the authenticated response
was explicitly bypassed rather than cached.

## Security Notes

- No service-role behavior changed.
- No token, credential, learner, contact, PDF, email, or audit payload was
  copied into repository evidence.
- No authenticated mutation or external delivery was performed.
- The authenticated check read only the current admin context and verified
  response status/headers; the test session was signed out immediately after
  the smoke.

## Database Objects

None.

## Deviations / Open Questions

No implementation deviation or open cache gate remains. Direct Vercel Preview
inspection was unnecessary after the merged canonical Production deployment
passed unsuccessful, redirect, authenticated-success, and public-boundary
checks.

## Next Dependency

ADM-SEC-CACHE needs no further deployment action. Continue only with separately
approved operational work; this ticket does not change the deferred real VEDOS
delivery, backup/restore, or final cross-browser/assistive-technology gates.
