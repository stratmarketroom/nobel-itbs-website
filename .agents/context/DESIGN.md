# Design Context

Product: Nobel ITBS Website and Credential Registry

## Design Intent

The Nobel ITBS interface should feel:

- premium;
- trustworthy;
- modern;
- international;
- education-focused;
- motivating;
- clear rather than flashy.

The public site should communicate EU credibility and international professional education. The emotional tone is aspirational: education that moves careers and lives forward, while staying credible, European, and professional.

The design reference in `docs/source/v1/design-concept-site.png` is the approved home-page visual reference. The home page should stay very close to this concept's layout, hierarchy, and premium digital atmosphere, while replacing any v1 scope conflicts with v2-compliant content and behavior.

Approved design direction:

- European professional premium education brand;
- premium through depth, contrast, restraint, typography, and evidence;
- not luxury pathos, not generic SaaS, not decorative tech-only branding;
- public site can be expressive and atmospheric;
- admin stays operational and visually separate from the public hero style.

## Register

Use brand-register design for:

- Home;
- public marketing pages;
- programme catalogue;
- programme sales pages;
- Programme Area and Programme Type landing pages;
- Partnerships;
- For Organisations;
- institutional storytelling.

Use product-register design for:

- admin;
- dashboards;
- operational forms;
- tables;
- credential workflows;
- verification result mechanics.

Public pages may be expressive. Admin pages must be quiet, dense, and operational.

## Brand Assets

Primary logo source folder observed locally:

- `/Users/olga/Downloads/Logo color/SVG`.

Preferred implementation source:

- use SVG whenever possible;
- avoid using PNG/JPEG exports with large baked-in whitespace for production UI;
- use raster exports only for previews, documents, or when SVG is unavailable.

Primary public logo direction:

- use the blue Nobel ITBS mark as the default brand identity;
- use the full horizontal logo for headers, footers, and formal brand moments;
- use the vertical logo only where a stacked composition is intentional;
- use the standalone `N` mark for favicon, compact mobile header, badges, loading states, and subtle background identity.

Logo-on-background rules:

- dark hero or footer: use a white or color-on-dark logo version with sufficient contrast;
- light sections: use full horizontal color/black logo versions;
- never stretch, crop, recolor manually, outline, add glow, or place the logo on noisy imagery;
- preserve clear space around the mark, at least the visual width of the `N` stroke;
- do not use the logo as a repeated decorative pattern.

Logo color roles:

- blue is the main Nobel ITBS identity color;
- gold can support premium trust and achievement moments only as a restrained detail;
- green can support calm institutional or partner/trust contexts;
- red can support high-energy campaign moments, but should be used sparingly.

Do not use red logo styling to represent errors or revoked credentials. Do not use green logo styling as the only signal for valid verification. Status states need their own accessible UI treatment.

## Brand Color System

Use OKLCH tokens in implementation. The hex values below come from available SVG assets and should be translated into OKLCH design tokens before code work.

Core logo colors:

- Nobel blue: `#5986c4`;
- deep blue shade: `#22537d`;
- soft green: `#c0d1b3`;
- green shade: `#96a886`;
- red: `#e25044`;
- red shade: `#b2322b`;
- soft gold: `#f4d9a1`;
- gold shade: `#c1a067`;
- near-black asset background: `#0c0c0c`.

Recommended palette behavior:

- public site: deep blue/near-black hero foundations, Nobel blue identity, concept-inspired primary CTA treatment, restrained gold as a fine detail only, restrained green/red accents by context;
- admin: tinted light neutrals, Nobel blue as brand anchor, low-chroma status colors, minimal decorative color;
- verification: status color must be semantic and accessible, not only brand-colored;
- avoid a purple-only interface. Purple may appear as a legacy accent from the concept, but the real brand system should be led by Nobel blue and supported by gold/green/red with discipline.

Approved color rules:

- use a deep Nobel premium base: near-black, midnight, deep blue, and Nobel blue;
- do not use light yellow buttons or large light yellow surfaces as a main UI pattern;
- use gold only as restrained premium detailing: thin lines, small highlights, borders, credential/trust accents;
- primary CTA may borrow energy from the design concept, but must stay adapted to the Nobel palette;
- secondary CTA treatment is not approved yet and should be designed separately.

