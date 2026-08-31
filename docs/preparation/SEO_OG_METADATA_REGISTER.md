# SEO And Open Graph Metadata Register

Product: Nobel ITBS Website and Credential Registry  
Scope: Release 1  
Locales: EN, UA, CZ  
Status: copy and social-image implementation complete; Production preview QA pending
Updated: 2026-08-31

## 1. Source Of Truth

Every indexable public locale page has these required fields in its localized
master-copy file:

- `seo_title`;
- `seo_description`;
- `og_title`;
- `og_description`.

Automated coverage check result: **51 of 51 public-page locale files contain all
four fields**.

Metadata must be read from the same localized content record as the visible
page. The frontend must not maintain independent hard-coded metadata copy.

## 2. Public Metadata Inventory

| Page entity | EN URL | UA URL | CZ URL | Master-copy basename |
| --- | --- | --- | --- | --- |
| Home | `/` | `/ua` | `/cz` | `HOME_{locale}_MASTER_COPY.md` |
| Programmes | `/programmes` | `/ua/programmes` | `/cz/programmes` | `PROGRAMMES_CATALOGUE_{locale}_MASTER_COPY.md` |
| Business & Management | `/programmes/business-management` | `/ua/programmes/business-management` | `/cz/programmes/business-management` | `BUSINESS_MANAGEMENT_AREA_{locale}_MASTER_COPY.md` |
| Technology & Innovation | `/programmes/technology-innovation` | `/ua/programmes/technology-innovation` | `/cz/programmes/technology-innovation` | `TECHNOLOGY_INNOVATION_AREA_{locale}_MASTER_COPY.md` |
| Psychology & Human | `/programmes/psychology-human` | `/ua/programmes/psychology-human` | `/cz/programmes/psychology-human` | `PSYCHOLOGY_HUMAN_AREA_{locale}_MASTER_COPY.md` |
| Certificate programme | `/programmes/certificate-programme` | `/ua/programmes/certificate-programme` | `/cz/programmes/certificate-programme` | `CERTIFICATE_PROGRAMME_TYPE_{locale}_MASTER_COPY.md` |
| Mini-MBA | `/programmes/mini-mba` | `/ua/programmes/mini-mba` | `/cz/programmes/mini-mba` | `MINI_MBA_TYPE_{locale}_MASTER_COPY.md` |
| Professional development course | `/programmes/professional-development-course` | `/ua/programmes/professional-development-course` | `/cz/programmes/professional-development-course` | `PROFESSIONAL_DEVELOPMENT_COURSE_TYPE_{locale}_MASTER_COPY.md` |
| AI Production | `/programmes/ai-production` | `/ua/programmes/ai-production` | `/cz/programmes/ai-production` | `AI_PRODUCTION_{locale}_MASTER_COPY.md` |
| General Psychology | `/programmes/general-psychology` | `/ua/programmes/general-psychology` | `/cz/programmes/general-psychology` | `GENERAL_PSYCHOLOGY_{locale}_MASTER_COPY.md` |
| Child Psychology | `/programmes/child-psychology` | `/ua/programmes/child-psychology` | `/cz/programmes/child-psychology` | `CHILD_PSYCHOLOGY_{locale}_MASTER_COPY.md` |
| Neuroplastic Reconstruction | `/programmes/neuroplastic-reconstruction` | `/ua/programmes/neuroplastic-reconstruction` | `/cz/programmes/neuroplastic-reconstruction` | `NEUROPLASTIC_RECONSTRUCTION_{locale}_MASTER_COPY.md` |
| Space Business | `/programmes/space-business` | `/ua/programmes/space-business` | `/cz/programmes/space-business` | `SPACE_BUSINESS_{locale}_MASTER_COPY.md` |
| For Organisations | `/for-organisations` | `/ua/for-organisations` | `/cz/for-organisations` | `FOR_ORGANISATIONS_{locale}_MASTER_COPY.md` |
| Partnerships | `/partnerships` | `/ua/partnerships` | `/cz/partnerships` | `PARTNERSHIPS_{locale}_MASTER_COPY.md` |
| About Us | `/about` | `/ua/about` | `/cz/about` | `ABOUT_US_{locale}_MASTER_COPY.md` |
| Verify Document | `/verify` | `/ua/verify` | `/cz/verify` | `VERIFY_DOCUMENT_{locale}_MASTER_COPY.md` |

`{locale}` maps to file suffix `EN`, `UA`, or `CZ`. Page master copies are in
`docs/preparation/pages`; programme master copies are in
`docs/preparation/programmes`.

