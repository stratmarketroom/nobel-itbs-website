begin;

select plan(40);

select has_type('public', 'credential_email_send_status', 'credential email status enum should exist');
select has_table('public', 'email_templates', 'private email templates should exist');
select has_table('public', 'credential_email_sends', 'permanent email send history should exist');
select results_eq(
  $$ select count(*)::bigint from public.email_templates where template_key = 'credential_delivery' and language_code in ('en', 'ua') $$,
  $$ values (2::bigint) $$,
  'credential delivery should have EN and UA templates'
);
select results_eq(
  $$ select count(*)::bigint from pg_class where oid in ('public.email_templates'::regclass, 'public.credential_email_sends'::regclass) and relrowsecurity and relforcerowsecurity $$,
  $$ values (2::bigint) $$,
  'private delivery tables should enable and force row level security'
);
select results_eq($$ select has_table_privilege('authenticated', 'public.email_templates', 'select') $$, $$ values (true) $$, 'authenticated actors can read templates through RLS');
select results_eq($$ select has_table_privilege('authenticated', 'public.email_templates', 'insert') $$, $$ values (false) $$, 'authenticated actors cannot insert templates directly');
select results_eq($$ select has_table_privilege('anon', 'public.email_templates', 'select') $$, $$ values (false) $$, 'anonymous users cannot read templates');
select results_eq($$ select has_table_privilege('authenticated', 'public.credential_email_sends', 'select') $$, $$ values (true) $$, 'authenticated actors can read delivery history through RLS');
select results_eq($$ select has_table_privilege('authenticated', 'public.credential_email_sends', 'insert') $$, $$ values (false) $$, 'authenticated actors cannot create delivery history directly');
select results_eq($$ select has_table_privilege('authenticated', 'public.credential_email_sends', 'update') $$, $$ values (false) $$, 'authenticated actors cannot mutate delivery history directly');
select results_eq($$ select has_table_privilege('anon', 'public.credential_email_sends', 'select') $$, $$ values (false) $$, 'anonymous users cannot read delivery history');

select has_function('public', 'activate_credential', array['uuid', 'text', 'text', 'text', 'jsonb'], 'atomic activation function should exist');
select has_function('public', 'complete_credential_email_send', array['uuid', 'credential_email_send_status', 'text'], 'controlled delivery finalizer should exist');
select results_eq(
  $$ select count(*)::bigint from pg_proc where oid in (
    'public.activate_credential(uuid,text,text,text,jsonb)'::regprocedure,
    'public.complete_credential_email_send(uuid,public.credential_email_send_status,text)'::regprocedure
  ) and prosecdef $$,
  $$ values (2::bigint) $$,
  'activation functions should be security definer'
);
select results_eq(
  $$ select count(*)::bigint from pg_proc where oid in (
    'public.activate_credential(uuid,text,text,text,jsonb)'::regprocedure,
    'public.complete_credential_email_send(uuid,public.credential_email_send_status,text)'::regprocedure
  ) and proconfig @> array['search_path=public, internal, pg_temp'] $$,
  $$ values (2::bigint) $$,
  'activation functions should use a fixed search path'
);
select results_eq($$ select has_function_privilege('anon', 'public.activate_credential(uuid,text,text,text,jsonb)', 'execute') $$, $$ values (false) $$, 'anonymous users cannot activate credentials');
select results_eq($$ select has_function_privilege('anon', 'public.complete_credential_email_send(uuid,public.credential_email_send_status,text)', 'execute') $$, $$ values (false) $$, 'anonymous users cannot finalize delivery');
select results_eq($$ select has_function_privilege('authenticated', 'public.activate_credential(uuid,text,text,text,jsonb)', 'execute') $$, $$ values (true) $$, 'authenticated actors can invoke controlled activation');
select results_eq($$ select has_function_privilege('authenticated', 'public.complete_credential_email_send(uuid,public.credential_email_send_status,text)', 'execute') $$, $$ values (true) $$, 'authenticated actors can invoke controlled delivery finalization');