Never use pure `#000` or `#fff` as authored design tokens in new UI. Use tinted neutrals. Logo source files may contain black/white paths, but interface tokens should remain softened.

## Typography

The brand wordmark is bold, geometric, and confident. Interface typography should echo that confidence without imitating the logo.

Direction:

- use Manrope as the main interface and public-site typeface;
- support Latin, Ukrainian, and Czech content;
- keep body copy readable and professional;
- use large, confident display type for public heroes;
- use compact, scannable hierarchy for admin;
- cap long body text at approximately 65-75 characters per line.

Avoid:

- overly delicate luxury serif styling;
- generic SaaS microcopy density on public pages;
- oversized headings inside compact admin panels;
- negative letter spacing.

## Public Site Direction

Public pages should feel like a premium international education brand, not a generic SaaS site.

Required public signals:

- Nobel ITBS identity visible in the first viewport;
- EU/Czech credibility visible early;
- international professional education visible early;
- real programme examples visible early;
- clear path to Programmes;
- utility path to Verify a Document.

Home page concept alignment:

- reproduce the design concept's page structure as closely as practical;
- keep the large dark premium hero on the left;
- use a large sculptural/3D-feeling Nobel `N` as the main hero visual object;
- keep the right-side light `Verify a Document` column/block on the first screen;
- keep the concept's programme-card section rhythm below the hero;
- keep a dark trust strip, partner/accreditation row, organisation block, digital badge/credential storytelling block, certificate CTA block, and dark footer in the same overall spirit;
- preserve the concept's premium digital blue/violet atmosphere where it supports the approved Nobel palette;
- use a primary CTA style close to the concept, adapted to the approved palette;
- do not replace the concept with a generic SaaS hero, generic course grid, or purely abstract wireframe.

Home hero and slider rules:

- the home first screen may use a premium brand/programme slider within the concept-like hero composition;
- use one brand/institutional slide and five programme slides;
- brand slide CTA: `View programmes`;
- programme slide CTA: `Apply now`;
- do not show a global `Apply now` on the general home hero;
- use only one CTA button per slide;
- do not use a secondary hero button;
- make `Verify` a prominent header/nav button;
- include the compact verification block on the first screen in the role and placement style of the design concept;
- verification should not compete with the slide CTA.

Required v2 adaptations to the concept:

- remove News/Blog navigation and sections;
- no public PDF download affordance;
- no public name/surname verification;
- no partner/accreditation information inside credential verification results;
- replace v1 programme groups with Release 1-approved programme areas and flagship programmes.

Programme-first direction:

- flagship examples for launch design:
  - AI production;
  - General Psychology;
  - Child Psychology;
  - Neuroplastic Reconstruction;
  - Space Business.
- programme cards should feel specific and inspectable;
- catalogue has no visible filters in Release 1;
- programme sales pages must use `Apply now` as the primary CTA;
- programme pages use one main CTA; secondary CTA is not approved yet.

Home hero programme slides:

- first slide: brand/institutional intro with `View programmes`;
- AI Production;
- General Psychology;
- Child Psychology;
- Neuroplastic Reconstruction;
- Space Business.

Programmes overview:

- group programmes by Business & Management, Psychology & Human, and Technology & Innovation;
- do not show visible filters in Release 1;
- programme cards lead to programme detail pages;
- do not put `Apply now` on every catalogue card;
- keep cards specific and inspectable, not decorative course tiles.

Trust proof points:

- Czech-based company;
- EU presence;
- partners and accreditations;
- experts;
- verifiable credentials.

Partners and accreditations may appear as public trust content. They must never appear in credential verification results.

## Verification UI

Verification must feel fast, serious, and unambiguous.

Public placement:

- header/nav must include a prominent `Verify` button;
- home first screen may include a small compact verification/trust block;
- verification is not a secondary hero CTA beside `View programmes` or `Apply now`.

Manual verification:

- one primary document-number input;
- no name/surname fields;
- no public search by learner identity;
- no unnecessary explanation text.

