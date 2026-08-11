# Preparation Stage Plan

Product: Nobel ITBS Website and Credential Registry
Stage: SEO, UI design system, copy, and launch materials
Status: product decisions synchronized; remaining preparation deliverables in progress
Updated: 2026-07-31

## 1. Purpose

This preparation stage turns the approved Release 1 product scope into practical inputs for implementation tickets.

The goal is to prepare:

- SEO strategy and URL/content metadata rules;
- UI design system direction for public and admin surfaces;
- page-by-page copy structure;
- brand, programme, trust, legal, and credential materials;
- open product decisions that must be resolved before broad public-site implementation.

This document does not expand Release 1 scope. It organizes work needed before Stage 3 and Stage 4 implementation.

## 2. Source Baseline

Primary source of truth:

- `AGENTS.md`
- `docs/README.md`
- `docs/product/PRODUCT_DECISIONS_SPEC_ALIGNMENT_v2.md`
- `docs/product/RELEASE_1_SCOPE_v2.md`
- `docs/product/SITEMAP_AND_USER_FLOWS_v2.md`
- `docs/design/DESIGN_GUIDELINES.md`
- `.agents/context/PRODUCT.md`
- `.agents/context/DESIGN.md`

Important scope guards:

- No News/Blog in Release 1.
- No public programme filters in Release 1.
- No LMS, student cabinet, payment module, or CRM.
- Public verification supports QR token and document number only.
- No public PDF download.
- Partners must never appear in credential verification.
- Public pages use EN, UA, and CZ URL model: English no prefix, Ukrainian `/ua`, Czech `/cz`.

## 3. Current State Summary

Completed foundation:

- Supabase/Auth/MFA/admin-user foundation is documented as implemented.
- Public Next.js scaffold exists.
- Home prototype exists for `/`, `/ua`, and `/cz`.
- Project brand assets exist under `public/brand/`.
- Product/design context files exist under `.agents/context/`.

Not ready yet:

- No full public sitemap implementation.
- No structured content model implementation.
- No programme catalogue/detail implementation.
- No public verification page implementation.
- No full SEO strategy document.
- No reusable UI design system specification beyond guidelines/context.
- No final copy deck or asset checklist for Release 1 pages.

## 4. Preparation Workstreams

### Workstream A: Product Decisions

Goal:

- resolve naming, content, CTA, trust, and legal questions before SEO and copy harden.

Deliverables:

- decision log for open items;
- approved page list;
- approved programme area labels;
- approved launch programme list;
- approved trust proof points.

Resolved product decision:

- the third programme area is `Psychology & Human` with the slug `psychology-human`.
- all five launch programmes are approved for simultaneous launch: AI Production, General Psychology, Child Psychology, Neuroplastic Reconstruction, and Space Business;
- AI Production, General Psychology, Child Psychology, and Neuroplastic Reconstruction are taught in Ukrainian;
- Space Business is taught in Ukrainian and English;
- every programme must have complete published presentation content in English, Ukrainian, and Czech at launch.
- AI Production uses `Mini-MBA` as its primary Programme Type;
- General Psychology, Child Psychology, and Neuroplastic Reconstruction use `Professional development course` as their Programme Type; the approved Ukrainian public category label is `Програма професійного підвищення кваліфікації`;
- certificates issued after completion are credential outcomes and do not change the Programme Type;
- AI Production is a 6-month, 360-hour / 12 ECTS programme with a 3-month university-certificate milestone for 180 hours / 6 ECTS and a 6-month Nobel ITBS Mini-MBA diploma milestone;
- AI Production public wording for the international Mini-MBA diploma, EQF Level 7 competence alignment, and possible credit toward a full MBA is product-owner approved; specific admission and academic-recognition rules remain a publication dependency;
- AI Production hours and learning results may be credited toward a full MBA subject to admission and recognition rules;
- Neuroplastic Reconstruction remains the short public name;
- Nobel ITBS has two complementary business goals: own/co-created professional education and infrastructure for partner programmes with properly issued, supplemented, registered, and verifiable documents;
- Neuroplastic Reconstruction is a partner programme with 12 confirmed public modules; Nobel ITBS provides its document and credential infrastructure, and a supplement accompanies the university certificate;
- Neuroplastic Reconstruction starts on 5 October; current landing tariffs and inclusions are confirmed, including CPD UK and MNR consultant status for Master and VIP;
- Space Business is a Certificate programme and issues a certificate;
- General Psychology, Child Psychology, and Space Business are continuously available distance programmes hosted in Moodle;
- Child Psychology is a distance theoretical programme without practical classes, placement, internship, clinic practice, or client work; the University of Alfred Nobel Mental Health Clinic is the programme-development base only;
- formal dates from source programme documents are excluded from public copy;
- programme application URLs may use Leeloo or an approved partner website and are not required for the current content pass where the question fallback is used.

