begin;

select plan(22);

select has_function(
  'public',
  'create_pending_credential',
  array['uuid', 'uuid', 'uuid', 'text', 'date', 'text', 'text', 'integer', 'text', 'text', 'text', 'uuid', 'date', 'text', 'text'],
  'controlled pending credential workflow should exist'
);

select results_eq(
  $$ select prosecdef from pg_proc where oid = 'public.create_pending_credential(uuid,uuid,uuid,text,date,text,text,integer,text,text,text,uuid,date,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'pending credential workflow should be security definer'
);

select results_eq(
  $$ select proretset from pg_proc where oid = 'public.create_pending_credential(uuid,uuid,uuid,text,date,text,text,integer,text,text,text,uuid,date,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'pending credential workflow should return one safe projected row'
);

select results_eq(
  $$ select proconfig @> array['search_path=public, internal, pg_temp'] from pg_proc where oid = 'public.create_pending_credential(uuid,uuid,uuid,text,date,text,text,integer,text,text,text,uuid,date,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'pending credential workflow should use a fixed search path'
);

select results_eq(
  $$ select pronargdefaults from pg_proc where oid = 'public.create_pending_credential(uuid,uuid,uuid,text,date,text,text,integer,text,text,text,uuid,date,text,text)'::regprocedure $$,
  $$ values (4::smallint) $$,
  'run, completion date, manual number, and manual reason should be optional'
);

select results_eq(
  $$ select has_function_privilege('anon', 'public.create_pending_credential(uuid,uuid,uuid,text,date,text,text,integer,text,text,text,uuid,date,text,text)', 'execute') $$,
  $$ values (false) $$,
  'anonymous users cannot create pending credentials'
);

select results_eq(
  $$ select has_function_privilege('authenticated', 'public.create_pending_credential(uuid,uuid,uuid,text,date,text,text,integer,text,text,text,uuid,date,text,text)', 'execute') $$,
  $$ values (true) $$,
  'authenticated admins can invoke the controlled workflow subject to role and MFA'
);

select results_eq(
  $$ select has_function_privilege('public', 'public.create_pending_credential(uuid,uuid,uuid,text,date,text,text,integer,text,text,text,uuid,date,text,text)', 'execute') $$,
  $$ values (false) $$,
  'PUBLIC receives no implicit workflow execution privilege'
);

select results_eq(
  $$ select prosrc like '%owner%super_admin%credential_manager%' from pg_proc where oid = 'public.create_pending_credential(uuid,uuid,uuid,text,date,text,text,integer,text,text,text,uuid,date,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'workflow should allow only approved credential roles'
);

select results_eq(
  $$ select prosrc like '%is_mfa_requirement_satisfied%' from pg_proc where oid = 'public.create_pending_credential(uuid,uuid,uuid,text,date,text,text,integer,text,text,text,uuid,date,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'workflow should enforce MFA'
);

select results_eq(
  $$ select prosrc like '%find_or_create_credential_set%' from pg_proc where oid = 'public.create_pending_credential(uuid,uuid,uuid,text,date,text,text,integer,text,text,text,uuid,date,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'workflow should find or create the exact credential set'
);

select results_eq(
  $$ select prosrc like '%reserve_document_number%' from pg_proc where oid = 'public.create_pending_credential(uuid,uuid,uuid,text,date,text,text,integer,text,text,text,uuid,date,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'workflow should reserve the next shared number'
);

select results_eq(
  $$ select prosrc like '%reserve_manual_document_number%' from pg_proc where oid = 'public.create_pending_credential(uuid,uuid,uuid,text,date,text,text,integer,text,text,text,uuid,date,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'workflow should preserve the controlled Owner/Super Admin manual path'
);

select results_eq(
  $$ select prosrc like '%insert into public.credentials%' from pg_proc where oid = 'public.create_pending_credential(uuid,uuid,uuid,text,date,text,text,integer,text,text,text,uuid,date,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'workflow should create the pending credential'
);

select results_eq(
  $$ select prosrc like '%update public.document_number_log%' from pg_proc where oid = 'public.create_pending_credential(uuid,uuid,uuid,text,date,text,text,integer,text,text,text,uuid,date,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'workflow should link the permanent number log row'
);

select results_eq(
  $$ select prosrc like '%document_number.reserved%' from pg_proc where oid = 'public.create_pending_credential(uuid,uuid,uuid,text,date,text,text,integer,text,text,text,uuid,date,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'workflow should append the linked number event to credential history'
);

select results_eq(
  $$ select pg_get_function_arguments('public.create_pending_credential(uuid,uuid,uuid,text,date,text,text,integer,text,text,text,uuid,date,text,text)'::regprocedure) like '%p_verification_token_lookup_hash text%p_verification_token_encrypted text%' $$,
  $$ values (true) $$,
  'database workflow should receive only protected token material'
);

select results_eq(
  $$ select pg_get_function_arguments('public.create_pending_credential(uuid,uuid,uuid,text,date,text,text,integer,text,text,text,uuid,date,text,text)'::regprocedure) not like '%raw_token%' $$,
  $$ values (true) $$,
  'database workflow must not accept a raw verification token'
);

select results_eq(
  $$ select pg_get_function_result('public.create_pending_credential(uuid,uuid,uuid,text,date,text,text,integer,text,text,text,uuid,date,text,text)'::regprocedure) not like '%verification_token%' $$,
  $$ values (true) $$,
  'workflow result must expose no token lookup or ciphertext fields'
);

select results_eq(
  $$ select prosrc not like '%partner_id%' from pg_proc where oid = 'public.create_pending_credential(uuid,uuid,uuid,text,date,text,text,integer,text,text,text,uuid,date,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'partner data must not enter credential creation'
);

select results_eq(
  $$ select prosrc like '%status,%issue_date,%document_number%' from pg_proc where oid = 'public.create_pending_credential(uuid,uuid,uuid,text,date,text,text,integer,text,text,text,uuid,date,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'pending status, issue date, and reserved number should be written together'
);

select results_eq(
  $$ select has_table_privilege('authenticated', 'public.credentials', 'insert') $$,
  $$ values (false) $$,
  'authenticated users still cannot bypass the workflow with direct credential inserts'
);

select * from finish();

rollback;
