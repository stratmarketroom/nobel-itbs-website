begin;

select plan(55);

select results_eq(
  $$ select count(*)::bigint from storage.buckets where id = 'private-credentials' $$,
  $$ values (1::bigint) $$,
  'private credential bucket should exist'
);
select results_eq(
  $$ select public from storage.buckets where id = 'private-credentials' $$,
  $$ values (false) $$,
  'private credential bucket must not be public'
);
select results_eq(
  $$ select file_size_limit from storage.buckets where id = 'private-credentials' $$,
  $$ values (20971520::bigint) $$,
  'private credential PDF limit should be 20 MB'
);
select results_eq(
  $$ select allowed_mime_types = array['application/pdf']::text[] from storage.buckets where id = 'private-credentials' $$,
  $$ values (true) $$,
  'private credential bucket should allow only PDF MIME type'
);
select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'storage' and tablename = 'objects' and (coalesce(qual, '') || coalesce(with_check, '')) like '%private-credentials%' $$,
  $$ values (0::bigint) $$,
  'browser JWTs should receive no direct private credential object policy'
);

select has_table('public', 'credential_file_types', 'credential file types table should exist');
select col_is_pk('public', 'credential_file_types', 'id', 'credential file type ID should be the primary key');
select has_column('public', 'credential_file_types', 'code', 'file type code should exist');
select has_column('public', 'credential_file_types', 'default_label', 'file type label should exist');
select has_column('public', 'credential_file_types', 'is_active', 'file type active flag should exist');
select results_eq(
  $$ select code, default_label, is_active from public.credential_file_types order by code $$,
  $$ values
    ('main_certificate'::text, 'Main certificate'::text, true),
    ('supplement'::text, 'Supplement'::text, true),
    ('transcript'::text, 'Transcript'::text, true) $$,
  'approved configurable file types should be seeded'
);
select results_eq(
  $$ select count(*)::bigint from pg_constraint where conrelid = 'public.credential_file_types'::regclass and contype = 'u' $$,
  $$ values (1::bigint) $$,
  'file type code should be unique'
);
select results_eq(
  $$ select count(*)::bigint from pg_constraint where conrelid = 'public.credential_file_types'::regclass and contype = 'c' and conname in ('credential_file_types_code_format', 'credential_file_types_default_label_not_blank') $$,
  $$ values (2::bigint) $$,
  'file type code and label should be constrained'
);
select has_trigger('public', 'credential_file_types', 'credential_file_types_set_updated_at', 'file types should maintain updated_at');
select is((select relrowsecurity from pg_class where oid = 'public.credential_file_types'::regclass), true, 'file types should enable RLS');
select is((select relforcerowsecurity from pg_class where oid = 'public.credential_file_types'::regclass), true, 'file types should force RLS');
select policies_are('public', 'credential_file_types', array['credential_file_types_admin_insert', 'credential_file_types_admin_update', 'credential_file_types_authorized_read'], 'file types should expose only approved policies');
select results_eq($$ select has_table_privilege('anon', 'public.credential_file_types', 'select') $$, $$ values (false) $$, 'anonymous clients cannot read private file types');
select results_eq($$ select has_table_privilege('authenticated', 'public.credential_file_types', 'select') $$, $$ values (true) $$, 'credential admins can read file types subject to RLS');
select results_eq($$ select has_table_privilege('authenticated', 'public.credential_file_types', 'delete') $$, $$ values (false) $$, 'file types are deactivated instead of deleted');
select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' and tablename = 'credential_file_types' and policyname = 'credential_file_types_authorized_read' and coalesce(qual, '') like '%credential_manager%' $$,
  $$ values (1::bigint) $$,
  'Credential Manager should read file types after MFA'
);
select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' and tablename = 'credential_file_types' and policyname like '%admin_%' and coalesce(qual, with_check, '') like '%credential_manager%' $$,
  $$ values (0::bigint) $$,
  'Credential Manager should not configure file types'
);

