# Release 1 SEO URL Map

Status: UA/EN/CZ copy and metadata complete; QA-005 SEO publication implementation accepted locally; production domain acceptance pending
Updated: 2026-08-24
Scope: Release 1 public website  
Languages: EN, UA, CZ

Implementation companions:

- `docs/preparation/SEO_OG_METADATA_REGISTER.md`;
- `docs/preparation/SEO_TECHNICAL_PUBLICATION_SPEC.md`;
- `docs/preparation/SYSTEM_AND_FORM_COPY.md`;
- `docs/preparation/LOCALIZATION_PARITY_QA_2026-07-31.md`.

## 1. Approved Launch Decision

All five programmes launch together:

1. AI Production
2. General Psychology
3. Child Psychology
4. Neuroplastic Reconstruction
5. Space Business

AI Production, General Psychology, Child Psychology, and Neuroplastic Reconstruction are taught in Ukrainian. Space Business is taught in Ukrainian and English.

Every programme must have complete, published presentation content in English, Ukrainian, and Czech at launch. Page locale and instruction language are independent: only Space Business has an English instruction option, and no programme is taught in Czech.

## 2. Locale And Slug Policy

| Language | Code | URL prefix |
| --- | --- | --- |
| English | `en` | none |
| Ukrainian | `ua` | `/ua` |
| Czech | `cz` | `/cz` |

Slug rules:

- one stable Latin slug is shared by all language versions;
- display titles, H1, body copy, metadata, and CTA copy are localized;
- programme, area, and type slugs share the `/programmes/[slug]` namespace;
- every slug in this document is reserved and must remain globally unique;
- a published slug change requires a 301 redirect in all locale paths.

## 3. Core Public URL Map

| Page | EN | UA | CZ | Indexing | Priority |
| --- | --- | --- | --- | --- | --- |
| Home | `/` | `/ua` | `/cz` | index | P0 |
| Programmes catalogue | `/programmes` | `/ua/programmes` | `/cz/programmes` | index | P0 |
| For Organisations | `/for-organisations` | `/ua/for-organisations` | `/cz/for-organisations` | index | P1 |
| Partnerships | `/partnerships` | `/ua/partnerships` | `/cz/partnerships` | index | P1 |
| About Us | `/about` | `/ua/about` | `/cz/about` | index | P1 |
| Verify Document | `/verify` | `/ua/verify` | `/cz/verify` | index | P1 |

Legal URL policy:

| Document | EN | UA | CZ | Indexing |
| --- | --- | --- | --- | --- |
| Terms of Use (Public Contract) | `/terms-of-use` | `/ua/terms-of-use` | `/cz/terms-of-use` | `noindex, follow` |
| Refund Policy | `/refund-policy` | `/ua/refund-policy` | `/cz/refund-policy` | `noindex, follow` |
| Privacy Policy | `/privacy-policy` | `/ua/privacy-policy` | `/cz/privacy-policy` | `noindex, follow` |

Legal pages are excluded from the XML sitemap and use only minimal technical
titles/descriptions where needed. Admin, API, verification result, error,
access-denied, and rate-limit routes are also excluded from indexing.

The product-owner-approved UA Programmes Catalogue master copy, including SEO
and Open Graph metadata, has an EN localization and is ready for CZ localization:

- `docs/preparation/pages/PROGRAMMES_CATALOGUE_UA_MASTER_COPY.md`.
- `docs/preparation/pages/PROGRAMMES_CATALOGUE_EN_MASTER_COPY.md`.

Product-owner-approved UA master copies with page-level SEO and Open Graph
metadata have EN localizations and are ready for CZ localization for:

- For Organisations: `docs/preparation/pages/FOR_ORGANISATIONS_UA_MASTER_COPY.md`;
- Partnerships: `docs/preparation/pages/PARTNERSHIPS_UA_MASTER_COPY.md`;
- Verify Document: `docs/preparation/pages/VERIFY_DOCUMENT_UA_MASTER_COPY.md`.

Corresponding EN master copies use the same base names with `_EN_MASTER_COPY.md`.

## 4. Programme Area URL Map

| Area | Slug | EN | UA | CZ | Priority |
| --- | --- | --- | --- | --- | --- |
| Business & Management | `business-management` | `/programmes/business-management` | `/ua/programmes/business-management` | `/cz/programmes/business-management` | P1 |
| Technology & Innovation | `technology-innovation` | `/programmes/technology-innovation` | `/ua/programmes/technology-innovation` | `/cz/programmes/technology-innovation` | P1 |
| Psychology & Human | `psychology-human` | `/programmes/psychology-human` | `/ua/programmes/psychology-human` | `/cz/programmes/psychology-human` | P1 |

