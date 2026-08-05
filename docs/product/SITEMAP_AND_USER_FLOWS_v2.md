# Sitemap and User Flows v2

Product: Nobel ITBS Website and Credential Registry
Status: Release 1 implementation baseline
Supersedes: source v1 sitemap where conflicting with Product Decisions / Spec Alignment v2

## 1. Product Zones

Release 1 has two zones:

- Public website;
- Admin panel.

The public website is content-managed, except verification pages, which are system pages.

## 2. Language URL Model

English is the default language and has no URL prefix.

Ukrainian uses `/ua`.

Czech uses `/cz`.

Examples:

- `/`
- `/ua`
- `/cz`
- `/programmes`
- `/ua/programmes`
- `/cz/programmes`

If UA/CZ translation is missing or draft, the public page shows English fallback without a public warning.

## 3. Main Navigation

Release 1 public navigation:

- Programmes;
- For Organisations;
- Partnerships;
- Verify a Document;
- About Us.

News/Blog is not in Release 1 navigation.

Programme Areas are shown inside Programmes, not as separate top-level menu items.

## 4. Public Sitemap

### Home

URLs:

- EN: `/`
- UA: `/ua`
- CZ: `/cz`

Purpose:

- explain Nobel ITBS;
- show Programme Areas and selected programmes;
- build trust;
- lead to Programmes or selected programme pages;
- provide access to verification.

Primary CTA:

- Explore Programmes.

Secondary utility:

- Verify a Document.

### Programmes Catalogue

URLs:

- EN: `/programmes`
- UA: `/ua/programmes`
- CZ: `/cz/programmes`

Release 1 behaviour:

- simple list/grid of programmes;
- no visible public filters in Release 1;
- programme cards show enrolment badge;
- fields for future filters are still present in data/admin model.

Future filter fields:

- Programme Area;
- Programme Type;
- instruction language;
- format.

Programme card enrolment badge:

- Enrolment open / ongoing;
- Coming soon;
- Enrolment inactive.

Badge is calculated automatically from programme runs, with admin correction ability.

### Programme Area Landing Pages

URL model:

- `/programmes/[slug]`
- `/ua/programmes/[slug]`
- `/cz/programmes/[slug]`

Release 1 Programme Areas:

- Business & Management;
- Technology & Innovation;
- Psychology & Human.

`Psychology & Human` is the approved public label for the third area.

Each Programme Area page has:

- editable H1;
- SEO title/description;
- intro text;
- automatic list of related programmes.

### Programme Type Landing Pages

URL model:

- `/programmes/[slug]`
- `/ua/programmes/[slug]`
- `/cz/programmes/[slug]`

Release 1 Programme Types:

- Certificate programme;
- Mini-MBA;
- Professional development course.

Each Programme Type page has:

- editable H1;
- SEO title/description;
- intro text;
- automatic list of related programmes.

Programme Area, Programme Type, and Programme slugs share one namespace under `/programmes/[slug]`. Admin must prevent duplicate slugs.

Published slug changes create 301 redirects from old slugs.

### Programme Detail Page

URL model:

- `/programmes/[programme-slug]`
- `/ua/programmes/[programme-slug]`
- `/cz/programmes/[programme-slug]`

Purpose:

- sell the programme;
- explain value and outcomes;
- lead to the configured Leeloo or partner-site application destination;
- provide secondary question path.

Launch content rule:

- AI Production, General Psychology, Child Psychology, Neuroplastic Reconstruction, and Space Business launch together;
- AI Production, General Psychology, Child Psychology, and Neuroplastic Reconstruction are taught in Ukrainian;
- Space Business is taught in Ukrainian and English;
- every programme detail page is fully presented in EN, UA, and CZ;
- each localized page states its actual instruction language or languages explicitly;
- AI Production is presented under the `Mini-MBA` Programme Type;
- General Psychology, Child Psychology, and Neuroplastic Reconstruction are presented under the `Professional development course` Programme Type. The Ukrainian public category label is `Програма професійного підвищення кваліфікації`; certificate information is presented separately as the learning credential;
- Neuroplastic Reconstruction is the approved short public name;
- General Psychology, Child Psychology, and Space Business are continuously available distance programmes hosted in Moodle;
- Child Psychology has no practical classes, placement, internship, clinic practice, or client work; the University of Alfred Nobel Mental Health Clinic is identified only as the programme-development base;
- formal dates from source programme documents are omitted from public copy;
- General Psychology, Child Psychology, and Space Business use Leeloo;
- Neuroplastic Reconstruction uses `https://school.kholodenko.net/`;
- AI Production will use the Dmytro Shevchuk website when supplied;
- where a configured application URL is unavailable, programme pages use the defined question/contact fallback.

Page model:

- sales-oriented landing page;
- structured editable sections;
- no free-form page builder;
- blocks may be hidden when empty/not needed.

Recommended sections:

- hero/value proposition;
- for whom;
- outcomes/skills;
- modules/curriculum;
- format/duration/language;
- document issued;
- expert cards, if any;
- trust block;
- pricing, if configured;
- FAQ, if configured;
- repeated CTA.

Primary CTA:

- leads to the programme's configured Leeloo or partner website.

Secondary CTA:

- Ask a question;
- opens on-site form;
- stores source programme in contact submissions.

Pricing:

- shown only on programme detail page;
- hidden if empty;
- flexible pricing options;
- pricing option may have its own application URL;
- fallback to the active run URL and then the programme application URL.

### For Organisations

URLs:

- EN: `/for-organisations`
- UA: `/ua/for-organisations`
- CZ: `/cz/for-organisations`

Purpose:

