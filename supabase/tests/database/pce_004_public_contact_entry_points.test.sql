begin;

select plan(9);

select has_function(
  'public',
  'create_public_contact_submission',
  array['contact_submission_type', 'text', 'text', 'text', 'text', 'text', 'text', 'text'],
  'server-only public contact creation function should exist'
);

select function_returns(
  'public',
  'create_public_contact_submission',
  array['contact_submission_type', 'text', 'text', 'text', 'text', 'text', 'text', 'text'],
  'uuid',
  'public contact creation should return the stored submission ID to the server workflow'
);

select is_definer(
  'public',
  'create_public_contact_submission',
  array['contact_submission_type', 'text', 'text', 'text', 'text', 'text', 'text', 'text'],
  'public contact creation should execute as a security definer'
);

select function_privs_are(
  'public',
  'create_public_contact_submission',
  array['contact_submission_type', 'text', 'text', 'text', 'text', 'text', 'text', 'text'],
  'anon',
  array[]::text[],
  'anonymous clients must not execute the storage function directly'
);

select function_privs_are(
  'public',
  'create_public_contact_submission',
  array['contact_submission_type', 'text', 'text', 'text', 'text', 'text', 'text', 'text'],
  'authenticated',
  array[]::text[],
  'authenticated browser clients must not execute the storage function directly'
);

select function_privs_are(
  'public',
  'create_public_contact_submission',
  array['contact_submission_type', 'text', 'text', 'text', 'text', 'text', 'text', 'text'],
  'service_role',
  array['EXECUTE'],
  'only the controlled server workflow receives execute permission'
);

select results_eq(
  $$ select count(*)::bigint from pg_proc where proname = 'create_public_contact_submission' and prosecdef $$,
  $$ values (1::bigint) $$,
  'the public contact function should have exactly one security-definer overload'
);

select results_eq(
  $$ select count(*)::bigint from pg_proc where proname = 'create_public_contact_submission' and proconfig @> array['search_path=public, internal, pg_temp'] $$,
  $$ values (1::bigint) $$,
  'the public contact function should pin its search path'
);

select results_eq(
  $$ select count(*)::bigint from information_schema.routine_privileges where routine_schema = 'public' and routine_name = 'create_public_contact_submission' and grantee in ('anon', 'authenticated') $$,
  $$ values (0::bigint) $$,
  'browser roles should have no routine grants'
);

select * from finish();

rollback;
