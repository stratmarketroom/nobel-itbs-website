begin;
select plan(16);

select has_table('public', 'content_pages', 'content_pages exists');
select has_table('public', 'content_page_translations', 'content_page_translations exists');
select col_is_pk('public', 'content_pages', 'id', 'content_pages uses id primary key');
select has_column('public', 'content_pages', 'page_key', 'page key exists');
select has_column('public', 'content_pages', 'page_type', 'page type exists');
select has_column('public', 'content_page_translations', 'sections', 'structured sections exist');
select has_pk('public', 'content_page_translations', 'translation composite primary key exists');
select is((select count(*)::integer from public.content_pages where page_key in ('home','about','partnerships','for_organisations')), 4, 'four core page identities are seeded');
select is((select count(*)::integer from public.content_page_translations), 12, 'three translation rows exist for every core page');
select is((select relrowsecurity from pg_class where oid = 'public.content_pages'::regclass), true, 'content pages RLS enabled');
select is((select relforcerowsecurity from pg_class where oid = 'public.content_pages'::regclass), true, 'content pages RLS forced');
select is((select relrowsecurity from pg_class where oid = 'public.content_page_translations'::regclass), true, 'translations RLS enabled');
select is((select count(*)::integer from pg_policies where tablename = 'content_pages' and roles @> array['anon']::name[]), 1, 'one anon page policy exists');
select is((select count(*)::integer from pg_policies where tablename = 'content_page_translations' and roles @> array['anon']::name[]), 1, 'one anon translation policy exists');
select has_function('internal', 'audit_content_translation_change', array[]::text[], 'content changes are audited');
select is((select count(*)::integer from information_schema.role_table_grants where table_schema='public' and table_name='content_pages' and grantee='anon' and privilege_type <> 'SELECT'), 0, 'anon has read-only content access');

select * from finish();
rollback;
