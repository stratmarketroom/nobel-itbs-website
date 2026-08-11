-- DBF-004: Audit Foundation
-- Append-only audit foundation for sensitive/admin actions.

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  actor_id uuid null,
  action text not null,
  target_schema text null,
  target_table text null,
  target_id uuid null,
  request_id text null,
  ip_hash text null,
  user_agent_hash text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_log_action_not_blank check (btrim(action) <> ''),
  constraint audit_log_target_schema_not_blank check (
    target_schema is null or btrim(target_schema) <> ''
  ),
  constraint audit_log_target_table_not_blank check (
    target_table is null or btrim(target_table) <> ''
  ),
  constraint audit_log_metadata_is_object check (jsonb_typeof(metadata) = 'object'),
  constraint audit_log_metadata_forbidden_keys check (
    not (
      metadata ?| array[
        'raw_token',
        'token',
        'password',
        'mfa_secret',
        'private_file_content',
        'file_content'
      ]
    )
  )
);

comment on table public.audit_log is
  'Append-only global audit log for sensitive/admin actions. Do not store raw tokens, passwords, MFA secrets, private file contents, or unnecessary PII.';
comment on column public.audit_log.actor_id is
  'Supabase auth user ID when available. Nullable for server/system events.';
comment on column public.audit_log.action is
  'Stable application action name, for example user.role.assigned or credential.activated.';
comment on column public.audit_log.metadata is
  'Minimal structured context. Forbidden keys block obvious raw secrets and private file contents.';

create index if not exists audit_log_occurred_at_idx
  on public.audit_log (occurred_at desc);

create index if not exists audit_log_actor_id_idx
  on public.audit_log (actor_id)
  where actor_id is not null;

create index if not exists audit_log_target_idx
  on public.audit_log (target_schema, target_table, target_id)
  where target_table is not null;

alter table public.audit_log enable row level security;
alter table public.audit_log force row level security;

revoke all on table public.audit_log from public, anon, authenticated;
grant select, insert on table public.audit_log to postgres, service_role;

create or replace function internal.prevent_audit_log_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
begin
  raise exception 'audit_log is append-only'
    using errcode = '42501';
end;
$$;

comment on function internal.prevent_audit_log_mutation() is
  'Blocks updates and deletes on public.audit_log.';

revoke all on function internal.prevent_audit_log_mutation() from public, anon, authenticated;
grant execute on function internal.prevent_audit_log_mutation() to postgres, service_role;

create trigger audit_log_prevent_mutation
before update or delete on public.audit_log
for each row
execute function internal.prevent_audit_log_mutation();

create trigger audit_log_prevent_truncate
before truncate on public.audit_log
for each statement
execute function internal.prevent_audit_log_mutation();

create or replace function internal.write_audit_log(
  p_action text,
  p_actor_id uuid default null,
  p_target_schema text default null,
  p_target_table text default null,
  p_target_id uuid default null,
  p_request_id text default null,
  p_ip_hash text default null,
  p_user_agent_hash text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_audit_log_id uuid;
begin
  insert into public.audit_log (
    actor_id,
    action,
    target_schema,
    target_table,
    target_id,
    request_id,
    ip_hash,
    user_agent_hash,
    metadata
  )
  values (
    p_actor_id,
    p_action,
    p_target_schema,
    p_target_table,
    p_target_id,
    p_request_id,
    p_ip_hash,
    p_user_agent_hash,
    coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_audit_log_id;

  return v_audit_log_id;
end;
$$;

comment on function internal.write_audit_log(
  text,
  uuid,
  text,
  text,
  uuid,
  text,
  text,
  text,
  jsonb
) is
  'Server-side helper for writing append-only audit entries. Do not pass raw tokens, secrets, MFA data, private file contents, or unnecessary PII.';

revoke all on function internal.write_audit_log(
  text,
  uuid,
  text,
  text,
  uuid,
  text,
  text,
  text,
  jsonb
) from public, anon, authenticated;

grant execute on function internal.write_audit_log(
  text,
  uuid,
  text,
  text,
  uuid,
  text,
  text,
  text,
  jsonb
) to postgres, service_role;
