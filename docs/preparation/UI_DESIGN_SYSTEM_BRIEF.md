# UI Design System Brief

Product: Nobel ITBS Website and Credential Registry
Stage: Release 1 UI design preparation
Status: working brief; public visual direction approved for UX/UI prototyping
Date: 2026-08-01

## 1. Design Goal

The UI system must support two distinct registers:

- public brand surfaces that sell professional education and build trust;
- admin/product surfaces that support secure, repeatable operations.

The system should feel premium, trustworthy, modern, international, education-focused, and clear rather than flashy.

## 2. Source Direction

Use:

- `docs/design/DESIGN_GUIDELINES.md`
- `.agents/context/PRODUCT.md`
- `.agents/context/DESIGN.md`
- `docs/source/v1/design-concept-site.png` as visual reference only

Do not use archived v1 product logic when v2 conflicts.

## 2.1 Approved Visual Direction

The approved public-site baseline is an editorial European education platform:

- primary influence: Bureau Borsche / Studio Feixen editorial systems;
- structural discipline: Pentagram / Collins institutional grid;
- verification and admin mechanics: Fathom / IBM Design Language system clarity.

This direction should feel like a contemporary European institution, not a
generic course marketplace or SaaS landing page. Public pages may use large
typographic blocks, asymmetrical section rhythm, confident whitespace, and fewer
generic course-card patterns. The layout must still preserve clear hierarchy,
early programme visibility, Czech/EU credibility, and one primary action per
page.

Home and public marketing pages should combine:

- a dark premium hero foundation;
- large editorial typography;
- real programme examples early in the page;
- light proof and trust sections;
- restrained Nobel blue, deep blue, gold-detail, green, and red brand accents;
- visible Nobel ITBS identity in the first viewport.

Programme surfaces should avoid feeling like database records. Catalogue and
programme pages should make programmes inspectable through editorial structure,
fact rows, status badges, and clear CTAs rather than repeating identical
decorative course cards.

Verify and admin surfaces should stay more systematic: compact forms, explicit
states, serious status language, tables where appropriate, visible focus states,
and no decorative editorial hero treatment in operational workflows.

## 3. Register Split

### Public Register

Used for:

- Home;
- Programmes catalogue;
- Programme Area landing pages;
- Programme Type landing pages;
- Programme sales pages;
- About Us;
- Partnerships;
- For Organisations;
- public legal pages.

Public design principles:

- premium European education brand;
- Nobel ITBS identity visible in first viewport;
- Czech/EU credibility early;
- real programme examples early;
- one clear primary action per page;
- expressive but disciplined layout;
- no News/Blog affordances;
- no public PDF download affordances;
- no name/surname verification affordances.

### Product Register

Used for:

- admin shell;
- users and roles;
- content editing;
- programme administration;
- learner administration;
- credential workflows;
- contact submissions;
- audit/history;
- verification result mechanics.

Product design principles:

- quiet, operational, scannable;
- tables, forms, tabs, badges, and compact panels;
- visible permission and MFA states;
- audit consequences visible before sensitive actions;
- no decorative hero layouts in admin.

## 4. Color System

Implementation should use OKLCH tokens.

Core brand references:

- Nobel blue: `#5986c4`
- deep blue shade: `#22537d`
- soft green: `#c0d1b3`
- green shade: `#96a886`
- red: `#e25044`
- red shade: `#b2322b`
- soft gold: `#f4d9a1`
- gold shade: `#c1a067`
- near-black asset background: `#0c0c0c`

Token roles to define:

- `page`
- `surface`
- `surface-soft`
- `surface-raised`
- `ink`
- `ink-muted`
- `line`
- `midnight`
- `deep-blue`
- `nobel-blue`
- `accent`
- `gold-detail`
- `success`
- `warning`
- `danger`
- `info`
- `focus`

Rules:

- no authored pure `#000` or `#fff` tokens;
- public hero can use dark premium foundations;
- admin should use light tinted neutrals with restrained accent use;
- gold is detail only, not a dominant button or large surface color;
- status colors must be semantic and accessible, not just brand logo colors;
- avoid a purple-only interface.

## 5. Typography

Primary direction:

