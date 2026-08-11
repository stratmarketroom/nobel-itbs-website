begin;

select plan(24);

select has_table('public', 'learners', 'learners table should exist');
select col_is_pk('public', 'learners', 'id', 'learners.id should be the primary key');
select has_column('public', 'learners', 'latin_first_name', 'Latin first name should exist');
select has_column('public', 'learners', 'latin_last_name', 'Latin last name should exist');
select has_column('public', 'learners', 'ukrainian_full_name', 'Ukrainian full name should exist');
select has_column('public', 'learners', 'internal_note', 'private internal note should exist');
select has_column('public', 'learners', 'archived_at', 'soft-archive timestamp should exist');
select col_not_null('public', 'learners', 'latin_first_name', 'Latin first name should be required');
select col_not_null('public', 'learners', 'latin_last_name', 'Latin last name should be required');
select col_not_null('public', 'learners', 'ukrainian_full_name', 'Ukrainian full name should be required');
select has_index('public', 'learners', 'learners_archived_at_idx', 'archive filtering index should exist');
select has_trigger('public', 'learners', 'learners_set_updated_at', 'learners should maintain updated_at');

select is(
  (select relrowsecurity from pg_class where oid = 'public.learners'::regclass),
  true,
  'learners should have RLS enabled'
);

select is(
  (select relforcerowsecurity from pg_class where oid = 'public.learners'::regclass),
  true,
  'learners should force RLS'
);

select policies_are(
  'public',
  'learners',
  array['learners_authorized_insert', 'learners_authorized_read', 'learners_authorized_update'],
  'learners should expose only authorized read, insert, and update policies'
);

select results_eq(
  $$ select has_table_privilege('anon', 'public.learners', 'select') $$,
  $$ values (false) $$,
  'anonymous users must not read learners'
);

select results_eq(
  $$ select has_table_privilege('authenticated', 'public.learners', 'select') $$,
  $$ values (true) $$,
  'authenticated admins receive select privilege subject to RLS'
);

select results_eq(
  $$ select has_column_privilege('authenticated', 'public.learners', 'latin_first_name', 'insert') $$,
  $$ values (true) $$,
  'authenticated admins may insert controlled learner fields subject to RLS'
);

select results_eq(
  $$ select has_column_privilege('authenticated', 'public.learners', 'id', 'insert') $$,
  $$ values (false) $$,
  'authenticated admins cannot supply internal learner IDs'
);

select results_eq(
  $$ select has_column_privilege('authenticated', 'public.learners', 'latin_first_name', 'update') $$,
  $$ values (true) $$,
  'authenticated admins may update controlled learner fields subject to RLS'
);

select results_eq(
  $$ select has_column_privilege('authenticated', 'public.learners', 'created_at', 'update') $$,
  $$ values (false) $$,
  'authenticated admins cannot rewrite learner creation timestamps'
);

select results_eq(
  $$ select has_table_privilege('authenticated', 'public.learners', 'delete') $$,
  $$ values (false) $$,
  'authenticated admins cannot hard-delete learners'
);

select results_eq(
  $$ select count(*)::bigint
     from pg_policies
     where schemaname = 'public'
       and tablename = 'learners'
       and coalesce(qual, with_check, '') like '%owner%'
       and coalesce(qual, with_check, '') like '%super_admin%'
       and coalesce(qual, with_check, '') like '%credential_manager%'
       and coalesce(qual, with_check, '') not like '%content_manager%'
       and coalesce(qual, with_check, '') like '%is_mfa_requirement_satisfied%' $$,
  $$ values (3::bigint) $$,
  'every learner policy should require an approved role and satisfied MFA without Content Manager access'
);

select results_eq(
  $$ select count(*)::bigint
     from information_schema.tables
     where table_schema = 'public'
       and table_name in ('learner_emails', 'learner_phones') $$,
  $$ values (0::bigint) $$,
  'LRN-001 must not create learner email or phone tables'
);

select * from finish();

rollback;
