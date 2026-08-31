# SEO Technical Publication Specification

Product: Nobel ITBS Website and Credential Registry  
Scope: canonical, hreflang, sitemap, robots, and redirects for Release 1  
Canonical origin: `https://nobel-itbs.eu`  
Status: implementation, Production legacy-URL, and canonical host/protocol acceptance complete
Updated: 2026-08-31

Implementation note: `QA-005-SEO-001` completed the publication layer on
2026-08-24. The implemented legal routes are `/terms-of-use` and
`/privacy-policy`, matching the current Release 1 application, rather than the
older working destinations `/terms` and `/privacy` below. Legacy sources now
redirect directly to those current routes. `/contacts-en/` redirects to
`/about` because the current About page has no stable `#contact` anchor. See
`docs/qa/QA_005_SEO_PUBLICATION_2026-08-24.md`.

Cutover follow-up note: the live Tilda sitemap was re-audited on 2026-08-30
before DNS attachment. It exposed two current legacy URLs that were absent from
the earlier inventory: `/tracks` and `/works`. The former consolidates into the
Release 1 programme catalogue; the latter consolidates into About, whose
current structured content covers how Nobel ITBS works, its educational
approach, and its audiences. Both now use direct permanent redirects. See
`docs/qa/QA_005_SEO_CUTOVER_2026-08-30.md`.

Canonical-edge acceptance update: on 2026-08-31 the live matrix confirmed
`https://nobel-itbs.eu/` returns `200`, `http://nobel-itbs.eu/` redirects to it
with `308`, and both `http://www.nobel-itbs.eu/` and
`https://www.nobel-itbs.eu/` redirect to it with one direct `301`. The domain
and the required host/protocol normalization are therefore accepted.

## 1. Canonical Host And URL Normalisation

Canonical origin:

`https://nobel-itbs.eu`

Permanent host/protocol redirects:

- `http://nobel-itbs.eu/*` → `https://nobel-itbs.eu/*`;
- `http://www.nobel-itbs.eu/*` → `https://nobel-itbs.eu/*`;
- `https://www.nobel-itbs.eu/*` → `https://nobel-itbs.eu/*`.

Path rules:

- lowercase stable Latin slugs;
- no trailing slash except `/`;
- one redirect hop from a non-canonical URL to its final destination;
- preserve valid query parameters such as UTM parameters;
- never place raw verification tokens in logs, metadata, sitemap, or redirect
  diagnostics;
- do not redirect unknown content URLs to Home as a generic fallback.

## 2. Locale URL Policy

| Content language | Internal locale code | URL prefix | hreflang |
| --- | --- | --- | --- |
| English | `en` | none | `en` |
| Ukrainian | `ua` | `/ua` | `uk` |
| Czech | `cz` | `/cz` | `cs` |

Locale alias redirects:

- `/en` → `/`;
- `/en/{path}` → `/{path}`;
- `/uk` → `/ua`;
- `/uk/{path}` → `/ua/{path}`;
- `/cs` → `/cz`;
- `/cs/{path}` → `/cz/{path}`.

These aliases are routing conveniences only. Generated links must always use
the canonical URL prefix model.

## 3. Canonical Decision Matrix

### Published Translation

When the requested locale translation is approved and published:

- EN page canonicalises to its EN URL;
- UA page canonicalises to its UA URL;
- CZ page canonicalises to its CZ URL.

Example for Space Business:

| Page | Canonical |
| --- | --- |
| `/programmes/space-business` | `https://nobel-itbs.eu/programmes/space-business` |
| `/ua/programmes/space-business` | `https://nobel-itbs.eu/ua/programmes/space-business` |
| `/cz/programmes/space-business` | `https://nobel-itbs.eu/cz/programmes/space-business` |

### Missing Or Draft Translation

The route may silently render English fallback according to the product rule,
but it is not treated as a separate translated search result:

- canonical points to the corresponding English URL;
- the fallback URL is omitted from hreflang;
- the fallback URL is omitted from the XML sitemap;
- `html lang` reflects the rendered content language (`en`), not the requested
  URL locale;
