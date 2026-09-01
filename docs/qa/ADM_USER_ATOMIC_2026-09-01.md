# ADM-USER-ATOMIC — Atomic Admin Profile and Role Update

Date: 2026-09-01
Branch: `codex/adm-user-atomic`
Status: accepted in Development and Production at 69/69 parity

## Summary

The Users and Roles editor now saves the full editable profile and exact role
set through one protected `PATCH` request and one PostgreSQL transaction. A
failure can no longer leave assigned/removed roles saved while the profile
change is rejected.

The former UI sequence made up to three independent requests: assign roles,
remove roles, then update the profile. This behavior was internally consistent
with the original AUTH-005 endpoints but did not provide all-or-nothing save
semantics. The v2 business rules did not conflict with the correction.

## Implementation

- Added `public.update_admin_user_atomic(uuid, text, boolean, boolean,
  public.app_role[])` as a fixed-search-path `SECURITY DEFINER` workflow.
- The function locks the target profile, resolves the current and requested
  role sets, enforces Owner/Super Admin and MFA policy, preserves Owner-role
  consistency, derives mandatory MFA from the final role set, and applies the
  role/profile diff inside one transaction.
- Unchanged retries are idempotent and do not generate audit noise.
- Existing profile and role audit triggers remain authoritative. Their events
  commit or roll back with the same transaction and do not include names,
  emails, passwords, tokens, or MFA secrets in metadata.
- Legacy role-only RPCs now lock the same target profile row, serializing them
  with the exact-state workflow without changing their permissions or API.
- The item API authorizes Owner/Super Admin plus MFA before loading protected
  user data and returns the committed user state.
- The admin UI now makes one Save request containing `fullName`, `isActive`,
  `mfaRequired`, and the complete `roles` array.

## Database Objects

Added:

- `public.update_admin_user_atomic(uuid, text, boolean, boolean,
  public.app_role[])`.

Replaced in place only to add target-row serialization:

- `public.assign_admin_roles(uuid, public.app_role[])`;
- `public.remove_admin_roles(uuid, public.app_role[])`.

No table, enum, RLS policy, public credential, learner, PDF, email, or lifecycle
object changed.

## Tests / Verification

Passed locally:

- `npm run verify:adm-user-atomic`;
- `npm run verify:auth-005`;
- `npm run verify:qa-003`;
- `npm run lint`;
- `npx tsc --noEmit`;
- `npm run build` (60/60 static pages generated).

The focused 22-assertion pgTAP contract covers function security/grants,
fixed search path, row locking, exact role replacement, mandatory MFA,
idempotency, audit behavior, rollback after a role deletion has begun, Owner
and Super Admin governance, AAL1 denial, and Content Manager denial.

Hosted database acceptance passed in both approved environments:

- Development project identity `flswzhgjbpagohbwehcz` matched the expected
  West EU project, its ledger ended at `20260901100000`, and the no-pending
  dry run confirmed exact 69/69 parity;
- Production project identity `szratzjodgiacvnhqmhx` matched the expected
  Frankfurt project, its ledger ended at `20260901100000`, and the no-pending
  dry run confirmed exact 69/69 parity;
- the focused pgTAP suite passed 22/22 in Development and 22/22 in Production;
- both pgTAP runs executed inside complete transactions and rolled back;
- post-test cleanup in each environment confirmed zero fixed fixture users,
  zero fixture-target audit rows, and no retained pgTAP extension;
- hosted schema lint returned `No schema errors found` in both environments.

The migration was already present in both hosted ledgers when this database-QA
ticket began, so no duplicate push was attempted and no hosted migration or
business row was written during this acceptance pass.

## Security Notes

- User management still requires an active Owner or Super Admin and MFA/AAL2.
- Current and requested Owner/Super Admin roles are both considered before a
  Super Admin is allowed to edit a target.
- Owner role transfer remains outside this editor and outside this ticket; the
  active Owner cannot be deactivated or lose the Owner role here.
- Role-derived MFA cannot be disabled: Owner, Super Admin, and Credential
  Manager in the final role set force `mfa_required = true`.
- The browser receives no service-role key and never calls the RPC directly.
- Existing append-only, privacy-minimal profile/role audit triggers are retained.

## Deviations / Open Questions

No business-rule deviation or open database gate remains. The earlier status
stating that database runtime and promotion were pending conflicted with the
actual hosted ledgers; exact read-only preflight resolved the conflict before
any push was attempted.

Docker Desktop was installed but its daemon was unavailable in this session.
As with the accepted migrations 67–68, the focused test therefore ran through
a transient PostgreSQL client over the approved TLS poolers. The client was
installed only under `/private/tmp`; no repository dependency changed.

## Remediation

The migration is forward-only. Before promotion it only adds an unused RPC and
adds row locks to two existing RPCs. If a defect is found after deployment, use
a follow-up migration to replace the affected function body; do not edit or
delete the applied migration.

## Next Dependency

Commit and review this database-QA evidence, then continue with the separate
ADM-SEC-CACHE deployed unauthenticated and authenticated response-header smoke.
