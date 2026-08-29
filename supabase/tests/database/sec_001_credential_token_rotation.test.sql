begin;

select plan(17);

select has_function(
  'public',
  'rotate_credential_token_material_batch',
  array['integer', 'integer', 'jsonb'],
  'controlled credential-token rotation function should exist'
);
select results_eq(
  $$ select prosecdef from pg_proc where oid = 'public.rotate_credential_token_material_batch(integer,integer,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'credential-token rotation should be security definer'
);
select results_eq(
  $$ select proconfig @> array['search_path=public, internal, pg_temp'] from pg_proc where oid = 'public.rotate_credential_token_material_batch(integer,integer,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'credential-token rotation should use a fixed search path'
);
select results_eq(
  $$ select has_function_privilege('anon', 'public.rotate_credential_token_material_batch(integer,integer,jsonb)', 'execute') $$,
  $$ values (false) $$,
  'anonymous callers cannot rotate token material'
);
select results_eq(
  $$ select has_function_privilege('authenticated', 'public.rotate_credential_token_material_batch(integer,integer,jsonb)', 'execute') $$,
  $$ values (false) $$,
  'authenticated callers cannot rotate token material'
);
select results_eq(
  $$ select has_function_privilege('service_role', 'public.rotate_credential_token_material_batch(integer,integer,jsonb)', 'execute') $$,
  $$ values (true) $$,
  'service role can execute controlled token rotation'
);
select has_trigger(
  'public',
  'credentials',
  'credentials_enforce_lifecycle',
  'credential lifecycle trigger should remain installed'
);
select results_eq(
  $$ select prosrc like '%current_setting(''app.credential_token_rotation'', true) = ''allowed''%' from pg_proc where oid = 'internal.enforce_credential_lifecycle()'::regprocedure $$,
  $$ values (true) $$,
  'lifecycle trigger should require the private transaction guard'
);
select results_eq(
  $$ select prosrc like '%credentials are not hard-deleted%' and prosrc like '%credential identity fields are immutable%' from pg_proc where oid = 'internal.enforce_credential_lifecycle()'::regprocedure $$,
  $$ values (true) $$,
  'lifecycle trigger should preserve hard-delete and identity protection'
);
select results_eq(
  $$ select prosrc like '%new.token_encryption_key_version <= old.token_encryption_key_version%' from pg_proc where oid = 'internal.enforce_credential_lifecycle()'::regprocedure $$,
  $$ values (true) $$,
  'token rotation should require a strictly newer key version'
);
select results_eq(
  $$ select prosrc like '%jsonb_array_length(p_items) > 100%' from pg_proc where oid = 'public.rotate_credential_token_material_batch(integer,integer,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'rotation batches should be bounded to one hundred credentials'
);
select results_eq(
  $$ select prosrc like '%for update%' and prosrc like '%p_new_key_version%' and prosrc like '%p_expected_key_version%' from pg_proc where oid = 'public.rotate_credential_token_material_batch(integer,integer,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'rotation should lock each credential and compare old/new versions'
);
select results_eq(
  $$ select prosrc like '%credential.token_material_rotated%' and prosrc like '%rotated_count%' and prosrc like '%already_rotated_count%' from pg_proc where oid = 'public.rotate_credential_token_material_batch(integer,integer,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'rotation should write count-only audit evidence'
);
select results_eq(
  $$ select prosrc not like '%p_metadata =>%lookup_hash%' and prosrc not like '%p_metadata =>%encrypted_material%' from pg_proc where oid = 'public.rotate_credential_token_material_batch(integer,integer,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'rotation audit metadata should exclude hash and ciphertext material'
);
select results_eq(
  $$ select pg_get_function_result('public.rotate_credential_token_material_batch(integer,integer,jsonb)'::regprocedure) $$,
  $$ values ('TABLE(rotated_count integer, already_rotated_count integer)') $$,
  'rotation should return aggregate counts only'
);
select results_eq(
  $$ select has_table_privilege('anon', 'public.credentials', 'update') $$,
  $$ values (false) $$,
  'anonymous callers should retain no direct credential update access'
);
select results_eq(
  $$ select has_table_privilege('authenticated', 'public.credentials', 'update') $$,
  $$ values (false) $$,
  'authenticated callers should retain no direct credential update access'
);

select * from finish();

rollback;
