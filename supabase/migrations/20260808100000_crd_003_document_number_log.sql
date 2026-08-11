-- CRD-003: Document Number Log
-- Permanent shared sequence and controlled reservation/voiding with no reuse.

create type public.document_number_status as enum (
  'reserved',
  'issued',
  'voided'
);

create sequence public.document_number_shared_seq
  as bigint
  minvalue 1
  maxvalue 999999
  start with 1
  increment by 1
  no cycle;

comment on sequence public.document_number_shared_seq is
  'One non-cycling sequence shared by every credential type and year. Consumed values are never returned.';

revoke all on sequence public.document_number_shared_seq from public, anon, authenticated, service_role;
grant usage, select, update on sequence public.document_number_shared_seq to postgres;

create table public.document_number_log (
  id uuid primary key default extensions.gen_random_uuid(),
  document_number text not null unique,
  sequence_value bigint not null unique,
  credential_id uuid null,
  credential_type_id uuid not null references public.credential_types(id) on delete restrict,
  status public.document_number_status not null default 'reserved',
  is_manual boolean not null default false,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  voided_by uuid null references public.user_profiles(id) on delete restrict,
  void_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint document_number_log_format check (
    document_number ~ '^NITBS-[A-Z]-[0-9]{4}-[0-9]{6}$'
  ),
  constraint document_number_log_sequence_range check (
    sequence_value between 1 and 999999
  ),
  constraint document_number_log_issued_link check (
    status <> 'issued' or credential_id is not null
  ),
  constraint document_number_log_void_consistency check (
    (
      status = 'voided'
      and voided_by is not null
      and void_reason is not null
      and void_reason = btrim(void_reason)
      and void_reason <> ''
    )
    or (
      status <> 'voided'
      and voided_by is null
      and void_reason is null
    )
  )
);

comment on table public.document_number_log is
  'Permanent private registry of every reserved, issued, or voided document number. Rows and sequence values are never reused.';
comment on column public.document_number_log.sequence_value is
  'Shared numeric component across all document types and years; globally unique even for manual reservations.';
comment on column public.document_number_log.credential_id is
  'Reserved link slot. CRD-004 adds the foreign key after public.credentials exists.';
comment on column public.document_number_log.is_manual is
  'True only for the rare Owner/Super Admin manual reservation path with an audited reason.';

create index document_number_log_status_created_idx
  on public.document_number_log (status, created_at desc);

create index document_number_log_credential_type_idx
  on public.document_number_log (credential_type_id, created_at desc);

create index document_number_log_credential_id_idx
  on public.document_number_log (credential_id)
  where credential_id is not null;

create trigger document_number_log_set_updated_at
before update on public.document_number_log
for each row execute function internal.set_updated_at();

create or replace function internal.enforce_document_number_log_permanence()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'document number log rows are permanent'
      using errcode = '23514';
  end if;

  if old.id is distinct from new.id
    or old.document_number is distinct from new.document_number
    or old.sequence_value is distinct from new.sequence_value
    or old.credential_type_id is distinct from new.credential_type_id
    or old.is_manual is distinct from new.is_manual
    or old.created_by is distinct from new.created_by
    or old.created_at is distinct from new.created_at then
    raise exception 'document number identity fields are immutable'
      using errcode = '23514';
  end if;

  if old.status <> new.status and not (
    old.status = 'reserved'
    and new.status in ('issued', 'voided')
  ) then
    raise exception 'invalid document number status transition'
      using errcode = '23514';
  end if;

  if old.credential_id is not null
    and old.credential_id is distinct from new.credential_id then
    raise exception 'document number credential link is immutable once assigned'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function internal.enforce_document_number_log_permanence() is
  'Prevents number deletion, identity rewrites, reverse lifecycle transitions, and credential relinking.';

revoke all on function internal.enforce_document_number_log_permanence()
  from public, anon, authenticated;
