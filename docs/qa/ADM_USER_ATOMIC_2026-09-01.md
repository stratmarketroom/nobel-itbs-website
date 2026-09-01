# ADM-USER-ATOMIC — Atomic Admin Profile and Role Update

Date: 2026-09-01
Branch: `codex/adm-user-atomic`
Status: implementation and local code verification passed; database runtime and review pending

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

The pgTAP file is committed but was not executed locally. The repository-local
Supabase CLI confirmed that neither Docker nor Podman is available on the
current PATH, so no database-runtime pass is claimed.

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

No business-rule deviation. Database runtime execution remains the explicit
pre-promotion gate because the local container runtime is unavailable.

## Remediation

The migration is forward-only. Before promotion it only adds an unused RPC and
adds row locks to two existing RPCs. If a defect is found after deployment, use
a follow-up migration to replace the affected function body; do not edit or
delete the applied migration.

## Next Dependency

Run the focused pgTAP transaction against the approved database test runner,
then review and merge this ticket before starting another admin correction.
