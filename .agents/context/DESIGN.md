# Design Context

Product: Nobel ITBS Website and Credential Registry

## Design Intent

The interface should feel:

- premium;
- trustworthy;
- modern;
- international;
- education-focused;
- clear rather than flashy.

The design reference in `docs/source/v1/design-concept-site.png` is directional, not a pixel-perfect requirement.

## Register

Use product-register design for admin, dashboards, forms, tables, and operational tools.

Use brand-register design for public marketing pages, programme pages, and institutional storytelling, while keeping the site concrete and task-oriented.

## Visual Direction

Public site:

- dark premium hero moments;
- clean light content sections;
- purple/blue accent language;
- high contrast;
- confident typography;
- trust-oriented verification states;
- real programme/content signals early in the first viewport.

Admin:

- quiet, operational, and scannable;
- dense enough for repeated work;
- predictable navigation;
- clear tables and forms;
- visible state, validation, and audit cues;
- no decorative hero layouts.

## Avoid

- generic SaaS dashboard look;
- cheap stock-feeling layouts;
- one-note purple-only interface;
- excessive decorative gradients;
- oversized marketing filler;
- cards inside cards;
- visible UI text that explains obvious mechanics;
- emoji as icons;
- placeholder image boxes.

## Layout Rules

- Public pages should show Nobel ITBS identity and page purpose immediately.
- Programme pages are sales landing pages with a clear primary CTA to Leeloo.
- Catalogue is simple in Release 1 and must not show visible filters.
- Verification UI must be minimal and confidence-building.
- Mobile layouts must be designed deliberately, not squeezed desktop.
- Admin pages should favor tables, forms, badges, tabs, and compact panels.

## Components

Preferred controls:

- tabs for grouped admin views;
- badges for statuses;
- tables for admin lists;
- inline form validation;
- dialogs only for confirmations or destructive actions;
- tooltips for icon-only controls.

If adding an icon library, prefer `lucide-react` unless a different library is already established.

## Color And Tone

Current scaffold uses OKLCH tokens in `app/globals.css`.

The palette should remain restrained for admin UI. Public pages can be more expressive, but should still feel premium, educational, and trustworthy.

Avoid a UI dominated entirely by one hue family. Purple/blue accents are allowed, but not as the whole visual system.

## Accessibility

Required:

- readable contrast;
- keyboard-accessible forms/buttons;
- visible focus states;
- responsive mobile layouts;
- no text overlap;
- no layout shift from dynamic controls;
- clear, specific form errors.

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
