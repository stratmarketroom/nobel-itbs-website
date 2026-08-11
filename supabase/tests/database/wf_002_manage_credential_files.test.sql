begin;

select plan(38);

select has_function('public', 'attach_credential_file', array['uuid', 'uuid', 'uuid', 'text', 'bigint', 'boolean', 'text'], 'controlled file attach function should exist');
select has_function('public', 'replace_credential_file', array['uuid', 'bigint', 'text'], 'controlled file replacement function should exist');
select has_function('public', 'update_credential_file', array['uuid', 'uuid', 'text', 'boolean', 'text'], 'controlled file metadata function should exist');
select has_function('public', 'delete_credential_file', array['uuid', 'text'], 'controlled pending-file deletion function should exist');

select results_eq(
  $$ select count(*)::bigint from pg_proc where oid in (
    'public.attach_credential_file(uuid,uuid,uuid,text,bigint,boolean,text)'::regprocedure,
    'public.replace_credential_file(uuid,bigint,text)'::regprocedure,
    'public.update_credential_file(uuid,uuid,text,boolean,text)'::regprocedure,
    'public.delete_credential_file(uuid,text)'::regprocedure
  ) and prosecdef $$,
  $$ values (4::bigint) $$,
  'all file mutation functions should be security definer'
);

select results_eq(
  $$ select count(*)::bigint from pg_proc where oid in (
    'public.attach_credential_file(uuid,uuid,uuid,text,bigint,boolean,text)'::regprocedure,
    'public.replace_credential_file(uuid,bigint,text)'::regprocedure,
    'public.update_credential_file(uuid,uuid,text,boolean,text)'::regprocedure,
    'public.delete_credential_file(uuid,text)'::regprocedure
  ) and proconfig @> array['search_path=public, internal, pg_temp'] $$,
  $$ values (4::bigint) $$,
  'all file mutation functions should use a fixed search path'
);

select results_eq($$ select has_function_privilege('anon', 'public.attach_credential_file(uuid,uuid,uuid,text,bigint,boolean,text)', 'execute') $$, $$ values (false) $$, 'anonymous cannot attach files');
select results_eq($$ select has_function_privilege('anon', 'public.replace_credential_file(uuid,bigint,text)', 'execute') $$, $$ values (false) $$, 'anonymous cannot replace files');
select results_eq($$ select has_function_privilege('anon', 'public.update_credential_file(uuid,uuid,text,boolean,text)', 'execute') $$, $$ values (false) $$, 'anonymous cannot update files');
select results_eq($$ select has_function_privilege('anon', 'public.delete_credential_file(uuid,text)', 'execute') $$, $$ values (false) $$, 'anonymous cannot delete files');
select results_eq($$ select has_function_privilege('authenticated', 'public.attach_credential_file(uuid,uuid,uuid,text,bigint,boolean,text)', 'execute') $$, $$ values (true) $$, 'authenticated actor can invoke controlled attach');
select results_eq($$ select has_function_privilege('authenticated', 'public.replace_credential_file(uuid,bigint,text)', 'execute') $$, $$ values (true) $$, 'authenticated actor can invoke controlled replacement');
select results_eq($$ select has_function_privilege('authenticated', 'public.update_credential_file(uuid,uuid,text,boolean,text)', 'execute') $$, $$ values (true) $$, 'authenticated actor can invoke controlled metadata update');
select results_eq($$ select has_function_privilege('authenticated', 'public.delete_credential_file(uuid,text)', 'execute') $$, $$ values (true) $$, 'authenticated actor can invoke controlled deletion');

select has_function('internal', 'require_credential_file_mutation', array['uuid', 'text', 'boolean'], 'shared lifecycle/authorization guard should exist');
select results_eq(
  $$ select prosrc like '%owner%super_admin%credential_manager%' from pg_proc where oid = 'internal.require_credential_file_mutation(uuid,text,boolean)'::regprocedure $$,
  $$ values (true) $$,
  'file workflow should allow Owner, Super Admin, and Credential Manager'
);
select results_eq(
  $$ select prosrc like '%is_mfa_requirement_satisfied%' from pg_proc where oid = 'internal.require_credential_file_mutation(uuid,text,boolean)'::regprocedure $$,
  $$ values (true) $$,
  'file workflow should enforce MFA'
);
select results_eq(
  $$ select prosrc like '%v_status not in (''pending'', ''valid'')%' from pg_proc where oid = 'internal.require_credential_file_mutation(uuid,text,boolean)'::regprocedure $$,
  $$ values (true) $$,
  'revoked and voided file mutations should be denied'
);
select results_eq(
  $$ select prosrc like '%p_allow_delete and v_status <> ''pending''%' from pg_proc where oid = 'internal.require_credential_file_mutation(uuid,text,boolean)'::regprocedure $$,
  $$ values (true) $$,
  'file deletion should be pending-only'
);
select results_eq(
  $$ select prosrc like '%v_status = ''valid''%reason is required%' from pg_proc where oid = 'internal.require_credential_file_mutation(uuid,text,boolean)'::regprocedure $$,
  $$ values (true) $$,
  'valid credential PDF changes should require a reason'
);

