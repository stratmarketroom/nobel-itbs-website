# SEO Preparation Brief

Product: Nobel ITBS Website and Credential Registry
Stage: Release 1 SEO preparation
Status: SEO/OG copy and technical publication decisions complete; implementation pending
Updated: 2026-07-31

## 1. SEO Goal

Release 1 SEO should make Nobel ITBS discoverable as a Czech/EU professional education company and make programme pages understandable to search engines and prospective learners.

SEO must support sales-oriented programme discovery, not a blog/content-marketing strategy.

## 2. Scope

In scope:

- Home metadata;
- Programmes catalogue metadata;
- Programme Area landing page metadata;
- Programme Type landing page metadata;
- Programme detail metadata;
- About Us, Partnerships, For Organisations, and Verify page metadata;
- minimal technical titles and descriptions for noindex legal pages;
- canonical and hreflang rules for EN/UA/CZ;
- XML sitemap rules;
- robots.txt rules;
- Open Graph/Twitter metadata templates;
- 301 redirect requirements for published programme slug changes.

Out of scope:

- News/Blog;
- public programme filters;
- public PDF indexing;
- learner or credential PII indexing;
- public verification result indexing;
- automated SEO article generation.

## 3. URL Model

Languages:

- English: no prefix;
- Ukrainian: `/ua`;
- Czech: `/cz`.

Core public URLs:

- `/`
- `/ua`
- `/cz`
- `/programmes`
- `/ua/programmes`
- `/cz/programmes`
- `/programmes/[slug]`
- `/ua/programmes/[slug]`
- `/cz/programmes/[slug]`
- `/for-organisations`
- `/ua/for-organisations`
- `/cz/for-organisations`
- `/partnerships`
- `/ua/partnerships`
- `/cz/partnerships`
- `/about`
- `/ua/about`
- `/cz/about`
- `/verify`
- `/ua/verify`
- `/cz/verify`
- `/verify/[token]`

The QR verification URL `/verify/[token]` is language-neutral. It should not expose token internals in metadata.

## 4. Indexing Policy

Index:

- Home;
- public content pages;
- programme catalogue;
- programme area landing pages;
- programme type landing pages;
- published programme detail pages;

Noindex:

- Privacy Policy, Terms of Use (Public Contract), and Refund Policy pages in all
  locales;
- `/verify/[token]` result pages;
- verification result states;
- admin routes;
- API routes;
- temporary errors;
- access denied pages;
- rate limited pages.

## 5. Canonical And Hreflang

Canonical:

- each language page should canonicalize to itself when translated/published;
- UA/CZ fallback pages should still render content, but canonical behavior needs implementation decision based on CMS translation status;
- English is the fallback language and should remain the canonical source when a translation is missing or draft.

Hreflang:

- include `en`, `uk`, `cs`, and `x-default` for translated public pages;
- `x-default` should point to the English URL;
- only include alternate language URLs that are public and routable.
- all five launch programme pages must publish complete EN, UA, and CZ content, so their hreflang clusters include all three language URLs from launch;
- the language of a presentation page must not be confused with the language of instruction.

Open decision:

- when UA/CZ fall back silently to English, should hreflang include those URLs before translations are published? Recommended: no, to avoid duplicate-language alternates until real translations exist.

## 6. Metadata Templates

### Home

SEO title pattern:

- `Nobel ITBS | Professional Education and Verifiable Credentials`

Description intent:

- Czech/EU professional education, international programmes, Leeloo application path, verifiable credentials.

### Programmes Catalogue

SEO title pattern:

- `Professional Programmes | Nobel ITBS`

Description intent:

- browse professional education programmes in business, technology, innovation, and psychology/human development.

### Programme Area Landing

SEO title pattern:

- `[Area Name] Programmes | Nobel ITBS`

Description intent:

- describe the area, its professional value, and link to related programmes.

Required fields:

- H1;
- SEO title;
- SEO description;
- intro text;
- related area;
- automatic related programme list.

### Programme Type Landing

SEO title pattern:

- `[Programme Type] | Nobel ITBS`

Description intent:

- explain the document/learning format and list matching programmes.

Required fields:

- H1;
- SEO title;
- SEO description;
- intro text;
- related type;
- automatic related programme list.

### Programme Detail

SEO title pattern:

- `[Programme Name] | Nobel ITBS`

Description intent:

- specific programme value, audience, outcomes, format, document issued, and application path.

Required fields:

- title;
- short description;
- structured sales sections;
- SEO title;
- SEO description;
- programme area;
- programme type;
- language/format fields where available;
- Leeloo CTA URL when supplied, otherwise explicit question/contact fallback mode.

Launch Programme Type rule:

