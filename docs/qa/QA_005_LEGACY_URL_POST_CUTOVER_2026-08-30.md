# QA-005 Legacy URL Post-Cutover Audit — 2026-08-30

Ticket: `QA-005-SEO-LEGACY-AUDIT-001`

## Summary

The complete verified legacy inventory was tested against the canonical
Production origin `https://nobel-itbs.eu` after domain cutover. All 16 known
redirecting source variants return one direct `301`, preserve a representative
query parameter, and finish on the intended `200` destination after exactly
one hop. The intentionally removed `/blog-en/` route returns `410 Gone` with
`X-Robots-Tag: noindex, nofollow`. An unknown legacy-looking path returns a real
`404` and is not redirected to Home.

The 51-entry Production sitemap contains none of the audited legacy sources.
All ten distinct redirect destinations emit the expected self-referencing
canonical URL without the audit query parameter.

## Production Results

| Legacy source | Expected destination | Result |
| --- | --- | --- |
| `/human` | `/programmes/psychology-human` | `301`, one hop, final `200` |
| `/tech` | `/programmes/technology-innovation` | `301`, one hop, final `200` |
| `/business` | `/programmes/business-management` | `301`, one hop, final `200` |
| `/tracks` | `/programmes` | `301`, one hop, final `200` |
| `/works` | `/about` | `301`, one hop, final `200` |
| `/aboutus` | `/about` | `301`, one hop, final `200` |
| `/about-us-en/` | `/about` | `301`, one hop, final `200` |
| `/course-en/` | `/programmes/space-business` | `301`, one hop, final `200` |
| `/contacts-en/` | `/about` | `301`, one hop, final `200` |
| `/termsofservice` | `/terms-of-use` | `301`, one hop, final `200` |
| `/terms/` | `/terms-of-use` | `301`, one hop, final `200` |
| `/refund` | `/refund-policy` | `301`, one hop, final `200` |
| `/refund/` | `/refund-policy` | `301`, one hop, final `200` |
| `/privacypolicy` | `/privacy-policy` | `301`, one hop, final `200` |
| `/privacy/` | `/privacy-policy` | `301`, one hop, final `200` |
| `/home-page-2/` | `/` | `301`, one hop, final `200` |
| `/blog-en/` | none | `410`, no redirect, `noindex, nofollow` |
| unknown control path | none | `404`, no redirect |

Every redirect check included `?utm_source=legacy`; the parameter remained on
the destination. Redirect responses and final pages were served through the
canonical HTTPS host.

## Files Changed

- `docs/preparation/SEO_TECHNICAL_PUBLICATION_SPEC.md`;
- this QA report.

The active specification's legacy table still named the superseded planned
destination `/about#contact` for `/contacts-en/`, while its implementation note
and Production behavior already used `/about` because no stable contact anchor
exists. The table is aligned with the accepted implementation decision.

## Database Objects Changed

None. No migration, policy, grant, row, Auth user, Storage object, secret, or
environment value changed.

## Tests / Verification

Passed on Production:

- direct response status and `Location` for every verified legacy source;
- final status and redirect count with redirects followed;
- query-string preservation using `utm_source=legacy`;
- self-referencing canonical for all ten distinct destinations;
- `410` plus `X-Robots-Tag: noindex, nofollow` for `/blog-en/`;
- genuine `404` for `/definitely-not-a-real-legacy-page`;
- 51-entry sitemap check confirming every audited source is absent.
- follow-up canonical host/protocol matrix on 2026-08-31:
  - `https://nobel-itbs.eu/` → `200`;
  - `http://nobel-itbs.eu/` → direct `308` to the canonical HTTPS origin;
  - `https://www.nobel-itbs.eu/` → direct `301` to the canonical origin;
  - `http://www.nobel-itbs.eu/` → direct `301` to the canonical origin.

Passed locally:

- `npm run verify:qa-005:seo`;
- Markdown whitespace validation with `git diff --check`.

## Security Notes

- The audit used only public HTTP responses and did not send credentials,
  verification tokens, personal data, or private query parameters.
- No application logging, authentication, RLS, MFA, credential, email, PDF,
  database, or service-role behavior changed.
- The unknown-path control confirms there is no catch-all redirect masking
  missing content or sending it to Home.

## Deviations / Open Questions

- No redirect or canonical defects were found in the verified inventory.
- Search Console, analytics, historical WordPress exports, backlink reports,
  and private CDN/server logs remain external operational sources. They must be
  reviewed separately if access becomes available; no additional redirects
  should be invented without evidence of an equivalent destination.

## Next Dependency

None for canonical-domain or verified legacy-URL acceptance. Continue normal
Search Console and analytics observation without inventing redirects that are
not supported by real legacy traffic evidence.
