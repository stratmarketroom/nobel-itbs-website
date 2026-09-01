# ADM-PAGINATION Server Pagination

Date: 2026-09-01

Branch: `codex/adm-pagination`

Status: local implementation complete; Preview/Production acceptance pending review and merge

## Scope

This ticket removes fixed first-page visibility caps from five protected admin
registries:

- Contact Submissions;
- Learners;
- Credentials;
- Credential Sets;
- Document Number Log.

It does not change Release 1 business workflows, roles, MFA, RLS, database
objects, public routes, analytics, or indexing behavior.

## Implementation

- Every list API accepts centrally validated `limit` and `offset`; the default
  page size is 50 and the maximum is 100.
- Every response includes an exact filtered `total`.
- Stable secondary ordering prevents equal timestamps from moving records
  between pages.
- Learner name/email/phone search runs server-side across the complete
  caller-visible result and fetches full private detail only for the requested
  result page.
- Credential search and status/learner filters are applied server-side before
  paging.
- Credential Set document counts are calculated for the visible page without a
  hidden 1,000-row cap.
- Shared labelled Previous/Next controls are used by all five registries and
  reset to the first page when filters change.

## Automated Verification

Required local gate:

- `npm run verify:adm-pagination`;
- `npm run verify:pce-004`;
- `npm run verify:lrn-004`;
- `npm run verify:adm-crd-001`;
- `npm run verify:qa-003`;
- `npm run verify:adm-sec-cache`;
- `npm run lint`;
- `npx tsc --noEmit`;
- `npm run build`.

The focused verifier checks all five protected routes, database-boundary
`range` paging, exact totals, removal of the old 250/500/1,000 caps,
full-result learner search, caller-scoped RLS clients, and accessible UI
controls.

## Security Notes

- All reads continue through the request Bearer token and caller-scoped RLS.
- Existing role and MFA assertions are unchanged.
- No service-role client was added to a browser or list path.
- Central `private, no-store` admin API controls remain in force.
- No learner, credential, submission, number, PDF, email, or audit record is
  created or changed by this ticket.

## Database Objects

None.

## Deviations / Open Questions

None for the code-level scope. Authenticated multi-page browser acceptance on a
deployed environment requires enough real or approved synthetic rows and is a
post-deployment check.

## Next Dependency

Review the diff and Preview deployment, then run authenticated Previous/Next,
filter-reset, and full-search smoke tests before merge.
