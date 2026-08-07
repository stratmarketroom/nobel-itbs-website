begin;

select plan(31);

select has_table('public', 'credential_sets', 'credential sets table should exist');
select col_is_pk('public', 'credential_sets', 'id', 'credential set ID should be the primary key');
select has_column('public', 'credential_sets', 'learner_id', 'learner reference should exist');
select has_column('public', 'credential_sets', 'programme_id', 'programme reference should exist');
select has_column('public', 'credential_sets', 'programme_run_id', 'optional programme run should exist');
select has_column('public', 'credential_sets', 'completion_date', 'optional completion date should exist');
select col_not_null('public', 'credential_sets', 'learner_id', 'learner should be required');
select col_not_null('public', 'credential_sets', 'programme_id', 'programme should be required');
select col_is_null('public', 'credential_sets', 'programme_run_id', 'programme run should be optional');
select col_is_null('public', 'credential_sets', 'completion_date', 'completion date should be optional');

select results_eq(
  $$ select count(*)::bigint from pg_constraint where conrelid = 'public.credential_sets'::regclass and contype = 'f' $$,
  $$ values (3::bigint) $$,
  'credential sets should reference learner, programme, and matching programme run context'
);

select has_index('public', 'credential_sets', 'credential_sets_context_unique_idx', 'exact grouping context should be unique');
select has_index('public', 'credential_sets', 'credential_sets_learner_created_idx', 'learner credential-set lookup should be indexed');
select has_index('public', 'credential_sets', 'credential_sets_programme_run_idx', 'programme context lookup should be indexed');
select has_trigger('public', 'credential_sets', 'credential_sets_set_updated_at', 'credential sets should maintain updated_at');
select has_trigger('public', 'credential_sets', 'credential_sets_audit_creation', 'credential set creation should be audited');
select has_function('public', 'find_or_create_credential_set', array['uuid', 'uuid', 'uuid', 'date'], 'automatic set matching helper should exist');

select is((select relrowsecurity from pg_class where oid = 'public.credential_sets'::regclass), true, 'credential sets should enable RLS');
select is((select relforcerowsecurity from pg_class where oid = 'public.credential_sets'::regclass), true, 'credential sets should force RLS');
select policies_are('public', 'credential_sets', array['credential_sets_authorized_insert', 'credential_sets_authorized_read'], 'credential sets should expose only approved policies');

select results_eq($$ select has_table_privilege('anon', 'public.credential_sets', 'select') $$, $$ values (false) $$, 'anonymous clients must not read credential sets');
select results_eq($$ select has_table_privilege('authenticated', 'public.credential_sets', 'select') $$, $$ values (true) $$, 'authenticated credential admins receive select subject to RLS');
select results_eq($$ select has_table_privilege('authenticated', 'public.credential_sets', 'delete') $$, $$ values (false) $$, 'authenticated admins must not hard-delete credential sets');
select results_eq($$ select has_table_privilege('authenticated', 'public.credential_sets', 'update') $$, $$ values (false) $$, 'set context should be immutable after creation');
select results_eq($$ select has_column_privilege('authenticated', 'public.credential_sets', 'learner_id', 'insert') $$, $$ values (true) $$, 'authorized admins may provide grouping context');
select results_eq($$ select has_column_privilege('authenticated', 'public.credential_sets', 'id', 'insert') $$, $$ values (false) $$, 'authenticated admins cannot supply internal set IDs');
select results_eq($$ select has_function_privilege('anon', 'public.find_or_create_credential_set(uuid,uuid,uuid,date)', 'execute') $$, $$ values (false) $$, 'anonymous clients cannot execute automatic set creation');
select results_eq($$ select has_function_privilege('authenticated', 'public.find_or_create_credential_set(uuid,uuid,uuid,date)', 'execute') $$, $$ values (true) $$, 'authenticated credential admins can execute automatic set creation subject to RLS');

select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' and tablename = 'credential_sets' and coalesce(qual, with_check, '') like '%is_mfa_requirement_satisfied%' $$,
  $$ values (2::bigint) $$,
  'every credential set policy should enforce MFA'
);

select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' and tablename = 'credential_sets' and coalesce(qual, with_check, '') like '%credential_manager%' $$,
  $$ values (2::bigint) $$,
  'Credential Manager should read and create sets after MFA'
);

select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' and tablename = 'credential_sets' and coalesce(qual, with_check, '') like '%content_manager%' $$,
  $$ values (0::bigint) $$,
  'Content Manager must not appear in credential set policies'
);

select * from finish();

rollback;
