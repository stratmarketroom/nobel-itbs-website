-- AUTH-004: Role Helpers
-- Helper functions for RLS policies and server-side authorization checks.

create or replace function internal.has_role(p_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = internal, public, pg_temp
as $$
  select coalesce(
    exists (
      select 1
      from public.user_profiles profile
      join public.user_roles role_assignment
        on role_assignment.user_id = profile.id
      where profile.id = auth.uid()
        and profile.is_active
        and role_assignment.role = p_role
    ),
    false
  );
$$;

comment on function internal.has_role(public.app_role) is
  'Returns true when auth.uid() is an active user with the requested role.';

revoke all on function internal.has_role(public.app_role) from public, anon;
grant execute on function internal.has_role(public.app_role) to authenticated, service_role;

create or replace function internal.has_any_role(p_roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = internal, public, pg_temp
as $$
  select coalesce(
    exists (
      select 1
      from public.user_profiles profile
      join public.user_roles role_assignment
        on role_assignment.user_id = profile.id
      where profile.id = auth.uid()
        and profile.is_active
        and role_assignment.role = any(p_roles)
    ),
    false
  );
$$;

comment on function internal.has_any_role(public.app_role[]) is
  'Returns true when auth.uid() is an active user with any requested role.';

revoke all on function internal.has_any_role(public.app_role[]) from public, anon;
grant execute on function internal.has_any_role(public.app_role[]) to authenticated, service_role;

create or replace function internal.is_owner()
returns boolean
language sql
stable
security definer
set search_path = internal, public, pg_temp
as $$
  select coalesce(
    exists (
      select 1
      from public.user_profiles profile
      join public.user_roles role_assignment
        on role_assignment.user_id = profile.id
      where profile.id = auth.uid()
        and profile.is_active
        and profile.is_owner
        and profile.mfa_required
        and role_assignment.role = 'owner'::public.app_role
    ),
    false
  );
$$;

comment on function internal.is_owner() is
  'Returns true when auth.uid() is the active Owner profile and has the owner role.';

revoke all on function internal.is_owner() from public, anon;
grant execute on function internal.is_owner() to authenticated, service_role;

create or replace function internal.is_active_admin()
returns boolean
language sql
stable
security definer
set search_path = internal, public, pg_temp
as $$
  select coalesce(
    exists (
      select 1
      from public.user_profiles profile
      join public.user_roles role_assignment
        on role_assignment.user_id = profile.id
      where profile.id = auth.uid()
        and profile.is_active
    ),
    false
  );
$$;

comment on function internal.is_active_admin() is
  'Returns true when auth.uid() has an active profile with at least one application role.';

revoke all on function internal.is_active_admin() from public, anon;
grant execute on function internal.is_active_admin() to authenticated, service_role;

create or replace function internal.has_mfa_aal()
returns boolean
language sql
stable
set search_path = internal, public, pg_temp
as $$
  select coalesce(auth.jwt() ->> 'aal' = 'aal2', false);
$$;

comment on function internal.has_mfa_aal() is
  'Returns true when the current Supabase Auth JWT has aal2.';

revoke all on function internal.has_mfa_aal() from public, anon;
grant execute on function internal.has_mfa_aal() to authenticated, service_role;

create or replace function internal.is_mfa_requirement_satisfied()
returns boolean
language sql
stable
security definer
set search_path = internal, public, pg_temp
as $$
  select coalesce(
    exists (
      select 1
      from public.user_profiles profile
      where profile.id = auth.uid()
        and profile.is_active
        and (
          not profile.mfa_required
          or internal.has_mfa_aal()
        )
    ),
    false
  );
$$;

comment on function internal.is_mfa_requirement_satisfied() is
  'Returns true when auth.uid() has an active profile and either MFA is not required or the current JWT has aal2.';

revoke all on function internal.is_mfa_requirement_satisfied() from public, anon;
grant execute on function internal.is_mfa_requirement_satisfied() to authenticated, service_role;
