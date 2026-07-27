-- AUTH-002: Multi-Role Model
-- Users may have multiple application roles. Owner-specific governance is handled in AUTH-003.

do $$
begin
  if not exists (
    select 1
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public'
      and t.typname = 'app_role'
  ) then
    create type public.app_role as enum (
      'owner',
      'super_admin',
      'content_manager',
      'credential_manager'
    );
  end if;
end;
$$;

comment on type public.app_role is
  'Application roles. Users may have multiple roles through public.user_roles.';

create table if not exists public.user_roles (
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  role public.app_role not null,
  assigned_by uuid null references public.user_profiles(id) on delete set null,
  assigned_at timestamptz not null default now(),
  primary key (user_id, role)
);

comment on table public.user_roles is
  'Many-to-many application role assignments for active admin authorization.';
comment on column public.user_roles.user_id is
  'Application user receiving the role.';
comment on column public.user_roles.role is
  'Assigned application role.';
comment on column public.user_roles.assigned_by is
  'Application user who assigned the role when known.';
comment on column public.user_roles.assigned_at is
  'Timestamp when the role assignment was created.';

create index if not exists user_roles_role_idx
  on public.user_roles (role);

create index if not exists user_roles_assigned_by_idx
  on public.user_roles (assigned_by)
  where assigned_by is not null;

alter table public.user_roles enable row level security;
alter table public.user_roles force row level security;

revoke all on table public.user_roles from public, anon, authenticated;
grant select, insert, update, delete on table public.user_roles to postgres, service_role;

create or replace function internal.audit_user_roles_change()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_actor_id uuid;
begin
  v_actor_id := auth.uid();

  if tg_op = 'INSERT' then
    perform internal.write_audit_log(
      p_action := 'user_role.assigned',
      p_actor_id := v_actor_id,
      p_target_schema := 'public',
      p_target_table := 'user_roles',
      p_target_id := new.user_id,
      p_metadata := jsonb_build_object(
        'role', new.role,
        'assigned_by', new.assigned_by
      )
    );

    return new;
  end if;

  if tg_op = 'UPDATE' then
    perform internal.write_audit_log(
      p_action := 'user_role.updated',
      p_actor_id := v_actor_id,
      p_target_schema := 'public',
      p_target_table := 'user_roles',
      p_target_id := new.user_id,
      p_metadata := jsonb_build_object(
        'old_role', old.role,
        'new_role', new.role,
        'assigned_by_changed', old.assigned_by is distinct from new.assigned_by
      )
    );

    return new;
  end if;

  perform internal.write_audit_log(
    p_action := 'user_role.removed',
    p_actor_id := v_actor_id,
    p_target_schema := 'public',
    p_target_table := 'user_roles',
    p_target_id := old.user_id,
    p_metadata := jsonb_build_object(
      'role', old.role
    )
  );

  return old;
end;
$$;

comment on function internal.audit_user_roles_change() is
  'Writes minimal audit metadata for user role assignment changes.';

revoke all on function internal.audit_user_roles_change() from public, anon, authenticated;
grant execute on function internal.audit_user_roles_change() to postgres, service_role;

create trigger user_roles_audit_changes
after insert or update or delete on public.user_roles
for each row
execute function internal.audit_user_roles_change();