select has_table('public', 'credential_files', 'credential files table should exist');
select col_is_pk('public', 'credential_files', 'id', 'credential file ID should be the primary key');
select has_column('public', 'credential_files', 'credential_id', 'credential reference should exist');
select has_column('public', 'credential_files', 'file_type_id', 'file type reference should exist');
select has_column('public', 'credential_files', 'admin_label', 'optional admin label should exist');
select has_column('public', 'credential_files', 'storage_bucket', 'private bucket should be recorded');
select has_column('public', 'credential_files', 'storage_path', 'private object path should exist');
select has_column('public', 'credential_files', 'mime_type', 'MIME type should exist');
select has_column('public', 'credential_files', 'size_bytes', 'file size should exist');
select has_column('public', 'credential_files', 'is_primary', 'primary marker should exist');
select has_column('public', 'credential_files', 'uploaded_by', 'upload actor should exist');
select results_eq(
  $$ select count(*)::bigint from pg_constraint where conrelid = 'public.credential_files'::regclass and contype = 'f' $$,
  $$ values (3::bigint) $$,
  'file metadata should reference credential, file type, and upload actor'
);
select results_eq(
  $$ select count(*)::bigint from pg_constraint where conrelid = 'public.credential_files'::regclass and contype = 'u' $$,
  $$ values (1::bigint) $$,
  'private storage path should be globally unique'
);
select results_eq(
  $$ select count(*)::bigint from pg_constraint where conrelid = 'public.credential_files'::regclass and contype = 'c' and conname in ('credential_files_admin_label_not_blank', 'credential_files_private_bucket', 'credential_files_canonical_path', 'credential_files_pdf_mime', 'credential_files_size_limit') $$,
  $$ values (5::bigint) $$,
  'label, bucket, canonical path, PDF MIME, and 20 MB limit should be constrained'
);
select results_eq(
  $$ select indisunique and indpred is not null from pg_index where indexrelid = 'public.credential_files_one_primary_idx'::regclass $$,
  $$ values (true) $$,
  'one partial unique primary-file index should exist per credential'
);
select has_index('public', 'credential_files', 'credential_files_credential_created_idx', 'credential file listing should be indexed');
select has_index('public', 'credential_files', 'credential_files_type_idx', 'file type listing should be indexed');
select has_trigger('public', 'credential_files', 'credential_files_set_updated_at', 'credential files should maintain updated_at');
select has_trigger('public', 'credential_files', 'credential_files_enforce_identity', 'credential and storage path identity should be immutable');
select has_trigger('public', 'credential_files', 'credential_files_audit_change', 'file changes should be audited');
select is((select relrowsecurity from pg_class where oid = 'public.credential_files'::regclass), true, 'credential files should enable RLS');
select is((select relforcerowsecurity from pg_class where oid = 'public.credential_files'::regclass), true, 'credential files should force RLS');
select policies_are('public', 'credential_files', array['credential_files_authorized_read'], 'credential files should expose only private authorized read');
select results_eq($$ select has_table_privilege('anon', 'public.credential_files', 'select') $$, $$ values (false) $$, 'anonymous clients cannot read file metadata');
select results_eq($$ select has_table_privilege('authenticated', 'public.credential_files', 'select') $$, $$ values (true) $$, 'credential admins can read file metadata subject to RLS');
select results_eq($$ select has_table_privilege('authenticated', 'public.credential_files', 'insert') $$, $$ values (false) $$, 'authenticated clients cannot attach metadata directly');
select results_eq($$ select has_table_privilege('authenticated', 'public.credential_files', 'update') $$, $$ values (false) $$, 'authenticated clients cannot replace metadata directly');
select results_eq($$ select has_table_privilege('authenticated', 'public.credential_files', 'delete') $$, $$ values (false) $$, 'authenticated clients cannot delete metadata directly');
select results_eq($$ select has_table_privilege('service_role', 'public.credential_files', 'insert') $$, $$ values (false) $$, 'service role cannot bypass future controlled metadata routes with direct insert');
select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' and tablename in ('credential_file_types', 'credential_files') and coalesce(qual, with_check, '') like '%is_mfa_requirement_satisfied%' $$,
  $$ values (4::bigint) $$,
  'every credential file policy should enforce MFA'
);
select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' and tablename = 'credential_files' and coalesce(qual, '') like '%credential_manager%' $$,
  $$ values (1::bigint) $$,
  'Credential Manager should read file metadata after MFA'
);
select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' and tablename in ('credential_file_types', 'credential_files') and coalesce(qual, with_check, '') like '%content_manager%' $$,
  $$ values (0::bigint) $$,
  'Content Manager must not appear in credential file policies'
);

select * from finish();

rollback;
