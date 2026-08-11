begin;

select plan(34);

select has_table('public', 'programme_pricing_options', 'programme pricing options table should exist');
select has_table('public', 'programme_pricing_option_translations', 'pricing option translations table should exist');
select col_is_pk('public', 'programme_pricing_options', 'id', 'pricing option id should be the primary key');
select col_is_pk(
  'public',
  'programme_pricing_option_translations',
  array['pricing_option_id', 'language_code'],
  'pricing option translations should be unique by option and language'
);
select has_column('public', 'programme_pricing_options', 'programme_id', 'programme reference should exist');
select has_column('public', 'programme_pricing_options', 'price', 'price should exist');
select has_column('public', 'programme_pricing_options', 'currency_code', 'currency should exist');
select has_column('public', 'programme_pricing_options', 'application_url', 'vendor-neutral application URL should exist');
select has_column('public', 'programme_pricing_options', 'sort_order', 'sort order should exist');
select has_column('public', 'programme_pricing_options', 'is_active', 'active flag should exist');
select has_column('public', 'programme_pricing_option_translations', 'translation_status', 'translation status should exist');
select has_column('public', 'programme_pricing_option_translations', 'title', 'localized title should exist');
select has_column('public', 'programme_pricing_option_translations', 'description', 'localized description should exist');
select has_column('public', 'programme_pricing_option_translations', 'cta_label', 'localized CTA label should exist');
select has_trigger('public', 'programme_pricing_options', 'programme_pricing_options_set_updated_at', 'pricing options should maintain updated_at');
select has_trigger(
  'public',
  'programme_pricing_option_translations',
  'programme_pricing_option_translations_set_updated_at',
  'pricing translations should maintain updated_at'
);
select has_function(
  'public',
  'resolve_programme_application_url',
  array['uuid', 'uuid', 'uuid', 'date'],
  'application URL resolver should exist'
);

select results_eq(
  $$ select count(*)::bigint from public.programme_pricing_options $$,
  $$ values (0::bigint) $$,
  'launch programmes should not duplicate partner or unconfirmed prices'
);

insert into public.programme_pricing_options (
  id,
  programme_id,
  price,
  currency_code,
  application_url,
  sort_order,
  is_active
)
values
  ('00000000-0000-4000-8000-000000005001', '00000000-0000-4000-8000-000000000302', 100, 'EUR', null, 10, true),
  ('00000000-0000-4000-8000-000000005002', '00000000-0000-4000-8000-000000000302', 200, 'EUR', null, 20, true),
  ('00000000-0000-4000-8000-000000005003', '00000000-0000-4000-8000-000000000302', 300, 'EUR', null, 30, true);

insert into public.programme_pricing_option_translations (
  pricing_option_id,
  language_code,
  translation_status,
  title,
  description,
  cta_label
)
select
  pricing_record.id,
  language_record.code,
  'published',
  concat('Tariff ', pricing_record.sort_order),
  'Localized tariff description',
  'Choose tariff'
from public.programme_pricing_options pricing_record
cross join public.languages language_record
where pricing_record.programme_id = '00000000-0000-4000-8000-000000000302';

select results_eq(
  $$ select count(*)::bigint
     from public.programme_pricing_options
     where programme_id = '00000000-0000-4000-8000-000000000302'
       and is_active $$,
  $$ values (3::bigint) $$,
  'a programme should support three active tariff cards without schema changes'
);

select results_eq(
  $$ select count(*)::bigint
     from public.programme_pricing_option_translations $$,
  $$ values (9::bigint) $$,
  'three tariff cards should support complete EN, UA, and CZ translations'
);

select throws_ok(
  $$ insert into public.programme_pricing_options (programme_id, price, currency_code, sort_order)
     values ('00000000-0000-4000-8000-000000000302', -1, 'EUR', 40) $$,
  '23514',
  null,
  'negative prices should be rejected'
);

select throws_ok(
  $$ insert into public.programme_pricing_options (programme_id, price, currency_code, sort_order)
     values ('00000000-0000-4000-8000-000000000302', 10, 'euro', 40) $$,
  '23514',
  null,
  'invalid currency codes should be rejected'
);

select results_eq(
  $$ select public.resolve_programme_application_url(
       '00000000-0000-4000-8000-000000000304',
       null,
       null,
       '2026-08-04'
     ) $$,
  $$ values ('https://school.kholodenko.net/'::text) $$,
  'partner-managed programme should fall back to its approved partner website'
);

select results_eq(
  $$ select public.resolve_programme_application_url(
       '00000000-0000-4000-8000-000000000301',
       null,
       null,
       '2026-08-04'
     ) $$,
  $$ values (null::text) $$,
  'programme without an approved URL should resolve to contact fallback'
);

update public.programme_pricing_options
set application_url = 'https://example.com/tariff'
where id = '00000000-0000-4000-8000-000000005001';

select results_eq(
  $$ select public.resolve_programme_application_url(
       '00000000-0000-4000-8000-000000000302',
       '00000000-0000-4000-8000-000000005001',
       null,
       '2026-08-04'
     ) $$,
  $$ values ('https://example.com/tariff'::text) $$,
  'tariff-specific URL should take precedence over run and programme URLs'
);

select results_eq(
  $$ select bool_and(relrowsecurity and relforcerowsecurity)
     from pg_class
     where oid in (
       'public.programme_pricing_options'::regclass,
       'public.programme_pricing_option_translations'::regclass
     ) $$,
  $$ values (true) $$,
  'pricing tables should enable and force row level security'
);

select has_policy('public', 'programme_pricing_options', 'programme_pricing_options_public_read', 'active pricing should have a public read policy');
select has_policy('public', 'programme_pricing_options', 'programme_pricing_options_content_read', 'content roles should have a pricing read policy');
select has_policy('public', 'programme_pricing_options', 'programme_pricing_options_content_insert', 'content roles should have a pricing insert policy');
select has_policy('public', 'programme_pricing_options', 'programme_pricing_options_content_update', 'content roles should have a pricing update policy');
select has_policy('public', 'programme_pricing_options', 'programme_pricing_options_content_delete', 'content roles should have a pricing delete policy');
select has_policy('public', 'programme_pricing_option_translations', 'programme_pricing_option_translations_public_read', 'published pricing translations should have a public read policy');
select has_policy('public', 'programme_pricing_option_translations', 'programme_pricing_option_translations_content_read', 'content roles should have a translation read policy');
select has_policy('public', 'programme_pricing_option_translations', 'programme_pricing_option_translations_content_update', 'content roles should have a translation update policy');

select * from finish();

rollback;
