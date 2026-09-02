# QA-005 — Public/Admin CSS, Analytics, and Indexing Boundary

Date: 2026-08-31
Branch: `codex/qa-005-public-admin-css`

## Summary

The public website and protected administration workspace now use separate
Next.js route layouts and separate global CSS bundles.

- The root layout contains only the document foundation and self-hosted font.
- The `(public)` route group owns public metadata, Google Analytics, cookie
  consent, and public CSS.
- The `admin` route owns admin CSS and explicit `noindex`, `nofollow`,
  `nocache`, `noarchive`, `nosnippet`, and `noimageindex` metadata.
- Admin and API responses receive an `X-Robots-Tag` private-space header from
  the proxy.
- `robots.txt` excludes both root and nested `/admin` and `/api` paths.
- Public EN/UA/CZ 404 routes retain the shared public header/footer and
  localization without importing public CSS into the admin route.

## Files changed

- Route boundary: `app/layout.tsx`, `app/(public)/layout.tsx`,
  `app/admin/layout.tsx`.
- CSS boundary: `app/base.css`, `app/public.css`, `app/admin.css` (replacing
  `app/globals.css`).
- Public pages moved into `app/(public)` with unchanged URLs.
- Public/private 404 boundaries added under `app/(public)` and `app/admin`.
- Indexing boundary: `app/robots.ts`, `proxy.ts`.
- Static ticket verifier:
  `scripts/verify-qa-005-public-admin-boundary.mjs`.
- Existing static verifiers updated for route-group and CSS paths.

## Database objects changed

None.

## Verification

- `npm run verify:qa-005:public-admin-boundary` — pass.
- SEO, Google Analytics, Open Graph, Manrope, security headers, HTML language,
  public header/footer/accessibility, programme, partnership, Verify, admin
  dashboard/audit/email-template, learner and PDF editor static checks — pass.
- `npx tsc --noEmit` — pass.
- `npm run build` — pass; all existing public, admin, and API URLs remain in
  the production route manifest.
- `npm run lint` — zero errors; one pre-existing warning remains in
  `components/admin-shell.tsx:174` (`window.location.assign`).
- Local production response inspection:
  - public `/verify`: base CSS + public CSS only;
  - admin `/admin/login`: base CSS + admin CSS only;
  - admin loaded JavaScript chunks contain no GA measurement ID, consent key,
    or Analytics component;
  - admin HTML contains no canonical, Open Graph, or Twitter metadata;
  - `/admin` and `/api` responses include
    `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet, noimageindex`;
  - public CSS contains no sampled admin selectors, and admin CSS contains no
    sampled public selectors.
- Browser-rendered local production 404 check:
  - `/ua/missing-public-page`: Ukrainian copy, public header/footer,
    `lang="uk"`;
  - `/cz/missing-public-page`: Czech copy, public header/footer, `lang="cs"`.
- Vercel Preview smoke:
  - `/verify`: base + public CSS only, public footer present, production
    canonical retained;
  - `/admin/login`: base + admin CSS only, `noindex, nofollow, nocache`, no
    public footer, Google Analytics script, canonical, Open Graph, or Twitter
    metadata.

## CSS delivery result

The previous public route loaded the combined public/admin stylesheet, measured
in the earlier Lighthouse audit at approximately 51 KB transferred. The split
local production build emits:

- shared foundation: 3,404 bytes minified, about 1.5 KB gzip;
- public CSS: 96,161 bytes minified, about 20.5 KB gzip;
- admin CSS: 147,087 bytes minified, about 27.2 KB gzip.

Public routes therefore have a local gzip estimate of about 22 KB for CSS and
do not download the admin bundle. Admin routes do not download the public
bundle.

## Security notes

- No service-role or other server secret was added or exposed.
- Authentication, MFA, RLS, and admin API authorization were not changed.
- Analytics remains consent-gated and verification token paths remain reduced
  to the privacy-safe `/verify/result` value.
- Admin exclusion is enforced in layers: route ownership, noindex metadata,
  `X-Robots-Tag`, `robots.txt`, sitemap omission, and the analytics path guard.

## Deviations and open questions

- Local `/admin/login` cannot fully render in this worktree because deployed
  Supabase browser configuration is not present locally. The environment-backed
  admin login was therefore smoke-tested on the successful Vercel Preview.
- No production Lighthouse rerun is included in this ticket; it should be
  repeated after deployment when this structural split is available on a
  production-equivalent URL.

## Next dependency

PR #67 merged as `47667ce`. This ticket has no remaining review or merge
dependency; subsequent error-fix tickets remain separately scoped.
