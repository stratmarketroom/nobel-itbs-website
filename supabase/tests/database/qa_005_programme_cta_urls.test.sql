begin;

select plan(8);

select results_eq(
  $$ select application_provider::text, application_url
     from public.programmes
     where slug = 'general-psychology' $$,
  $$ values ('leeloo'::text, 'https://event.duan.edu.ua/ie80iq'::text) $$,
  'General Psychology should use its approved Leeloo destination'
);

select results_eq(
  $$ select application_provider::text, application_url
     from public.programmes
     where slug = 'child-psychology' $$,
  $$ values ('leeloo'::text, 'https://event.duan.edu.ua/830uga'::text) $$,
  'Child Psychology should use its approved Leeloo destination'
);

select results_eq(
  $$ select application_provider::text, application_url
     from public.programmes
     where slug = 'ai-production' $$,
  $$ values ('partner_site'::text, null::text) $$,
  'AI Production should remain on the question fallback'
);

select results_eq(
  $$ select public.resolve_programme_application_url(
       '00000000-0000-4000-8000-000000000302', null, null, current_date
     ) $$,
  $$ values ('https://event.duan.edu.ua/ie80iq'::text) $$,
  'General Psychology should resolve to the approved programme URL'
);

select results_eq(
  $$ select public.resolve_programme_application_url(
       '00000000-0000-4000-8000-000000000303', null, null, current_date
     ) $$,
  $$ values ('https://event.duan.edu.ua/830uga'::text) $$,
  'Child Psychology should resolve to the approved programme URL'
);

select results_eq(
  $$ select public.resolve_programme_application_url(
       '00000000-0000-4000-8000-000000000301', null, null, current_date
     ) $$,
  $$ values (null::text) $$,
  'AI Production should resolve to the on-site question fallback'
);

select results_eq(
  $$ select count(*)::bigint
     from public.programme_runs run_record
     join public.programmes programme_record on programme_record.id = run_record.programme_id
     where programme_record.slug in ('general-psychology', 'child-psychology', 'ai-production')
       and run_record.status <> 'closed'
       and run_record.application_url is not null $$,
  $$ values (0::bigint) $$,
  'active runs should not override the approved programme CTA state'
);

select results_eq(
  $$ select count(*)::bigint
     from public.programme_pricing_options pricing_record
     join public.programmes programme_record on programme_record.id = pricing_record.programme_id
     where programme_record.slug in ('general-psychology', 'child-psychology', 'ai-production')
       and pricing_record.is_active
       and pricing_record.application_url is not null $$,
  $$ values (0::bigint) $$,
  'active pricing should not override the approved programme CTA state'
);

select * from finish();

rollback;
