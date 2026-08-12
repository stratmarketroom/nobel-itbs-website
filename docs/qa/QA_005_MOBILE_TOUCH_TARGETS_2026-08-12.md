# QA-005 Mobile Touch Targets

Date: 2026-08-12  
Ticket: QA-005 mobile touch-target hardening

## Summary

The public Home now preserves a minimum `44 x 44` CSS-pixel interaction area
for the mobile header, menu, language switcher, text links, and footer links.
The visual composition, content, colours, typography, routes, and business
behaviour remain unchanged.

## Files Changed

- `app/globals.css`;
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

## Security Notes

- no authentication, authorization, RLS, API, secret, or data-access code
  changed;
- public verification remains server-mediated;
- no protected information was introduced into browser code.

## Deviations / Open Questions

The implementation follows the project target of `44 x 44` CSS pixels. Real
device and Vercel Production checks remain part of the subsequent Production QA
pass.

## Next Dependency

Merge this branch, wait for the Vercel Production deployment, then repeat the
public Production QA before configuring production Auth, Owner, MFA, and admin
acceptance.