select results_eq(
  $$ select prosrc like '%owner%super_admin%credential_manager%' from pg_proc where oid = 'public.activate_credential(uuid,text,text,text,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'activation should allow only Owner, Super Admin, and Credential Manager roles'
);
select results_eq(
  $$ select prosrc like '%is_mfa_requirement_satisfied%' from pg_proc where oid = 'public.activate_credential(uuid,text,text,text,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'activation should enforce MFA'
);
select results_eq(
  $$ select prosrc like '%only a pending credential can be activated%' from pg_proc where oid = 'public.activate_credential(uuid,text,text,text,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'activation should be pending-only'
);
select results_eq(
  $$ select prosrc like '%a primary PDF is required for activation%' from pg_proc where oid = 'public.activate_credential(uuid,text,text,text,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'activation should require a primary PDF'
);
select results_eq(
  $$ select prosrc like '%file manifest must include every current credential file%' from pg_proc where oid = 'public.activate_credential(uuid,text,text,text,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'activation should bind delivery to every current file'
);
select results_eq(
  $$ select prosrc like '%set status = ''issued''%' from pg_proc where oid = 'public.activate_credential(uuid,text,text,text,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'activation should issue the permanent document number'
);
select results_eq(
  $$ select prosrc like '%set status = ''valid'', activated_at = v_activated_at%' from pg_proc where oid = 'public.activate_credential(uuid,text,text,text,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'activation should make the credential valid atomically'
);
select results_eq(
  $$ select prosrc like '%insert into public.credential_email_sends%' from pg_proc where oid = 'public.activate_credential(uuid,text,text,text,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'activation should create delivery history before provider coordination'
);
select results_eq(
  $$ select prosrc like '%skipped_empty_recipient%' from pg_proc where oid = 'public.activate_credential(uuid,text,text,text,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'empty recipient should be recorded without blocking activation'
);
select results_eq(
  $$ select prosrc like '%credential.activated%' and prosrc like '%credential_email.queued%' from pg_proc where oid = 'public.activate_credential(uuid,text,text,text,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'activation should write credential history'
);
select results_eq(
  $$ select prosrc like '%write_audit_log%' from pg_proc where oid = 'public.activate_credential(uuid,text,text,text,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'activation should write the security audit log'
);

select results_eq(
  $$ select prosrc like '%email_send.sent_by = auth.uid()%' from pg_proc where oid = 'public.complete_credential_email_send(uuid,public.credential_email_send_status,text)'::regprocedure $$,
  $$ values (true) $$,
  'delivery finalization should be limited to the actor-owned pending attempt'
);
select results_eq(
  $$ select prosrc like '%sent%failed%not_configured%' from pg_proc where oid = 'public.complete_credential_email_send(uuid,public.credential_email_send_status,text)'::regprocedure $$,
  $$ values (true) $$,
  'delivery finalization should allow only terminal provider outcomes'
);
select results_eq(
  $$ select prosrc like '%write_credential_history%' from pg_proc where oid = 'public.complete_credential_email_send(uuid,public.credential_email_send_status,text)'::regprocedure $$,
  $$ values (true) $$,
  'delivery outcome should write credential history'
);
select results_eq(
  $$ select prosrc like '%write_audit_log%' from pg_proc where oid = 'public.complete_credential_email_send(uuid,public.credential_email_send_status,text)'::regprocedure $$,
  $$ values (true) $$,
  'delivery outcome should write the security audit log'
);
select has_function('internal', 'enforce_credential_email_send_mutation', array[]::text[], 'delivery permanence trigger should exist');
select results_eq(
  $$ select prosrc like '%content is immutable%' and prosrc like '%pending%sent%failed%not_configured%' from pg_proc where oid = 'internal.enforce_credential_email_send_mutation()'::regprocedure $$,
  $$ values (true) $$,
  'delivery content should be immutable with one pending-to-final transition'
);
select results_eq(
  $$ select count(*)::bigint from pg_trigger where tgrelid = 'public.credential_email_sends'::regclass and tgname = 'credential_email_sends_enforce_mutation' and not tgisinternal $$,
  $$ values (1::bigint) $$,
  'delivery permanence trigger should be installed'
);
select results_eq(
  $$ select prosrc not like '%storage_path%' and prosrc not like '%file_content%' from pg_proc where oid = 'public.activate_credential(uuid,text,text,text,jsonb)'::regprocedure $$,
  $$ values (true) $$,
  'activation history must not copy private paths or PDF content'
);
select results_eq(
  $$ select count(*)::bigint from pg_constraint where conrelid = 'public.credential_email_sends'::regclass and conname in ('credential_email_sends_files_array', 'credential_email_sends_status_consistency') $$,
  $$ values (2::bigint) $$,
  'delivery history should validate the safe file manifest and outcome consistency'
);

select * from finish();

rollback;