- Manrope for public and admin UI unless changed by approved brand decision;
- support Latin, Ukrainian, and Czech;
- display type can be large on public hero surfaces;
- admin type should be compact and predictable;
- no negative letter spacing;
- body text max line length: approximately 65 to 75 characters.

Public scale:

- display hero;
- page H1;
- section H2;
- card H3;
- lead/body/caption;
- eyebrow labels.

Admin scale:

- page title;
- section title;
- table header;
- field label;
- body;
- helper/error;
- badge text.

## 6. Component Inventory

### Shared

- logo lockup;
- language switcher;
- primary button;
- secondary/action link treatment;
- icon button;
- text input;
- textarea;
- select;
- checkbox/toggle;
- badge;
- status badge;
- tabs;
- empty state;
- loading skeleton;
- error state;
- focus states.

### Public

- site header;
- public footer;
- hero slide;
- compact verification block;
- programme area card;
- programme card;
- programme sales CTA block;
- trust proof point;
- partner/accreditation logo row;
- expert card;
- FAQ item;
- pricing option;
- legal content block;
- 404/system page block.

### Verification

- document number form;
- QR result page layout;
- valid result state;
- revoked result state;
- not found result state;
- rate limited state;
- temporary error state.

Verification restrictions:

- no PDF download;
- no partner;
- no email/phone;
- no internal IDs;
- no token internals;
- no audit/history;
- no name/surname search.

### Admin

- admin shell navigation;
- user role badges;
- MFA-required notice;
- table;
- filters/search for admin only where scoped;
- detail header;
- tabs;
- form sections;
- permission denied state;
- irreversible action confirmation;
- audit/history list;
- contact submission status controls.

## 7. Page Template Inventory

Public templates:

- Home;
- Programmes catalogue;
- Programme Area landing page;
- Programme Type landing page;
- Programme detail sales page;
- About Us;
- Partnerships;
- For Organisations;
- Verify Document;
- Legal page;
- 404;
- rate limited;
- temporary error.

Admin templates:

- admin login and MFA;
- admin dashboard;
- users list/detail;
- content page editor;
- programme list/detail;
- programme area/type editor;
- partner/expert editor;
- contact submissions list/detail;
- learner list/detail;
- credential list/detail;
- document number log;
- email templates;
- site settings;
- audit/history.

## 8. Public Page Design Notes

Home:

- keep close to approved concept;
- dark premium first viewport;
- strong Nobel ITBS identity;
- compact verification block in first screen;
- first slide CTA `View programmes`;
- programme slides CTA `Apply now`;
- no secondary hero CTA.

Catalogue:

- simple grid/list;
- no visible filters in Release 1;
- cards should feel specific and inspectable;
- prices hidden in catalogue.

Programme detail:

- sales landing page, not database record;
- primary CTA `Apply now`;
- secondary `Ask a question` pattern must be designed and approved;
- pricing hidden when empty;
- repeated CTA near page end.

Verification:

- minimal, serious, unambiguous;
- one document-number input;
- no name/surname fields.

## 9. Accessibility And Responsive Rules

Required:

- readable contrast;
- keyboard-accessible controls;
- visible focus states;
- status not color-only;
- no text overlap;
- no layout shift from badges/buttons;
- deliberate mobile layouts;
- reduced motion support;
- clear form errors near fields.

## 10. Motion Direction

Public:

- subtle premium transitions;
- controlled hero slider;
- no aggressive autoplay;
- no distracting decorative motion.

Admin:

- motion only for state feedback;
- 150 to 250 ms transitions;
- no page-load choreography.

## 11. UI Acceptance Checklist

- Public/admin register split is respected.
- Design tokens are defined before broad implementation.
- Components have default, hover, focus, active, disabled, loading, and error states where relevant.
- Programme pages support sales flow to Leeloo.
- Verification UI follows privacy rules.
- Mobile and desktop layouts are intentionally defined.
- No News/Blog UI appears.
- No visible programme filters appear in Release 1 catalogue.
- No nested cards are introduced.
- No public PDF download affordance appears.

## 12. Open Questions

1. Final secondary CTA treatment for programme pages.
2. Whether hero programme slider is approved for implementation or remains prototype direction.
3. Final visual treatment for programme-specific imagery.
4. Whether `lucide-react` should be added for icons or icons should wait until a component ticket.
5. Which partner/accreditation logos are approved and available as SVG.