All area pages are indexable and list their related published programmes automatically.

Product-owner-approved UA master copies, including page-level metadata, have EN
localizations and are ready for CZ localization for all three areas:

- `docs/preparation/pages/BUSINESS_MANAGEMENT_AREA_UA_MASTER_COPY.md`;
- `docs/preparation/pages/TECHNOLOGY_INNOVATION_AREA_UA_MASTER_COPY.md`;
- `docs/preparation/pages/PSYCHOLOGY_HUMAN_AREA_UA_MASTER_COPY.md`.

Corresponding EN master copies use the same base names with `_EN_MASTER_COPY.md`.

## 5. Programme Type URL Map

| Type | Slug | EN | UA | CZ | Priority |
| --- | --- | --- | --- | --- | --- |
| Certificate programme | `certificate-programme` | `/programmes/certificate-programme` | `/ua/programmes/certificate-programme` | `/cz/programmes/certificate-programme` | P2 |
| Mini-MBA | `mini-mba` | `/programmes/mini-mba` | `/ua/programmes/mini-mba` | `/cz/programmes/mini-mba` | P2 |
| Professional development course | `professional-development-course` | `/programmes/professional-development-course` | `/ua/programmes/professional-development-course` | `/cz/programmes/professional-development-course` | P2 |

All type pages are indexable and list their related published programmes automatically.

Product-owner-approved UA master copies, including page-level SEO and Open Graph
metadata, have EN localizations and are ready for CZ localization for all three
types:

- `docs/preparation/pages/CERTIFICATE_PROGRAMME_TYPE_UA_MASTER_COPY.md`;
- `docs/preparation/pages/MINI_MBA_TYPE_UA_MASTER_COPY.md`;
- `docs/preparation/pages/PROFESSIONAL_DEVELOPMENT_COURSE_TYPE_UA_MASTER_COPY.md`.

Corresponding EN master copies use the same base names with `_EN_MASTER_COPY.md`.

## 6. Launch Programme URL Map

| Programme | Area | Programme Type | Slug | EN | UA | CZ | Priority |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AI Production | Business & Management | Mini-MBA | `ai-production` | `/programmes/ai-production` | `/ua/programmes/ai-production` | `/cz/programmes/ai-production` | P0 |
| General Psychology | Psychology & Human | Professional development course | `general-psychology` | `/programmes/general-psychology` | `/ua/programmes/general-psychology` | `/cz/programmes/general-psychology` | P0 |
| Child Psychology | Psychology & Human | Professional development course | `child-psychology` | `/programmes/child-psychology` | `/ua/programmes/child-psychology` | `/cz/programmes/child-psychology` | P0 |
| Neuroplastic Reconstruction | Psychology & Human | Professional development course | `neuroplastic-reconstruction` | `/programmes/neuroplastic-reconstruction` | `/ua/programmes/neuroplastic-reconstruction` | `/cz/programmes/neuroplastic-reconstruction` | P0 |
| Space Business | Technology & Innovation | Certificate programme | `space-business` | `/programmes/space-business` | `/ua/programmes/space-business` | `/cz/programmes/space-business` | P0 |

These fifteen localized URLs are launch-blocking and indexable. No programme is marked `Coming soon` solely because its presentation locale differs from its instruction language.

Programme presentation notes:

- AI Production links to the `Mini-MBA` type landing page;
- General Psychology, Child Psychology, and Neuroplastic Reconstruction link to the `Professional development course` type landing page;
- Space Business links to the `Certificate programme` type landing page;
- the UA public category label for `Professional development course` is `Програма професійного підвищення кваліфікації`;
- Programme Type is distinct from the certificate or diploma issued after completion;
- General Psychology, Child Psychology, and Space Business are presented as continuously available distance programmes hosted in Moodle;
- Neuroplastic Reconstruction is the approved short public name;
- formal source-document dates are not included in public copy;
- programme application URLs are intentionally deferred, so the question/contact fallback is used.

## 7. Localized Title Working Set

The English names below are the current source names. UA and CZ names are working editorial translations and require native-language approval before publication.

| Slug | EN | UA working title | CZ working title |
| --- | --- | --- | --- |
| `ai-production` | AI Production | AI Production | AI Production |
| `general-psychology` | General Psychology | Загальна психологія | Obecná psychologie |
| `child-psychology` | Child Psychology | Дитяча психологія | Dětská psychologie |
| `neuroplastic-reconstruction` | Neuroplastic Reconstruction | Нейропластична реконструкція | Neuroplastická rekonstrukce |
| `space-business` | Space Business | Космічний бізнес | Vesmírný byznys |

