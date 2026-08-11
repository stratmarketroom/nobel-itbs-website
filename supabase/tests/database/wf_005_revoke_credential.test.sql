begin;

select plan(16);

select has_function(
  'public',
  'revoke_credential',
  array['uuid', 'text'],
  'controlled credential revocation function should exist'
);
select results_eq(
  $$ select prosecdef from pg_proc where oid = 'public.revoke_credential(uuid,text)'::regprocedure $$,
  $$ values (true) $$,
  'revocation should be security definer'
);
select results_eq(
  $$ select proconfig @> array['search_path=public, internal, pg_temp'] from pg_proc where oid = 'public.revoke_credential(uuid,text)'::regprocedure $$,
  $$ values (true) $$,
  'revocation should use a fixed search path'
);
select results_eq(
  $$ select has_function_privilege('anon', 'public.revoke_credential(uuid,text)', 'execute') $$,
  $$ values (false) $$,
  'anonymous users cannot revoke credentials'
);
select results_eq(
  $$ select has_function_privilege('authenticated', 'public.revoke_credential(uuid,text)', 'execute') $$,
  $$ values (true) $$,
  'authenticated actors can invoke the controlled workflow subject to authorization'
);
select results_eq(
  $$ select prosrc like '%owner%super_admin%credential_manager%' from pg_proc where oid = 'public.revoke_credential(uuid,text)'::regprocedure $$,
  $$ values (true) $$,
  'revocation should allow only Owner, Super Admin, and Credential Manager roles'
);
select results_eq(
  $$ select prosrc like '%is_mfa_requirement_satisfied%' from pg_proc where oid = 'public.revoke_credential(uuid,text)'::regprocedure $$,
  $$ values (true) $$,
  'revocation should enforce MFA'
);
select results_eq(
  $$ select prosrc like '%credential and revocation reason are required%' and prosrc like '%char_length(v_reason) > 4000%' from pg_proc where oid = 'public.revoke_credential(uuid,text)'::regprocedure $$,
  $$ values (true) $$,
  'revocation should require a bounded non-blank reason'
);
select results_eq(
  $$ select prosrc like '%for update%' from pg_proc where oid = 'public.revoke_credential(uuid,text)'::regprocedure $$,
  $$ values (true) $$,
  'revocation should lock the credential against concurrent lifecycle changes'
);
select results_eq(
  $$ select prosrc like '%only a valid credential can be revoked%' from pg_proc where oid = 'public.revoke_credential(uuid,text)'::regprocedure $$,
  $$ values (true) $$,
  'revocation should be valid-only'
);
select results_eq(
  $$ select prosrc like '%status = ''revoked''%' and prosrc like '%revoked_at = v_revoked_at%' and prosrc like '%revoked_by = v_actor_id%' and prosrc like '%revocation_reason = v_reason%' from pg_proc where oid = 'public.revoke_credential(uuid,text)'::regprocedure $$,
  $$ values (true) $$,
  'revocation should atomically store status, time, actor, and reason'
);
select results_eq(
  $$ select prosrc like '%credential.revoked%' and prosrc like '%write_audit_log%' from pg_proc where oid = 'public.revoke_credential(uuid,text)'::regprocedure $$,
  $$ values (true) $$,
  'revocation should write the security audit log'
);
select results_eq(
  $$ select count(*)::bigint from pg_trigger where tgrelid = 'public.credentials'::regclass and tgname = 'credentials_record_core_history' and not tgisinternal $$,
  $$ values (1::bigint) $$,
  'the existing private credential history trigger should record revocation and reason'
);
select results_eq(
  $$ select prosrc like '%coalesce(new.revocation_reason, new.void_reason)%' from pg_proc where oid = 'internal.record_credential_core_history()'::regprocedure $$,
  $$ values (true) $$,
  'credential history should retain the private revocation reason'
);
select results_eq(
  $$ select prosrc not like '%update public.document_number_log%' from pg_proc where oid = 'public.revoke_credential(uuid,text)'::regprocedure $$,
  $$ values (true) $$,
  'revocation should preserve the already-issued permanent document number'
);
select results_eq(
  $$ select prosrc like '%old.status = ''valid'' and new.status = ''revoked''%' from pg_proc where oid = 'internal.enforce_credential_lifecycle()'::regprocedure $$,
  $$ values (true) $$,
  'the lifecycle guard should keep revocation irreversible with only the one-way valid-to-revoked transition'
);

select * from finish();

rollback;
