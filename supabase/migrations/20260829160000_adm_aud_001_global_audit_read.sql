-- ADM-AUD-001: Global Audit/History read boundary
-- Owner/Super Admin-only, AAL2-protected, append-only access for the admin UI.

grant select on table public.audit_log to authenticated;

create policy audit_log_owner_super_admin_read
on public.audit_log
for select
to authenticated
using (
  internal.has_any_role(array['owner', 'super_admin']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);

-- The global audit UI resolves only the actor's administrative display name.
-- Email and all other profile fields remain unavailable through this grant.
grant select (id, full_name) on table public.user_profiles to authenticated;

create policy user_profiles_audit_actor_read
on public.user_profiles
for select
to authenticated
using (
  internal.has_any_role(array['owner', 'super_admin']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);

comment on policy audit_log_owner_super_admin_read on public.audit_log is
  'Allows only MFA-verified Owner and Super Admin accounts to read the append-only global audit log.';

comment on policy user_profiles_audit_actor_read on public.user_profiles is
  'Allows MFA-verified Owner and Super Admin accounts to resolve audit actor display names; column grants expose only id and full_name.';