Localized display titles do not alter the stable slug or canonical cluster.

## 8. Language Of Instruction Presentation

AI Production, General Psychology, Child Psychology, and Neuroplastic Reconstruction use:

| Page locale | Required label/value |
| --- | --- |
| EN | `Language of instruction: Ukrainian` |
| UA | `Мова навчання: українська` |
| CZ | `Jazyk výuky: ukrajinština` |

Space Business uses:

| Page locale | Required label/value |
| --- | --- |
| EN | `Languages of instruction: Ukrainian and English` |
| UA | `Мови навчання: українська та англійська` |
| CZ | `Jazyky výuky: ukrajinština a angličtina` |

This fact must also be reflected accurately in summaries, FAQs, structured data, and any advertising metadata where teaching language is mentioned.

Do not imply Czech-language instruction. Do not imply English-language instruction for any programme except Space Business.

## 9. Canonical And Hreflang Matrix

For every fully translated launch programme:

- EN canonical points to its EN URL;
- UA canonical points to its UA URL;
- CZ canonical points to its CZ URL;
- each page declares `en`, `uk`, `cs`, and `x-default` alternates;
- `x-default` points to the EN URL;
- all three pages must be published together to avoid incomplete hreflang clusters.

Example for AI Production:

| Relation | URL |
| --- | --- |
| canonical on EN | `/programmes/ai-production` |
| canonical on UA | `/ua/programmes/ai-production` |
| canonical on CZ | `/cz/programmes/ai-production` |
| `hreflang=en` | `/programmes/ai-production` |
| `hreflang=uk` | `/ua/programmes/ai-production` |
| `hreflang=cs` | `/cz/programmes/ai-production` |
| `hreflang=x-default` | `/programmes/ai-production` |

## 10. Metadata Rules For Programme Pages

Title pattern:

- EN: `[Programme Name] | Nobel ITBS`
- UA: `[Назва програми] | Nobel ITBS`
- CZ: `[Název programu] | Nobel ITBS`

Description requirements:

- identify the programme's core professional value;
- name the intended audience or outcome;
- state that instruction is in Ukrainian when language context is material;
- avoid implying an EN/CZ instruction version;
- remain equivalent in claims across locales;
- use a unique description for each programme and locale.

Each programme page requires localized:

- display title and H1;
- SEO title and description;
- hero value proposition;
- audience and outcomes;
- curriculum/modules;
- format, duration, and actual instruction language or languages;
- document issued;
- pricing, where configured;
- FAQ, where configured;
- CTA and question-form copy;
- Open Graph title, description, and alt text.

## 11. SEO Production Order

1. P0: five programme briefs with verified facts and approved source names.
2. P0: UA master sales copy for each programme because instruction and source materials are Ukrainian.
3. P0: EN and CZ localization from the approved factual master.
4. P0: metadata and Open Graph copy for all fifteen programme URLs.
5. P0: programme catalogue copy in EN, UA, and CZ.
6. P1: three Programme Area landing pages in EN, UA, and CZ.
7. P2: three Programme Type landing pages in EN, UA, and CZ.
8. QA: factual parity, language-of-instruction clarity, canonical, hreflang, internal links, and sitemap inclusion.

The UA factual master recommendation does not change the site's English fallback rule. It remains the content-production workflow, including for bilingual Space Business.

## 12. Implementation Dependency

The v2 sitemap requires instruction language for programme presentation and future filtering. The current `programmes` schema draft includes `format` but does not yet define an instruction-language field or relation.

Before PRG-003 is implemented, the technical specification must choose a multilingual-capable data shape, preferably a relation or array that can support one or more instruction languages without storing the page locale as the instruction language.

This is a specification alignment item, not authorization to expand public Release 1 filters.

## 13. Approval Checklist

- five launch programme names are approved;
- five proposed stable slugs are approved before implementation;
- instruction languages are confirmed as Ukrainian for four programmes and Ukrainian/English for Space Business;
- all fifteen localized programme URLs are required for launch;
- UA and CZ display titles receive native-language approval;
- each programme has one verified factual brief;
- metadata does not misrepresent instruction language;
- all launch programme hreflang clusters contain `en`, `uk`, `cs`, and `x-default`;
- PRG-003 data model stores instruction language independently from page locale;
- programme application routes use Leeloo or an approved partner website; question/contact fallback is used until a required URL is supplied.
