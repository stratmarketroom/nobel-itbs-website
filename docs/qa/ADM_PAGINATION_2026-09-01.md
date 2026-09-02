# ADM-PAGINATION Server Pagination

Date: 2026-09-02

Branch: `codex/adm-pagination`

Status: implementation merged in PR #80; Development Preview live acceptance complete for Learners, Credentials, Credential Sets, and Document Number Log; Contact Submissions multi-page acceptance remains data-blocked

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

## Development Preview Browser Acceptance

Authenticated Owner/AAL2 read-only acceptance was completed on the deployed
PR #80 Development Preview on 2026-09-02. The approved synthetic registry
contained 1,741 Learners, 1,741 Credentials, 1,741 Credential Sets, and 1,741
Document Number Log rows.

| Registry | Desktop result | Search / filter reset | Mobile result |
| --- | --- | --- | --- |
| Learners | `1–50 of 1,741` → `51–100 of 1,741` → Previous to `1–50`; 50 rows per page | A unique surname from page 2 returned `1–1 of 1`; changing the archive filter from page 2 reset the range to page 1 | `390 × 844`, no document overflow; Enter on Next opened `51–100` |
| Credentials | `1–50 of 1,741` → `51–100 of 1,741` → Previous to `1–50`; 50 rows per page | A document number from page 2 returned `1–1 of 1`; changing status from page 2 to Revoked reset to `1–1 of 1`, and All restored `1–50` | `390 × 844`, no document overflow |
| Credential Sets | `1–50 of 1,741` → `51–100 of 1,741` → Previous to `1–50`; 50 rows per page | No filters in this registry | `390 × 844`, no document overflow; table scrolling remains contained |
| Document Number Log | `1–50 of 1,741` → `51–100 of 1,741` → Previous to `1–50`; 50 rows per page | No filters in this registry | `390 × 844`, no document overflow; table scrolling remains contained |
| Contact Submissions | Correct `0–0 of 0` empty state; Previous and Next disabled | Status and type filters applied and reset without an error | `390 × 844`, no document overflow |

The browser console contained no warnings or errors. Dashboard counts before
and after the smoke were unchanged: 0 new enquiries, 1,740 pending credentials,
1,741 active learners, 0 valid credentials, 1 revoked credential, and 0 voided
credentials. No form was submitted and no registry record was selected for
mutation.

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

The Development environment has zero Contact Submissions. Its empty state,
disabled controls, filters, reset behavior, responsive layout, and console were
accepted, but genuine page 1/page 2 navigation cannot be evidenced until the
environment contains more than 50 approved submissions. Creating synthetic
public enquiries was intentionally excluded from this read-only acceptance.

Learner search accepts individual name fields, email, and phone. A unique
surname from beyond the first page was used for the full-result proof; the
visible two-part Latin display name is not treated as one combined search field
and is recorded as a non-blocking UX limitation rather than a pagination fault.

## Next Dependency

Run the remaining Contact Submissions multi-page acceptance when more than 50
approved records exist. The next separate ticket is `DOC-STATUS-SYNC`; it must
remove stale `pending review and merge` labels without changing this ticket's
implementation or QA evidence.
