# ADM-LEARNER-FULL-NAME-SEARCH

Date: 2026-09-02

Branch: `codex/adm-learner-full-name-search`

Status: implementation and local verification complete; review and merge pending

## Summary

The protected Learners registry now accepts the displayed Latin full name as
one search query while retaining existing individual-name, Ukrainian full-name,
email, and phone matching. Search ignores letter case, leading/trailing spaces,
and repeated internal whitespace.

## Files Changed

- `lib/learners/search.ts`
- `lib/learners/admin.ts`
- `components/admin-learners.tsx`
- `scripts/test-adm-learner-full-name-search.mjs`
- `scripts/verify-adm-learner-full-name-search.mjs`
- `package.json`
- learner API and QA documentation

## Database Objects

None.

## Tests / Verification

- `npm run test:adm-learner-full-name-search` — pass; covers full-name,
  whitespace, case, individual name, Ukrainian name, email, phone, and negative
  matching.
- `npm run verify:adm-learner-full-name-search` — pass; guards the protected
  route, caller-scoped RLS data path, full-result scan before pagination, and
  updated search-control copy.
- `npm run verify:adm-pagination` — pass.
- `npm run verify:lrn-004` — pass.
- `npm run verify:adm-sec-cache` — pass for all 71 admin API routes.
- `npm run verify:qa-003` — pass.
- `npx tsc --noEmit` — pass.
- `npm run lint` — pass with no warnings.
- `npm run build` — pass.

## Security Notes

- Search remains available only to Owner, Super Admin, and Credential Manager
  through the existing authenticated MFA-protected admin route.
- The same caller JWT and RLS-scoped Supabase client are used.
- No service role, public learner lookup, analytics event, or indexing surface
  was added.

## Deviations / Open Questions

None. Reverse-order `last name + first name` matching is outside this focused
ticket; the supported combined form follows the displayed `first name + last
name` order.

## Next Dependency

Review the Vercel Preview and merge this isolated ticket before starting another
admin improvement.