## 3. Legal Page Metadata

Legal pages use `noindex, follow`. They are excluded from the XML sitemap and do
not target search keywords. Minimal OG text is provided only for deliberate link
sharing; no campaign-specific OG image is required.

| URL | SEO / OG title | SEO / OG description |
| --- | --- | --- |
| `/terms` | Terms of Use | Terms governing the purchase and use of Nobel ITBS online educational programmes. |
| `/ua/terms` | Умови використання | Умови придбання та використання онлайн-освітніх програм Nobel ITBS. |
| `/cz/terms` | Podmínky používání | Podmínky nákupu a používání online vzdělávacích programů Nobel ITBS. |
| `/refund-policy` | Refund Policy | Rules for withdrawal, complaints, and refunds for Nobel ITBS online programmes. |
| `/ua/refund-policy` | Політика повернення коштів | Правила відмови, розгляду скарг і повернення коштів за онлайн-програми Nobel ITBS. |
| `/cz/refund-policy` | Podmínky vrácení peněz | Pravidla odstoupení, reklamací a vrácení peněz za online programy Nobel ITBS. |
| `/privacy` | Privacy Policy | How Nobel ITBS processes and protects personal data. |
| `/ua/privacy` | Політика конфіденційності | Як Nobel ITBS обробляє та захищає персональні дані. |
| `/cz/privacy` | Zásady ochrany osobních údajů | Jak Nobel ITBS zpracovává a chrání osobní údaje. |

Technical fields for all nine legal URLs:

- `robots`: `noindex, follow`;
- canonical: self-referencing locale URL;
- hreflang: include only lawyer-approved and published locale versions;
- sitemap: excluded.

## 4. System Metadata

404, temporary-error, rate-limit, access-denied, admin, API, and verification
result/token pages use the localized titles from
`SYSTEM_AND_FORM_COPY.md` and `noindex, nofollow`.

No system or verification-result page may include:

- holder or learner data in title, description, OG, or Twitter metadata;
- document number or raw verification token;
- partner, PDF, internal ID, reason, or history;
- success-result details in a generated share preview.

## 5. Open Graph Image Matrix

The approved image matrix is implemented as optimized 1200 × 630 PNG files in
`public/brand/social`. Production social-preview cache validation remains a
post-deploy acceptance step.

Required 1200 × 630 image roles:

| Page group | Image role | Localized text inside image |
| --- | --- | --- |
| Home / About / Partnerships / For Organisations | Nobel ITBS institutional OG | None; use brand and approved visual only |
| Catalogue | programme-catalogue OG | None |
| Programme Areas | one area-specific image per area | None; area name is supplied by OG title |
| Programme Types | one neutral learning-format image | None |
| Programme details | one programme-specific image per programme | Avoid embedded copy; programme title may be used only in approved template |
| Verify Document | neutral document-verification image | No personal or sample document data |
| Legal pages | default brand image or no explicit image | None |

Requirements:

- use the actual programme/product context rather than decorative stock imagery;
- never use a real learner document, QR token, certificate number, or holder;
- image URL must be absolute in production metadata;
- provide `og:image:width=1200`, `og:image:height=630`, and localized alt text;
- use `summary_large_image` for Twitter/X metadata;
- social preview QA must be run after final assets are supplied.

## 6. OG Image Alt Templates

| Locale | Institutional | Programme | Verification |
| --- | --- | --- | --- |
| EN | Nobel ITBS professional education | {programme} programme at Nobel ITBS | Nobel ITBS document verification |
| UA | Професійна освіта Nobel ITBS | Програма {programme} у Nobel ITBS | Перевірка документів Nobel ITBS |
| CZ | Profesní vzdělávání Nobel ITBS | Program {programme} v Nobel ITBS | Ověření dokumentů Nobel ITBS |

Area and type pages substitute the approved canonical area/type display name for
`{programme}`.

## 7. Metadata Implementation Rules

- preserve natural title length; do not truncate content at storage time;
- render one H1 per page independently of the SEO title;
- use localized page title/description for OG and Twitter fields;
- `og:url` equals the page's absolute self-canonical URL;
- `og:locale`: EN `en_GB`, UA `uk_UA`, CZ `cs_CZ`;
- include the other two published locales in `og:locale:alternate`;
- `og:type`: `website` for all Release 1 pages;
- do not use `article`; News/Blog is out of scope;
- update dynamic programme status/date in visible content, not in evergreen SEO
  title unless a separate time-bound campaign is approved.