- sell Nobel ITBS B2B infrastructure services to online schools, experts,
  programme authors, and educational projects;
- present partner-programme onboarding and structuring;
- explain support for document models, supplements, registration, and
  verification;
- do not present courses or team training as the For Organisations offer.

Primary CTA:

- leads to dedicated Leeloo funnel.

The Leeloo URL is editable in admin Site Settings by Owner/Super Admin.

### Partnerships

URLs:

- EN: `/partnerships`
- UA: `/ua/partnerships`
- CZ: `/cz/partnerships`

Purpose:

- present partner organisations;
- present experts/teachers;
- build trust.

Partners and experts use cards/logos. No individual public partner or expert profile pages in Release 1.

### About Us

URLs:

- EN: `/about`
- UA: `/ua/about`
- CZ: `/cz/about`

Content-managed page.

### Verify Document

Manual verification URLs:

- EN: `/verify`
- UA: `/ua/verify`
- CZ: `/cz/verify`

QR verification URL:

- `/verify/[token]`

QR token URL is language-neutral. User can switch language in UI if needed.

Manual verification supports:

- document number.

No public search by surname/name in Release 1.

### Legal Pages

Legal pages are content-managed:

- Privacy Policy / `Політика конфіденційності`;
- Terms of Use (Public Contract) / `Умови (Публічний договір)`;
- Refund Policy / `Політика повернення`.

All three are mandatory full website documents in EN, UA, and CZ. The supplied
CZ and EN texts may be translated into Ukrainian. Shortened versions displayed
in Leeloo link to the full pages and do not replace them.

All three legal pages use `noindex, follow`, are excluded from the XML sitemap,
and use only minimal technical titles/descriptions where needed.

Release 1 has no separate Cookie Policy page. A minimal localized cookie-consent
block appears before non-essential cookies load and offers two actions:
`Accept` and `Decline`. The decision is stored. A full Cookie Policy page and
granular settings follow after the lawyer provides the approved text.

Use the language prefix model.

### System Pages

Required:

- 404;
- rate limited;
- temporary error;
- admin access denied.

## 5. Admin Sitemap

Release 1 admin modules:

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

## 6. Role-Based Admin Access

Owner:

- all rights;
- only active Owner;
- can create/change Super Admins.

Super Admin:

- broad system rights;
- cannot perform Owner-only actions.

Content Manager:

- content only;
- no learners;
- no credentials;
- no contact submissions.

Credential Manager:

- learners and credentials;
- read-only programme references;
- contact submissions;
- email templates;
- no programme editing.

Users may have multiple roles.

MFA required for:

- Owner;
- Super Admin;
- Credential Manager.

## 7. Public Verification User Flow

### QR Flow

1. User scans QR.
2. Browser opens `/verify/[token]`.
3. Backend resolves token.
4. UI displays result.

### Manual Number Flow

1. User opens `/verify`.
2. User enters document number.
3. Backend resolves number.
4. UI displays result.

### Valid Result

Show:

- status `Дійсний`;
- document number;
- holder name;
- programme title;
- document type;
- issue date.

Do not show:

- partner;
- PDF download;
- email;
- phone;
- internal UUID;
- private files;
- notes;
- history.

### Revoked Result

Show:

- status `Відкликаний`.

Do not show document details.

### Not Found Result

Message:

`За цим кодом/номером документ не знайдено.`

Pending and voided credentials must behave as not found publicly.

## 8. Programme Application User Flow

1. User opens catalogue or SEO landing page.
2. User opens programme page.
3. User reads sales content and pricing, if present.
4. User clicks primary CTA.
5. System opens the relevant configured Leeloo or partner-site URL.

Application URL priority:

1. pricing option application URL, if the CTA belongs to a pricing option and the URL exists;
2. active programme run application URL where applicable;
3. programme-level application URL;
4. fallback contact/question CTA if no application URL exists.

## 9. Ask a Question User Flow

1. User clicks Ask a question on a programme page.
2. On-site form opens.
3. Form stores source programme automatically.
4. Submission is saved as contact submission with type `programme_question`.
5. Email notification is sent to general Nobel ITBS address.

## 10. Credential Admin User Flow

1. Admin creates/selects learner.
2. Admin creates credential with learner, programme context, type, language, issue date.
3. System creates/fetches Credential Set.
4. System generates document number and QR token during pending preparation.
5. Admin uploads one primary PDF and optional additional PDFs.
6. Admin reviews recipient email and email text.
7. Admin activates credential.
8. Credential becomes valid.
9. System attempts to email all current PDFs.
10. Send result is recorded in history.

Activation succeeds even if email is missing or sending fails.

## 11. Credential Correction User Flow

For a valid credential:

1. Admin opens credential.
2. Admin updates current public data and/or PDF.
3. Admin must provide reason.
4. System records change in History/Audit.
5. Public verification shows updated current data.
6. No public update notice is shown.

Replacing PDF does not trigger automatic resend.

## 12. Revoke User Flow

1. Admin opens valid credential.
2. Admin chooses revoke.
3. Admin enters mandatory reason.
4. Credential becomes revoked.
5. Public verification shows `Відкликаний` only.

Revocation is irreversible in standard workflow.

## 13. Void Pending User Flow

1. Admin opens pending credential with reserved number.
2. Admin chooses void.
3. Admin enters mandatory reason.
4. Credential becomes voided.
5. Document number remains permanently unused.
6. Public verification behaves as not found.

## 14. Analytics Events

Recommended Release 1 events:

- programme_view;
- leeloo_cta_click;
- ask_question_submitted;
- contact_form_submitted;
- verify_submitted;
- verify_valid;
- verify_revoked;
- verify_not_found.

Do not send PII in analytics events.