### Workstream B: SEO

Goal:

- create a practical SEO foundation for Release 1 public pages without adding blog scope.

Deliverables:

- URL map for EN/UA/CZ;
- keyword clusters;
- metadata templates;
- canonical and hreflang policy;
- sitemap and robots rules;
- OG/social preview rules;
- redirect strategy.

Primary document:

- `docs/preparation/SEO_PREPARATION_BRIEF.md`

### Workstream C: UI Design System

Goal:

- turn design guidelines and current prototype direction into a reusable design system for public and admin UI.

Deliverables:

- token map;
- component inventory;
- page template inventory;
- public/admin register split;
- accessibility and responsive rules;
- verification state UI rules.

Primary document:

- `docs/preparation/UI_DESIGN_SYSTEM_BRIEF.md`

### Workstream D: Copy And Materials

Goal:

- define what text and assets are needed for each Release 1 page before implementation.

Deliverables:

- page-by-page content inventory;
- EN master-copy workflow;
- UA/CZ adaptation workflow;
- programme content templates;
- material checklist for logos, experts, partners, legal data, Leeloo links, and credential examples.

Primary document:

- `docs/preparation/CONTENT_AND_MATERIALS_INVENTORY.md`

## 5. Recommended Sequence

1. Resolve product naming and launch-content decisions.
2. Approve public sitemap and page inventory.
3. Build SEO URL and metadata plan.
4. Build UI design system brief and public/admin component inventory.
5. Draft EN master copy for core pages.
6. Draft UA factual master copy for launch programmes and approve claims.
7. Prepare complete EN/CZ programme localizations and the remaining UA/CZ localization pass.
8. Collect required materials and mark placeholders.
9. Convert approved preparation documents into scoped CNT/PRG implementation tickets.

## 6. Implementation Tie-In

The preparation stage feeds these Release 1 ticket groups:

- CNT-001 Languages
- CNT-002 Structured Content Pages
- CNT-003 Public Layout and Navigation
- CNT-004 Site Settings
- CNT-005 Legal Pages
- PRG-001 Programme Areas
- PRG-002 Programme Types
- PRG-003 Programme Core
- PRG-006 Programme Catalogue
- PRG-007 SEO Landing Pages
- PRG-008 Slug Redirects
- PRG-009 Programme Question Form
- PCE-001 Partners
- PCE-002 Experts
- PCE-003 Partnerships Page

## 7. Acceptance Gates

Preparation is ready to feed implementation when:

- programme area names are approved;
- launch programme names and slugs are approved;
- page inventory is approved;
- required SEO fields are defined for every public page type;
- metadata templates exist for every public page type;
- UI tokens and components are defined;
- page templates are defined;
- EN copy status is clear for every page;
- UA/CZ translation status is clear for every page;
- asset ownership and placeholder policy are clear;
- legal/company details needed for public pages are collected or explicitly marked missing.

## 8. Open Questions

1. Which partner and accreditation names/logos are approved for public display?
2. Which analytics provider is approved, if any, for Release 1 events?

Resolved legal-page decision: Privacy Policy, Terms of Use (Public Contract),
and Refund Policy are mandatory full website pages in EN, UA, and CZ. The
supplied CZ and EN texts may be translated into Ukrainian. Release 1 has no
separate Cookie Policy page and uses a minimal localized cookie block with
`Accept` / `Decline` actions. The full Cookie Policy follows after legal review.
