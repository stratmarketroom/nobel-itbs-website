# QA-005 SEO Publication — 2026-08-24

Ticket: `QA-005-SEO-001`

## Summary

The Release 1 SEO publication layer is implemented at code and local HTTP-smoke
level. The canonical origin is `https://nobel-itbs.eu`; preview hosts remain
usable, while canonical-domain HTTP and `www` requests normalize directly to
the final HTTPS non-`www` URL when that domain is attached.

The ticket adds:

- a root `metadataBase` and shared absolute canonical URL helpers;
- publication-aware canonical/hreflang/x-default metadata;
- a dynamic sitemap sourced from public published records/translations through
  the anon client and RLS;
- a robots route that excludes `/admin/` and `/api/` and points to the canonical
  sitemap;
- `/en`, `/uk`, and `/cs` locale aliases;
- one-hop protocol, host, trailing-slash, and verified legacy redirects;
- `410 Gone` plus `X-Robots-Tag: noindex, nofollow` for `/blog-en/`;
- a focused `verify:qa-005:seo` regression verifier.

Legal pages remain `noindex, follow` and do not emit hreflang because all legal
locale versions are not yet lawyer-approved. Verification token/result pages
remain `noindex, nofollow`; canonical metadata points to the corresponding
manual verification page and never contains the raw token.

## Files Changed

- SEO routes/helpers: `app/robots.ts`, `app/sitemap.ts`, `lib/seo/urls.ts`,
  `lib/seo/publication.ts`;
- metadata integration: root layout, managed content, programme catalogue and
  landing pages, manual verification, token verification, and legal metadata;
- URL routing: `proxy.ts`, `next.config.mjs`;
- verification: `scripts/verify-qa-005-seo.mjs`, `package.json`;
- directly related status and SEO documentation.

## Database Objects

None. The sitemap reads existing public publication state through anon/RLS. No
migration, database mutation, Storage change, secret, or production
configuration was added.

## Tests / Verification

Passed:

- all 64 non-live `verify:*` package scripts: 64 passed, 0 failed;
- `npm run verify:qa-005:seo`;
- `npm run verify:prg-007`;
- `npm run verify:prg-008`;
- `npm run verify:cnt-003`;
- `npx tsc --noEmit`;
- `npm run lint`;
- `npm run build`, including `/robots.txt` and dynamic `/sitemap.xml` routes;
- local production HTTP smoke in explicit seed mode:
  - 51 unique sitemap URLs;
  - 204 `xhtml:link` alternates;
  - required XHTML sitemap namespace;
  - zero admin, API, legal, token-result, or duplicate sitemap URLs;
  - locale aliases, trailing-slash normalization, and verified legacy paths
    return one-hop `301`;
  - `/blog-en/` returns `410`;
  - an unknown path remains `404`;
  - simulated `www` and HTTP canonical-host requests preserve UTM parameters and
    redirect in one hop;
  - manual Verify emits EN/UK/CS/x-default alternates;
  - token verification emits `noindex, nofollow` and no token-bearing canonical.

The exact live Supabase publication query could not be rerun locally because
this worktree has no `.env.local`. Its query is compile/build checked and uses
the same public anon/RLS pattern as current public resolvers. Post-deploy
Production sitemap/crawl acceptance remains required before domain cutover.

## Security Notes

- The sitemap uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`, never service role.
- Only published records and published translations enter the sitemap.
- Admin, API, legal, verification token/results, drafts, and external URLs are
  excluded.
- Redirects do not log paths, queries, or tokens and preserve legitimate query
  parameters.
- Robots is discovery guidance, not an authorization boundary; existing RLS and
  route authorization remain unchanged.

## Deviations / Open Questions

- The older SEO working documents named `/terms` and `/privacy`, but the current
  Release 1 application publishes `/terms-of-use` and `/privacy-policy`. Legacy
  sources redirect directly to the implemented routes to avoid redirecting to
  404 pages; the SEO documents were synchronized in this ticket.
- `/contacts-en/` redirects to `/about`, not `/about#contact`, because the current
  About implementation has no stable contact anchor.
- Canonical DNS/domain attachment, CDN behavior, and Production crawl validation
  are operational dependencies and were not changed in this code ticket.

## Next Dependency

Proceed with the next single QA-005 hardening ticket after review. The
recommended next ticket is browser security headers/CSP; canonical-domain
attachment should wait for legal, backup, CTA, and integration readiness.