- after the real translation is published, canonical becomes self-referencing
  and the locale URL joins hreflang and sitemap.

All 17 approved Release 1 public page entities currently have EN, UA, and CZ
copy, so launch clusters are expected to use self-canonical URLs in all three
locales.

### Non-Indexable Pages

- legal pages: self-canonical plus `noindex, follow`;
- verification token/results: self-canonical without query/result data plus
  `noindex, nofollow`;
- 404, rate limit, temporary error, access denied: no canonical requirement,
  `noindex, nofollow`;
- admin and API: no public canonical, excluded from indexing.

## 4. Hreflang Rules

Every approved, published three-language public cluster outputs four alternate
links:

```html
<link rel="alternate" hreflang="en" href="https://nobel-itbs.eu/{en-path}" />
<link rel="alternate" hreflang="uk" href="https://nobel-itbs.eu/ua/{path}" />
<link rel="alternate" hreflang="cs" href="https://nobel-itbs.eu/cz/{path}" />
<link rel="alternate" hreflang="x-default" href="https://nobel-itbs.eu/{en-path}" />
```

Home is the special case where EN path is `/`, UA is `/ua`, and CZ is `/cz`.

Rules:

- alternates are reciprocal across every URL in the cluster;
- use absolute HTTPS URLs;
- use `uk`, not `ua`, and `cs`, not `cz`, in hreflang;
- `x-default` always points to the English page;
- include only approved, published, routable translations;
- page locale does not describe programme instruction language;
- do not emit hreflang for 404, admin, API, verification-result, rate-limit, or
  temporary-error pages;
- legal pages may use hreflang only after all referenced legal locale versions
  are lawyer-approved and published.

## 5. HTML Language And Locale Metadata

| Locale | `<html lang>` | `og:locale` |
| --- | --- | --- |
| EN | `en` | `en_GB` |
| UA | `uk` | `uk_UA` |
| CZ | `cs` | `cs_CZ` |

Each translated page includes the other published locales via
`og:locale:alternate`.

## 6. XML Sitemap

Production endpoint:

`https://nobel-itbs.eu/sitemap.xml`

Release 1 uses one dynamically generated sitemap. Expected launch inventory:

- 17 indexable page entities;
- 3 published locale URLs per entity;
- **51 URLs total**.

Included:

- Home;
- Programmes catalogue;
- three Programme Area pages;
- three Programme Type pages;
- five programme detail pages;
- For Organisations;
- Partnerships;
- About Us;
- manual Verify Document page.

Every sitemap URL:

- is an absolute canonical URL;
- returns `200` without redirect;
- is approved and published in that locale;
- includes reciprocal `xhtml:link` alternates for `en`, `uk`, `cs`, and
  `x-default`;
- uses `lastmod` only when based on the actual public content update time.

Do not emit `changefreq` or artificial `priority` values.

Excluded:

- Terms, Refund Policy, and Privacy Policy;
- `/verify/[token]` and every result state;
- admin and API routes;
- form POST endpoints;
- drafts, hidden pages, preview URLs, and fallback-only translations;
- 404, rate-limit, temporary-error, and access-denied routes;
- Leeloo, Moodle, Stripe, or other external URLs.

Example sitemap cluster:

```xml
<url>
  <loc>https://nobel-itbs.eu/programmes/space-business</loc>
  <xhtml:link rel="alternate" hreflang="en" href="https://nobel-itbs.eu/programmes/space-business" />
  <xhtml:link rel="alternate" hreflang="uk" href="https://nobel-itbs.eu/ua/programmes/space-business" />
  <xhtml:link rel="alternate" hreflang="cs" href="https://nobel-itbs.eu/cz/programmes/space-business" />
  <xhtml:link rel="alternate" hreflang="x-default" href="https://nobel-itbs.eu/programmes/space-business" />
</url>
```

The root element must declare
`xmlns:xhtml="http://www.w3.org/1999/xhtml"`.

## 7. Robots Policy

`robots.txt`:

