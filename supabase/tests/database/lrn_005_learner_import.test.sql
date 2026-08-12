begin;

select plan(15);

select has_function(
  'public',
  'import_learners',
  array['jsonb'],
  'controlled learner import workflow should exist'
);

select results_eq(
  $$ select prosecdef from pg_proc where oid = 'public.import_learners(jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'learner import should be security definer'
);

select results_eq(
  $$ select proconfig @> array['search_path=internal, public, extensions, pg_temp'] from pg_proc where oid = 'public.import_learners(jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'learner import should use a fixed search path'
);

select results_eq(
  $$ select has_function_privilege('anon', 'public.import_learners(jsonb)', 'execute') $$,
  $$ values (false) $$,
  'anonymous users cannot import learners'
);

select results_eq(
  $$ select has_function_privilege('public', 'public.import_learners(jsonb)', 'execute') $$,
  $$ values (false) $$,
  'PUBLIC receives no implicit learner import privilege'
);

select results_eq(
  $$ select has_function_privilege('authenticated', 'public.import_learners(jsonb)', 'execute') $$,
  $$ values (true) $$,
  'authenticated admins can invoke import subject to role and MFA'
);

select results_eq(
  $$ select prosrc like '%assert_sensitive_action_allowed%' from pg_proc where oid = 'public.import_learners(jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'learner import should enforce the shared sensitive-action gate'
);

select results_eq(
  $$ select prosrc like '%owner%super_admin%credential_manager%' and prosrc not like '%content_manager%' from pg_proc where oid = 'public.import_learners(jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'only approved learner roles should import'
);

select results_eq(
  $$ select prosrc like '%v_count < 1 or v_count > 500%' from pg_proc where oid = 'public.import_learners(jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'database import should limit batches to 500 rows'
);

select results_eq(
  $$ select prosrc like '%Learner import contains duplicate rows or contacts.%' from pg_proc where oid = 'public.import_learners(jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'database import should reject duplicates within the batch'
);

select results_eq(
  $$ select prosrc like '%Learner import conflicts with an existing learner or contact.%' from pg_proc where oid = 'public.import_learners(jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'database import should never overwrite existing learners'
);

select results_eq(
  $$ select prosrc like '%insert into public.learners%' and prosrc like '%insert into public.learner_emails%' and prosrc like '%insert into public.learner_phones%' from pg_proc where oid = 'public.import_learners(jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'learner identity and contacts should be inserted in one workflow'
);

select results_eq(
  $$ select prosrc like '%learners.imported%' and prosrc like '%jsonb_build_object(''count'', v_count)%' from pg_proc where oid = 'public.import_learners(jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'audit should record only the imported count'
);

select results_eq(
  $$ select prosrc not like '%p_metadata =>%email%' and prosrc not like '%p_metadata =>%phone%' and prosrc not like '%p_metadata =>%name%' from pg_proc where oid = 'public.import_learners(jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'audit metadata should contain no learner personal data'
);

select results_eq(
  $$ select pg_get_function_result('public.import_learners(jsonb)'::regprocedure) $$,
  $$ values ('jsonb'::text) $$,
  'learner import should return a controlled JSON summary'
);

select * from finish();

rollback;
