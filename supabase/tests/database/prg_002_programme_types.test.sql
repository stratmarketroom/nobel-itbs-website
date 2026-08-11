begin;

select plan(22);

select has_table('public', 'programme_types', 'programme_types table should exist');
select has_table('public', 'programme_type_translations', 'programme_type_translations table should exist');
select col_is_pk('public', 'programme_types', 'id', 'programme_types.id should be the primary key');
select col_is_pk(
  'public',
  'programme_type_translations',
  array['type_id', 'language_code'],
  'programme type translations should be unique by type and language'
);
select has_column('public', 'programme_types', 'slug', 'programme_types.slug should exist');
select has_column('public', 'programme_types', 'status', 'programme_types.status should exist');
select has_column('public', 'programme_types', 'sort_order', 'programme_types.sort_order should exist');
select has_column('public', 'programme_type_translations', 'title', 'translation title should exist');
select has_column('public', 'programme_type_translations', 'landing_title', 'landing H1 should exist');
select has_column('public', 'programme_type_translations', 'short_description', 'short description should exist');
select has_column('public', 'programme_type_translations', 'intro_content', 'intro content should exist');
select has_column('public', 'programme_type_translations', 'sections', 'structured sections should exist');
select has_column('public', 'programme_type_translations', 'seo_title', 'SEO title should exist');
select has_column('public', 'programme_type_translations', 'seo_description', 'SEO description should exist');
select has_column('public', 'programme_type_translations', 'og_title', 'OG title should exist');
select has_column('public', 'programme_type_translations', 'og_description', 'OG description should exist');
select has_trigger('public', 'programme_types', 'programme_types_set_updated_at', 'programme types should maintain updated_at');
select has_trigger(
  'public',
  'programme_type_translations',
  'programme_type_translations_set_updated_at',
  'programme type translations should maintain updated_at'
);

select results_eq(
  $$ select slug, status::text, sort_order
     from public.programme_types
     order by sort_order $$,
  $$ values
       ('certificate-programme'::text, 'published'::text, 10),
       ('mini-mba'::text, 'published'::text, 20),
       ('professional-development-course'::text, 'published'::text, 30) $$,
  'programme types should seed the three approved published records'
);

select results_eq(
  $$ select language_code, translation_status::text, count(*)::bigint
     from public.programme_type_translations
     group by language_code, translation_status
     order by language_code $$,
  $$ values
       ('cz'::text, 'published'::text, 3::bigint),
       ('en'::text, 'published'::text, 3::bigint),
       ('ua'::text, 'published'::text, 3::bigint) $$,
  'all nine approved programme type translations should be published'
);

select results_eq(
  $$ select count(*)::bigint
     from public.programme_type_translations
     where sections ?& array['primary_cta_label', 'audience', 'comparison', 'listing', 'closing_cta']
       and jsonb_array_length(sections #> '{audience,items}') > 0
       and jsonb_array_length(sections #> '{comparison,items}') > 0 $$,
  $$ values (9::bigint) $$,
  'all translations should contain complete fixed-shape landing content'
);

select results_eq(
  $$ select bool_and(relrowsecurity and relforcerowsecurity)
     from pg_class
     where oid in (
       'public.programme_types'::regclass,
       'public.programme_type_translations'::regclass
     ) $$,
  $$ values (true) $$,
  'programme type tables should enable and force row level security'
);

select * from finish();

rollback;
