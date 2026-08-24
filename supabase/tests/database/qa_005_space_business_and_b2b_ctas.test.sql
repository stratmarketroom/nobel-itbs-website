begin;

select plan(5);

select results_eq(
  $$ select application_provider::text, application_url
     from public.programmes
     where slug = 'space-business' $$,
  $$ values ('leeloo'::text, 'https://event.duan.edu.ua/et6naw'::text) $$,
  'Space Business should use its approved Leeloo destination'
);

select results_eq(
  $$ select public.resolve_programme_application_url(
       '00000000-0000-4000-8000-000000000305', null, null, current_date
     ) $$,
  $$ values ('https://event.duan.edu.ua/et6naw'::text) $$,
  'Space Business should resolve to the approved programme URL'
);

select results_eq(
  $$ select count(*)::bigint
     from public.programme_runs run_record
     join public.programmes programme_record on programme_record.id = run_record.programme_id
     where programme_record.slug = 'space-business'
       and run_record.status <> 'closed'
       and run_record.application_url is not null $$,
  $$ values (0::bigint) $$,
  'active runs should not override the Space Business programme CTA'
);

select results_eq(
  $$ select count(*)::bigint
     from public.programme_pricing_options pricing_record
     join public.programmes programme_record on programme_record.id = pricing_record.programme_id
     where programme_record.slug = 'space-business'
       and pricing_record.is_active
       and pricing_record.application_url is not null $$,
  $$ values (0::bigint) $$,
  'active pricing should not override the Space Business programme CTA'
);

select results_eq(
  $$ select value_text, is_public
     from public.site_settings
     where setting_key = 'for_organisations_application_url' $$,
  $$ values (null::text, true) $$,
  'For Organisations should retain its public on-site form fallback'
);

select * from finish();

rollback;
