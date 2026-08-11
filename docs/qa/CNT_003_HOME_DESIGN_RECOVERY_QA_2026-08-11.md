# CNT-003 Home Design Recovery QA

Date: 2026-08-11
Ticket: CNT-003 remediation
Status: implementation and focused QA complete

## Summary

The Home routes no longer use the generic `ManagedContentPage` renderer. They use a dedicated Home composition aligned with the approved concept while retaining Supabase as the content source.

The restored page includes:

- real Nobel ITBS logo and the approved 3D Nobel hero asset;
- a dark brand hero with one primary programme CTA;
- a separate trust-oriented verification utility;
- three programme areas derived from the published catalogue;
- five published programme presentations derived from the programme catalogue;
- published partners derived from the partner registry;
- managed trust, workflow, organisation, institutional, and final CTA blocks;
- a localized footer and responsive EN/UA/CZ navigation.

Only explicitly mapped manager fields are rendered. Editorial implementation notes, incomplete backtick placeholders, and generic block bodies cannot leak into the Home UI.

## Files Changed

- `app/page.tsx`
- `app/[locale]/page.tsx`
- `components/public-shell.tsx`
- `app/globals.css`
- `docs/qa/CNT_003_HOME_DESIGN_RECOVERY_QA_2026-08-11.md`

## Database Objects

None.

## Tests / Verification

Passed:

- `npm run lint`
- `npx tsc --noEmit`
- `npm run verify:cnt-003`
- `npm run verify:fef-001`
- `git diff --check`
- Local Home routes `/`, `/ua`, and `/cz` return `200`.
- Browser console has no warnings or errors on the tested Home routes.
- 390 px mobile viewport has no horizontal overflow (`scrollWidth === innerWidth === 390`).
- Desktop viewport has no horizontal overflow.
- EN/UA/CZ Home output contains no internal programme-card note, verification note fragment, or backtick field placeholders.

The production build compiles and TypeScript completes successfully, but final static export remains blocked by an existing unrelated Supabase load failure on `/for-organisations`. This route was not changed in this ticket and remains part of launch hardening.

## Security Notes

- Home data continues to use public, RLS-protected projections and the publishable key.
- No service-role access, secret, private learner data, credential PDF, or verification token was added to browser code.
- The Home verification utility links to the existing controlled verification flow and does not perform a new direct database lookup.

## Deviations / Open Questions

- The concept is treated as a responsive visual reference, not a pixel-perfect image embed.
- The full-page browser screenshot helper produced a repeated stitching artifact; viewport-by-viewport visual inspection was used instead.
- `/for-organisations` production-build data loading remains an independent launch blocker.

## Next Dependency

Resume the technical launch-hardening checklist: stabilize public page build-time Supabase loading, then address metadata/language, sitemap/robots, and security headers before the final production QA.
