begin;

select plan(17);

select has_function(
  'public',
  'update_valid_credential_public_data',
  array['uuid', 'text', 'text', 'text', 'text'],
  'controlled valid credential public-data correction function should exist'
);
select results_eq(
  $$ select prosecdef from pg_proc where oid = 'public.update_valid_credential_public_data(uuid,text,text,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'public-data correction should be security definer'
);
select results_eq(
  $$ select proconfig @> array['search_path=public, internal, pg_temp'] from pg_proc where oid = 'public.update_valid_credential_public_data(uuid,text,text,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'public-data correction should use a fixed search path'
);
select results_eq(
  $$ select has_function_privilege('anon', 'public.update_valid_credential_public_data(uuid,text,text,text,text)', 'execute') $$,
  $$ values (false) $$,
  'anonymous users cannot correct credential public data'
);
select results_eq(
  $$ select has_function_privilege('authenticated', 'public.update_valid_credential_public_data(uuid,text,text,text,text)', 'execute') $$,
  $$ values (true) $$,
  'authenticated actors can invoke the controlled workflow subject to authorization'
);
select results_eq(
  $$ select prosrc like '%owner%super_admin%credential_manager%' from pg_proc where oid = 'public.update_valid_credential_public_data(uuid,text,text,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'correction should allow only Owner, Super Admin, and Credential Manager roles'
);
select results_eq(
  $$ select prosrc like '%is_mfa_requirement_satisfied%' from pg_proc where oid = 'public.update_valid_credential_public_data(uuid,text,text,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'correction should enforce MFA'
);
select results_eq(
  $$ select prosrc like '%credential, public data, and change reason are required%' and prosrc like '%char_length(v_holder_name) > 320%' and prosrc like '%char_length(v_programme_title) > 500%' and prosrc like '%char_length(v_credential_type) > 200%' and prosrc like '%char_length(v_reason) > 4000%' from pg_proc where oid = 'public.update_valid_credential_public_data(uuid,text,text,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'correction should validate complete bounded public data and a mandatory reason'
);
select results_eq(
  $$ select prosrc like '%for update%' from pg_proc where oid = 'public.update_valid_credential_public_data(uuid,text,text,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'correction should lock the credential against concurrent lifecycle changes'
);
select results_eq(
  $$ select prosrc like '%only a valid credential can have public data corrected%' from pg_proc where oid = 'public.update_valid_credential_public_data(uuid,text,text,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'public-data correction should be valid-only'
);
select results_eq(
  $$ select prosrc like '%at least one public credential value must change%' from pg_proc where oid = 'public.update_valid_credential_public_data(uuid,text,text,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'correction should reject unchanged submissions'
);
select results_eq(
  $$ select prosrc like '%public_holder_name = v_holder_name%' and prosrc like '%public_programme_title = v_programme_title%' and prosrc like '%public_credential_type = v_credential_type%' from pg_proc where oid = 'public.update_valid_credential_public_data(uuid,text,text,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'correction should update only the current public record fields'
);
select results_eq(
  $$ select prosrc like '%credential.public_data_updated%' and prosrc like '%p_reason => v_reason%' and prosrc like '%p_before_data =>%' and prosrc like '%p_after_data =>%' from pg_proc where oid = 'public.update_valid_credential_public_data(uuid,text,text,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'correction should write detailed private History with mandatory reason'
);
select results_eq(
  $$ select prosrc like '%changed_fields%' and prosrc like '%write_audit_log%' from pg_proc where oid = 'public.update_valid_credential_public_data(uuid,text,text,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'correction should write a PII-minimal Audit field list'
);
select results_eq(
  $$ select prosrc not like '%update public.document_number_log%' and prosrc not like '%status = ''pending''%' and prosrc not like '%status = ''revoked''%' and prosrc not like '%status = ''voided''%' from pg_proc where oid = 'public.update_valid_credential_public_data(uuid,text,text,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'correction should not alter lifecycle or the permanent document number'
);
select results_eq(
  $$ select prosrc not like '%verification_token_lookup_hash =%' and prosrc not like '%verification_token_encrypted =%' and prosrc not like '%learner_id =%' and prosrc not like '%programme_id =%' and prosrc not like '%credential_type_id =%' from pg_proc where oid = 'public.update_valid_credential_public_data(uuid,text,text,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'correction should not alter private identity or token material'
);
select results_eq(
  $$ select prosrc not like '%public_status%' and prosrc not like '%verification result%' from pg_proc where oid = 'public.update_valid_credential_public_data(uuid,text,text,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'WF-007 should not implement the public verification response'
);

select * from finish();

rollback;
