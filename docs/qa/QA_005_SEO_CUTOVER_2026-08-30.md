# QA-005 SEO Cutover Legacy URL Completion — 2026-08-30

Ticket: `QA-005-SEO-CUTOVER-001`

## Summary

The pre-domain read-only audit found two current Tilda URLs in the live
`https://nobel-itbs.eu/sitemap.xml` that were absent from the earlier verified
legacy inventory and returned `404` on the new Vercel Production deployment:
`/tracks` and `/works`.

This ticket completes the known current-Tilda redirect map without expanding
the Release 1 public surface:

- `/tracks` redirects permanently to `/programmes`, which is the current
  catalogue for the old learning-direction index;
- `/works` redirects permanently to `/about`, whose structured sections now
  explain how Nobel ITBS works, its educational approach, and its audiences.

Both routes use the existing one-hop `301` mechanism and preserve query
parameters. Unknown legacy paths are not redirected to Home, and the removed
Blog root remains `410 Gone`.

## Files Changed

- `proxy.ts`;
- `scripts/verify-qa-005-seo.mjs`;
- `docs/preparation/SEO_TECHNICAL_PUBLICATION_SPEC.md`;
- this QA report;
- directly related documentation index, implementation status, and master
  checklist records.

## Database Objects Changed

None. No migration, policy, grant, row, Auth user, Storage object, secret, or
environment value changed.

## Tests / Verification

Passed:

- `npm run verify:qa-005:seo`;
- `npm run verify:prg-008`;
- `npm run verify:qa-005:security-headers`;
- `npx tsc --noEmit`;
- `npm run lint` with zero errors and one unrelated existing warning in
  `components/admin-shell.tsx`;
- `CONTENT_DATA_SOURCE=seed npm run build`, with 57/57 static pages generated;
- local production HTTP smoke:
  - `/tracks?utm_source=legacy` returns `301` to
    `/programmes?utm_source=legacy`;
  - `/works?ref=tilda` returns `301` to `/about?ref=tilda`;
  - `/programmes` returns `200` with the expected canonical.

The managed About page intentionally has no seed-mode fixture, so its local
seed response is not used as destination evidence. The unchanged deployed
Production `/about` route returned `200` during the pre-ticket read-only crawl.

The Ready Vercel Preview for commit `74290d7` also passed an authenticated
Chrome smoke:

- `/tracks?utm_source=legacy` resolved directly to
  `/programmes?utm_source=legacy`, with canonical
  `https://nobel-itbs.eu/programmes`;
- `/works?ref=tilda` resolved directly to `/about?ref=tilda`, with canonical
  `https://nobel-itbs.eu/about`.

Canonical-domain edge acceptance remains a separate cutover step.

## Security Notes

- The redirect implementation does not log source paths, query strings, or
  verification tokens.
- Existing legitimate query parameters remain intact.
- No catch-all redirect was added, so unknown URLs continue to return a real
  `404` instead of leaking or masking unrelated paths.
- No authentication, RLS, MFA, credential, email, PDF, or service-role code
  changed.

## Deviations / Open Questions

- The earlier preparation inventory and QA-005 SEO report described the known
  legacy map as verified, but the current live Tilda sitemap later exposed
  `/tracks` and `/works`. The active preparation specification is corrected in
  this ticket; historical QA evidence remains unchanged.
- Search Console, analytics, legacy WordPress exports, and backlink reports are
  still external operational sources. They must be reviewed before DNS cutover
  for any additional genuinely equivalent legacy URLs.
- Actual `http`/`www`/HTTPS one-hop behavior cannot be accepted until Vercel is
  attached to the domain.

## Next Dependency

Open, review, and merge the branch PR. Then attach the canonical domain in a
controlled window and run the post-cutover crawl across all old URL variants,
the 51-URL sitemap, robots, canonical, hreflang, and final host/protocol
redirects.
