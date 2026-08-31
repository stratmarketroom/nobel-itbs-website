# QA-005 Partner Logo Adaptation

Date: 2026-08-31

## Summary

The public partner-logo rendering now uses one shared `next/image` component on
the content-managed Partnerships page, the Home partner row, and the retained
Partnerships presentation component. The content-managed page no longer ships
the original partner files through a raw `<img>` element.

The logo area preserves every source aspect ratio with `object-fit: contain`,
uses responsive `sizes`, keeps the horizontal marks within a fluid maximum
width, and gives the two compact square marks a consistent visual width. Long
partner names may wrap inside their card instead of forcing horizontal overflow.

## Scope

- partner logos on public pages only;
- desktop, tablet, and mobile image sizing;
- image delivery and containment;
- no partner content, card order, links, admin workflow, or database changes.

## Files

- `components/partner-logo-image.tsx`
- `components/managed-content-page.tsx`
- `components/public-shell.tsx`
- `components/partnerships-page.tsx`
- `app/public.css`
- `scripts/verify-qa-005-partner-logo-adaptation.mjs`
- `scripts/verify-pce-001.mjs`
- `package.json`

## Verification

- `npm run verify:qa-005:partner-logo-adaptation` passed;
- `npm run verify:cnt-003:partnership-experts-responsive` passed;
- `npm run verify:pce-001` passed;
- `npm run verify:pce-003` passed;
- `npx tsc --noEmit` passed;
- `npm run lint` passed with the pre-existing `components/admin-shell.tsx:174`
  navigation warning and no errors;
- `npm run build` passed with all 60 static pages generated;
- Vercel Preview visual smoke passed for EN, UA, and CZ Partnerships at
  1440×900 and 390×844;
- desktop and mobile both rendered five cards with `object-fit: contain`, no
  horizontal overflow, and optimized `/_next/image` sources;
- the 390 px viewport selected a 384 px image candidate instead of transferring
  the original oversized assets.

## Security

The change is public presentation only. It adds no data fields, API access,
analytics payload, private asset path, credential data, or browser secret.
Partner information remains outside public credential verification.

## Open Questions

None for this ticket. Future partner assets should preferably be supplied as
properly trimmed SVG files; the current approved WebP files remain unchanged.