```txt
User-agent: *
Disallow: /admin/
Disallow: /api/

Sitemap: https://nobel-itbs.eu/sitemap.xml
```

Rules:

- page-level robots metadata is the primary indexing control for legal and
  verification-result pages;
- do not expose private routes in sitemap;
- robots rules are not a security boundary;
- do not block public assets needed to render indexable pages.

## 8. Verified Legacy Redirect Inventory

The following paths were observed on the public legacy site during the
preparation audit. Implement permanent redirects at the same domain during the
new-site cutover.

| Legacy path | Release 1 destination | Response | Reason |
| --- | --- | --- | --- |
| `/human` | `/programmes/psychology-human` | 301 | renamed Programme Area |
| `/tech` | `/programmes/technology-innovation` | 301 | renamed Programme Area |
| `/business` | `/programmes/business-management` | 301 | Programme Area URL model |
| `/tracks` | `/programmes` | 301 | current Tilda learning-direction index consolidates into the Release 1 catalogue |
| `/works` | `/about` | 301 | current Tilda process/audience content consolidates into the structured About page |
| `/aboutus` | `/about` | 301 | current Tilda About URL |
| `/about-us-en/` | `/about` | 301 | older WordPress About URL |
| `/course-en/` | `/programmes/space-business` | 301 | older Space Business page |
| `/contacts-en/` | `/about` | 301 | no standalone Contact page or stable contact anchor in Release 1 |
| `/termsofservice` | `/terms-of-use` | 301 | current Tilda legal URL; aligned with the implemented Release 1 route |
| `/terms/` | `/terms-of-use` | 301 | older WordPress legal URL; aligned with the implemented Release 1 route |
| `/refund` | `/refund-policy` | 301 | current Tilda legal URL |
| `/refund/` | `/refund-policy` | 301 | older WordPress legal URL |
| `/privacypolicy` | `/privacy-policy` | 301 | current Tilda legal URL; aligned with the implemented Release 1 route |
| `/privacy/` | `/privacy-policy` | 301 | older WordPress legal URL; aligned with the implemented Release 1 route |
| `/home-page-2/` | `/` | 301 | older WordPress home URL |
| `/blog-en/` | none | 410 | News/Blog is intentionally out of Release 1 |

The current About page has no stable `#contact` anchor, so `/contacts-en/`
redirects directly to `/about` as recorded in the implementation note above.

Do not redirect removed Blog articles or unknown legacy URLs to Home. Return a
useful localized 404, or `410 Gone` for URLs confirmed as intentionally removed.

## 9. Unverified Legacy Candidates

Before production cutover, inspect Search Console, analytics, server/CDN logs,
the Tilda export, and the previous WordPress sitemap for:

- additional Space Business language paths;
- individual old Blog article URLs;
- old course/category pagination;
- `old.nobel-itbs.eu` URLs;
- query-based or duplicated legal-page URLs;
- mixed trailing-slash and case variants.

Add redirects only when the source URL and a genuinely equivalent destination
are known. Do not invent redirects solely to reduce 404 counts.

## 10. Future Published Slug Changes

Programme Areas, Programme Types, and Programmes share the
`/programmes/[slug]` namespace.

When a published slug changes:

1. reserve the previous slug in `programme_slug_redirects`;
2. create one mapping from old slug to current slug;
3. apply the mapping to EN, UA, and CZ paths;
4. return `301` directly to the final current URL;
5. prevent loops and redirect chains;
6. never reuse a historical slug for a different entity;
7. update canonical, hreflang, sitemap, internal links, and OG URL atomically.

Example:

- `/programmes/old-slug` → `/programmes/new-slug`;
- `/ua/programmes/old-slug` → `/ua/programmes/new-slug`;
- `/cz/programmes/old-slug` → `/cz/programmes/new-slug`.

## 11. Redirect QA

For every redirect verify:

- expected 301 or 410 status;
- one hop only;
- destination returns 200;
- locale is preserved where a locale-specific source exists;
- query parameters are handled intentionally;
- canonical points to destination itself;
- source URL is absent from sitemap and internal links;
- no redirect exposes a raw verification token or private parameter.
