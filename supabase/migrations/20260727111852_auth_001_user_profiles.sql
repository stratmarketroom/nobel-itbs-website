-- AUTH-001: User Profiles
-- Application profile records for Supabase Auth users.

create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text null,
  is_active boolean not null default true,
  is_owner boolean not null default false,
  mfa_required boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_profiles_full_name_not_blank check (
    full_name is null or btrim(full_name) <> ''
  ),
  constraint user_profiles_owner_requires_mfa check (
    not is_owner or mfa_required
  )
);

comment on table public.user_profiles is
  'Application profile records for Supabase Auth users. Roles are modeled separately in user_roles.';
comment on column public.user_profiles.id is
  'Matches auth.users.id.';
comment on column public.user_profiles.is_active is
  'Controls whether the user is active in the application admin model.';
comment on column public.user_profiles.is_owner is
  'Owner flag. At most one active profile may be Owner.';
comment on column public.user_profiles.mfa_required is
  'Whether the user must satisfy MFA/AAL requirements for sensitive admin actions.';

create unique index if not exists user_profiles_one_active_owner_idx
  on public.user_profiles (is_owner)
  where is_owner and is_active;

create trigger user_profiles_set_updated_at
before update on public.user_profiles
for each row
execute function internal.set_updated_at();

alter table public.user_profiles enable row level security;
alter table public.user_profiles force row level security;

revoke all on table public.user_profiles from public, anon, authenticated;
grant select, insert, update on table public.user_profiles to postgres, service_role;

create or replace function internal.audit_user_profiles_change()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_action text;
  v_actor_id uuid;
begin
  v_actor_id := auth.uid();

  if tg_op = 'INSERT' then
    v_action := 'user_profile.created';

    perform internal.write_audit_log(
      p_action := v_action,
      p_actor_id := v_actor_id,
      p_target_schema := 'public',
      p_target_table := 'user_profiles',
      p_target_id := new.id,
      p_metadata := jsonb_build_object(
        'is_active', new.is_active,
        'is_owner', new.is_owner,
        'mfa_required', new.mfa_required
      )
    );

    return new;
  end if;

  v_action := 'user_profile.updated';

  perform internal.write_audit_log(
    p_action := v_action,
    p_actor_id := v_actor_id,
    p_target_schema := 'public',
    p_target_table := 'user_profiles',
    p_target_id := new.id,
    p_metadata := jsonb_build_object(
      'is_active_changed', old.is_active is distinct from new.is_active,
      'is_owner_changed', old.is_owner is distinct from new.is_owner,
      'mfa_required_changed', old.mfa_required is distinct from new.mfa_required,
      'full_name_changed', old.full_name is distinct from new.full_name
    )
  );

  return new;
end;
$$;

comment on function internal.audit_user_profiles_change() is
  'Writes minimal audit metadata for user profile create/update events.';

revoke all on function internal.audit_user_profiles_change() from public, anon, authenticated;
grant execute on function internal.audit_user_profiles_change() to postgres, service_role;

create trigger user_profiles_audit_changes
after insert or update on public.user_profiles
for each row
execute function internal.audit_user_profiles_change();
