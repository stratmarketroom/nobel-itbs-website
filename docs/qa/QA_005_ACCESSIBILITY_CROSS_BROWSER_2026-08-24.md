# QA-005 Accessibility and Cross-Browser Audit — 2026-08-24

Ticket: `QA-005-A11Y-001`

Environment: `https://nobel-itbs-website.vercel.app/`

## Summary

The Release 1 public surface passed the accessibility checks that can be
completed in the available Chromium environment: semantic landmarks and
headings, accessible names, image alternatives, ARIA references, responsive
reflow, horizontal-overflow checks, focus styling, reduced-motion coverage,
and the Home verification-tab interaction. EN, UA, and CZ Home routes were
included.

Final accessibility/cross-browser acceptance is not closed. The audit found
one high-priority launch defect on `/admin/login`: the component uses
`auth-shell`, `auth-panel`, `auth-form`, and related classes for which the
repository contains no CSS rules. Production therefore renders the sign-in
form with browser-default controls; its email and password inputs are only
about 22 CSS pixels high, and the labels, fields, and submit button collapse
into an unsuitable mobile layout. The fields still have correct accessible
names through wrapping labels, so this is a missing presentation/touch-target
implementation rather than an unlabeled-control defect.

This was an audit-only ticket. No application or database change was mixed
into the audit. The admin-login correction must be handled by the next focused
ticket, `QA-005-A11Y-FIX-001`.

## Files Changed

- this QA report;
- directly related implementation-status, master-checklist, execution-sequence,
  and documentation-index records.

No application source file changed.

## Database Objects Changed

None. No migration, policy, grant, row, Auth user, Storage object, secret, or
Production configuration was changed.

## Tests / Verification

Production Chromium DOM/responsive matrix:

- desktop checks at `1280 x 900` covered Home, localized UA/CZ Home,
  Programmes, General Psychology, For Organisations, Partnerships, About,
  Verify, Privacy Policy, and an unknown route;
- mobile checks at `390 x 844` covered Home, localized UA/CZ Home,
  Programmes, General Psychology, For Organisations, Partnerships, Verify, and
  Privacy Policy;
- reflow checks at `320 x 800` covered Home, Programmes, General Psychology,
  For Organisations, Partnerships, Verify, Privacy Policy, and Admin Login;
- every checked public page had one `main`, one visible H1, a non-empty title,
  and the expected document language (`en`, `uk`, or `cs`);
- zero public-page missing image alternatives, duplicate IDs, broken
  `aria-labelledby`/`aria-describedby`/`aria-controls` references, unnamed
  visible controls, or heading-level skips were found;
- zero horizontal document overflow was measured at all checked widths;
- the apparent sub-44-pixel mobile targets were breadcrumb/inline links or a
  checkbox whose full text is an associated clickable label, not isolated
  failing controls;
- no positive `tabindex` values were found;
- the mobile menu uses native `details`/`summary`, receives focus, and exposes a
  visible browser focus outline;
- the Home verification tabs have a named tablist, roving `tabIndex`, complete
  tab/panel ID references, and source-level Arrow Left/Right/Home/End handling;
  clicking the QR tab changed `aria-selected` and the visible tabpanel as
  expected;
- public focus-visible rules and targeted reduced-motion rules are present;
- the solid-background contrast sampler found no reproducible public-text
  failure. Gradient and browser-computed `lab()` cases were reviewed against
  their source CSS instead of being represented as full automated coverage.

Admin Login evidence:

- the page has one `main`, one H1, a named region, and accessible Email,
  Password, and Sign in controls;
- production visual inspection at `390 x 844` showed the unstyled form;
- measured control sizes were approximately `147 x 22` for both inputs and
  `65 x 25` for the submit button;
- repository search found every `auth-*` class only in
  `components/admin-mfa-login.tsx` and no corresponding CSS implementation.

Browser availability:

- automated interaction used the available Chromium runtime;
- local Google Chrome `151.0.7922.173` and Safari/WebDriver `17.6` are present,
  but Safari automation was not enabled and no Safari result was inferred from
  Chromium;
- the viewport was reset after browser QA.

Repository verification after the documentation-only diff:

- all 69 non-live `verify:*` package scripts passed;
- `npm run lint` passed;
- `npx tsc --noEmit` passed;
- `CONTENT_DATA_SOURCE=seed npm run build` passed with 46/46 static pages
  generated;
- `git diff --check` passed.

## Security Notes

- the audit was read-only and did not submit public or admin forms;
- no credential, contact, learner, Auth, database, or Storage mutation was
  performed;
- no browser storage, cookies, sessions, passwords, or secrets were inspected;
- the `/admin/login` defect does not expose a secret or bypass authentication,
  but an undersized/unstructured sign-in UI increases operational error risk and
  cannot be accepted as the final protected-entry experience.

## Deviations / Open Questions

- no Safari, Firefox, physical-device, VoiceOver/NVDA, or switch-control run was
  completed; cross-browser and assistive-technology acceptance therefore
  remains open;
- the available browser-control surface could focus elements and validate DOM
  state, but did not provide reliable synthetic Tab/Enter dispatch for a full
  manual keyboard traversal. Static tab order, native control semantics,
  focus-visible state, and the implemented tab keyboard handler were checked,
  but this is not represented as a complete keyboard acceptance;
- no full axe/Lighthouse run was available in the controlled Production browser;
  the result is a targeted WCAG 2.2 AA audit, not a certification;
- the public surface passed the checked scope, while the protected Admin Login
  presentation remains a launch defect. These outcomes must not be collapsed
  into a blanket site-wide pass.

## Next Dependency

Implement `QA-005-A11Y-FIX-001` for the Admin Login layout, minimum target
sizes, responsive form structure, and explicit focus/reduced-motion treatment.
After deployment, repeat the focused login audit and then complete Safari plus
physical-device/assistive-technology acceptance before the final release
decision.
