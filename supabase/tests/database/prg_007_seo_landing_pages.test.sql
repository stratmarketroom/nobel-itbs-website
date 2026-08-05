begin;

select plan(22);

select has_column('public', 'programme_area_translations', 'sections', 'area landing sections should exist');
select has_column('public', 'programme_area_translations', 'og_title', 'area Open Graph title should exist');
select has_column('public', 'programme_area_translations', 'og_description', 'area Open Graph description should exist');
select has_function('internal', 'assert_programme_slug_available', array['text', 'text', 'uuid'], 'shared slug assertion should exist');
select has_function('internal', 'enforce_programme_shared_slug', array[]::text[], 'shared slug trigger function should exist');
select has_trigger('public', 'programmes', 'programmes_enforce_shared_slug', 'programme slugs should use the shared namespace trigger');
select has_trigger('public', 'programme_areas', 'programme_areas_enforce_shared_slug', 'area slugs should use the shared namespace trigger');
select has_trigger('public', 'programme_types', 'programme_types_enforce_shared_slug', 'type slugs should use the shared namespace trigger');

select results_eq(
  $$ select count(*)::bigint from public.programme_area_translations where translation_status = 'published' $$,
  $$ values (9::bigint) $$,
  'all three areas should be published in EN, UA, and CZ'
);

select results_eq(
  $$ select count(*)::bigint from public.programme_area_translations where language_code = 'cz' and translation_status = 'published' $$,
  $$ values (3::bigint) $$,
  'all Czech area translations should be published'
);

select results_eq(
  $$ select count(*)::bigint from public.programme_area_translations
     where sections ?& array['eyebrow', 'primary_cta_label', 'about', 'audience', 'outcomes', 'listing', 'closing_cta'] $$,
  $$ values (9::bigint) $$,
  'every area translation should contain the fixed landing-page sections'
);

select results_eq(
  $$ select count(*)::bigint from public.programme_area_translations where btrim(og_title) <> '' and btrim(og_description) <> '' $$,
  $$ values (9::bigint) $$,
  'every area translation should have Open Graph metadata'
);

select results_eq(
  $$ select count(*)::bigint from (
       select slug from public.programmes union select slug from public.programme_areas union select slug from public.programme_types
     ) namespace_slugs $$,
  $$ values (11::bigint) $$,
  'all launch slugs should currently be unique across the shared namespace'
);

select results_eq(
  $$ select ((select count(*) from public.programme_areas where status = 'published') + (select count(*) from public.programme_types where status = 'published'))::bigint $$,
  $$ values (6::bigint) $$,
  'six SEO taxonomy landing pages should be published'
);

select throws_ok(
  $$ update public.programmes set slug = 'business-management' where slug = 'ai-production' $$,
  '23505', 'Programme namespace slug "business-management" is already used.',
  'programme slug should not collide with an area slug'
);

select throws_ok(
  $$ update public.programme_areas set slug = 'mini-mba' where slug = 'business-management' $$,
  '23505', 'Programme namespace slug "mini-mba" is already used.',
  'area slug should not collide with a type slug'
);

select throws_ok(
  $$ update public.programme_types set slug = 'space-business' where slug = 'mini-mba' $$,
  '23505', 'Programme namespace slug "space-business" is already used.',
  'type slug should not collide with a programme slug'
);

select results_eq(
  $$ select has_function_privilege('anon', 'internal.assert_programme_slug_available(text,text,uuid)', 'execute') $$,
  $$ values (false) $$,
  'anonymous users should not execute the internal slug assertion directly'
);

select results_eq(
  $$ select count(*)::bigint from information_schema.routine_privileges
     where routine_schema = 'internal' and routine_name in ('assert_programme_slug_available', 'enforce_programme_shared_slug') and grantee = 'PUBLIC' $$,
  $$ values (0::bigint) $$,
  'shared slug functions should not retain PUBLIC execution grants'
);

select results_eq(
  $$ select short_description from public.programme_area_translations
     where area_id = '00000000-0000-4000-8000-000000000103' and language_code = 'ua' $$,
  $$ values ('Розуміння людини допомагає діяти уважніше, професійніше й відповідальніше.'::text) $$,
  'Psychology & Human should retain the approved Ukrainian positioning'
);

select results_eq(
  $$ select count(*)::bigint from public.programme_type_translations
     where translation_status = 'published' and sections ?& array['primary_cta_label', 'audience', 'comparison', 'listing', 'closing_cta'] $$,
  $$ values (9::bigint) $$,
  'all type landing translations should retain complete structured content'
);

select results_eq(
  $$ select count(*)::bigint from public.programmes
     where publication_status = 'published'
       and area_id in (select id from public.programme_areas where status = 'published')
       and type_id in (select id from public.programme_types where status = 'published') $$,
  $$ values (5::bigint) $$,
  'all launch programmes should be available to automatic area and type listings'
);

select * from finish();

rollback;
