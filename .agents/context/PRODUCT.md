# Product Context

Product: Nobel ITBS Website and Credential Registry

Register: product

## Product Definition

Nobel ITBS is a European professional education platform for adults and
organisations, operating through Czech company Nobel ITBS s.r.o.

The business model has two complementary goals:

1. create, co-create, present, and sell professional education programmes;
2. provide B2B infrastructure for online schools, experts, and partner
   educational programmes, including programme structuring, properly issued
   documents, supplements, registration, and public verification.

The University of Alfred Nobel is the exclusive academic partner of Nobel ITBS.
The University's more than 30 years of history, its participation as the first
Ukrainian university in the EIT Deep Tech Talent Initiative, and the acceptance
of its Space Business programme within the initiative may be used as trust proof
only when clearly attributed to the University. They are not direct Nobel ITBS
accreditations or achievements. Founder and team profiles are not part of the
Release 1 public website.

Release 1 must launch a professional, content-managed website and credential registry that:

- presents Nobel ITBS as a credible international education company;
- promotes programmes and moves users to Leeloo application/payment funnels;
- supports B2B infrastructure enquiries from online schools, experts, programme
  authors, and educational projects;
- lets third parties verify issued documents by QR token or document number;
- gives admins secure tools for content, programmes, learners, credentials, users, email templates, and audit/history.

Release 1 is not an LMS, student cabinet, payment system, CRM, news publication, or public document archive.

Payments are processed through Stripe. Nobel ITBS s.r.o. is not a VAT payer.
Leeloo presents shortened versions of the Terms of Use, Refund Policy, and
Privacy Policy, each linking to the corresponding full policy on the Nobel ITBS
company website. The Leeloo consent checkbox is initially unchecked.
The final Leeloo/checkout integration must retain evidence of the applicable
Terms acceptance and any required digital-content withdrawal acknowledgement.

## Core Product Promise

Professional education that is easy to evaluate, easy to enter, and easy to verify.

For learners and organisations, the public site should make Nobel ITBS feel credible, international, practical, and worth contacting or paying. For verifiers, the registry should answer one question quickly and confidently: is this document valid?

## Product Direction For Design

Primary public emphasis:

- EU credibility;
- international professional education.

Public-site tone:

- education that moves careers and lives forward;
- aspirational and motivating, while remaining credible, European, and professional.

Primary programme CTA:

- `Apply now`.

Flagship programme examples for launch design:

- Business & Management: AI production;
- Psychology & Human: General Psychology;
- Psychology & Human: Child Psychology;
- Psychology & Human: Neuroplastic Reconstruction;
- Technology & Innovation: Space Business.

All five programmes are approved for simultaneous launch. AI Production, General Psychology, Child Psychology, and Neuroplastic Reconstruction are taught in Ukrainian; Space Business is taught in Ukrainian and English. Every public programme presentation must be complete in EN, UA, and CZ.

AI Production uses `Mini-MBA` as its primary Programme Type. It runs for 6 months with 360 hours / 12 ECTS in total: a University of Alfred Nobel professional development certificate for 180 hours / 6 ECTS is issued after 3 months, followed by a Nobel ITBS international Mini-MBA diploma with Diploma Supplement after 6 months. The public copy may state EQF Level 7 competence alignment and that programme hours and learning results may be credited toward a full MBA subject to admission and academic-recognition rules. General Psychology, Child Psychology, and Neuroplastic Reconstruction use `Professional development course` as their Programme Type; the approved Ukrainian public category label is `Програма професійного підвищення кваліфікації`. Programme Type and the certificate/diploma issued after completion are separate facts. Neuroplastic Reconstruction remains the short public name. It is a partner programme presented as a 3-month, 180-hour / 6 ECTS programme with 12 owner-confirmed public modules in three stages. The current cohort starts on 5 October. Confirmed landing tariffs are For Yourself EUR 990, Master EUR 1,390, and VIP EUR 2,090; Master and VIP include the University certificate with supplement, CPD UK, MNR consultant status, and registry entry, while For Yourself has no certification documents or consultant status. The Nataliia Kholodenko Psychology Centre owns the method/content and delivers the learning experience; Nobel ITBS provides document preparation, packaging, registration, and verification infrastructure. General Psychology, Child Psychology, and Space Business are continuously available distance programmes hosted in Moodle. Space Business is a Certificate programme and issues a certificate. General Psychology and Child Psychology issue a University of Alfred Nobel professional development certificate for 90 hours / 3 ECTS. General Psychology has one-year asynchronous Moodle access; Child Psychology has six-month asynchronous Moodle access. Both run without mandatory Zoom sessions or a fixed schedule. Child Psychology has no practical classes, placement, internship, clinic practice, or client work; the University of Alfred Nobel Mental Health Clinic is the programme-development base only. Formal programme-source dates are not used in public copy. Programme Leeloo URLs are intentionally deferred during preparation, so the question/contact fallback applies until they are supplied.

