# Legal Policy Audit

Product: Nobel ITBS Website and Credential Registry  
Source: policies prepared by Czech legal counsel  
Audit date: 2026-07-31  
Status: source package catalogued; Release 1 gap review complete

## 1. Scope And Limits

This is a product, content, and implementation audit. It does not replace legal
review. The source legal wording has not been rewritten.

The audit covers:

- Terms of Use / Terms and Conditions;
- Refund Policy;
- Privacy Policy;
- interim cookie-consent interface;
- Czech and English language parity;
- alignment with the approved Nobel ITBS Release 1 product;
- requirements that must be implemented around the policies.

## 2. Canonical Source Files

### Czech

- `docs/legal/source/cz/2026-03-01-terms-of-use-cz.docx`
- `docs/legal/source/cz/2026-03-01-refund-policy-cz.docx`
- `docs/legal/source/cz/2026-03-01-privacy-policy-cz.docx`

### English

- `docs/legal/source/en/2026-03-01-terms-of-use-en.docx`
- `docs/legal/source/en/2026-03-01-refund-policy-en.docx`
- `docs/legal/source/en/2026-03-01-privacy-policy-en.docx`

All canonical documents use an effective date of 1 March 2026.

The Czech text has priority if language versions conflict.

### Website Working Copies

The lawyer-supplied canonical files remain unchanged. Website working copies of
the Privacy Policy are stored in:

- `docs/legal/working/cz/2026-07-31-privacy-policy-cz.docx`;
- `docs/legal/working/en/2026-07-31-privacy-policy-en.docx`.

On 31 July 2026, `telephone number` was added to the personal data collected
under Article 2(a) in both working copies. The same disclosure must be carried
into the Ukrainian version.

## 3. Duplicate And Version Findings

### Privacy Policy

The Czech files without a suffix, `(1)`, and `(2)` are byte-for-byte identical.
Any one of them represents the same source version.

### Refund Policy

The Czech files without a suffix, `(1)`, and `(2)` are byte-for-byte identical.
Any one of them represents the same source version.

### Terms Of Use

The Czech file without a suffix and `(1)` are byte-for-byte identical.

The `(2)` file changes only Czech terminology:

- `refundy` becomes `refundace`;
- the document reference is normalized to `Podmínky vrácení peněz`.

There is no change to substantive rights or obligations. The `(2)` file is
therefore treated as the canonical final Czech version.

## 4. Language Parity

The English versions follow the Czech versions closely:

- all main sections and article numbers are present;
- Nobel ITBS legal details match;
- the effective date matches;
- the Czech governing law and Czech Trade Inspection Authority references match;
- the Czech version is expressly stated to prevail;
- refund and privacy cross-references are preserved.

No material CZ/EN contradiction was found during the product-level comparison.

Ukrainian versions were not supplied by counsel. Working website translations
have now been produced from the canonical Czech structure using the English
version as a terminology reference:

- `docs/legal/working/ua/2026-07-31-terms-of-use-ua.md`;
- `docs/legal/working/ua/2026-07-31-refund-policy-ua.md`;
- `docs/legal/working/ua/2026-07-31-privacy-policy-ua.md`.

These are not lawyer-approved versions and must be reviewed by Czech counsel
before publication. The Czech version continues to prevail.

## 5. Verified Company Details In The Legal Package

- Legal name: `NOBEL ITBS s.r.o.`
- Company ID: `23465492`
- Registered office: `Vrážská 143, Radotín, 153 00 Praha 5, Czech Republic`
- Commercial Register: Municipal Court in Prague
- File number: `C 427524`
- Contact email: `info@nobel-itbs.eu`
- Payment service provider: `Stripe`
- VAT status: Nobel ITBS s.r.o. is not a VAT payer

These legal details can now replace placeholders in the website footer, About
Us publication dependencies, and legal-page templates.

The product owner confirmed on 31 July 2026 that the VAT statement in Terms
Article 5.2 remains current and that Stripe is the payment service provider.

## 6. Publication Readiness

### Terms Of Use

Status: legally supplied CZ/EN source is ready for web adaptation, subject to
sales-flow confirmation.

The document covers:

- provider and buyer identity;
- course definitions;
- technical requirements;
- ordering and contract formation;
- pricing, payment, and currency;
- access and user accounts;
- access period and course/platform changes;
- intellectual property;
- certificates;
- defects and complaints;
- withdrawal and refunds;
- privacy;
- governing law and dispute resolution.

Publication blockers:

- confirm whether ordering and payment occur through a Nobel ITBS web interface
  or an external Leeloo flow;
