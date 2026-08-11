begin;

select plan(25);

select has_type('public', 'programme_run_status', 'programme run status enum should exist');
select has_table('public', 'programme_runs', 'programme runs table should exist');
select col_is_pk('public', 'programme_runs', 'id', 'programme_runs.id should be the primary key');
select has_column('public', 'programme_runs', 'programme_id', 'programme reference should exist');
select has_column('public', 'programme_runs', 'status', 'run status should exist');
select has_column('public', 'programme_runs', 'starts_at', 'run start date should exist');
select has_column('public', 'programme_runs', 'ends_at', 'run end date should exist');
select has_column('public', 'programme_runs', 'application_url', 'run application URL should exist');
select has_trigger('public', 'programme_runs', 'programme_runs_set_updated_at', 'programme runs should maintain updated_at');
select has_function(
  'public',
  'calculate_programme_enrolment_badge',
  array['uuid', 'date'],
  'enrolment badge calculation function should exist'
);

select results_eq(
  $$ select programme_record.slug, run_record.status::text, run_record.starts_at
     from public.programme_runs run_record
     join public.programmes programme_record on programme_record.id = run_record.programme_id
     order by programme_record.slug $$,
  $$ values
       ('ai-production'::text, 'open'::text, null::date),
       ('child-psychology'::text, 'ongoing'::text, null::date),
       ('general-psychology'::text, 'ongoing'::text, null::date),
       ('neuroplastic-reconstruction'::text, 'open'::text, '2026-10-05'::date),
       ('space-business'::text, 'ongoing'::text, null::date) $$,
  'launch runs should match the approved catalogue states and Neuroplastic start date'
);

select results_eq(
  $$ select programme_record.slug, public.calculate_programme_enrolment_badge(programme_record.id, '2026-08-04'::date)
     from public.programmes programme_record
     order by programme_record.slug $$,
  $$ values
       ('ai-production'::text, 'open'::text),
       ('child-psychology'::text, 'ongoing'::text),
       ('general-psychology'::text, 'ongoing'::text),
       ('neuroplastic-reconstruction'::text, 'open'::text),
       ('space-business'::text, 'ongoing'::text) $$,
  'calculated launch badges should match approved public presentation'
);

update public.programmes
set enrolment_badge_override = 'coming_soon'
where slug = 'ai-production';

select results_eq(
  $$ select public.calculate_programme_enrolment_badge(id, '2026-08-04'::date)
     from public.programmes
     where slug = 'ai-production' $$,
  $$ values ('coming_soon'::text) $$,
  'admin override should take precedence over run calculation'
);

update public.programmes
set enrolment_badge_override = null
where slug = 'ai-production';

select throws_ok(
  $$ update public.programmes
     set enrolment_badge_override = 'custom-value'
     where slug = 'ai-production' $$,
  '23514',
  null,
  'unsupported enrolment badge override should be rejected'
);

select throws_ok(
  $$ insert into public.programme_runs (programme_id, status, starts_at, ends_at)
     values (
       '00000000-0000-4000-8000-000000000301',
       'upcoming',
       '2026-10-10',
       '2026-10-01'
     ) $$,
  '23514',
  null,
  'programme run end date must not precede start date'
);

select results_eq(
  $$ select count(*)::bigint
     from public.programme_runs
     where application_url is not null $$,
  $$ values (0::bigint) $$,
  'run-specific application URLs should remain empty until approved'
);

select results_eq(
  $$ select bool_and(relrowsecurity and relforcerowsecurity)
     from pg_class
     where oid = 'public.programme_runs'::regclass $$,
  $$ values (true) $$,
  'programme runs should enable and force row level security'
);

select has_policy('public', 'programme_runs', 'programme_runs_public_read', 'published active runs should have a public read policy');
select has_policy('public', 'programme_runs', 'programme_runs_reference_read', 'active admins should have a reference read policy');
select has_policy('public', 'programme_runs', 'programme_runs_content_read', 'content roles should have a read policy');
select has_policy('public', 'programme_runs', 'programme_runs_content_insert', 'content roles should have an insert policy');
select has_policy('public', 'programme_runs', 'programme_runs_content_update', 'content roles should have an update policy');
select has_policy('public', 'programme_runs', 'programme_runs_content_delete', 'content roles should have a delete policy');

select results_eq(
  $$ select count(*)::bigint
     from public.programme_runs
     where status = 'closed' $$,
  $$ values (0::bigint) $$,
  'launch seed should not mark any programme as closed'
);

select results_eq(
  $$ select count(*)::bigint
     from public.programme_runs
     where starts_at is not null $$,
  $$ values (1::bigint) $$,
  'only the owner-confirmed Neuroplastic cohort should have a launch date'
);

select * from finish();

rollback;
