# UA / EN / CZ Parity QA

Product: Nobel ITBS Website and Credential Registry  
Date: 2026-07-31  
Scope: Release 1 public copy, metadata, forms, and system states  
Result: **PASS for internal factual/content parity**  
External gates: Czech native-language review; UA legal review by Czech counsel

## 1. Coverage

| Locale | Shared/page master copies | Programme master copies | Total |
| --- | ---: | ---: | ---: |
| UA | 12 | 5 | 17 |
| EN | 12 | 5 | 17 |
| CZ | 12 | 5 | 17 |

The 12 shared/page entities are Home, Catalogue, three Programme Areas, three
Programme Types, For Organisations, Partnerships, About Us, and Verify Document.

Metadata coverage:

- 51/51 public locale files contain `seo_title`;
- 51/51 contain `seo_description`;
- 51/51 contain `og_title`;
- 51/51 contain `og_description`.
- Unicode-aware length QA found no title or description above the working limits
  of 65 characters for SEO titles, 180 for SEO descriptions, 80 for OG titles,
  and 200 for OG descriptions.

System/form coverage:

- four contact-submission types have EN/UA/CZ copy;
- shared validation, success, rate-limit, CAPTCHA, connection, and temporary
  error states have EN/UA/CZ copy;
- 404, rate-limit, temporary-error, and admin-access-denied pages have EN/UA/CZ
  copy.

## 2. Entity Parity Matrix

| Entity | UA | EN | CZ | Result |
| --- | --- | --- | --- | --- |
| Home | complete | complete | complete | pass |
| Programmes Catalogue | complete | complete | complete | pass |
| Business & Management | complete | complete | complete | pass |
| Technology & Innovation | complete | complete | complete | pass |
| Psychology & Human | complete | complete | complete | pass |
| Certificate programme | complete | complete | complete | pass |
| Mini-MBA | complete | complete | complete | pass |
| Professional development course | complete | complete | complete | pass |
| AI Production | complete | complete | complete | pass |
| General Psychology | complete | complete | complete | pass |
| Child Psychology | complete | complete | complete | pass |
| Neuroplastic Reconstruction | complete | complete | complete | pass |
| Space Business | complete | complete | complete | pass |
| For Organisations | complete | complete | complete | pass |
| Partnerships | complete | complete | complete | pass |
| About Us | complete | complete | complete | pass |
| Verify Document | complete | complete | complete | pass |

`complete` means the public information and claims are equivalent. Localized
wording and sentence structure are intentionally not literal translations.

## 3. Programme Fact Checks

### AI Production

- Programme Area: Business & Management;
- Programme Type: Mini-MBA;
- instruction language: Ukrainian in all presentations;
- 6 months; 360 hours / 12 ECTS;
- after 3 months: University certificate, 180 hours / 6 ECTS;
- after 6 months: Nobel ITBS `Mini-MBA | Professional Development` diploma and
  Diploma Supplement;
- EQF wording remains competence alignment, not an awarded EQF qualification;
- possible MBA credit remains subject to admission and recognition rules.

Result: pass.

### General Psychology

- Psychology & Human;
- Professional development course;
- Ukrainian instruction;
- continuously available, asynchronous Moodle format;
- 90 hours / 3 ECTS; 1-year access;
- University professional development certificate;
- no claim that the programme alone qualifies a psychologist.

Result: pass.

### Child Psychology

- Psychology & Human;
- Professional development course;
- Ukrainian instruction;
- continuously available, asynchronous Moodle format;
- 90 hours / 3 ECTS; 6-month access;
- University professional development certificate;
- no practical classes, placement, internship, Clinic practice, or client work;
- the Clinic is described only as the programme-development base.

Result: pass.

### Neuroplastic Reconstruction

- Psychology & Human;
- Professional development course;
- Ukrainian instruction;
- 3 months / 12 weeks; 180 hours / 6 ECTS; 12 modules;
- current cohort start: 5 October;
- package pricing and access periods remain equivalent;
- Personal package has no certification documents or consultant status;
- Master/VIP include the University certificate and supplement, CPD UK, and MNR
  consultant status after requirements are met;
- consultant status is not presented as the profession of psychologist,
  psychotherapist, or medical practitioner.

Result: pass.

### Space Business

- Technology & Innovation;
- Certificate programme;
- Ukrainian and English instruction;
- Czech is a presentation locale, not an instruction option;
- continuously available Moodle format; 90 hours;
- eight modules and project consultation;
- completion document: certificate.

Result: pass.

## 4. Shared Product Rule Checks

- canonical Programme Area labels are identical in every locale;
- stable slugs do not change with localized display titles;
- Programme Type is separate from the completion document;
- EN/CZ page locale never implies instruction in that language;
- For Organisations sells infrastructure, not courses or team training;
- partner participation is programme-specific and never shown in verification;
- no public PDF download or name/email/phone verification;
- no News/Blog content in Release 1;
- dynamic status, price, and date are treated as current-data fields.

Result: pass.

## 5. Verification State Checks

| Internal/public condition | EN | UA | CZ | Details visible |
| --- | --- | --- | --- | --- |
| valid | Valid | Дійсний | Platný | approved minimal fields only |
| revoked | Revoked | Відкликаний | Odvolaný | no |
| pending | Not found | Не знайдено | Nenalezen | no |
| voided | Not found | Не знайдено | Nenalezen | no |
| invalid token / missing | Not found | Не знайдено | Nenalezen | no |

Result pages remain `noindex`; no metadata includes document or learner details.

Result: pass.

## 6. Metadata And Technical SEO Checks

- each real published translation is self-canonical;
- fallback-only locale URLs canonicalise to English and are omitted from
  hreflang/sitemap;
- hreflang uses `en`, `uk`, `cs`, and `x-default`;
- `x-default` points to English;
- expected sitemap count is 51 indexable URLs;
- legal, system, verification result/token, admin, and API pages are excluded;
- legal pages use `noindex, follow`;
- system and verification-result pages use `noindex, nofollow`;
- legacy redirect inventory is separated from automatic future slug redirects.

Result: pass at specification level; implementation test remains pending.

## 7. Non-Public Guardrail Text

Some master-copy files deliberately contain internal sections such as
`Removed From Current Prototype`, `Claims Not Yet Approved`, or
`Publication Dependencies`. Terms such as old accreditation logos or digital
badges may appear only inside those internal prohibition lists.

Implementation must not render internal notes or publication dependencies.

## 8. External Review Gates

Internal parity is complete. These are approval gates, not missing translation
work:

1. Czech editor/native speaker reviews fluency, grammar, and Czech educational
   terminology without changing approved facts.
2. Czech counsel reviews UA Terms, Refund Policy, Privacy Policy, and the
   credential-registry privacy addendum.
3. Final implementation QA compares rendered content fields, metadata, links,
   canonical, hreflang, sitemap, robots, and redirects against these sources.

## 9. Prototype Conflict

The current prototype `lib/i18n.ts` still contains older, unapproved public copy,
including fictional verification data and removed trust/partner claims. It is
not a localization source of truth and must be replaced from the approved
master-copy package during the frontend content-integration ticket.
