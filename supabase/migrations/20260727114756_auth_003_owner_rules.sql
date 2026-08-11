-- AUTH-003: Owner Rules
-- Enforce active Owner uniqueness and Owner-only Owner/Super Admin governance.

create or replace function internal.enforce_user_profiles_owner_rules()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_actor_id uuid;
  v_actor_is_active_owner boolean;
  v_active_owner_exists boolean;
  v_owner_fields_changed boolean;
begin
  v_actor_id := auth.uid();

  select exists (
    select 1
    from public.user_profiles actor_profile
    where actor_profile.id = v_actor_id
      and actor_profile.is_active
      and actor_profile.is_owner
  )
  into v_actor_is_active_owner;

  select exists (
    select 1
    from public.user_profiles existing_owner
    where existing_owner.is_active
      and existing_owner.is_owner
      and (tg_op = 'INSERT' or existing_owner.id <> new.id)
  )
  into v_active_owner_exists;

  if new.is_owner and new.is_active and v_active_owner_exists then
    raise exception 'Only one active Owner is allowed.'
      using errcode = '23505';
  end if;

  if tg_op = 'INSERT' then
    v_owner_fields_changed := new.is_owner;
  else
    v_owner_fields_changed :=
      old.is_owner is distinct from new.is_owner
      or ((old.is_active is distinct from new.is_active) and (old.is_owner or new.is_owner))
      or ((old.mfa_required is distinct from new.mfa_required) and (old.is_owner or new.is_owner));
  end if;

  if v_owner_fields_changed and not v_actor_is_active_owner then
    if tg_op = 'INSERT' and new.is_owner and new.is_active and not v_active_owner_exists then
      -- First active Owner bootstrap is allowed.
      return new;
    end if;

    raise exception 'Only an active Owner can change Owner profile fields.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

comment on function internal.enforce_user_profiles_owner_rules() is
  'Enforces one active Owner and Owner-only changes to Owner profile fields. First active Owner bootstrap is allowed.';

revoke all on function internal.enforce_user_profiles_owner_rules() from public, anon, authenticated;
grant execute on function internal.enforce_user_profiles_owner_rules() to postgres, service_role;

create trigger user_profiles_enforce_owner_rules
before insert or update on public.user_profiles
for each row
execute function internal.enforce_user_profiles_owner_rules();

create unique index if not exists user_roles_one_owner_role_idx
  on public.user_roles (role)
  where role = 'owner'::public.app_role;

create or replace function internal.enforce_user_roles_owner_rules()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_actor_id uuid;
  v_actor_is_active_owner boolean;
  v_target_is_active_owner boolean;
  v_owner_role_exists boolean;
  v_sensitive_role_changed boolean;
begin
  v_actor_id := auth.uid();

  select exists (
    select 1
    from public.user_profiles actor_profile
    where actor_profile.id = v_actor_id
      and actor_profile.is_active
      and actor_profile.is_owner
  )
  into v_actor_is_active_owner;

  if tg_op <> 'DELETE' and new.role = 'owner'::public.app_role then
    select exists (
      select 1
      from public.user_profiles target_profile
      where target_profile.id = new.user_id
        and target_profile.is_active
        and target_profile.is_owner
        and target_profile.mfa_required
    )
    into v_target_is_active_owner;

    if not v_target_is_active_owner then
      raise exception 'Owner role requires an active Owner profile with MFA required.'
        using errcode = '23514';
    end if;

    select exists (
      select 1
      from public.user_roles existing_owner_role
      where existing_owner_role.role = 'owner'::public.app_role
        and (
          tg_op = 'INSERT'
          or existing_owner_role.user_id <> old.user_id
          or old.role <> 'owner'::public.app_role
        )
    )
    into v_owner_role_exists;

    if v_owner_role_exists then
      raise exception 'Only one Owner role assignment is allowed.'
        using errcode = '23505';
    end if;
  else
    v_target_is_active_owner := false;
    v_owner_role_exists := false;
  end if;

  if tg_op = 'INSERT' then
    v_sensitive_role_changed := new.role in ('owner'::public.app_role, 'super_admin'::public.app_role);
  elsif tg_op = 'UPDATE' then
    v_sensitive_role_changed :=
      old.role in ('owner'::public.app_role, 'super_admin'::public.app_role)
      or new.role in ('owner'::public.app_role, 'super_admin'::public.app_role);
  else
    v_sensitive_role_changed := old.role in ('owner'::public.app_role, 'super_admin'::public.app_role);
  end if;

  if v_sensitive_role_changed and not v_actor_is_active_owner then
    if tg_op = 'INSERT'
      and new.role = 'owner'::public.app_role
      and v_target_is_active_owner
      and not v_owner_role_exists then
      -- First Owner role bootstrap is allowed after the first active Owner profile exists.
      return new;
    end if;

    raise exception 'Only an active Owner can change Owner or Super Admin role assignments.'
      using errcode = '42501';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

comment on function internal.enforce_user_roles_owner_rules() is
  'Blocks non-Owner changes to Owner and Super Admin role assignments.';

revoke all on function internal.enforce_user_roles_owner_rules() from public, anon, authenticated;
grant execute on function internal.enforce_user_roles_owner_rules() to postgres, service_role;

create trigger user_roles_enforce_owner_rules
before insert or update or delete on public.user_roles
for each row
execute function internal.enforce_user_roles_owner_rules();
