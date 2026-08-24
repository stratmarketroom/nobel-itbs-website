begin;

select plan(24);

select has_function('public', 'resend_credential', array['uuid', 'text', 'text', 'text', 'jsonb'], 'controlled resend function should exist');
select results_eq(
  $$ select prosecdef from pg_proc where oid = 'public.resend_credential(uuid,text,text,text,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'resend should be security definer'
);
select results_eq(
  $$ select proconfig @> array['search_path=public, internal, pg_temp'] from pg_proc where oid = 'public.resend_credential(uuid,text,text,text,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'resend should use a fixed search path'
);
select results_eq($$ select has_function_privilege('anon', 'public.resend_credential(uuid,text,text,text,jsonb)', 'execute') $$, $$ values (false) $$, 'anonymous users cannot resend credentials');
select results_eq($$ select has_function_privilege('authenticated', 'public.resend_credential(uuid,text,text,text,jsonb)', 'execute') $$, $$ values (true) $$, 'authenticated actors can invoke controlled resend');

select results_eq(
  $$ select prosrc like '%owner%super_admin%credential_manager%' from pg_proc where oid = 'public.resend_credential(uuid,text,text,text,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'resend should allow only Owner, Super Admin, and Credential Manager roles'
);
select results_eq(
  $$ select prosrc like '%is_mfa_requirement_satisfied%' from pg_proc where oid = 'public.resend_credential(uuid,text,text,text,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'resend should enforce MFA'
);
select results_eq(
  $$ select prosrc like '%only a valid credential can be resent%' from pg_proc where oid = 'public.resend_credential(uuid,text,text,text,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'resend should be valid-only'
);
select results_eq(
  $$ select prosrc like '%for update%' from pg_proc where oid = 'public.resend_credential(uuid,text,text,text,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'resend should lock the credential while validating current files'
);
select results_eq(
  $$ select prosrc like '%char_length(btrim(p_subject)) > 180%' and prosrc like '%char_length(btrim(p_body)) > 20000%' from pg_proc where oid = 'public.resend_credential(uuid,text,text,text,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'resend should enforce email text limits'
);
select results_eq(
  $$ select prosrc like '%recipient email is invalid%' from pg_proc where oid = 'public.resend_credential(uuid,text,text,text,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'resend should validate a custom recipient'
);
select results_eq(
  $$ select prosrc like '%file manifest must include every current credential file%' from pg_proc where oid = 'public.resend_credential(uuid,text,text,text,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'resend should require every current PDF'
);
select results_eq(
  $$ select prosrc like '%each current credential file exactly once%' from pg_proc where oid = 'public.resend_credential(uuid,text,text,text,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'resend should reject duplicate or incomplete file manifests'
);
select results_eq(
  $$ select prosrc like '%storage_path%storage_bucket%file_content%bytes%' from pg_proc where oid = 'public.resend_credential(uuid,text,text,text,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'resend should reject private storage fields and file bytes'
);
select results_eq(
  $$ select prosrc like '%file manifest contains unsupported data%' from pg_proc where oid = 'public.resend_credential(uuid,text,text,text,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'resend should permit only the approved safe manifest fields'
);
select results_eq(
  $$ select prosrc like '%insert into public.credential_email_sends%' from pg_proc where oid = 'public.resend_credential(uuid,text,text,text,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'resend should create immutable delivery history before provider coordination'
);
select results_eq(
  $$ select prosrc like '%skipped_empty_recipient%' from pg_proc where oid = 'public.resend_credential(uuid,text,text,text,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'empty recipient should create a skipped resend record'
);
select results_eq(
  $$ select prosrc like '%credential_email.resend_queued%' and prosrc like '%credential_email.resend_skipped%' from pg_proc where oid = 'public.resend_credential(uuid,text,text,text,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'resend should write minimal credential history events'
);
select results_eq(
  $$ select prosrc like '%write_audit_log%' from pg_proc where oid = 'public.resend_credential(uuid,text,text,text,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'resend should write the security audit log'
);
select results_eq(
  $$ select prosrc not like '%update public.credentials%' from pg_proc where oid = 'public.resend_credential(uuid,text,text,text,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'resend delivery outcome must not change credential status'
);
select results_eq(
  $$ select prosrc not like '%document_number_log%' from pg_proc where oid = 'public.resend_credential(uuid,text,text,text,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'resend must not change the permanent document number ledger'
);
select results_eq(
  $$ select count(*)::bigint from pg_trigger where tgrelid = 'public.credential_email_sends'::regclass and tgname = 'credential_email_sends_enforce_mutation' and not tgisinternal $$,
  $$ values (1::bigint) $$,
  'resend history should remain protected by the delivery permanence trigger'
);
select has_function('public', 'complete_credential_email_send', array['uuid', 'credential_email_send_status', 'text'], 'resend should reuse the controlled provider-outcome finalizer');
select results_eq(
  $$
    select metadata_source like '%credential_id%status%file_count%'
      and metadata_source not like '%recipient%'
      and metadata_source not like '%p_body%'
      and metadata_source not like '%filename%'
    from (
      select split_part(split_part(prosrc, 'p_metadata => jsonb_build_object(', 2), ');', 1) as metadata_source
      from pg_proc
      where oid = 'public.resend_credential(uuid,text,text,text,jsonb)'::regprocedure
    ) source
  $$,
  $$ values (true) $$,
  'resend audit metadata should contain only credential ID, status, and file count'
);

select * from finish();

rollback;