- confirm who is merchant/seller of record in every programme flow;
- confirm that certificate wording also covers diplomas, supplements, and other
  approved credential types where applicable.

### Refund Policy

Status: legally supplied CZ/EN source is ready for web adaptation, subject to the
same sales-flow and checkout confirmation.

The Refund Policy is supplementary. The Terms prevail if the documents conflict.

The document correctly separates:

- withdrawal before digital performance begins;
- duplicate/error payments;
- non-delivery or cancellation;
- complaints and defective digital performance;
- business-customer treatment.

Publication blockers:

- checkout consent and evidence requirements must be implemented;
- a model withdrawal form or an approved alternative process should be confirmed
  with counsel;
- the actual refund operator and payment path must match the published process.

### Privacy Policy

Status: the supplied CZ/EN source is suitable for course sales and course use,
but is not yet complete for the full Release 1 platform.

The current text covers:

- course customers and course users;
- order, payment-confirmation, study, account, communication, and marketing data;
- certificate issuance in general;
- recipients and non-EU/EEA transfers in general;
- retention for orders, study data, communication, and marketing;
- GDPR rights and controller contact details.

It does not yet fully describe the approved website and credential registry.

### Cookie Policy

Status: a separate page is deferred and is not required for the first release.
It was not included in the supplied Czech legal package.

Release 1 uses a minimal localized cookie block with two actions: `Accept` and
`Decline`. Non-essential cookies must not load unless the user accepts, and the
decision must be stored. A full Cookie Policy page and granular category settings
will be prepared after counsel supplies or approves the full text.

## 7. Privacy Addendum Required For Release 1

Counsel should review and add, where applicable:

1. Website visitors and technical/security logs.
2. General, programme, organisation, and partnership contact submissions.
3. CAPTCHA and rate-limiting data.
4. Learner profiles, multiple emails and phones, messenger availability, and
   internal notes.
5. Credential records, document numbers, QR tokens, credential status, issue
   date, and credential history.
6. Public verification of holder name, programme title, document type, document
   number, issue date, and valid status.
7. Private credential PDF storage and delivery through Gmail/Google Workspace.
8. Credential email-send history and actual recipient addresses.
9. Admin user accounts, roles, MFA, access logs, and audit history.
10. The actual providers used for hosting/database/storage, email, LMS,
    applications/payments, analytics, CAPTCHA, and other integrations.
11. Controller/processor or joint-controller roles between Nobel ITBS, the
    University of Alfred Nobel, content providers, and programme partners.
12. Retention periods for learner, credential, verification, audit, contact, and
    email-send data.
13. Legal bases for credential issuance, long-term registry retention, public
    verification, fraud prevention, and audit.
14. Whether personal data may be received from a university, partner, or
    organisation rather than directly from the learner.
15. Cookies and analytics, including the Release 1 cookie inventory and consent
    evidence, followed later by the full Cookie Policy and granular settings.

The current Privacy Policy should not be described as complete Release 1 privacy
coverage until these points are resolved.

## 8. Checkout And Consent Requirements

The purchase/application flow must make the legal documents available before a
binding order and retain evidence of the accepted version.

Required implementation decisions:

- Terms acceptance checkbox;
- links to Terms, Refund Policy, and Privacy Policy before order submission;
- unambiguous paid-order button wording;
- stored policy version/effective date and acceptance timestamp;
- ability to save or print the Terms before ordering;
- confirmation email containing or linking to the applicable terms;
- a separate, active and unchecked consent for immediate provision of digital
  content before the 14-day withdrawal period expires;
- explicit acknowledgement that immediate provision causes loss of the
  withdrawal right;
- evidence that the customer performed the active consent action.

Acceptance of general Terms alone, a pre-checked box, or payment by itself should
not be used as the only evidence of express consent to immediate digital
performance.

### Observed Leeloo Order Screen

Evidence:

- `docs/legal/evidence/2026-07-31-leeloo-child-psychology-checkout.png`
- `docs/legal/evidence/2026-07-31-leeloo-child-psychology-payment-form.png`

The supplied Child Psychology order and payment-form screens confirm:

- Leeloo hosts the offer and checkout form before payment processing;
- the first screen shows the programme, price, and `Оформить заказ` action;
- the payment form collects name, email, and phone;
- the payment form shows the amount and an `Оплатить` action;
- a checked checkbox is visible beside `Вы соглашаетесь с Пользовательское
  соглашение` on both screens;
- the agreement text is linked;
- the agreement checkbox is positioned below the order/payment action;
- the phone selector defaults visually to the United States `+1`;
- the visible consent wording is in Russian although the offer content is
  Ukrainian.

