# QA-005 Mobile Touch Targets

Date: 2026-08-12  
Ticket: QA-005 mobile touch-target hardening

## Summary

The public Home and all shared Release 1 public page shells now preserve a
minimum `44 x 44` CSS-pixel interaction area for the mobile header, menu,
language switcher, taxonomy links, consent links, and footer links. The visual
composition, colours, typography, routes, and business behaviour remain
unchanged.

The same correction removes an audit-discovered localization defect: managed
content pages and shared footers now use the localized EN/UA/CZ shell copy
instead of hard-coded English navigation and legal labels.

## Files Changed

- `app/globals.css`;
- `lib/i18n.ts`;
- shared public-shell components;
- this QA record;
- the directly related launch checklist item.

## Database Objects Changed

None.

## Tests / Verification

- `npm run lint`: passed;
- `npx tsc --noEmit`: passed;
- `npm run build`: passed;
- `git diff --check`: passed;
- local production server at `390 x 844`:
  - collapsed Home: zero visible interactive elements below `44 x 44`;
  - expanded mobile menu: zero visible interactive elements below `44 x 44`;
- local production server at `320 x 720`:
  - zero visible interactive elements below `44 x 44`;
  - document width equals viewport width, with no horizontal overflow;
- browser console: zero errors.
- follow-up public-shell matrix at `390 x 844`:
  - About, For Organisations, Partnerships, Programmes, and Verify in UA/CZ;
  - zero visible interactive elements below `44 x 44`;
  - zero horizontal overflow;
  - document languages remain `uk` and `cs`;
  - managed-page header and legal-footer labels are localized;
  - catalogue and verification footer headings, links, and destinations are
    localized.

## Security Notes

- no authentication, authorization, RLS, API, secret, or data-access code
  changed;
- public verification remains server-mediated;
- no protected information was introduced into browser code.

## Deviations / Open Questions

The implementation follows the project target of `44 x 44` CSS pixels. Real
device and cross-browser checks remain part of final launch acceptance. Vercel
Production Chromium acceptance passed on 2026-08-12; see
`docs/qa/QA_005_PRODUCTION_PUBLIC_ACCEPTANCE_2026-08-12.md`.

## Next Dependency

The branch is merged and public Vercel Production acceptance has passed. Next,
configure production Auth, the single Owner, MFA, and protected admin
acceptance.
