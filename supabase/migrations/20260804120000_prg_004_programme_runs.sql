-- PRG-004: Programme Runs and Enrolment Badge
-- Programme-run lifecycle, launch run seed, automatic badge calculation, and admin override contract.

create type public.programme_run_status as enum (
  'upcoming',
  'open',
  'ongoing',
  'closed'
);

comment on type public.programme_run_status is
  'Programme-run presentation state: upcoming, open for a cohort, continuously ongoing, or closed.';

alter table public.programmes
  add constraint programmes_enrolment_badge_override_allowed check (
    enrolment_badge_override is null
    or enrolment_badge_override in (
      'open',
      'ongoing',
      'coming_soon',
      'inactive'
    )
  );

comment on column public.programmes.enrolment_badge_override is
  'Optional admin correction using a supported badge key; null uses programme-run calculation.';

create table public.programme_runs (
  id uuid primary key default extensions.gen_random_uuid(),
  programme_id uuid not null references public.programmes(id) on delete restrict,
  status public.programme_run_status not null default 'upcoming',
  starts_at date null,
  ends_at date null,
  application_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint programme_runs_date_order check (
    starts_at is null
    or ends_at is null
    or ends_at >= starts_at
  ),
  constraint programme_runs_application_url_http check (
    application_url is null
    or application_url ~ '^https://'
  )
);

comment on table public.programme_runs is
  'Cohort-specific or continuously available programme runs used for enrolment presentation and credential reference.';
comment on column public.programme_runs.starts_at is
  'Programme learning start date, not an inferred enrolment-opening date.';
comment on column public.programme_runs.application_url is
  'Optional run-specific external application URL; the programme provider identifies Leeloo or a partner site.';

create index programme_runs_programme_status_dates_idx
  on public.programme_runs (programme_id, status, starts_at, ends_at);

create trigger programme_runs_set_updated_at
before update on public.programme_runs
for each row
execute function internal.set_updated_at();

insert into public.programme_runs (
  id,
  programme_id,
  status,
  starts_at,
  ends_at,
  application_url
)
values
  (
    '00000000-0000-4000-8000-000000000401',
    '00000000-0000-4000-8000-000000000301',
    'open',
    null,
    null,
    null
  ),
  (
    '00000000-0000-4000-8000-000000000402',
    '00000000-0000-4000-8000-000000000302',
    'ongoing',
    null,
    null,
    null
  ),
  (
    '00000000-0000-4000-8000-000000000403',
    '00000000-0000-4000-8000-000000000303',
    'ongoing',
    null,
    null,
    null
  ),
  (
    '00000000-0000-4000-8000-000000000404',
    '00000000-0000-4000-8000-000000000304',
    'open',
    '2026-10-05',
    null,
    null
  ),
  (
    '00000000-0000-4000-8000-000000000405',
    '00000000-0000-4000-8000-000000000305',
    'ongoing',
    null,
    null,
    null
  );

alter table public.programme_runs enable row level security;
alter table public.programme_runs force row level security;

revoke all on table public.programme_runs from public, anon, authenticated;
grant select on table public.programme_runs to anon;
grant select, insert, update, delete on table public.programme_runs to authenticated;
grant select, insert, update, delete on table public.programme_runs to postgres, service_role;
grant usage on type public.programme_run_status to anon, authenticated, service_role;

create policy programme_runs_public_read
on public.programme_runs for select to anon
using (
  status <> 'closed'
  and exists (
    select 1
    from public.programmes programme_record
    where programme_record.id = programme_id
      and programme_record.publication_status = 'published'
  )
);

create policy programme_runs_reference_read
on public.programme_runs for select to authenticated
using (
  internal.is_active_admin()
  and exists (
    select 1
    from public.programmes programme_record
    where programme_record.id = programme_id
      and programme_record.publication_status = 'published'
  )
);

create policy programme_runs_content_read
on public.programme_runs for select to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programme_runs_content_insert
on public.programme_runs for insert to authenticated
with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programme_runs_content_update
on public.programme_runs for update to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]))
with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programme_runs_content_delete
on public.programme_runs for delete to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create or replace function public.calculate_programme_enrolment_badge(
  p_programme_id uuid,
  p_as_of date default current_date
)
returns text
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  with programme_value as (
    select programme_record.enrolment_badge_override
    from public.programmes programme_record
    where programme_record.id = p_programme_id
  ),
  eligible_runs as (
    select run_record.status
    from public.programme_runs run_record
    where run_record.programme_id = p_programme_id
      and (
        run_record.ends_at is null
        or run_record.ends_at >= p_as_of
      )
  ),
  calculated_value as (
    select case
      when exists (select 1 from eligible_runs where status = 'open') then 'open'
      when exists (select 1 from eligible_runs where status = 'ongoing') then 'ongoing'
      when exists (select 1 from eligible_runs where status = 'upcoming') then 'coming_soon'
      else 'inactive'
    end as badge_key
  )
  select coalesce(programme_value.enrolment_badge_override, calculated_value.badge_key)
  from calculated_value
  left join programme_value on true;
$$;

comment on function public.calculate_programme_enrolment_badge(uuid, date) is
  'Returns open, ongoing, coming_soon, or inactive from visible runs unless an admin override is set.';

revoke all on function public.calculate_programme_enrolment_badge(uuid, date) from public;
grant execute on function public.calculate_programme_enrolment_badge(uuid, date) to anon, authenticated, service_role;
