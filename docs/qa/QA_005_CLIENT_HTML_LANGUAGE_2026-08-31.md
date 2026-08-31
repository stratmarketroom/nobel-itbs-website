# QA-005 Client HTML Language Synchronization — 2026-08-31

Status: implemented and locally verified; Preview verification pending

## Summary

The server-rendered document language remains derived from the requested URL,
so direct EN, UA, and CZ page loads continue to emit `en`, `uk`, and `cs`.

The public layout now also synchronizes `document.documentElement.lang` after a
Next.js client-side route change. Switching between `/`, `/ua`, and `/cz`
therefore updates the document language without requiring a full page reload.

## Scope

- preserve the existing server-derived language on first load;
- update the document language during public client navigation;
- cover EN, UA, and CZ URL prefixes;
- keep the admin boundary and all page content unchanged;
- no routing, visual, analytics, database, or business-logic changes.

## Implementation

- added a null-rendering public client synchronizer that watches `usePathname`;
- reused the existing `htmlLanguageForPathname` resolver, including the correct
  BCP 47 mappings `/ua` to `uk` and `/cz` to `cs`;
- mounted the synchronizer only in the public layout;
- extended the HTML-language verifier to require both initial server rendering
  and client-navigation synchronization.

## Files Changed

- `app/(public)/layout.tsx`
- `components/html-language-synchronizer.tsx`
- `scripts/verify-html-language.mjs`
- `docs/README.md`
- this report

## Database Objects

None.

## Tests / Verification

- all 20 focused public route, localization, SEO, analytics, accessibility, and
  boundary verifiers passed;
- `npx tsc --noEmit` passed;
- `npm run lint` passed with no warnings;
- `npm run build` passed;
- local production browser smoke passed on `/verify`:
  - initial EN load: `/verify`, `lang="en"`;
  - client navigation to UA: `/ua/verify`, `lang="uk"`;
  - client navigation to CZ: `/cz/verify`, `lang="cs"`;
  - client navigation back to EN: `/verify`, `lang="en"`.

## Security Notes

- the component reads only the public pathname;
- no cookies, storage, analytics state, user data, or protected admin data are
  read or changed;
- the synchronizer is absent from the admin layout;
- no service-role, RLS, MFA, API, or credential behaviour changed.

## Deviations / Open Questions

None. The existing request-header mechanism remains the source of truth for
the initial server response; the client synchronizer only covers subsequent
public route changes.

## Next Dependency

Create a Vercel Preview, repeat the EN to UA to CZ client-navigation smoke, and
merge only after the Preview deployment and repository checks pass.
