begin;

select plan(20);

select has_type('public', 'record_status', 'record_status enum should exist');
select has_table('public', 'programme_areas', 'programme_areas table should exist');
select has_table('public', 'programme_area_translations', 'programme_area_translations table should exist');
select col_is_pk('public', 'programme_areas', 'id', 'programme_areas.id should be the primary key');
select col_is_pk(
  'public',
  'programme_area_translations',
  array['area_id', 'language_code'],
  'programme area translations should be unique by area and language'
);
select has_column('public', 'programme_areas', 'slug', 'programme_areas.slug should exist');
select has_column('public', 'programme_areas', 'status', 'programme_areas.status should exist');
select has_column('public', 'programme_areas', 'sort_order', 'programme_areas.sort_order should exist');
select has_column('public', 'programme_area_translations', 'translation_status', 'translation status should exist');
select has_column('public', 'programme_area_translations', 'title', 'translation title should exist');
select has_column('public', 'programme_area_translations', 'short_description', 'short description should exist');
select has_column('public', 'programme_area_translations', 'intro_content', 'intro content should exist');
select has_column('public', 'programme_area_translations', 'seo_title', 'SEO title should exist');
select has_column('public', 'programme_area_translations', 'seo_description', 'SEO description should exist');
select has_trigger('public', 'programme_areas', 'programme_areas_set_updated_at', 'programme areas should maintain updated_at');
select has_trigger(
  'public',
  'programme_area_translations',
  'programme_area_translations_set_updated_at',
  'programme area translations should maintain updated_at'
);

select results_eq(
  $$ select enumlabel::text from pg_enum
     where enumtypid = 'public.record_status'::regtype
     order by enumsortorder $$,
  $$ values ('draft'::text), ('published'::text), ('archived'::text) $$,
  'record_status should contain the approved lifecycle values'
);

select results_eq(
  $$ select slug, status::text, sort_order
     from public.programme_areas
     order by sort_order $$,
  $$ values
       ('business-management'::text, 'published'::text, 10),
       ('technology-innovation'::text, 'published'::text, 20),
       ('psychology-human'::text, 'published'::text, 30) $$,
  'programme areas should seed the three approved Release 1 records'
);

select results_eq(
  $$ select language_code, translation_status::text, count(*)::bigint
     from public.programme_area_translations
     group by language_code, translation_status
     order by language_code $$,
  $$ values
       ('cz'::text, 'draft'::text, 3::bigint),
       ('en'::text, 'published'::text, 3::bigint),
       ('ua'::text, 'published'::text, 3::bigint) $$,
  'each area should have EN, UA, and draft CZ content'
);

select results_eq(
  $$ select bool_and(relrowsecurity and relforcerowsecurity)
     from pg_class
     where oid in (
       'public.programme_areas'::regclass,
       'public.programme_area_translations'::regclass
     ) $$,
  $$ values (true) $$,
  'programme area tables should enable and force row level security'
);

select * from finish();

rollback;
