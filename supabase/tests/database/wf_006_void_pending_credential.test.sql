begin;

select plan(18);

select has_function(
  'public',
  'void_pending_credential',
  array['uuid', 'text'],
  'controlled pending credential void function should exist'
);
select results_eq(
  $$ select prosecdef from pg_proc where oid = 'public.void_pending_credential(uuid,text)'::regprocedure $$,
  $$ values (true) $$,
  'pending void should be security definer'
);
select results_eq(
  $$ select proconfig @> array['search_path=public, internal, pg_temp'] from pg_proc where oid = 'public.void_pending_credential(uuid,text)'::regprocedure $$,
  $$ values (true) $$,
  'pending void should use a fixed search path'
);
select results_eq(
  $$ select has_function_privilege('anon', 'public.void_pending_credential(uuid,text)', 'execute') $$,
  $$ values (false) $$,
  'anonymous users cannot void pending credentials'
);
select results_eq(
  $$ select has_function_privilege('authenticated', 'public.void_pending_credential(uuid,text)', 'execute') $$,
  $$ values (true) $$,
  'authenticated actors can invoke the controlled workflow subject to authorization'
);
select results_eq(
  $$ select prosrc like '%owner%super_admin%credential_manager%' from pg_proc where oid = 'public.void_pending_credential(uuid,text)'::regprocedure $$,
  $$ values (true) $$,
  'voiding should allow only Owner, Super Admin, and Credential Manager roles'
);
select results_eq(
  $$ select prosrc like '%is_mfa_requirement_satisfied%' from pg_proc where oid = 'public.void_pending_credential(uuid,text)'::regprocedure $$,
  $$ values (true) $$,
  'voiding should enforce MFA'
);
select results_eq(
  $$ select prosrc like '%credential and void reason are required%' and prosrc like '%char_length(v_reason) > 4000%' from pg_proc where oid = 'public.void_pending_credential(uuid,text)'::regprocedure $$,
  $$ values (true) $$,
  'voiding should require a bounded non-blank reason'
);
select results_eq(
  $$ select length(prosrc) - length(replace(lower(prosrc), 'for update', '')) >= 20 from pg_proc where oid = 'public.void_pending_credential(uuid,text)'::regprocedure $$,
  $$ values (true) $$,
  'voiding should lock both the credential and number against concurrent lifecycle changes'
);
select results_eq(
  $$ select prosrc like '%only a pending credential can be voided%' from pg_proc where oid = 'public.void_pending_credential(uuid,text)'::regprocedure $$,
  $$ values (true) $$,
  'voiding should be pending-only'
);
select results_eq(
  $$ select prosrc like '%number_log.status = ''reserved''%' and prosrc like '%matching reserved document number not found%' from pg_proc where oid = 'public.void_pending_credential(uuid,text)'::regprocedure $$,
  $$ values (true) $$,
  'voiding should require the exact linked reserved number'
);
select results_eq(
  $$ select prosrc like '%update public.document_number_log%' and prosrc like '%status = ''voided''%' and prosrc like '%voided_by = v_actor_id%' and prosrc like '%void_reason = v_reason%' from pg_proc where oid = 'public.void_pending_credential(uuid,text)'::regprocedure $$,
  $$ values (true) $$,
  'voiding should permanently void the reserved number with actor and reason'
);
select results_eq(
  $$ select prosrc like '%update public.credentials%' and prosrc like '%voided_at = v_voided_at%' and prosrc like '%voided_by = v_actor_id%' and prosrc like '%void_reason = v_reason%' from pg_proc where oid = 'public.void_pending_credential(uuid,text)'::regprocedure $$,
  $$ values (true) $$,
  'voiding should atomically void the pending credential with actor, time, and reason'
);
select results_eq(
  $$ select prosrc like '%document_number.voided%' and prosrc like '%credential.voided%' and prosrc like '%write_audit_log%' from pg_proc where oid = 'public.void_pending_credential(uuid,text)'::regprocedure $$,
  $$ values (true) $$,
  'voiding should audit both permanent registry records'
);
select results_eq(
  $$ select count(*)::bigint from pg_trigger where (tgrelid = 'public.credentials'::regclass and tgname = 'credentials_record_core_history') or (tgrelid = 'public.document_number_log'::regclass and tgname = 'document_number_log_record_history') $$,
  $$ values (2::bigint) $$,
  'private History triggers should record both void transitions and reasons'
);
select results_eq(
  $$ select prosrc like '%old.status = ''pending'' and new.status in (''valid'', ''voided'')%' from pg_proc where oid = 'internal.enforce_credential_lifecycle()'::regprocedure $$,
  $$ values (true) $$,
  'credential lifecycle should keep voiding irreversible from pending only'
);
select results_eq(
  $$ select prosrc like '%old.status = ''reserved''%' and prosrc like '%new.status in (''issued'', ''voided'')%' from pg_proc where oid = 'internal.enforce_document_number_log_permanence()'::regprocedure $$,
  $$ values (true) $$,
  'document-number lifecycle should keep voided numbers permanent and non-reusable'
);
select results_eq(
  $$ select prosrc not like '%public_status%' and prosrc not like '%verification_token%' from pg_proc where oid = 'public.void_pending_credential(uuid,text)'::regprocedure $$,
  $$ values (true) $$,
  'WF-006 should not implement or expose public verification'
);

select * from finish();

rollback;