- AI Production: `Mini-MBA`;
- General Psychology: `Professional development course`;
- Child Psychology: `Professional development course`;
- Neuroplastic Reconstruction: `Professional development course`;
- Space Business: `Certificate programme`;
- programme type and credential/document type are separate metadata concepts and must not be substituted for one another.

Launch programme language rule:

- AI Production, General Psychology, Child Psychology, and Neuroplastic Reconstruction are taught in Ukrainian;
- for those four programmes, EN pages state `Language of instruction: Ukrainian`, UA pages state `Мова навчання: українська`, and CZ pages state `Jazyk výuky: ukrajinština`;
- Space Business is taught in Ukrainian and English;
- Space Business EN pages state `Languages of instruction: Ukrainian and English`, UA pages state `Мови навчання: українська та англійська`, and CZ pages state `Jazyky výuky: ukrajinština a angličtina`;
- metadata must not imply Czech-language instruction or an English-language delivery option for programmes other than Space Business.

### Verify Document

SEO title pattern:

- `Verify a Document | Nobel ITBS`

Description intent:

- check a Nobel ITBS document by document number or QR code.

Important:

- do not imply name/surname lookup;
- do not imply public PDF download;
- do not index result pages.

## 7. Keyword Clusters

Primary brand cluster:

- Nobel ITBS;
- Nobel ITBS s.r.o.;
- Nobel ITBS Czech Republic;
- Nobel ITBS professional education.

Institutional cluster:

- professional education in Europe;
- Czech professional education;
- international business school Czech Republic;
- verifiable educational credentials.

Programme area clusters:

- business and management programmes;
- technology and innovation programmes;
- psychology and human development programmes.

Programme type clusters:

- certificate programme;
- Mini-MBA;
- professional development course.

Approved launch programme clusters:

- AI Production programme;
- General Psychology programme;
- Child Psychology programme;
- Neuroplastic Reconstruction programme;
- Space Business programme.

## 8. Slug Rules

Shared namespace:

- Programme Areas, Programme Types, and Programmes share `/programmes/[slug]`.

Required behavior:

- slugs must be globally unique in this namespace;
- published slug changes create automatic 301 redirects;
- redirects must preserve language prefix behavior where possible;
- redirects must not send users to Home as a fallback.

Proposed stable launch slugs:

- `business-management`
- `technology-innovation`
- `psychology-human`
- `certificate-programme`
- `mini-mba`
- `professional-development-course`
- `ai-production`
- `general-psychology`
- `child-psychology`
- `neuroplastic-reconstruction`
- `space-business`

## 9. Open Graph Rules

Recommended defaults:

- use brand logo or approved hero graphic for generic pages;
- use programme-specific visuals for programme detail pages when available;
- no stock-like or decorative-only OG images for programme detail pages;
- no credential, learner, or verification result details in OG metadata.

OG title should usually match SEO title.

OG description should be shorter and more action-oriented than meta description.

## 10. Sitemap Rules

Include:

- published public pages;
- published programme catalogue;
- published programme area/type landing pages;
- published programme details;

Exclude:

- all legal policy pages;
- admin;
- API;
- verification token URLs;
- non-published draft translations;
- hidden pages;
- public form POST endpoints.

Legal pages use `noindex, follow`, remain directly accessible to users and
checkout flows, and are excluded from the XML sitemap. They require only a clear
localized page title and optional minimal description; keyword targeting, rich
SEO copy, Open Graph campaigns, and search landing-page optimisation are not
required.

## 11. Robots Rules

Disallow:

- `/admin`
- `/api`
- verification result token paths if feasible via page-level noindex as primary control.

Allow:

- public content and programme pages.

## 12. SEO Acceptance Checklist

- URL map exists for EN, UA, and CZ.
- Each public page type has metadata rules.
- Canonical and hreflang behavior is approved.
- Sitemap inclusion/exclusion rules are approved.
- Verification result pages are noindex.
- Admin and API routes are not indexable.
- Programme slug collision prevention is implemented in PRG-007.
- Published slug changes create 301 redirects in PRG-008.
- No SEO plan depends on News/Blog.
- No public verification SEO exposes PII or credential details.

## 13. Resolved And External Dependencies

Resolved:

1. UA/CZ fallback-only URLs do not appear in hreflang or sitemap and canonicalise
   to the corresponding English URL until a real translation is published.
2. All 17 public page entities have EN/UA/CZ metadata and enter complete
   hreflang clusters at launch.
3. Verified legacy paths and redirect destinations are recorded in
   `SEO_TECHNICAL_PUBLICATION_SPEC.md`.

External dependencies:

- analytics and Search Console ownership/access;
- Search Console, server/CDN log, Tilda export, and old WordPress sitemap audit
  before cutover;
- final OG image assets and social-preview QA.
