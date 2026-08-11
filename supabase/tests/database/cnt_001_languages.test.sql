begin;

select plan(15);

select has_type('public', 'translation_status', 'translation_status enum should exist');
select has_table('public', 'languages', 'languages table should exist');
select col_is_pk('public', 'languages', 'code', 'languages.code should be the primary key');
select has_column('public', 'languages', 'name', 'languages.name should exist');
select has_column('public', 'languages', 'native_name', 'languages.native_name should exist');
select has_column('public', 'languages', 'url_prefix', 'languages.url_prefix should exist');
select has_column('public', 'languages', 'is_default', 'languages.is_default should exist');
select has_column('public', 'languages', 'is_active', 'languages.is_active should exist');
select has_column('public', 'languages', 'sort_order', 'languages.sort_order should exist');
select has_index('public', 'languages', 'languages_one_default_idx', 'languages should have one default language');
select has_trigger('public', 'languages', 'languages_set_updated_at', 'languages should maintain updated_at');

select results_eq(
  $$ select enumlabel::text from pg_enum
     where enumtypid = 'public.translation_status'::regtype
     order by enumsortorder $$,
  $$ values ('missing'::text), ('draft'::text), ('published'::text) $$,
  'translation_status should contain only Release 1 values'
);

select results_eq(
  $$ select code, url_prefix, is_default, sort_order
     from public.languages
     order by sort_order $$,
  $$ values
       ('en'::text, null::text, true, 10::smallint),
       ('ua'::text, '/ua'::text, false, 20::smallint),
       ('cz'::text, '/cz'::text, false, 30::smallint) $$,
  'languages should seed en, ua, and cz with canonical prefixes'
);

select results_eq(
  $$ select count(*)::bigint from public.languages where is_default $$,
  $$ values (1::bigint) $$,
  'languages should contain exactly one default language'
);

select results_eq(
  $$ select relrowsecurity and relforcerowsecurity
     from pg_class
     where oid = 'public.languages'::regclass $$,
  $$ values (true) $$,
  'languages should enable and force row level security'
);

select * from finish();

rollback;
