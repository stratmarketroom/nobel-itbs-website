begin;

select plan(20);

select results_eq(
  $$ select public from storage.buckets where id = 'credential-templates' $$,
  $$ values (false) $$,
  'credential template source bucket should be private'
);
select results_eq(
  $$ select file_size_limit from storage.buckets where id = 'credential-templates' $$,
  $$ values (20971520::bigint) $$,
  'template source PDFs should be limited to 20 MB'
);
select results_eq(
  $$ select allowed_mime_types from storage.buckets where id = 'credential-templates' $$,
  $$ values (array['application/pdf']::text[]) $$,
  'template source bucket should accept PDF MIME only'
);
select results_eq(
  $$
    select count(*)::bigint
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and (coalesce(qual, '') || coalesce(with_check, '')) like '%credential-templates%'
  $$,
  $$ values (0::bigint) $$,
  'browser JWTs should have no direct credential template Storage policy'
);

select has_trigger('storage', 'objects', 'credential_template_objects_enforce_safety', 'template objects should enforce canonical paths and immutability');
select has_trigger('public', 'credential_template_versions', 'credential_template_versions_require_source_objects', 'publication should require every private source object');
select has_function('internal', 'enforce_credential_template_storage_object', array[]::text[], 'template Storage safety function should exist');
select has_function('internal', 'require_template_source_objects_for_publication', array[]::text[], 'publication source-object guard should exist');
select has_function(
  'public',
  'attach_credential_template_document',
  array['uuid', 'uuid', 'uuid', 'text', 'text', 'integer', 'boolean', 'bigint', 'integer', 'text', 'jsonb'],
  'validated template document metadata should attach atomically'
);
select has_function(
  'public',
  'delete_credential_template_document',
  array['uuid', 'uuid'],
  'draft template document metadata should delete through a controlled function'
);

select results_eq(
  $$ select has_function_privilege('anon', 'public.attach_credential_template_document(uuid,uuid,uuid,text,text,integer,boolean,bigint,integer,text,jsonb)'::regprocedure, 'execute') $$,
  $$ values (false) $$,
  'anonymous callers should not attach template documents'
);
select results_eq(
  $$ select has_function_privilege('authenticated', 'public.attach_credential_template_document(uuid,uuid,uuid,text,text,integer,boolean,bigint,integer,text,jsonb)'::regprocedure, 'execute') $$,
  $$ values (true) $$,
  'authenticated callers should reach the role/MFA-guarded attach function'
);
select results_eq(
  $$ select has_function_privilege('anon', 'public.delete_credential_template_document(uuid,uuid)'::regprocedure, 'execute') $$,
  $$ values (false) $$,
  'anonymous callers should not delete template documents'
);
select results_eq(
  $$ select has_function_privilege('authenticated', 'public.delete_credential_template_document(uuid,uuid)'::regprocedure, 'execute') $$,
  $$ values (true) $$,
  'authenticated callers should reach the role/MFA-guarded delete function'
);

select results_eq(
  $$ select has_table_privilege('authenticated', 'public.credential_template_documents', 'select') $$,
  $$ values (false) $$,
  'authenticated browser clients should not receive whole-row template document reads'
);
select results_eq(
  $$
    select count(*)::bigint
    from unnest(array[
      'id', 'template_version_id', 'file_type_id', 'admin_label',
      'output_filename_pattern', 'sort_order', 'is_primary', 'mime_type',
      'size_bytes', 'page_count', 'created_by', 'created_at', 'updated_at'
    ]) column_name
    where has_column_privilege('authenticated', 'public.credential_template_documents', column_name, 'select')
  $$,
  $$ values (13::bigint) $$,
  'authenticated RLS reads should expose only safe template document metadata'
);
select results_eq(
  $$
    select count(*)::bigint
    from unnest(array['source_storage_bucket', 'source_storage_path', 'source_sha256']) column_name
    where has_column_privilege('authenticated', 'public.credential_template_documents', column_name, 'select')
  $$,
  $$ values (0::bigint) $$,
  'browser clients should not read private source paths or hashes'
);
select results_eq(
  $$
    select count(*)::bigint
    from pg_proc procedure_record
    join pg_namespace namespace_record on namespace_record.oid = procedure_record.pronamespace
    where namespace_record.nspname = 'public'
      and procedure_record.proname in ('attach_credential_template_document', 'delete_credential_template_document')
      and pg_get_functiondef(procedure_record.oid) like '%internal.assert_sensitive_action_allowed%'
      and pg_get_functiondef(procedure_record.oid) like '%owner%'
      and pg_get_functiondef(procedure_record.oid) like '%super_admin%'
  $$,
  $$ values (2::bigint) $$,
  'template source mutations should require Owner or Super Admin and the shared MFA guard'
);

select results_eq(
  $$ select enumlabel::text from pg_enum where enumtypid = 'public.credential_template_version_status'::regtype order by enumsortorder $$,
  $$ values ('draft'::text), ('published'::text), ('retired'::text) $$,
  'template source storage should preserve the approved version lifecycle'
);
select results_eq(
  $$ select enumlabel::text from pg_enum where enumtypid = 'public.credential_status'::regtype order by enumsortorder $$,
  $$ values ('pending'::text), ('valid'::text), ('revoked'::text), ('voided'::text) $$,
  'template source storage should not change credential lifecycle statuses'
);

select * from finish();

rollback;
