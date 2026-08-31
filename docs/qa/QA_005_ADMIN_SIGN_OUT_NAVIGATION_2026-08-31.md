# QA-005 Admin Sign-out Navigation — 2026-08-31

## Summary

Admin sign-out now uses the Next.js App Router for the internal transition to
`/admin/login`. The session is still revoked first through Supabase, then
`router.replace` opens the login route without leaving the protected module as
the previous browser-history entry.

The change removes the
`@next/next/no-location-assign-relative-destination` lint warning without
changing MFA, role checks, protected-data loading, or login behavior.

## Files Changed

- `components/admin-shell.tsx`
- `scripts/verify-admin-shell.mjs`
- this report

## Database Objects

None.

## Tests / Verification

- `npm run verify:admin-shell`;
- `npx tsc --noEmit`;
- `npm run lint`;
- `npm run build`.

## Security Notes

- `supabase.auth.signOut()` remains awaited before navigation.
- The destination is the fixed internal `/admin/login` route; no untrusted URL
  reaches `router.replace`.
- Admin RLS, MFA, role allowlists, indexing protection, and analytics exclusion
  are unchanged.

## Deviations / Open Questions

None.

## Next Dependency

None.
