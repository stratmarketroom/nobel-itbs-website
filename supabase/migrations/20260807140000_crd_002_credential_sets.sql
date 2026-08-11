-- CRD-002: Credential Sets
-- Private, status-free grouping for a learner/programme/completion context.

alter table public.programme_runs
  add constraint programme_runs_programme_id_id_unique
  unique (programme_id, id);

create table public.credential_sets (
  id uuid primary key default extensions.gen_random_uuid(),
  learner_id uuid not null references public.learners(id) on delete restrict,
  programme_id uuid not null references public.programmes(id) on delete restrict,
  programme_run_id uuid null,
  completion_date date null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credential_sets_programme_run_context_fk
    foreign key (programme_id, programme_run_id)
    references public.programme_runs(programme_id, id)
    on delete restrict
);

comment on table public.credential_sets is
  'Private status-free grouping for related credentials of one learner and programme completion context; never publicly verified.';
comment on column public.credential_sets.programme_run_id is
  'Optional programme run that must belong to the set programme.';
comment on column public.credential_sets.completion_date is
  'Optional completion date shared by credentials in this administrative grouping.';

create unique index credential_sets_context_unique_idx
  on public.credential_sets (
    learner_id,
    programme_id,
    programme_run_id,
    completion_date
  ) nulls not distinct;

create index credential_sets_learner_created_idx
  on public.credential_sets (learner_id, created_at desc);

create index credential_sets_programme_run_idx
  on public.credential_sets (programme_id, programme_run_id);

create trigger credential_sets_set_updated_at
before update on public.credential_sets
for each row execute function internal.set_updated_at();

create or replace function internal.audit_credential_set_creation()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
begin
  perform internal.write_audit_log(
    p_action => 'credential_set.created',
    p_actor_id => auth.uid(),
    p_target_schema => 'public',
    p_target_table => 'credential_sets',
    p_target_id => new.id,
    p_metadata => '{}'::jsonb
  );

  return new;
end;
$$;

comment on function internal.audit_credential_set_creation() is
  'Audits credential-set creation without copying learner or completion context into audit metadata.';

revoke all on function internal.audit_credential_set_creation() from public, anon, authenticated;
grant execute on function internal.audit_credential_set_creation() to postgres, service_role;

create trigger credential_sets_audit_creation
after insert on public.credential_sets
for each row execute function internal.audit_credential_set_creation();

alter table public.credential_sets enable row level security;
alter table public.credential_sets force row level security;

revoke all on table public.credential_sets from public, anon, authenticated;

grant select on table public.credential_sets to authenticated;
grant insert (learner_id, programme_id, programme_run_id, completion_date)
  on table public.credential_sets to authenticated;

grant select, insert, update, delete on table public.credential_sets to postgres, service_role;

create policy credential_sets_authorized_read
on public.credential_sets
for select
to authenticated
using (
  internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);

create policy credential_sets_authorized_insert
on public.credential_sets
for insert
to authenticated
with check (
  internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);

create or replace function public.find_or_create_credential_set(
  p_learner_id uuid,
  p_programme_id uuid,
  p_programme_run_id uuid default null,
  p_completion_date date default null
)
returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  v_credential_set_id uuid;
begin
  if p_learner_id is null or p_programme_id is null then
    raise exception 'learner_id and programme_id are required'
      using errcode = '22023';
  end if;

  insert into public.credential_sets (
    learner_id,
    programme_id,
    programme_run_id,
    completion_date
  )
  values (
    p_learner_id,
    p_programme_id,
    p_programme_run_id,
    p_completion_date
  )
  on conflict do nothing
  returning id into v_credential_set_id;

  if v_credential_set_id is null then
    select credential_set.id
      into v_credential_set_id
    from public.credential_sets credential_set
    where credential_set.learner_id = p_learner_id
      and credential_set.programme_id = p_programme_id
      and credential_set.programme_run_id is not distinct from p_programme_run_id
      and credential_set.completion_date is not distinct from p_completion_date;
  end if;

  if v_credential_set_id is null then
    raise exception 'credential set could not be found or created'
      using errcode = '40001';
  end if;

  return v_credential_set_id;
end;
$$;

comment on function public.find_or_create_credential_set(uuid, uuid, uuid, date) is
  'Idempotently finds or creates the private set for an exact learner/programme/run/completion context. RLS and MFA policies remain authoritative.';

revoke all on function public.find_or_create_credential_set(uuid, uuid, uuid, date)
  from public, anon;
grant execute on function public.find_or_create_credential_set(uuid, uuid, uuid, date)
  to authenticated, postgres, service_role;
