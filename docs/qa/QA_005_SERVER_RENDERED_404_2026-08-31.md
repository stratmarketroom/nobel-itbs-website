# QA-005-SERVER-404-001 — Server-rendered public 404

Date: 2026-08-31
Branch: `codex/qa-005-server-rendered-404`
Status: implemented and verified locally; Vercel Preview review pending

## Summary

The public fallback is now a real Next.js global 404 document instead of a
client-localized catch-all page.

- Unmatched EN, UA, and CZ URLs return HTTP `404` with fully server-rendered
  localized HTML.
- The initial document carries `lang="en"`, `lang="uk"`, or `lang="cs"`
  without waiting for client hydration.
- The approved system-page copy includes an explanation, a primary Programmes
  action, and a secondary Home action.
- The shared responsive public header, global footer, consent-gated analytics,
  and cookie consent remain present.
- Public `notFound()` calls from existing content routes retain the same
  localized server component through the public route-group boundary.
- The admin 404 boundary remains separate and unchanged.

## Files Changed

- `app/global-not-found.tsx`
- `app/(public)/not-found.tsx`
- `components/public-not-found.tsx`
- `app/public.css`
- `next.config.mjs`
- `proxy.ts`
- `package.json`
- `scripts/verify-qa-005-server-rendered-404.mjs`
- related public shell, HTML-language, and public/admin boundary verifiers
- obsolete public catch-all and nested 404 boundary files removed

## Database Objects

None.

## Tests / Verification

- `npm run verify:qa-005:server-404` — pass.
- `npm run verify:qa-005:html-language` — pass.
- `npm run verify:qa-005:public-admin-boundary` — pass.
- `npm run verify:cnt-003:mobile-nav` — pass.
- `npm run verify:cnt-003:global-footer` — pass.
- `npm run verify:cnt-003:public-landmarks-a11y` — pass.
- `npx tsc --noEmit` — pass.
- `npm run lint` — pass with no warnings.
- `npm run build` — pass; global 404 and public routes are server-rendered on demand.
- Local production HTTP smoke:
  - unknown EN root and nested routes: `404`, `lang="en"`;
  - unknown UA route: `404`, `lang="uk"`;
  - unknown CZ route: `404`, `lang="cs"`;
  - invalid locale route: `404`, English fallback;
  - all responses contain localized title, body, public header/footer, and
    `noindex, nofollow`;
  - all responses omit canonical, Open Graph, and Twitter metadata.
- Browser smoke: Ukrainian desktop 404 rendered the complete shared header,
  localized actions, main landmark, and full global footer without overflow.

## Security Notes

- No authentication, authorization, MFA, RLS, API, credential, or database
  logic changed.
- No secret or service-role value was added.
- Admin routing, indexing protection, analytics exclusion, and private CSS
  boundary remain unchanged.
- The 404 exposes no request details, internal IDs, or private content.

## Deviations / Open Questions

- The implementation enables Next.js 16.3.3 `experimental.globalNotFound`, the
  framework-supported mechanism for a complete unmatched-route document when
  the application has separate public and admin layout concerns. The focused
  verifier and production HTTP smoke guard this behavior.
- No product-scope deviation or open business question.

## Next Dependency

- Create a PR, review the Vercel Preview on desktop and mobile, then run the
  same EN/UA/CZ HTTP smoke against the preview before merge.