select results_eq(
  $$ select prosrc like '%credential_file_types%is_active%' from pg_proc where oid = 'public.attach_credential_file(uuid,uuid,uuid,text,bigint,boolean,text)'::regprocedure $$,
  $$ values (true) $$,
  'file attach should require an active file type'
);
select results_eq(
  $$ select prosrc like '%credential_id::text || ''/'' || p_file_id::text || ''.pdf''%' from pg_proc where oid = 'public.attach_credential_file(uuid,uuid,uuid,text,bigint,boolean,text)'::regprocedure $$,
  $$ values (true) $$,
  'file attach should use the canonical private object path'
);
select results_eq(
  $$ select prosrc like '%mime_type,%size_bytes,%is_primary,%uploaded_by%' from pg_proc where oid = 'public.attach_credential_file(uuid,uuid,uuid,text,bigint,boolean,text)'::regprocedure $$,
  $$ values (true) $$,
  'file attach should record current PDF metadata and actor'
);
select results_eq(
  $$ select prosrc like '%existing.is_primary%' from pg_proc where oid = 'public.attach_credential_file(uuid,uuid,uuid,text,bigint,boolean,text)'::regprocedure $$,
  $$ values (true) $$,
  'attaching a primary file should clear the prior primary atomically'
);
select results_eq(
  $$ select prosrc like '%app.credential_file_operation%replace%' from pg_proc where oid = 'public.replace_credential_file(uuid,bigint,text)'::regprocedure $$,
  $$ values (true) $$,
  'replacement should mark the operation explicitly even when size is unchanged'
);
select results_eq(
  $$ select prosrc like '%uploaded_by = auth.uid()%' from pg_proc where oid = 'public.replace_credential_file(uuid,bigint,text)'::regprocedure $$,
  $$ values (true) $$,
  'replacement should record the current actor'
);
select results_eq(
  $$ select prosrc like '%valid credential must retain one primary PDF%' from pg_proc where oid = 'public.update_credential_file(uuid,uuid,text,boolean,text)'::regprocedure $$,
  $$ values (true) $$,
  'valid credentials should not lose their only primary file'
);
select results_eq(
  $$ select prosrc like '%delete from public.credential_files%' from pg_proc where oid = 'public.delete_credential_file(uuid,text)'::regprocedure $$,
  $$ values (true) $$,
  'controlled pending-file deletion should remove current metadata'
);

select has_function('internal', 'credential_file_change_reason', array[]::text[], 'controlled transaction reason reader should exist');
select results_eq(
  $$ select prosrc like '%credential_file_change_reason%' from pg_proc where oid = 'internal.audit_credential_file_change()'::regprocedure $$,
  $$ values (true) $$,
  'file audit should read the controlled reason'
);
select results_eq(
  $$ select prosrc like '%credential_file_change_reason%' from pg_proc where oid = 'internal.record_credential_file_history()'::regprocedure $$,
  $$ values (true) $$,
  'file history should read the controlled reason'
);
select results_eq(
  $$ select prosrc like '%v_operation = ''replace''%' from pg_proc where oid = 'internal.audit_credential_file_change()'::regprocedure $$,
  $$ values (true) $$,
  'audit should identify every physical replacement explicitly'
);
select results_eq(
  $$ select prosrc like '%p_reason => v_reason%' from pg_proc where oid = 'internal.record_credential_file_history()'::regprocedure $$,
  $$ values (true) $$,
  'history should store the controlled valid-change reason'
);
select results_eq(
  $$ select prosrc not like '%storage_path%' from pg_proc where oid = 'internal.record_credential_file_history()'::regprocedure $$,
  $$ values (true) $$,
  'history must not copy private Storage paths'
);

select results_eq($$ select has_table_privilege('authenticated', 'public.credential_files', 'insert') $$, $$ values (false) $$, 'authenticated users cannot bypass attach with direct insert');
select results_eq($$ select has_table_privilege('authenticated', 'public.credential_files', 'update') $$, $$ values (false) $$, 'authenticated users cannot bypass replacement/update');
select results_eq($$ select has_table_privilege('authenticated', 'public.credential_files', 'delete') $$, $$ values (false) $$, 'authenticated users cannot bypass pending deletion');
select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'storage' and tablename = 'objects' and (coalesce(qual, '') || coalesce(with_check, '')) like '%private-credentials%' $$,
  $$ values (0::bigint) $$,
  'private credential Storage should remain inaccessible to browser JWTs'
);

select * from finish();

rollback;
