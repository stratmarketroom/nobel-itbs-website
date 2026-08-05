begin;

select plan(19);

select has_table('public', 'partners', 'partners table should exist');
select has_table('public', 'partner_translations', 'partner_translations table should exist');
select col_is_pk('public', 'partners', 'id', 'partners.id should be the primary key');
select col_is_pk('public', 'partner_translations', array['partner_id', 'language_code'], 'translations should be unique by partner and language');
select has_column('public', 'partners', 'partner_type', 'partner type should exist');
select has_column('public', 'partners', 'official_url', 'official URL should exist');
select has_column('public', 'partners', 'logo_path', 'approved logo path should exist');
select has_column('public', 'partner_translations', 'name', 'localized name should exist');
select has_column('public', 'partner_translations', 'role_label', 'localized role should exist');
select has_column('public', 'partner_translations', 'location', 'optional localized location should exist');
select has_column('public', 'partner_translations', 'logo_alt', 'localized logo alt should exist');
select has_trigger('public', 'partners', 'partners_set_updated_at', 'partners should maintain updated_at');
select has_trigger('public', 'partner_translations', 'partner_translations_set_updated_at', 'translations should maintain updated_at');

select results_eq(
  $$ select count(*)::bigint from public.partners where status = 'published' $$,
  $$ values (5::bigint) $$,
  'five approved partners should be published'
);

select results_eq(
  $$ select count(*)::bigint from public.partner_translations where translation_status = 'published' $$,
  $$ values (15::bigint) $$,
  'all fifteen approved translations should be published'
);

select results_eq(
  $$ select slug, partner_type from public.partners where partner_type = 'exclusive_academic_partner' $$,
  $$ values ('alfred-nobel-university'::text, 'exclusive_academic_partner'::text) $$,
  'Alfred Nobel University should be the exclusive academic partner'
);

select results_eq(
  $$ select count(*)::bigint from public.partners where slug = 'e-launch-online-school' and official_url = 'https://e-launch.net/' $$,
  $$ values (1::bigint) $$,
  'e-launch should be included with its official URL'
);

select results_eq(
  $$ select bool_and(relrowsecurity and relforcerowsecurity)
     from pg_class
     where oid in ('public.partners'::regclass, 'public.partner_translations'::regclass) $$,
  $$ values (true) $$,
  'partner tables should enable and force row level security'
);

select results_eq(
  $$ select count(*)::bigint
     from pg_constraint c
     join pg_class source_table on source_table.oid = c.conrelid
     join pg_class target_table on target_table.oid = c.confrelid
     where c.contype = 'f'
       and source_table.relname in ('partners', 'partner_translations')
       and target_table.relname like 'credential%' $$,
  $$ values (0::bigint) $$,
  'partners should never be connected to credential records'
);

select * from finish();
rollback;