grant execute on function internal.enforce_document_number_log_permanence()
  to postgres, service_role;

create trigger document_number_log_enforce_permanence
before update or delete on public.document_number_log
for each row execute function internal.enforce_document_number_log_permanence();

alter table public.document_number_log enable row level security;
alter table public.document_number_log force row level security;

revoke all on table public.document_number_log from public, anon, authenticated, service_role;
grant select on table public.document_number_log to authenticated, service_role;
grant select, insert, update on table public.document_number_log to postgres;
grant usage on type public.document_number_status to authenticated, service_role;

create policy document_number_log_authorized_read
on public.document_number_log
for select
to authenticated
using (
  internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);

create or replace function public.reserve_document_number(
  p_credential_type_id uuid,
  p_issue_date date
)
returns table (
  log_id uuid,
  reserved_document_number text,
  reserved_status public.document_number_status
)
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_document_letter text;
  v_sequence_value bigint;
  v_document_number text;
  v_log_id uuid;
begin
  if not internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
    or not internal.is_mfa_requirement_satisfied() then
    raise exception 'credential role with MFA is required'
      using errcode = '42501';
  end if;

  if p_issue_date is null then
    raise exception 'issue date is required'
      using errcode = '22023';
  end if;

  select credential_type.document_letter
    into v_document_letter
  from public.credential_types credential_type
  where credential_type.id = p_credential_type_id
    and credential_type.is_active;

  if v_document_letter is null then
    raise exception 'active credential type not found'
      using errcode = '22023';
  end if;

  loop
    v_sequence_value := nextval('public.document_number_shared_seq');
    v_document_number := format(
      'NITBS-%s-%s-%s',
      v_document_letter,
      to_char(p_issue_date, 'YYYY'),
      lpad(v_sequence_value::text, 6, '0')
    );

    begin
      insert into public.document_number_log (
        document_number,
        sequence_value,
        credential_type_id,
        status,
        is_manual,
        created_by
      )
      values (
        v_document_number,
        v_sequence_value,
        p_credential_type_id,
        'reserved',
        false,
        v_actor_id
      )
      returning id into v_log_id;

      exit;
    exception
      when unique_violation then
        -- A manual reservation may already own this shared numeric value.
        -- Consume the collision and continue; sequence values never move backwards.
    end;
  end loop;

  perform internal.write_audit_log(
    p_action => 'document_number.reserved',
    p_actor_id => v_actor_id,
    p_target_schema => 'public',
    p_target_table => 'document_number_log',
    p_target_id => v_log_id,
    p_metadata => jsonb_build_object(
      'manual', false,
      'credential_type_id', p_credential_type_id,
      'issue_year', extract(year from p_issue_date)::integer
    )
  );

  return query
  select v_log_id, v_document_number, 'reserved'::public.document_number_status;
end;
$$;

comment on function public.reserve_document_number(uuid, date) is
  'Reserves the next permanent NITBS number from the one shared non-cycling sequence. Requires credential role and MFA.';

create or replace function public.reserve_manual_document_number(
  p_credential_type_id uuid,
  p_issue_date date,
  p_document_number text,
  p_reason text
)
returns table (
  log_id uuid,
  reserved_document_number text,
  reserved_status public.document_number_status
)
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_document_letter text;
  v_sequence_value bigint;
  v_log_id uuid;
  v_normalized_number text := upper(btrim(p_document_number));