QR verification:

- direct result page;
- language switch may be available, but token details should not be exposed.

Valid result:

- public status `Дійсний`;
- show only document number, holder name, programme title, credential type, and issue date;
- no PDF download;
- no partner;
- no internal IDs.

Revoked result:

- public status `Відкликаний`;
- show status only;
- do not show document details.

Not found:

- show `За цим кодом/номером документ не знайдено.`;
- pending and voided credentials behave as not found.

Use icons, badges, and color together. Never rely on color alone.

## Admin UI Direction

Admin is a work surface, not a brand campaign.

Admin should be:

- quiet;
- operational;
- scannable;
- dense enough for repeated use;
- predictable;
- audit-aware;
- security-aware.

Preferred structures:

- left navigation or compact module navigation;
- tables for lists;
- badges for roles/statuses;
- tabs for grouped details;
- inline validation;
- compact panels for summaries;
- confirmation dialogs for destructive or irreversible actions;
- visible MFA/permission states where they affect action availability.

Avoid:

- decorative hero layouts;
- marketing-style cards;
- giant empty dashboards;
- cards inside cards;
- hiding permission failures behind vague disabled states.

Credential workflows should make status, required files, recipient email, MFA state, and audit/history consequences visible before action.

## Layout Rules

Public pages:

- first viewport must clearly show Nobel ITBS identity and page purpose;
- every major page should have one clear primary action;
- programme pages are sales landing pages;
- sections should be structured and scannable;
- mobile layouts must be deliberately designed, not squeezed desktop;
- show a hint of the next section in landing-page first viewports when possible.

Admin pages:

- prioritize tables, forms, tabs, and compact controls;
- avoid decorative first screens;
- keep text and controls from shifting layout when status badges or actions change;
- show empty/loading/error states for operational surfaces.

Programme pages:

- programme detail pages are sales-oriented;
- `Apply now` is the single approved primary CTA;
- secondary button treatment is not approved yet;
- structure around outcome, audience fit, learning content, format/duration/language when confirmed, and evidence-based proof points.

## Components

Approved component direction:

- restrained premium, not bubbly SaaS;
- cards and panels use moderate 6-8px radius;
- public CTA may use a pill shape, especially in hero contexts;
- public cards rely more on space and typography than decorative borders;
- programme cards must not look like cheap course tiles;
- admin components use compact borders, dividers, tables, tabs, forms, and badges;
- badges are small and restrained;
- inputs are clean with visible focus states;
- icons should be simple line icons.

Preferred controls:

- tabs for grouped views;
- badges for statuses and roles;
- tables for admin lists;
- segmented controls for modes;
- toggles or checkboxes for binary settings;
- inline form validation;
- dialogs only for confirmations or destructive actions;
- tooltips for unfamiliar icon-only controls.

If adding an icon library, prefer `lucide-react` unless a different library is already established.

Do not use emoji as icons.

## Motion

Motion should feel precise and confident.

Draft-approved motion direction:

- subtle premium transitions;
- controlled hero slider;
- no flashy animation;
- final behavior should be reviewed in prototype.

Use motion for:

- page entrance refinement;
- hover/focus affordances;
- verification result transition;
- admin save/loading feedback.

Avoid:

- bounce or elastic effects;
- aggressive autoplay;
- decorative motion that slows task completion;
- animating layout properties;
- distracting background loops in admin.

Respect `prefers-reduced-motion`.

## Accessibility

Required:

- readable contrast;
- keyboard-accessible forms and buttons;
- visible focus states;
- responsive mobile layouts;
- no text overlap;
- no layout shift from dynamic controls;
- clear, specific form errors;
- status states not communicated by color alone.

## Avoid

- generic SaaS dashboard look;
- cheap stock-feeling layouts;
- one-note purple-only interface;
- excessive decorative gradients;
- oversized marketing filler;
- cards inside cards;
- visible UI text explaining obvious mechanics;
- emoji as icons;
- placeholder image boxes;
- public PDF download affordances;
- public name/surname verification affordances;
- News/Blog navigation.

## Status Language

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
