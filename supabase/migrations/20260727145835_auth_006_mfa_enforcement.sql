-- AUTH-006: MFA Enforcement Foundation
-- Database helpers and guardrails for sensitive admin actions.

create or replace function internal.role_requires_mfa(p_role public.app_role)
returns boolean
language sql
immutable
set search_path = internal, public, pg_temp
as $$
  select p_role in (
    'owner'::public.app_role,
    'super_admin'::public.app_role,
    'credential_manager'::public.app_role
  );
$$;

comment on function internal.role_requires_mfa(public.app_role) is
  'Returns true for roles that must satisfy MFA: Owner, Super Admin, Credential Manager.';

revoke all on function internal.role_requires_mfa(public.app_role) from public, anon;
grant execute on function internal.role_requires_mfa(public.app_role) to authenticated, service_role;

create or replace function internal.current_user_requires_mfa()
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
      left join public.user_roles role_assignment
        on role_assignment.user_id = profile.id
      where profile.id = auth.uid()
        and profile.is_active
        and (
          profile.mfa_required
          or internal.role_requires_mfa(role_assignment.role)
        )
    ),
    false
  );
$$;

comment on function internal.current_user_requires_mfa() is
  'Returns true when auth.uid() has an active profile or role requiring MFA.';

revoke all on function internal.current_user_requires_mfa() from public, anon;
grant execute on function internal.current_user_requires_mfa() to authenticated, service_role;

create or replace function internal.assert_mfa_requirement_satisfied()
returns void
language plpgsql
stable
security definer
set search_path = internal, public, pg_temp
as $$
begin
  if not internal.is_active_admin() then
    raise exception 'Active admin session is required.'
      using errcode = '42501';
  end if;

  if internal.current_user_requires_mfa() and not internal.has_mfa_aal() then
    raise exception 'MFA/AAL2 is required for this action.'
      using errcode = '42501';
  end if;
end;
$$;

comment on function internal.assert_mfa_requirement_satisfied() is
  'Raises when auth.uid() is not an active admin or when required MFA/AAL2 is missing.';

revoke all on function internal.assert_mfa_requirement_satisfied() from public, anon;
grant execute on function internal.assert_mfa_requirement_satisfied() to authenticated, service_role;

create or replace function internal.assert_sensitive_action_allowed(
  p_required_roles public.app_role[],
  p_action text default null
)
returns void
language plpgsql
stable
security definer
set search_path = internal, public, pg_temp
as $$
begin
  if p_required_roles is null or cardinality(p_required_roles) = 0 then
    raise exception 'At least one required role must be provided for sensitive action checks.'
      using errcode = '22023';
  end if;

  if not internal.has_any_role(p_required_roles) then
    raise exception 'Required role is missing for this action.'
      using errcode = '42501',
      hint = coalesce(p_action, 'sensitive action');
  end if;

  perform internal.assert_mfa_requirement_satisfied();
end;
$$;

comment on function internal.assert_sensitive_action_allowed(public.app_role[], text) is
  'Server-side guard for sensitive routes/functions: checks current active role and MFA/AAL2 where required.';

revoke all on function internal.assert_sensitive_action_allowed(public.app_role[], text) from public, anon;
grant execute on function internal.assert_sensitive_action_allowed(public.app_role[], text) to authenticated, service_role;

create or replace function internal.enforce_user_profiles_mfa_rules()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_has_mfa_role boolean;
begin
  if new.is_owner then
    new.mfa_required := true;
    return new;
  end if;

  select exists (
    select 1
    from public.user_roles role_assignment
    where role_assignment.user_id = new.id
      and internal.role_requires_mfa(role_assignment.role)
  )
  into v_has_mfa_role;

  if v_has_mfa_role and not new.mfa_required then
    raise exception 'MFA is required for Owner, Super Admin, and Credential Manager roles.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function internal.enforce_user_profiles_mfa_rules() is
  'Prevents disabling mfa_required for users with MFA-required roles; Owner profiles are always marked MFA-required.';

revoke all on function internal.enforce_user_profiles_mfa_rules() from public, anon, authenticated;
grant execute on function internal.enforce_user_profiles_mfa_rules() to postgres, service_role;

create trigger user_profiles_enforce_mfa_rules
before insert or update on public.user_profiles
for each row
execute function internal.enforce_user_profiles_mfa_rules();

create or replace function internal.enforce_user_roles_mfa_rules()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
begin
  if tg_op <> 'DELETE' and internal.role_requires_mfa(new.role) then
    update public.user_profiles
    set mfa_required = true
    where id = new.user_id
      and not mfa_required;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

comment on function internal.enforce_user_roles_mfa_rules() is
  'Automatically marks users as MFA-required when assigning Owner, Super Admin, or Credential Manager roles.';

revoke all on function internal.enforce_user_roles_mfa_rules() from public, anon, authenticated;
grant execute on function internal.enforce_user_roles_mfa_rules() to postgres, service_role;

create trigger user_roles_enforce_mfa_rules
before insert or update on public.user_roles
for each row
execute function internal.enforce_user_roles_mfa_rules();