begin
  if not internal.has_any_role(array['owner', 'super_admin']::public.app_role[])
    or not internal.is_mfa_requirement_satisfied() then
    raise exception 'Owner or Super Admin with MFA is required for manual reservation'
      using errcode = '42501';
  end if;

  if p_issue_date is null then
    raise exception 'issue date is required'
      using errcode = '22023';
  end if;

  if p_document_number is null or btrim(p_document_number) = '' then
    raise exception 'manual document number is required'
      using errcode = '22023';
  end if;

  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'manual reservation reason is required'
      using errcode = '22023';
  end if;

  select credential_type.document_letter
    into v_document_letter
  from public.credential_types credential_type
  where credential_type.id = p_credential_type_id
    and credential_type.is_active;

  if v_document_letter is null then
    raise exception 'active credential type not found'
      using errcode = '22023';
  end if;

  if v_normalized_number !~ format(
    '^NITBS-%s-%s-[0-9]{6}$',
    v_document_letter,
    to_char(p_issue_date, 'YYYY')
  ) then
    raise exception 'manual document number must match the selected type and issue year'
      using errcode = '22023';
  end if;

  v_sequence_value := right(v_normalized_number, 6)::bigint;
  if v_sequence_value < 1 then
    raise exception 'manual document sequence value must start at 000001'
      using errcode = '22023';
  end if;

  begin
    insert into public.document_number_log (
      document_number,
      sequence_value,
      credential_type_id,
      status,
      is_manual,
      created_by
    )
    values (
      v_normalized_number,
      v_sequence_value,
      p_credential_type_id,
      'reserved',
      true,
      v_actor_id
    )
    returning id into v_log_id;
  exception
    when unique_violation then
      raise exception 'document number or shared sequence value is already reserved'
        using errcode = '23505';
  end;

  perform internal.write_audit_log(
    p_action => 'document_number.reserved_manual',
    p_actor_id => v_actor_id,
    p_target_schema => 'public',
    p_target_table => 'document_number_log',
    p_target_id => v_log_id,
    p_metadata => jsonb_build_object(
      'manual', true,
      'credential_type_id', p_credential_type_id,
      'issue_year', extract(year from p_issue_date)::integer,
      'reason', btrim(p_reason)
    )
  );

  return query
  select v_log_id, v_normalized_number, 'reserved'::public.document_number_status;
end;
$$;

comment on function public.reserve_manual_document_number(uuid, date, text, text) is
  'Rare audited manual reservation for Owner/Super Admin. The type, year, format, reason, and shared numeric value are enforced.';

create or replace function public.void_reserved_document_number(
  p_log_id uuid,
  p_reason text
)
returns public.document_number_log
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_log public.document_number_log;
begin
  if not internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
    or not internal.is_mfa_requirement_satisfied() then
    raise exception 'credential role with MFA is required'
      using errcode = '42501';
  end if;

  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'void reason is required'
      using errcode = '22023';
  end if;

  update public.document_number_log number_log
  set
    status = 'voided',
    voided_by = v_actor_id,
    void_reason = btrim(p_reason)
  where number_log.id = p_log_id
    and number_log.status = 'reserved'
  returning number_log.* into v_log;

  if v_log.id is null then
    raise exception 'reserved document number not found'
      using errcode = '22023';
  end if;

  perform internal.write_audit_log(
    p_action => 'document_number.voided',
    p_actor_id => v_actor_id,
    p_target_schema => 'public',
    p_target_table => 'document_number_log',
    p_target_id => v_log.id,
    p_metadata => jsonb_build_object('reason', btrim(p_reason))
  );

  return v_log;
end;
$$;

comment on function public.void_reserved_document_number(uuid, text) is
  'Permanently voids a reserved number with mandatory reason. Voided rows and numeric values remain unavailable forever.';

revoke all on function public.reserve_document_number(uuid, date)
  from public, anon, authenticated;
revoke all on function public.reserve_manual_document_number(uuid, date, text, text)
  from public, anon, authenticated;
revoke all on function public.void_reserved_document_number(uuid, text)
  from public, anon, authenticated;

grant execute on function public.reserve_document_number(uuid, date)
  to authenticated, postgres, service_role;
grant execute on function public.reserve_manual_document_number(uuid, date, text, text)
  to authenticated, postgres, service_role;
grant execute on function public.void_reserved_document_number(uuid, text)
  to authenticated, postgres, service_role;
