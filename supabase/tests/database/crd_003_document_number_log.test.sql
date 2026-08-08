begin;

select plan(46);

select has_type('public', 'document_number_status', 'document number status enum should exist');
select results_eq(
  $$ select enumlabel from pg_enum where enumtypid = 'public.document_number_status'::regtype order by enumsortorder $$,
  $$ values ('reserved'::name), ('issued'::name), ('voided'::name) $$,
  'document number status should contain only reserved, issued, and voided'
);
select has_sequence('public', 'document_number_shared_seq', 'one shared document number sequence should exist');
select results_eq(
  $$ select seqmax from pg_sequence where seqrelid = 'public.document_number_shared_seq'::regclass $$,
  $$ values (999999::bigint) $$,
  'shared sequence should preserve the six-digit format limit'
);
select results_eq(
  $$ select seqcycle from pg_sequence where seqrelid = 'public.document_number_shared_seq'::regclass $$,
  $$ values (false) $$,
  'shared sequence must never cycle'
);

select has_table('public', 'document_number_log', 'document number log table should exist');
select col_is_pk('public', 'document_number_log', 'id', 'document number log ID should be the primary key');
select has_column('public', 'document_number_log', 'document_number', 'formatted document number should exist');
select has_column('public', 'document_number_log', 'sequence_value', 'shared numeric value should exist');
select has_column('public', 'document_number_log', 'credential_id', 'future credential link slot should exist');
select has_column('public', 'document_number_log', 'credential_type_id', 'credential type reference should exist');
select has_column('public', 'document_number_log', 'status', 'number status should exist');
select has_column('public', 'document_number_log', 'created_by', 'reservation actor should exist');
select has_column('public', 'document_number_log', 'voided_by', 'void actor should exist');
select has_column('public', 'document_number_log', 'void_reason', 'void reason should exist');
select results_eq(
  $$ select column_default from information_schema.columns where table_schema = 'public' and table_name = 'document_number_log' and column_name = 'status' $$,
  $$ values ('''reserved''::document_number_status'::text) $$,
  'new log rows should default to reserved'
);
select results_eq(
  $$ select count(*)::bigint from pg_constraint where conrelid = 'public.document_number_log'::regclass and contype = 'f' $$,
  $$ values (3::bigint) $$,
  'log should reference credential type and reservation/void actors before CRD-004 adds credential FK'
);
select results_eq(
  $$ select count(*)::bigint from pg_constraint where conrelid = 'public.document_number_log'::regclass and contype = 'u' $$,
  $$ values (2::bigint) $$,
  'formatted number and shared numeric value should both be globally unique'
);
select results_eq(
  $$ select count(*)::bigint from pg_constraint where conrelid = 'public.document_number_log'::regclass and contype = 'c' and conname in ('document_number_log_format', 'document_number_log_sequence_range', 'document_number_log_issued_link', 'document_number_log_void_consistency') $$,
  $$ values (4::bigint) $$,
  'format, numeric range, issued link, and void consistency should be constrained'
);

select has_index('public', 'document_number_log', 'document_number_log_status_created_idx', 'status listing should be indexed');
select has_index('public', 'document_number_log', 'document_number_log_credential_type_idx', 'credential type listing should be indexed');
select has_index('public', 'document_number_log', 'document_number_log_credential_id_idx', 'future credential lookup should be indexed');
select has_trigger('public', 'document_number_log', 'document_number_log_set_updated_at', 'document number log should maintain updated_at');
select has_trigger('public', 'document_number_log', 'document_number_log_enforce_permanence', 'document number identity and rows should be permanent');

select has_function('public', 'reserve_document_number', array['uuid', 'date'], 'automatic number reservation function should exist');
select has_function('public', 'reserve_manual_document_number', array['uuid', 'date', 'text', 'text'], 'manual reservation function should exist');
select has_function('public', 'void_reserved_document_number', array['uuid', 'text'], 'controlled void function should exist');

select is((select relrowsecurity from pg_class where oid = 'public.document_number_log'::regclass), true, 'document number log should enable RLS');
select is((select relforcerowsecurity from pg_class where oid = 'public.document_number_log'::regclass), true, 'document number log should force RLS');
select policies_are('public', 'document_number_log', array['document_number_log_authorized_read'], 'only authorized read policy should exist');

select results_eq($$ select has_table_privilege('anon', 'public.document_number_log', 'select') $$, $$ values (false) $$, 'anonymous clients must not read the log');
select results_eq($$ select has_table_privilege('authenticated', 'public.document_number_log', 'select') $$, $$ values (true) $$, 'authenticated credential admins receive select subject to RLS');
select results_eq($$ select has_table_privilege('authenticated', 'public.document_number_log', 'insert') $$, $$ values (false) $$, 'authenticated users cannot insert log rows directly');
select results_eq($$ select has_table_privilege('authenticated', 'public.document_number_log', 'update') $$, $$ values (false) $$, 'authenticated users cannot update log rows directly');
select results_eq($$ select has_table_privilege('authenticated', 'public.document_number_log', 'delete') $$, $$ values (false) $$, 'authenticated users cannot delete log rows');
select results_eq($$ select has_sequence_privilege('authenticated', 'public.document_number_shared_seq', 'usage') $$, $$ values (false) $$, 'authenticated users cannot consume the sequence directly');
select results_eq($$ select has_sequence_privilege('service_role', 'public.document_number_shared_seq', 'usage') $$, $$ values (false) $$, 'service role cannot consume the sequence outside controlled functions');

select results_eq($$ select has_function_privilege('anon', 'public.reserve_document_number(uuid,date)', 'execute') $$, $$ values (false) $$, 'anonymous clients cannot reserve numbers');
select results_eq($$ select has_function_privilege('authenticated', 'public.reserve_document_number(uuid,date)', 'execute') $$, $$ values (true) $$, 'authenticated credential admins can invoke automatic reservation subject to function authorization');
select results_eq($$ select has_function_privilege('authenticated', 'public.reserve_manual_document_number(uuid,date,text,text)', 'execute') $$, $$ values (true) $$, 'authenticated users can invoke manual reservation subject to Owner/Super Admin authorization');
select results_eq($$ select has_function_privilege('authenticated', 'public.void_reserved_document_number(uuid,text)', 'execute') $$, $$ values (true) $$, 'authenticated credential admins can invoke controlled voiding');

select results_eq(
  $$ select count(*)::bigint from pg_proc procedure join pg_namespace namespace on namespace.oid = procedure.pronamespace where namespace.nspname = 'public' and procedure.proname in ('reserve_document_number', 'reserve_manual_document_number', 'void_reserved_document_number') and procedure.prosecdef $$,
  $$ values (3::bigint) $$,
  'all mutation functions should be security definer functions with explicit authorization'
);
select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' and tablename = 'document_number_log' and coalesce(qual, '') like '%is_mfa_requirement_satisfied%' $$,
  $$ values (1::bigint) $$,
  'document number read policy should enforce MFA'
);
select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' and tablename = 'document_number_log' and coalesce(qual, '') like '%credential_manager%' $$,
  $$ values (1::bigint) $$,
  'Credential Manager should read the log after MFA'
);
select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' and tablename = 'document_number_log' and coalesce(qual, '') like '%content_manager%' $$,
  $$ values (0::bigint) $$,
  'Content Manager must not appear in document number policies'
);

select * from finish();

rollback;
