begin;

select plan(18);

select has_table('public', 'experts', 'experts table should exist');
select has_table('public', 'expert_translations', 'expert_translations table should exist');
select col_is_pk('public', 'experts', 'id', 'experts.id should be the primary key');
select col_is_pk('public', 'expert_translations', array['expert_id', 'language_code'], 'translations should be unique by expert and language');
select has_column('public', 'experts', 'photo_path', 'optional approved portrait path should exist');
select has_column('public', 'expert_translations', 'name', 'localized name should exist');
select has_column('public', 'expert_translations', 'public_category', 'localized public category should exist');
select has_column('public', 'expert_translations', 'expert_role', 'localized expert role should exist');
select has_column('public', 'expert_translations', 'photo_alt', 'localized photo alt should exist');
select has_trigger('public', 'experts', 'experts_set_updated_at', 'experts should maintain updated_at');
select has_trigger('public', 'expert_translations', 'expert_translations_set_updated_at', 'translations should maintain updated_at');

select results_eq(
  $$ select count(*)::bigint from public.experts where status = 'published' $$,
  $$ values (3::bigint) $$,
  'three approved experts should be published'
);

select results_eq(
  $$ select count(*)::bigint from public.expert_translations where translation_status = 'published' $$,
  $$ values (9::bigint) $$,
  'all nine approved translations should be published'
);

select results_eq(
  $$ select slug from public.experts where photo_path is not null order by sort_order $$,
  $$ values ('nataliia-kholodenko'::text), ('dmytro-shevchuk'::text), ('alina-yudina'::text) $$,
  'all experts with approved received portraits should have photo paths'
);

select results_eq(
  $$ select count(*)::bigint from public.experts where slug = 'alina-yudina' and photo_path = '/experts/alina-yudina.webp' $$,
  $$ values (1::bigint) $$,
  'Alina Yudina should use the approved received portrait'
);

select results_eq(
  $$ select bool_and(relrowsecurity and relforcerowsecurity)
     from pg_class
     where oid in ('public.experts'::regclass, 'public.expert_translations'::regclass) $$,
  $$ values (true) $$,
  'expert tables should enable and force row level security'
);

select results_eq(
  $$ select count(*)::bigint
     from pg_constraint c
     join pg_class source_table on source_table.oid = c.conrelid
     join pg_class target_table on target_table.oid = c.confrelid
     where c.contype = 'f'
       and source_table.relname in ('experts', 'expert_translations')
       and target_table.relname like 'credential%' $$,
  $$ values (0::bigint) $$,
  'experts should not be connected to credential records'
);

select results_eq(
  $$ select count(*)::bigint
     from pg_constraint c
     join pg_class source_table on source_table.oid = c.conrelid
     join pg_class target_table on target_table.oid = c.confrelid
     where c.contype = 'f'
       and source_table.relname in ('experts', 'expert_translations')
       and target_table.relname = 'programmes' $$,
  $$ values (0::bigint) $$,
  'PCE-002 should not add the later programme-expert relation'
);

select * from finish();
rollback;
