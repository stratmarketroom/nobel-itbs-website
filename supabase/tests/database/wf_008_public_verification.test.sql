begin;

select plan(19);

select has_table(
  'internal',
  'credential_verification_rate_limits',
  'server-only credential verification rate-limit storage should exist'
);
select has_function(
  'public',
  'verify_public_credential',
  array['text', 'text', 'text'],
  'curated public verification function should exist'
);
select results_eq(
  $$ select prosecdef from pg_proc where oid = 'public.verify_public_credential(text,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'public verification should be security definer'
);
select results_eq(
  $$ select proconfig @> array['search_path=public, internal, pg_temp'] from pg_proc where oid = 'public.verify_public_credential(text,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'public verification should use a fixed search path'
);
select results_eq(
  $$ select has_function_privilege('anon', 'public.verify_public_credential(text,text,text)', 'execute') $$,
  $$ values (false) $$,
  'anonymous clients cannot call the service-only database function directly'
);
select results_eq(
  $$ select has_function_privilege('authenticated', 'public.verify_public_credential(text,text,text)', 'execute') $$,
  $$ values (false) $$,
  'authenticated clients cannot call the service-only database function directly'
);
select results_eq(
  $$ select has_function_privilege('service_role', 'public.verify_public_credential(text,text,text)', 'execute') $$,
  $$ values (true) $$,
  'the server-only service role can call the curated database function'
);
select results_eq(
  $$ select has_table_privilege('anon', 'internal.credential_verification_rate_limits', 'select') $$,
  $$ values (false) $$,
  'anonymous clients cannot read verification rate-limit records'
);
select results_eq(
  $$ select has_table_privilege('authenticated', 'internal.credential_verification_rate_limits', 'select') $$,
  $$ values (false) $$,
  'authenticated clients cannot read verification rate-limit records'
);
select results_eq(
  $$ select prosrc like '%credential_verification_rate_limits%' and prosrc like '%interval ''15 minutes''%' and prosrc like '%v_request_count > 30%' from pg_proc where oid = 'public.verify_public_credential(text,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'verification lookup should enforce the database-backed thirty-per-fifteen-minute limit'
);
select results_eq(
  $$ select prosrc like '%verification_token_lookup_hash = v_value%' and prosrc not like '%verification_token_encrypted = v_value%' from pg_proc where oid = 'public.verify_public_credential(text,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'token lookup should use only the HMAC lookup hash'
);
select results_eq(
  $$ select prosrc like '%document_number = upper(v_value)%' from pg_proc where oid = 'public.verify_public_credential(text,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'manual lookup should normalize and resolve the document number'
);
select results_eq(
  $$ select prosrc like '%status in (''pending'', ''voided'')%' and prosrc like '%''not_found''::text%' from pg_proc where oid = 'public.verify_public_credential(text,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'pending and voided credentials should be indistinguishable from absent records'
);
select results_eq(
  $$ select prosrc like '%status = ''revoked''%' and prosrc like '%''Відкликаний''::text%' from pg_proc where oid = 'public.verify_public_credential(text,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'revoked verification should return the approved public status'
);
select results_eq(
  $$ select prosrc like '%v_credential.document_number%' and prosrc like '%v_credential.public_holder_name%' and prosrc like '%v_credential.public_programme_title%' and prosrc like '%v_credential.public_credential_type%' and prosrc like '%v_credential.issue_date%' from pg_proc where oid = 'public.verify_public_credential(text,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'valid verification should return only the current approved public credential fields'
);
select results_eq(
  $$ select pg_get_function_result('public.verify_public_credential(text,text,text)'::regprocedure) $$,
  $$ values ('TABLE(verification_result text, public_status text, document_number text, holder_name text, programme_title text, credential_type text, issue_date date)') $$,
  'the database response shape should contain no internal identifiers or private links'
);
select results_eq(
  $$ select prosrc not like '%partner%'
       and prosrc not like '%credential_files%'
       and prosrc not like '%learner_emails%'
       and prosrc not like '%learner_phones%'
       and prosrc not like '%revocation_reason%'
     from pg_proc
     where oid = 'public.verify_public_credential(text,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'verification should not read partner, PDF, contact, or revocation-reason data'
);
select results_eq(
  $$ select obj_description('internal.credential_verification_rate_limits'::regclass) like '%No token, document number, or PII is stored%' $$,
  $$ values (true) $$,
  'rate-limit storage should document that lookup values and PII are excluded'
);
select results_eq(
  $$ select has_table_privilege('anon', 'public.credentials', 'select') $$,
  $$ values (false) $$,
  'the private credentials table should remain unreadable to anonymous clients'
);

select * from finish();

rollback;
