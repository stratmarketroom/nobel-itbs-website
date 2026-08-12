# QA-005 HTML Language

Date: 2026-08-12  
Ticket: QA-005 HTML language correction

## Summary

The root document language now follows the public URL locale on the server:

- English routes: `<html lang="en">`;
- Ukrainian `/ua` routes: `<html lang="uk">`;
- Czech `/cz` routes: `<html lang="cs">`.

The implementation uses the Next.js 16 `proxy.ts` convention to forward one
validated internal request header to the root layout. It does not modify page
content, URL structure, visual design, or Supabase data.

## Files Changed

- `proxy.ts`;
- `lib/content/html-language.ts`;
- `app/layout.tsx`;
- `scripts/verify-html-language.mjs`;
- `package.json`;
- directly related QA/checklist records.

## Database Objects Changed

None.

## Tests / Verification

- `npm run verify:qa-005:html-language`;
- `npm run lint`;
- `npx tsc --noEmit`;
- `npm run build`;
- `git diff --check`;
- local production server HTML:
  - `/` -> `lang="en"`;
  - `/ua` -> `lang="uk"`;
  - `/cz` -> `lang="cs"`.

Vercel Preview DOM confirmation remains required before merge.

## Security Notes

- only a fixed `en`, `uk`, or `cs` value is forwarded;
- arbitrary incoming header values are not trusted by the root layout;
- APIs and static assets are excluded from the proxy matcher;
- no authentication, authorization, RLS, or secret handling changed.

## Deviation / Open Question

The current Release 1 content has published EN, UA, and CZ translations. If a
future localized route renders an English fallback, the nearest page component
must retain its rendered-content `lang` marker, and the broader fallback SEO
behavior remains governed by `SEO_TECHNICAL_PUBLICATION_SPEC.md`.

## Next Dependency

Deploy to Vercel Preview and confirm the three document language values in the
server-rendered DOM before merge.
