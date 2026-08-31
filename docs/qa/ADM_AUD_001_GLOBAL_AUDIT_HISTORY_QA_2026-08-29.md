# ADM-AUD-001 Global Audit / History QA

Date: 2026-08-29

Status: **accepted in Development, Preview deployment, and Production**

## Summary

ADM-AUD-001 adds the final Release 1 global administrative Audit/History view.
The view is read-only and restricted to Owner and Super Admin with MFA/AAL2.
It lists newest-first cross-module events, resolves only administrative actor
display names, supports bounded filters and pagination, and loads one selected
event through a separate privacy-projected detail response.

Content Manager and Credential Manager do not receive global cross-module audit
access. Their existing module-specific credential history remains unchanged.
Dashboard and Email Templates business logic were not changed by this ticket.

## Files Changed

- admin page and UI: `app/admin/audit-history/page.tsx`,
  `components/admin-audit-history.tsx`, `app/globals.css`;
- protected collection/detail API: `app/api/v1/admin/audit-events/route.ts`,
  `app/api/v1/admin/audit-events/[id]/route.ts`;
- server contract: `lib/audit/admin.ts`, `lib/audit/input.ts`,
  `lib/audit/types.ts`, `lib/supabase/server.ts`;
- role-aware navigation: `components/admin-shell.tsx`;
- migration and database tests:
  `supabase/migrations/20260829160000_adm_aud_001_global_audit_read.sql`,
  `supabase/tests/database/adm_aud_001_global_audit_read.test.sql`, and the
  updated `supabase/tests/database/qa_001_rls_matrix.test.sql`;
- static verification and v2 implementation/security/status documentation.

## Database Objects Changed

Migration `20260829160000` adds no table, function, lifecycle, or mutable
workflow. It changes only the protected read boundary:

- grants `authenticated` table-level `SELECT` on forced-RLS `audit_log`;
- adds `audit_log_owner_super_admin_read` for Owner/Super Admin plus the shared
  MFA requirement;
- grants only `user_profiles.id` and `user_profiles.full_name` for actor lookup;
- adds `user_profiles_audit_actor_read` with the same role/MFA boundary;
- grants no authenticated insert, update, delete, or truncate capability.

Development and Production both have exact 68/68 migration parity ending at
`20260829160000`.

## Tests and Verification

Local code gates passed:

- `npm run verify:adm-aud-001`;
- `npm run verify:qa-001` for all 46 protected public tables;
- `npm run verify:admin-shell`;
- `npx tsc --noEmit`;
- `npm run lint` with zero errors and one pre-existing admin-shell navigation
  warning outside this ticket;
- `npm run build`, including `/admin/audit-history` and both audit API routes.

Database gates passed in both hosted environments inside complete rollbacks:

- focused ADM-AUD-001 pgTAP: 15/15;
- aggregate QA-001 RLS matrix: 42/42;
- post-test read-back: 68 migrations, both policies present, zero ADM-AUD
  fixture users, zero `adm_aud_001.test` events, and no retained pgTAP extension.

Delivery and browser gates:

- implementation PR #54 passed both Vercel checks and merged as `8471445`;
- the Vercel Preview deployment reached `Ready`; direct Preview application
  inspection remained behind the account SSO gate;
- Production deployment `Aqcoj87Npqtyk6eYyVWPT3o3Ht6G` reached `Ready`;
- the stable unauthenticated collection API returned HTTP `401` with
  `Bearer session is required`;
- the local Development Owner at AAL1 was stopped by the existing MFA-required
  shell before protected content loaded;
- the existing Production Owner/AAL2 session loaded 36 real audit events,
  selected event detail, and the role-aware navigation item;
- the `learners.imported` action filter returned one matching row and detail
  exposed only the safe numeric `count` field;
- the rendered detail contained no raw metadata object, request ID, IP hash,
  user-agent hash, reason, contact detail, private path, token, or email content;
- 390-pixel and 320-pixel layouts had no horizontal overflow; action and
  pagination controls measured at least 44 pixels high;
- the Production browser console contained zero warnings or errors;
- no browser mutation was submitted.

## Security Notes

- The browser receives no service-role secret. List, detail, and actor lookup
  execute with the caller JWT and database RLS.
- The API repeats the Owner/Super Admin plus MFA/AAL2 check before querying.
- The list query never selects metadata or transport/security columns.
- Detail loads metadata for one event only and projects values through explicit
  identifier, boolean, number, and short-label allowlists. Unknown keys, nested
  values, reasons, and unapproved strings are counted as hidden, not returned.
- `audit_log` remains forced-RLS and append-only; its existing mutation and
  truncate protections remain unchanged.

## Deviations and Resolved Conflicts

- The v2 sitemap required a global Audit/History admin module but did not name
  its exact cross-module reader roles. Least privilege was resolved as
  Owner/Super Admin plus MFA/AAL2; Content Manager and Credential Manager keep
  only module-specific history.
- The pre-ticket aggregate QA-001 contract expected zero authenticated grants
  and policies on all audit/identity tables. That expectation conflicted with
  the required caller-JWT/RLS global read view. QA-001 now allows exactly the
  `audit_log` table read grant and the two named Owner/Super Admin AAL2 policies;
  it continues to reject all direct mutations and broader profile access.
- Docker was unavailable in this worktree session. The focused and aggregate
  pgTAP files therefore ran through transient PostgreSQL clients against both
  hosted environments inside rollback transactions, followed by explicit
  cleanup verification.

## Next Dependency

The Release 1 Dashboard, Email Templates editor, and global Audit/History admin
modules are complete. Remaining separate work stays unchanged: the first
Owner-approved real complete-package credential activation/VEDOS delivery,
backup activation and restore drill when real learner/credential data exists,
and final Safari, physical-device, and assistive-technology acceptance.
Consent-gated GA4 page views and canonical-domain verification were completed
on 2026-08-31; custom analytics events and field INP/CrUX remain separate
non-blocking follow-up work.
