begin;

select plan(18);

select has_column('public', 'programmes', 'catalogue_sort_order', 'catalogue sort order should exist');
select has_column('public', 'programmes', 'instruction_language_codes', 'future-filter instruction languages should exist');
select has_column('public', 'programme_translations', 'catalogue_description', 'localized catalogue description should exist');
select has_column('public', 'programme_translations', 'catalogue_facts', 'localized catalogue facts should exist');
select has_column('public', 'programme_translations', 'catalogue_document_summary', 'localized document summary should exist');

select results_eq(
  $$ select count(*)::bigint from public.programmes
     where publication_status = 'published'
       and cardinality(instruction_language_codes) > 0 $$,
  $$ values (5::bigint) $$,
  'all five launch programmes should expose instruction-language filter data'
);

select results_eq(
  $$ select array_agg(slug order by catalogue_sort_order) from public.programmes $$,
  $$ values (array[
       'ai-production',
       'general-psychology',
       'child-psychology',
       'neuroplastic-reconstruction',
       'space-business'
     ]::text[]) $$,
  'launch catalogue order should be deterministic'
);

select results_eq(
  $$ select instruction_language_codes from public.programmes where slug = 'space-business' $$,
  $$ values (array['uk', 'en']::text[]) $$,
  'Space Business should expose Ukrainian and English as instruction languages'
);

select results_eq(
  $$ select count(*)::bigint from public.programme_translations
     where translation_status = 'published'
       and btrim(catalogue_description) <> ''
       and btrim(catalogue_facts) <> ''
       and btrim(catalogue_document_summary) <> '' $$,
  $$ values (15::bigint) $$,
  'all launch cards should have complete EN, UA, and CZ catalogue content'
);

select results_eq(
  $$ select catalogue_document_summary
     from public.programme_translations
     where programme_id = '00000000-0000-4000-8000-000000000305'
       and language_code = 'ua' $$,
  $$ values ('Сертифікат Університету імені Альфреда Нобеля; години на сертифікаті не зазначаються.'::text) $$,
  'Space Business card should name the university issuer and omit hours from the certificate claim'
);

select results_eq(
  $$ select starts_at from public.programme_runs
     where programme_id = '00000000-0000-4000-8000-000000000304'
       and status = 'open' $$,
  $$ values ('2026-10-05'::date) $$,
  'Neuroplastic Reconstruction should retain the approved 5 October 2026 start date'
);

select results_eq(
  $$ select public.calculate_programme_enrolment_badge(
       '00000000-0000-4000-8000-000000000304',
       '2026-08-04'
     ) $$,
  $$ values ('open'::text) $$,
  'Neuroplastic Reconstruction should show enrolment open before its start date'
);

select throws_ok(
  $$ update public.programmes set catalogue_sort_order = -1 where slug = 'ai-production' $$,
  '23514',
  null,
  'negative catalogue order should be rejected'
);

select throws_ok(
  $$ update public.programmes set instruction_language_codes = '{}' where slug = 'ai-production' $$,
  '23514',
  null,
  'published programmes should require instruction-language data'
);

select throws_ok(
  $$ update public.programme_translations
     set catalogue_document_summary = null
     where programme_id = '00000000-0000-4000-8000-000000000301'
       and language_code = 'en' $$,
  '23514',
  null,
  'published programme translations should require complete catalogue content'
);

select has_index(
  'public',
  'programmes',
  'programmes_public_catalogue_order_idx',
  'public catalogue ordering should be indexed'
);

select has_index(
  'public',
  'programmes',
  'programmes_instruction_languages_idx',
  'future instruction-language filtering should be indexed'
);

select results_eq(
  $$ select count(*)::bigint from public.programme_pricing_options $$,
  $$ values (0::bigint) $$,
  'catalogue launch should not introduce or expose unconfirmed pricing records'
);

select * from finish();

rollback;
