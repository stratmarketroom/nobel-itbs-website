# ADM-PAGINATION Server Pagination

Date: 2026-09-02

Branch: `codex/adm-pagination`

Status: implementation merged in PR #80; Development Preview live acceptance complete for all five protected registries; evidence merged through PRs #86 and #87

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
| Contact Submissions | Initial `0–0 of 0` empty state accepted; supplemental 60-row smoke passed `1–50 of 60` → `51–60 of 60` → Previous to `1–50`; 50/10 rows rendered | Changing Status from page 2 reset to `1–10 of 10`; changing Type from page 2 reset to `1–20 of 20`; clearing each filter restored `1–50 of 60` | `390 × 844`, no document overflow; Enter on Next opened `51–60` with 10 rows |

The browser console contained no warnings or errors. Dashboard counts before
and after the smoke were unchanged: 0 new enquiries, 1,740 pending credentials,
1,741 active learners, 0 valid credentials, 1 revoked credential, and 0 voided
credentials. No form was submitted and no registry record was selected for
mutation.

### Contact Submissions Supplemental Acceptance

After explicit Owner approval, the previously data-blocked Contact Submissions
case was completed with a controlled Development-only fixture on 2026-09-02:

- 60 records were inserted directly with one unique `qa_ticket` metadata
  marker, `example.invalid` addresses, sequential timestamps, and a controlled
  mix of `new`, `processed`, and `archived` statuses plus the three public
  enquiry types;
- a temporary Credential Manager completed real TOTP enrollment and reached
  AAL2 before opening the protected registry;
- desktop page 1 contained 50 rows and page 2 contained 10 rows; Previous and
  Next enabled and disabled at the correct boundaries;
- applying Processed from page 2 reset the range to `1–10 of 10`, and clearing
  it restored `1–50 of 60`;
- applying Partnership from page 2 reset the range to `1–20 of 20`, and
  clearing it restored `1–50 of 60`;
- the `390 × 844` pass retained `scrollWidth === clientWidth === 390`; keyboard
  Enter on Next opened `51–60 of 60`; the browser console remained clean.

Cleanup deleted exactly 60 fixture rows, confirmed zero rows for the unique QA
marker, restored the total Contact Submissions count from 60 to the baseline of
0, and deleted the temporary Auth user together with its profile, role, and MFA
factor.

## Security Notes

- All reads continue through the request Bearer token and caller-scoped RLS.
- Existing role and MFA assertions are unchanged.
- No service-role client was added to a browser or list path.
- Central `private, no-store` admin API controls remain in force.
- No learner, credential, number, PDF, email, or retained audit record was
  created or changed by this ticket.
- The supplemental Contact Submissions fixture was Development-only, uniquely
  marked, excluded from the public form/rate-limit/notification path, and fully
  removed after browser acceptance.
- The temporary Credential Manager used a generated `example.invalid` identity,
  enforced MFA/AAL2, and was deleted after sign-out.

## Database Objects

None.

## Deviations / Open Questions

Learner search accepts individual name fields, email, and phone. A unique
surname from beyond the first page was used for the full-result proof; the
visible two-part Latin display name is not treated as one combined search field
and is recorded as a non-blocking UX limitation rather than a pagination fault.

## Next Dependency

Completed. `DOC-STATUS-SYNC` reconciles the remaining stale status labels as a
separate documentation-only ticket.