The product owner confirmed that the checkbox is initially unchecked. The
screenshots therefore show the state after an active user action, not a
pre-selected consent.

The approved policy-delivery model is:

- Leeloo opens shortened versions of the Terms of Use, Refund Policy, and
  Privacy Policy;
- each shortened version links to the corresponding full policy on the Nobel
  ITBS company website.

The screenshot does not establish:

- whether checking it is mandatory before proceeding;
- which exact document and version the link opens;
- whether Leeloo stores the consent timestamp, policy version, user/order
  reference, and checkbox state;
- whether a separate active consent covers immediate digital performance and
  acknowledgement of loss of the 14-day withdrawal right;
- what card/payment screen Stripe presents after the Leeloo `Оплатить` action.

Current consent-flow status:

- general agreement acceptance is visibly present in Leeloo;
- the checkbox is confirmed to start unchecked;
- shortened versions of all three policies will be available in Leeloo and
  will link to the full website versions;
- Leeloo is the observed checkout front end and Stripe remains the confirmed
  payment processor;
- legal sufficiency and the system of record for each consent remain unconfirmed
  until the agreement destinations, version mapping, stored evidence, and
  Stripe screen are inspected.

Required Leeloo correction for launch:

- localize the checkbox and order-button wording for EN, UA, and CZ;
- link the applicable canonical Terms version;
- expose the shortened Terms, Privacy, and Refund texts before order completion,
  each with a link to the matching full website version;
- move required legal consent above the binding order/payment button;
- preserve the confirmed initially unchecked state;
- preserve evidence of the accepted version and active action;
- avoid a misleading default country code for the target locale.

## 9. Proposed Release 1 Legal Routes

All three supplied documents are mandatory full website pages. Shortened Leeloo
versions link to their full pages and do not replace them. The CZ and EN source
texts may be translated into Ukrainian.

Recommended stable slugs and approved Ukrainian public titles:

| Document | Ukrainian title | English | Ukrainian | Czech |
| --- | --- | --- | --- | --- |
| Terms of Use (Public Contract) | Умови (Публічний договір) | `/terms` | `/ua/terms` | `/cz/terms` |
| Refund Policy | Політика повернення | `/refund-policy` | `/ua/refund-policy` | `/cz/refund-policy` |
| Privacy Policy | Політика конфіденційності | `/privacy` | `/ua/privacy` | `/cz/privacy` |

English remains the default locale. Czech is the controlling legal text despite
the English URL being the default website locale.

Legal pages should:

- render as accessible HTML, not DOCX-only downloads;
- use `noindex, follow` and remain excluded from the XML sitemap;
- use only minimal localized technical titles/descriptions where needed;
- preserve numbering and paragraph order;
- include effective date and language-priority notice;
- link to each other where the source documents cross-reference;
- make Terms, Refund Policy, and Privacy Policy reachable from the relevant
  footer and checkout links;
- support print/save without requiring a user account;
- record an internal content version for order evidence.

Release 1 has no separate Cookie Policy route or menu link. Before any
non-essential cookie loads, a minimal localized block provides concise text and
two explicit options: `Accept` and `Decline`. The decision is stored.

## 10. Visual And Structural QA

The six canonical source documents were rendered and inspected:

- Czech Privacy Policy: 4 pages;
- Czech Refund Policy: 2 pages;
- Czech Terms of Use: 5 pages;
- English Privacy Policy: 4 pages;
- English Refund Policy: 3 pages;
- English Terms of Use: 6 pages.

No clipping, overlap, missing glyphs, broken tables, tracked changes, or comments
were found. The English Refund Policy ends on a short third page; this is a
pagination characteristic, not missing content.

The Czech and English Privacy Policy working copies were also rendered and
inspected at four pages each after the phone-number disclosure was added. No
layout or pagination defects were introduced.

## 11. Recommended Next Actions

1. Send the Release 1 privacy addendum list and remaining consent questions to
   Czech counsel.
2. Configure and inspect the three shortened Leeloo policy texts, their full-site
   destinations and version mapping, stored consent evidence, and the following
   Stripe screen. The initially unchecked state, Stripe, and non-VAT-payer
   status are already confirmed.
3. Prepare Ukrainian translations of the supplied CZ/EN legal texts.
4. Approve the three route slugs.
5. Convert canonical CZ/EN text to structured CMS legal-page content without
   editorial rewriting.
6. Add the completed UA text.
7. Implement footer, checkout, print/save, version evidence, consent logging,
   and the minimal cookie accept/decline block.
8. Prepare the full Cookie Policy and granular controls after counsel review.
9. Complete Release 1 legal-content QA in all three languages before launch.
