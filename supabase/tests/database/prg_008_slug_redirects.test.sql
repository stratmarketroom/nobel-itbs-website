begin;

select plan(28);

select has_table('public', 'programme_slug_redirects', 'programme slug redirect table should exist');
select has_column('public', 'programme_slug_redirects', 'old_slug', 'historical slug should be stored');
select has_column('public', 'programme_slug_redirects', 'new_slug', 'current slug should be stored');
select has_column('public', 'programme_slug_redirects', 'entity_type', 'redirect entity type should be stored');
select has_column('public', 'programme_slug_redirects', 'entity_id', 'redirect entity id should be stored');
select has_column('public', 'programme_slug_redirects', 'created_at', 'redirect creation time should be stored');
select col_is_pk('public', 'programme_slug_redirects', 'old_slug', 'historical slug should be the primary key');

select has_function('internal', 'capture_published_programme_slug_redirect', array[]::text[], 'slug capture function should exist');
select has_trigger('public', 'programmes', 'programmes_capture_slug_redirect', 'programmes should capture published slug changes');
select has_trigger('public', 'programme_areas', 'programme_areas_capture_slug_redirect', 'areas should capture published slug changes');
select has_trigger('public', 'programme_types', 'programme_types_capture_slug_redirect', 'types should capture published slug changes');

select results_eq(
  $$ select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.programme_slug_redirects'::regclass $$,
  $$ values (true) $$,
  'slug redirects should use forced RLS'
);
select policies_are(
  'public',
  'programme_slug_redirects',
  array['programme_slug_redirects_content_read', 'programme_slug_redirects_public_read'],
  'redirect table should expose only explicit read policies'
);
select results_eq(
  $$ select has_table_privilege('anon', 'public.programme_slug_redirects', 'insert') $$,
  $$ values (false) $$,
  'anonymous users must not insert redirect records'
);
select results_eq(
  $$ select has_table_privilege('authenticated', 'public.programme_slug_redirects', 'update') $$,
  $$ values (false) $$,
  'authenticated browser users must not update redirect records directly'
);
select results_eq(
  $$ select has_function_privilege('anon', 'internal.capture_published_programme_slug_redirect()', 'execute') $$,
  $$ values (false) $$,
  'anonymous users must not execute the redirect capture function'
);

update public.programmes
set slug = 'ai-production-current'
where slug = 'ai-production';

select results_eq(
  $$ select new_slug from public.programme_slug_redirects where old_slug = 'ai-production' $$,
  $$ values ('ai-production-current'::text) $$,
  'a published programme slug change should create a redirect'
);
select results_eq(
  $$ select entity_type from public.programme_slug_redirects where old_slug = 'ai-production' $$,
  $$ values ('programme'::text) $$,
  'programme redirect should retain its entity type'
);

update public.programmes
set slug = 'ai-production-final'
where slug = 'ai-production-current';

select results_eq(
  $$ select old_slug, new_slug from public.programme_slug_redirects
     where entity_type = 'programme' and entity_id = '00000000-0000-4000-8000-000000000301'
     order by old_slug $$,
  $$ values
       ('ai-production'::text, 'ai-production-final'::text),
       ('ai-production-current'::text, 'ai-production-final'::text) $$,
  'all historical programme slugs should resolve in one hop to the final slug'
);
select is_empty(
  $$ select 1 from public.programme_slug_redirects where new_slug = 'ai-production-current' $$,
  'redirect chains should not remain after another slug change'
);

select throws_ok(
  $$ update public.programme_areas set slug = 'ai-production' where slug = 'business-management' $$,
  '23505', 'Programme namespace slug "ai-production" is already used.',
  'a historical slug must never be reused by a different entity'
);
select throws_ok(
  $$ update public.programmes set slug = 'ai-production' where slug = 'ai-production-final' $$,
  '23505', 'Programme namespace slug "ai-production" is already used.',
  'returning to a historical slug should be rejected to prevent loops'
);

insert into public.programme_areas (id, slug, status)
values ('00000000-0000-4000-8000-000000000901', 'draft-slug-test', 'draft');
update public.programme_areas
set slug = 'draft-slug-test-updated'
where id = '00000000-0000-4000-8000-000000000901';

select is_empty(
  $$ select 1 from public.programme_slug_redirects where old_slug = 'draft-slug-test' $$,
  'a draft slug change should not create a redirect'
);

update public.programme_areas
set slug = 'psychology-people'
where slug = 'psychology-human';
select results_eq(
  $$ select entity_type, new_slug from public.programme_slug_redirects where old_slug = 'psychology-human' $$,
  $$ values ('area'::text, 'psychology-people'::text) $$,
  'a published area slug change should create a redirect'
);

update public.programme_types
set slug = 'mini-mba-programme'
where slug = 'mini-mba';
select results_eq(
  $$ select entity_type, new_slug from public.programme_slug_redirects where old_slug = 'mini-mba' $$,
  $$ values ('type'::text, 'mini-mba-programme'::text) $$,
  'a published type slug change should create a redirect'
);

set local role anon;
select results_eq(
  $$ select new_slug from public.programme_slug_redirects where old_slug = 'ai-production' $$,
  $$ values ('ai-production-final'::text) $$,
  'anonymous routing may read a redirect whose destination is published'
);
reset role;

update public.programmes
set publication_status = 'archived'
where slug = 'ai-production-final';
set local role anon;
select is_empty(
  $$ select old_slug from public.programme_slug_redirects where old_slug = 'ai-production' $$,
  'anonymous routing must not expose a redirect to an archived destination'
);
reset role;

select results_eq(
  $$ select count(*)::bigint from information_schema.routine_privileges
     where routine_schema = 'internal'
       and routine_name = 'capture_published_programme_slug_redirect'
       and grantee = 'PUBLIC' $$,
  $$ values (0::bigint) $$,
  'redirect capture function should not retain PUBLIC execution grants'
);

select * from finish();

rollback;
