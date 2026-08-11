-- AUTH-005: Admin user management RPC foundation.
-- Provides controlled PostgREST-callable functions for managing admin profiles and roles.

set check_function_bodies = on;

create or replace function public.create_admin_profile(
  p_user_id uuid,
  p_full_name text,
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
  v_requires_owner boolean;
  v_requires_mfa boolean;
begin
  if p_user_id is null then
    raise exception 'Target user id is required.';
  end if;

  if cardinality(v_roles) = 0 then
    raise exception 'At least one admin role is required.';
  end if;

  v_requires_owner := v_roles && array['owner'::public.app_role, 'super_admin'::public.app_role];

  if v_requires_owner then
    perform internal.assert_sensitive_action_allowed(array['owner'::public.app_role], 'Owner or Super Admin management');
  else
    perform internal.assert_sensitive_action_allowed(
      array['owner'::public.app_role, 'super_admin'::public.app_role],
      'admin user management'
    );
  end if;

  select exists (
    select 1
    from unnest(v_roles) as role_name(role)
    where internal.role_requires_mfa(role_name.role)
  )
  into v_requires_mfa;

  insert into public.user_profiles (
    id,
    full_name,
    is_active,
    is_owner,
    mfa_required
  )
  values (
    p_user_id,
    nullif(btrim(p_full_name), ''),
    true,
    'owner'::public.app_role = any(v_roles),
    v_requires_mfa
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
  on conflict (user_id, role) do nothing;
end;
$$;

create or replace function public.update_admin_profile(
  p_user_id uuid,
  p_full_name text default null,
  p_is_active boolean default null,
  p_mfa_required boolean default null,
  p_update_full_name boolean default false,
  p_update_is_active boolean default false,
  p_update_mfa_required boolean default false
)
returns void
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_target_roles public.app_role[];
  v_target_is_owner boolean;
begin
  if p_user_id is null then
    raise exception 'Target user id is required.';
  end if;

  if not p_update_full_name and not p_update_is_active and not p_update_mfa_required then
    raise exception 'No user profile changes were provided.';
  end if;

  select
    coalesce(array_agg(ur.role), array[]::public.app_role[]),
    coalesce(up.is_owner, false)
  into v_target_roles, v_target_is_owner
  from public.user_profiles up
  left join public.user_roles ur on ur.user_id = up.id
  where up.id = p_user_id
  group by up.id, up.is_owner;

  if not found then
    raise exception 'Admin user was not found.';
  end if;

  if v_target_is_owner or v_target_roles && array['owner'::public.app_role, 'super_admin'::public.app_role] then
    perform internal.assert_sensitive_action_allowed(array['owner'::public.app_role], 'Owner or Super Admin management');
  else
    perform internal.assert_sensitive_action_allowed(
      array['owner'::public.app_role, 'super_admin'::public.app_role],
      'admin user management'
    );
  end if;

  update public.user_profiles
  set
    full_name = case when p_update_full_name then nullif(btrim(p_full_name), '') else full_name end,
    is_active = case when p_update_is_active then coalesce(p_is_active, false) else is_active end,
    mfa_required = case when p_update_mfa_required then coalesce(p_mfa_required, false) else mfa_required end
  where id = p_user_id;
end;
$$;

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

revoke all on function public.create_admin_profile(uuid, text, public.app_role[]) from public, anon;
revoke all on function public.update_admin_profile(uuid, text, boolean, boolean, boolean, boolean, boolean) from public, anon;
revoke all on function public.assign_admin_roles(uuid, public.app_role[]) from public, anon;
revoke all on function public.remove_admin_roles(uuid, public.app_role[]) from public, anon;

grant execute on function public.create_admin_profile(uuid, text, public.app_role[]) to authenticated, service_role;
grant execute on function public.update_admin_profile(uuid, text, boolean, boolean, boolean, boolean, boolean) to authenticated, service_role;
grant execute on function public.assign_admin_roles(uuid, public.app_role[]) to authenticated, service_role;
grant execute on function public.remove_admin_roles(uuid, public.app_role[]) to authenticated, service_role;