Approved trust proof points:

- Czech-based company;
- EU presence;
- partners and accreditations;
- experts;
- verifiable credentials.

## Primary Audiences

Prospective learners:

- evaluate business, management, technology, innovation, psychology-adjacent, and professional development programmes;
- need to understand value, outcomes, format, document issued, price when available, and the next step;
- should be led toward a programme page and then to a Leeloo CTA.

Organisation representatives:

- look for training solutions for teams, experts, or online school formats;
- need trust signals, flexibility, and a clear For Organisations funnel;
- should be led to the dedicated Leeloo URL or an enquiry path.

Credential verifiers:

- check whether a document is genuine;
- may arrive from a QR code or manual document number entry;
- need a minimal, serious, unambiguous result without private data.

Admin users:

- Owner: full system control, unique active Owner, MFA required;
- Super Admin: broad system administration, MFA required;
- Content Manager: public content and programme content only;
- Credential Manager: learners, credentials, contact submissions, and credential email templates, MFA required.

## Release 1 Public Surface

Public website:

- Home;
- Programmes catalogue;
- Programme Area landing pages;
- Programme Type landing pages;
- Programme sales pages;
- About Us;
- Partnerships;
- For Organisations;
- Verify document;
- three mandatory full legal pages: Privacy Policy, Terms of Use (Public
  Contract), and Refund Policy;
- 404 and other system pages.

The three full legal documents are supplied in CZ and EN, may be translated into
Ukrainian, and are published in EN, UA, and CZ. Their approved Ukrainian public
titles are `Політика конфіденційності`, `Умови (Публічний договір)`, and
`Політика повернення`. Shortened Leeloo versions link to these full website
pages and do not replace them.

All legal policy pages use `noindex, follow`, are excluded from the XML sitemap,
and use only minimal technical titles/descriptions where needed. They are not
SEO landing pages.

Release 1 has no separate Cookie Policy page. It uses a minimal localized cookie
block with `Accept` / `Decline` (`Приймаю` / `Не приймаю`) actions and stores the
decision. Non-essential cookies do not load without acceptance. The full
lawyer-approved Cookie Policy and granular settings follow in a later version.

Navigation:

- Programmes;
- For Organisations;
- Partnerships;
- Verify a Document;
- About Us.

News/Blog is out of scope and must not appear in Release 1 navigation.

## Language Model

Release 1 public languages:

- English: no URL prefix;
- Ukrainian: `/ua`;
- Czech: `/cz`.

English is the fallback language. If Ukrainian or Czech content is missing or draft, the public site silently shows English content without warning the user.

Admin UI should expose translation status:

- `missing`;
- `draft`;
- `published`.

## Programme Product Model

Programme Areas:

- Business & Management;
- Technology & Innovation;
- Psychology & Human.

`Psychology & Human` is the approved public label for the third area.

Programme Types:

- Certificate programme;
- Mini-MBA;
- Professional development course.

Programme catalogue:

- simple grid/list in Release 1;
- no visible public filters;
- programme cards may show enrolment badge;
- prices are not shown in catalogue.

Programme pages:

- must feel like sales landing pages, not database records;
- must explain value, audience, outcomes, modules, format, duration, document issued, experts if present, trust, pricing if configured, FAQ if configured, and repeated CTA;
- primary CTA goes to Leeloo;
- secondary CTA is Ask a question and stores source programme context;
- pricing block hides when no active pricing exists;
- pricing option Leeloo URL wins over programme/run fallback when present.

SEO landing pages:

- Programme Area and Programme Type pages live under `/programmes/[slug]`;
- Area, Type, and Programme slugs share one namespace;
- published slug changes must preserve 301 redirects.

## Organisation And Trust Content

For Organisations:

- content-managed B2B sales page for online schools, experts, programme authors,
  educational projects, partner-programme onboarding, and credential
  infrastructure;
- explains programme structuring, document models, supplements, registration,
  and verification;
- does not sell courses or team training;
- primary CTA leads to a dedicated Leeloo funnel;
- Leeloo URL is editable in Site Settings by Owner/Super Admin.

Partnerships:

- presents partner organisations and experts/teachers;
- partners and experts use cards/logos/sections only;
- no individual partner or expert profile pages in Release 1.

Approved public partnership list:

- exclusive academic partner: University of Alfred Nobel, Dnipro, Ukraine;
- partner organisation: Riga Nordic University, Riga, Latvia;
- partner organisation: Nataliia Kholodenko School of Psychology;
- partner organisation: Mental Health Clinic;
- experts: Nataliia Kholodenko, Dmytro Shevchuk, and Alina Yudina.

