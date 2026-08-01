# Localization QA Report

Product: Nobel ITBS Website and Credential Registry  
Date: 2026-07-31  
Scope: approved Release 1 public copy and legal-page working translations

## Result

- 17 UA non-legal public-page master copies present;
- 17 EN localized master copies present;
- 17 CZ localized master copies present;
- 3 UA legal-page working translations present;
- localized Cookie Consent copy present in UA/EN/CZ;
- `git diff --check` passes.

## Factual Parity Checks

- AI Production: 6 months, 360 hours / 12 ECTS; University certificate after 3
  months for 180 hours / 6 ECTS; Nobel ITBS Mini-MBA diploma with Diploma
  Supplement after the full programme; Ukrainian instruction.
- General Psychology: 90 hours / 3 ECTS; continuously available asynchronous
  Moodle programme; 1-year access; Ukrainian instruction; University
  professional development certificate.
- Child Psychology: 90 hours / 3 ECTS; continuously available asynchronous
  Moodle programme; 6-month access; Ukrainian instruction; no practice,
  placement, Clinic placement, or client work; University professional
  development certificate.
- Neuroplastic Reconstruction: 3 months / 12 weeks; 180 hours / 6 ECTS; 12
  modules; 5 October start; Ukrainian instruction; package-dependent documents
  and MNR consultant status; CPD UK for Master/VIP.
- Space Business: 90 hours; continuously available Moodle certificate
  programme; Ukrainian and English instruction; Czech is presentation only.
- Programme Type remains separate from document type in all locales.
- EN/CZ page locale is not presented as instruction language.

## Verification And SEO Checks

- English has no URL prefix; Ukrainian uses `/ua`; Czech uses `/cz`.
- manual verification page remains indexable;
- QR-token and verification result pages remain `noindex`;
- only `valid` reveals approved document details;
- `revoked` reveals status only;
- `pending`, `voided`, invalid token, and missing record share the not-found
  public state;
- legal pages are marked `noindex, follow` and remain outside the sitemap.

## Legal Translation Checks

- UA Terms and Refund Policy were translated from the canonical CZ structure
  using the supplied EN text as terminology reference;
- UA Privacy Policy was translated from the 2026-07-31 working version and
  includes telephone number among collected contact data;
- Czech remains the prevailing legal version;
- UA legal working copies are not marked lawyer-approved;
- the Privacy Policy retains a non-public Release 1 addendum note because the
  supplied policy does not yet fully cover the credential registry.

## Publication Gates

Internal content production is complete. Before publication:

1. obtain native-language editorial approval for Czech public copy;
2. obtain Czech counsel approval for the three UA legal translations and the
   Release 1 Privacy addendum;
3. verify dynamic programme status, date, pricing, partner assets, and enquiry
   destinations immediately before content entry;
4. run rendered-page and metadata QA after implementation in the CMS/frontend.
