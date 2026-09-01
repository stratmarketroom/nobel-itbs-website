-- ADM-USER-ATOMIC: update one admin profile and its complete role set atomically.

set check_function_bodies = on;

create or replace function public.update_admin_user_atomic(
  p_user_id uuid,
  p_full_name text,
  p_is_active boolean,
  p_mfa_required boolean,
  p_roles public.app_role[]
)
returns void
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_current_roles public.app_role[];
  v_roles public.app_role[];
  v_target_is_owner boolean;
  v_effective_mfa_required boolean;
  v_requires_owner boolean;
begin
  if p_user_id is null then
    raise exception 'Target user id is required.';
  end if;

  if p_is_active is null or p_mfa_required is null then
    raise exception 'Active and MFA settings are required.';
  end if;

  if p_roles is null
    or cardinality(p_roles) = 0
    or array_position(p_roles, null::public.app_role) is not null then
    raise exception 'At least one valid admin role is required.';
  end if;

  select array_agg(distinct requested_role order by requested_role)
  into v_roles
  from unnest(p_roles) as requested(requested_role);

  select profile.is_owner
  into v_target_is_owner
  from public.user_profiles profile
  where profile.id = p_user_id
  for update;

  if not found then
    raise exception 'Admin user was not found.';
  end if;

  select coalesce(
    array_agg(role_assignment.role order by role_assignment.role),
    array[]::public.app_role[]
  )
  into v_current_roles
  from public.user_roles role_assignment
  where role_assignment.user_id = p_user_id;

  v_requires_owner :=
    v_target_is_owner
    or v_current_roles && array['owner'::public.app_role, 'super_admin'::public.app_role]
    or v_roles && array['owner'::public.app_role, 'super_admin'::public.app_role];

  if v_requires_owner then
    perform internal.assert_sensitive_action_allowed(
      array['owner'::public.app_role],
      'Owner or Super Admin management'
    );
  else
    perform internal.assert_sensitive_action_allowed(
      array['owner'::public.app_role, 'super_admin'::public.app_role],
      'admin user management'
    );
  end if;

  if v_target_is_owner is distinct from ('owner'::public.app_role = any(v_roles)) then
    raise exception 'Owner role cannot be changed through this user update.';
  end if;

  select exists (
    select 1
    from unnest(v_roles) as role_name(role)
    where internal.role_requires_mfa(role_name.role)
  )
  into v_effective_mfa_required;

  v_effective_mfa_required := p_mfa_required or v_effective_mfa_required;

  -- Remove obsolete roles first so MFA can be disabled when the final role set
  -- no longer requires it. Any later failure rolls this deletion back.
  delete from public.user_roles role_assignment
  where role_assignment.user_id = p_user_id
    and not (role_assignment.role = any(v_roles));

  update public.user_profiles profile
  set
    full_name = nullif(btrim(p_full_name), ''),
    is_active = p_is_active,
    mfa_required = v_effective_mfa_required
  where profile.id = p_user_id
    and (
      profile.full_name is distinct from nullif(btrim(p_full_name), '')
      or profile.is_active is distinct from p_is_active
      or profile.mfa_required is distinct from v_effective_mfa_required
    );

  insert into public.user_roles (
    user_id,
    role,
    assigned_by
  )
  select
    p_user_id,
    role_name.role,
    v_actor_id
  from unnest(v_roles) as role_name(role)
  where not exists (
    select 1
    from public.user_roles existing_role
    where existing_role.user_id = p_user_id
      and existing_role.role = role_name.role
  );
end;
$$;

comment on function public.update_admin_user_atomic(uuid, text, boolean, boolean, public.app_role[]) is
  'Atomically applies an admin profile and exact role set after Owner/Super Admin and MFA checks.';

revoke all on function public.update_admin_user_atomic(uuid, text, boolean, boolean, public.app_role[])
from public, anon;

grant execute on function public.update_admin_user_atomic(uuid, text, boolean, boolean, public.app_role[])
to authenticated, service_role;

-- Serialize the legacy role-only RPCs with the new exact-state workflow. Their
-- existing authorization, MFA, Owner and audit behavior remains unchanged.
create or replace function public.assign_admin_roles(
  p_user_id uuid,
  p_roles public.app_role[]
)
returns void
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_roles public.app_role[] := coalesce(p_roles, array[]::public.app_role[]);
  v_actor_id uuid := auth.uid();
begin
  if p_user_id is null then
    raise exception 'Target user id is required.';
  end if;

  if cardinality(v_roles) = 0 then
    raise exception 'At least one role is required.';
  end if;

  perform 1
  from public.user_profiles profile
  where profile.id = p_user_id
  for update;

  if not found then
    raise exception 'Admin user was not found.';
  end if;

  if v_roles && array['owner'::public.app_role, 'super_admin'::public.app_role] then
    perform internal.assert_sensitive_action_allowed(array['owner'::public.app_role], 'Owner or Super Admin role management');
  else
    perform internal.assert_sensitive_action_allowed(
      array['owner'::public.app_role, 'super_admin'::public.app_role],
      'admin role management'
    );
  end if;

  insert into public.user_roles (
    user_id,
    role,
    assigned_by
  )
  select
    p_user_id,
    role_name.role,
    v_actor_id
  from unnest(v_roles) as role_name(role)
  on conflict (user_id, role) do update
  set assigned_by = excluded.assigned_by,
      assigned_at = now();
end;
$$;

create or replace function public.remove_admin_roles(
  p_user_id uuid,
  p_roles public.app_role[]
)
returns void
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_roles public.app_role[] := coalesce(p_roles, array[]::public.app_role[]);
begin
  if p_user_id is null then
    raise exception 'Target user id is required.';
  end if;

  if cardinality(v_roles) = 0 then
    raise exception 'At least one role is required.';
  end if;

  perform 1
  from public.user_profiles profile
  where profile.id = p_user_id
  for update;

  if not found then
    raise exception 'Admin user was not found.';
  end if;

  if v_roles && array['owner'::public.app_role, 'super_admin'::public.app_role] then
    perform internal.assert_sensitive_action_allowed(array['owner'::public.app_role], 'Owner or Super Admin role management');
  else
    perform internal.assert_sensitive_action_allowed(
      array['owner'::public.app_role, 'super_admin'::public.app_role],
      'admin role management'
    );
  end if;

  delete from public.user_roles
  where user_id = p_user_id
    and role = any(v_roles);
end;
$$;
