# Design Guidelines

Product: Nobel ITBS Website and Credential Registry
Status: mandatory guidance for frontend/UI agents

## 1. Design Intent

The Nobel ITBS website should feel:

- premium;
- trustworthy;
- modern;
- international;
- education-focused;
- clear rather than flashy.

The design concept in `docs/source/v1/design-concept-site.png` is the visual reference, not a pixel-perfect requirement.

Frontend work must turn the concept into a responsive, usable product.

## 2. Product Priorities

Primary public goal:

- users find a programme and move to Leeloo application/payment.

Secondary public goal:

- users verify a document quickly and confidently.

Every major page should support one clear primary action.

## 3. Visual Direction

Use the brand direction from the concept:

- dark premium hero areas;
- clean light content sections;
- purple/blue accent language;
- high contrast;
- confident typography;
- trust-oriented cards and verification states.

Avoid:

- generic SaaS dashboards on public pages;
- cheap stock-feeling layouts;
- overly decorative gradients without purpose;
- a one-note purple-only interface;
- oversized marketing fluff that hides the actual task.

## 4. Layout Rules

Public pages:

- first screen must clearly show Nobel ITBS identity and page purpose;
- programme pages are sales landing pages;
- verification must feel fast, serious, and unambiguous;
- sections should be structured and scannable;
- mobile layouts must be designed deliberately, not squeezed desktop.

Admin pages:

- operational, dense enough for repeated use;
- predictable navigation;
- clear tables/forms;
- no decorative hero layouts;
- prioritize speed, auditability, and clarity.

## 5. Components

Use familiar UI controls:

- tabs for grouped views;
- badges for statuses;
- tables for admin lists;
- cards only for repeated content items or framed tools;
- dialogs for confirmations;
- tooltips for icon-only controls;
- form validation inline near fields.

Prefer icons from the existing icon library if one is installed. If adding one, prefer lucide-react unless the project already uses another.

Do not put cards inside cards.

Do not use visible helper text to explain obvious UI mechanics.

## 6. Public Programme Pages

Programme pages must be sales-oriented.

Required behaviour:

- primary CTA to Leeloo;
- secondary CTA Ask a question;
- pricing block only if pricing exists;
- blocks can hide when empty;
- document-issued block should build trust but not overpromise.

Do not make programme pages feel like academic database records.

## 7. Catalogue

Release 1 catalogue:

- simple grid/list;
- no visible filters;
- cards may show enrolment badge;
- card CTA goes to programme detail.

Data model may support filters, but UI should not show them yet.

## 8. Verification UI

Verification UI must be minimal and trust-first.

Valid:

- show `Дійсний`;
- show minimal document details.

Revoked:

- show `Відкликаний`;
- do not show document details.

Not found:

- show `За цим кодом/номером документ не знайдено.`

Do not show:

- PDF download;
- partner;
- internal IDs;
- technical token details;
- audit/history.

## 9. Multilingual UI

Languages:

- EN;
- UA;
- CZ.

URLs:

- English no prefix;
- `/ua`;
- `/cz`.

If translation is missing, public page silently falls back to English.

Admin UI should show translation status.

## 10. Accessibility and Responsiveness

Required:

- readable contrast;
- keyboard-accessible forms/buttons;
- visible focus states;
- responsive mobile layouts;
- no text overlap;
- no layout shift from dynamic badges/buttons;
- form errors that are clear and specific.

## 11. Assets

Use real project assets when available.

The design concept image may guide visual styling but should not be embedded as the actual website UI.

Avoid generated decorative assets unless explicitly requested.

## 12. Admin UI Status Language

Use simple status language:

Credential internal statuses:

- Pending;
- Valid;
- Revoked;
- Voided.

Public status language:

- Дійсний;
- Відкликаний;
- Не підтверджено;
- Не знайдено.

Programme enrolment badge:

- Enrolment open / ongoing;
- Coming soon;
- Enrolment inactive.