Other listed organisations are partners, not additional academic partners.
Logos, photos, exact roles, and descriptions are supplied separately.

Important trust rule:

- partners may participate in programme delivery and commercial cooperation, represented through programme and public content;
- partners must never appear in credential verification or credential public data.

## Public Verification Model

Public verification supports only:

- QR token URL;
- manual document number entry.

No public verification by name, surname, email, phone, learner ID, or partner.

Valid result:

- public status `Дійсний`;
- show document number;
- show holder name;
- show programme title;
- show credential type;
- show issue date.

Revoked result:

- public status `Відкликаний`;
- show status only;
- do not show document details.

Not found result:

- message: `За цим кодом/номером документ не знайдено.`;
- pending and voided credentials behave as not found;
- wrong token or number behaves as not found.

Never show publicly:

- PDF download;
- partner;
- internal IDs;
- learner email or phone;
- private file paths;
- token internals;
- audit/history;
- notes;
- revoke or void reasons.

## Credential Registry Model

One credential is one verifiable document identity:

- one document number;
- one verification token/QR;
- one document language;
- one public verification result;
- one status.

Credential statuses:

- `pending`;
- `valid`;
- `revoked`;
- `voided`.

Do not introduce Release 1 lifecycle states:

- `expired`;
- `cancelled`;
- public/internal `reissued`.

Credential Set:

- internal grouping entity only;
- no public URL;
- no QR/token;
- no public lifecycle;
- not shown in public verification.

Credential files:

- private PDFs are required for sending documents to learners;
- one credential may have multiple files;
- exactly one primary/main file;
- primary PDF is required before activation;
- public users cannot download PDFs in Release 1.

Activation:

- changes pending credential to valid;
- attempts Gmail/Google Workspace sending;
- succeeds even if recipient email is empty or email sending fails;
- records send history.

Document numbers:

- generated before activation because they are printed in PDFs;
- never reused, including voided numbers;
- format examples: `NITBS-C-YYYY-000123`, `NITBS-D-YYYY-000124`.

## Admin Product Model

Admin panel modules in Release 1:

- Dashboard;
- Content Pages;
- Programmes;
- Programme Areas;
- Programme Types;
- Programme Runs;
- Partners;
- Experts;
- Contact Submissions;
- Learners;
- Credential Sets;
- Credentials;
- Document Number Log;
- Email Templates;
- Site Settings;
- Users and Roles;
- Audit/History.

Admin experience principles:

- efficient repeated work;
- clear tables, forms, statuses, and permissions;
- no decorative public-site hero style;
- auditability and security are visible in the workflow;
- role and MFA restrictions must shape the interface, not appear as afterthoughts.

## Contact Submissions

Release 1 contact submission types include:

- general;
- programme question;
- partner enquiry;
- organisation enquiry.

Statuses:

- `new`;
- `processed`;
- `archived`.

Access:

- Owner, Super Admin, and Credential Manager can access submissions;
- Content Manager cannot access submissions.

Programme questions must store source programme context.

## Product Principles

- Trust first: the product must feel credible to education buyers and document verifiers.
- Clarity over flourish: every page needs one obvious primary action.
- Programmes must sell: programme pages should explain value and move users to Leeloo.
- Verification must be fast, serious, and minimal.
- Privacy is part of the product: public verification must reveal only what v2 allows.
- Admin UI serves secure operations, not brand spectacle.
- Structured content wins: Release 1 uses controlled sections, not a full page builder.
- Release 1 scope is a constraint, not a suggestion.

## Release 1 Success Criteria

Release 1 is successful when:

- core public pages are content-managed;
- EN content can publish, with UA/CZ fallback;
- programme pages work as sales pages;
- Leeloo CTAs work from programme and pricing paths;
- learners and credentials can be managed by authorized admins;
- document number and QR are generated before activation;
- credential PDFs can be uploaded privately and emailed;
- valid credentials can be verified by QR and document number;
- revoked/pending/voided credentials do not leak document details;
- MFA is enforced for Owner, Super Admin, and Credential Manager;
- audit/history covers critical credential and admin actions.

## Hard Scope Guards

Do not add to Release 1:

- LMS;
- student cabinet;
- internal payment processing;
- full CRM workflow;
- News/Blog;
- public PDF download;
- automatic Moodle completion integration;
- automatic PDF document generation;
- public search by learner name/surname;
- full page builder;
- promotional pricing or installment workflow;
- public expert profile pages;
- public partner profile pages;
- public programme filters;
- old PDF version retention;
- credential statuses outside `pending`, `valid`, `revoked`, `voided`.
