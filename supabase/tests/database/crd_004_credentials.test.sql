begin;

select plan(54);

select has_type('public', 'credential_status', 'credential status enum should exist');
select results_eq(
  $$ select enumlabel from pg_enum where enumtypid = 'public.credential_status'::regtype order by enumsortorder $$,
  $$ values ('pending'::name), ('valid'::name), ('revoked'::name), ('voided'::name) $$,
  'credential status should contain only the approved Release 1 lifecycle'
);

select has_table('public', 'credentials', 'credentials table should exist');
select col_is_pk('public', 'credentials', 'id', 'credential ID should be the primary key');
select has_column('public', 'credentials', 'credential_set_id', 'credential set reference should exist');
select has_column('public', 'credentials', 'learner_id', 'learner reference should exist');
select has_column('public', 'credentials', 'programme_id', 'programme reference should exist');
select has_column('public', 'credentials', 'programme_run_id', 'optional programme run should exist');
select has_column('public', 'credentials', 'credential_type_id', 'credential type reference should exist');
select has_column('public', 'credentials', 'language_code', 'document language should exist');
select has_column('public', 'credentials', 'status', 'credential lifecycle status should exist');
select has_column('public', 'credentials', 'issue_date', 'issue date should exist');
select has_column('public', 'credentials', 'document_number', 'document number should exist');
select has_column('public', 'credentials', 'verification_token_lookup_hash', 'HMAC lookup should exist');
select has_column('public', 'credentials', 'verification_token_encrypted', 'encrypted token material should exist');
select has_column('public', 'credentials', 'token_encryption_key_version', 'token encryption key version should exist');
select has_column('public', 'credentials', 'public_holder_name', 'current public holder name should exist');
select has_column('public', 'credentials', 'public_programme_title', 'current public programme title should exist');
select has_column('public', 'credentials', 'public_credential_type', 'current public document type should exist');
select results_eq(
  $$ select column_default from information_schema.columns where table_schema = 'public' and table_name = 'credentials' and column_name = 'status' $$,
  $$ values ('''pending''::credential_status'::text) $$,
  'new credentials should default to pending'
);

select results_eq(
  $$ select count(*)::bigint from pg_constraint where conrelid = 'public.credentials'::regclass and contype = 'f' $$,
  $$ values (9::bigint) $$,
  'credential references and programme-run context should use foreign keys'
);
select results_eq(
  $$ select count(*)::bigint from pg_constraint where conrelid = 'public.credentials'::regclass and contype = 'u' $$,
  $$ values (2::bigint) $$,
  'document number and token lookup hash should be unique'
);
select results_eq(
  $$ select count(*)::bigint from pg_constraint where conrelid = 'public.credentials'::regclass and contype = 'c' and conname in ('credentials_token_lookup_hash_format', 'credentials_encrypted_token_not_blank', 'credentials_token_key_version_positive', 'credentials_public_holder_name_not_blank', 'credentials_public_programme_title_not_blank', 'credentials_public_credential_type_not_blank', 'credentials_revocation_time_order', 'credentials_lifecycle_consistency') $$,
  $$ values (8::bigint) $$,
  'token, public-field, timestamp, and lifecycle constraints should exist'
);

select has_index('public', 'credentials', 'credentials_learner_status_created_idx', 'learner credential listing should be indexed');
select has_index('public', 'credentials', 'credentials_set_created_idx', 'credential set listing should be indexed');
select has_index('public', 'credentials', 'credentials_programme_status_idx', 'programme credential listing should be indexed');
select has_index('public', 'credentials', 'credentials_status_updated_idx', 'credential work queue should be indexed');

select has_trigger('public', 'credentials', 'credentials_set_updated_at', 'credentials should maintain updated_at');
select has_trigger('public', 'credentials', 'credentials_validate_context', 'set/type/year context should be validated');
select has_trigger('public', 'credentials', 'credentials_enforce_lifecycle', 'identity and lifecycle should be protected');
select has_trigger('public', 'credentials', 'credentials_audit_change', 'creation and set moves should be audited');
select has_trigger('public', 'credentials', 'credentials_validate_number_link', 'credential-to-number integrity should be deferred');
select has_trigger('public', 'document_number_log', 'document_number_log_validate_credential_link', 'number-to-credential integrity should be deferred');
select has_function('public', 'move_credential_to_set', array['uuid', 'uuid'], 'controlled credential set move function should exist');

select results_eq(
  $$ select count(*)::bigint from pg_constraint where conrelid = 'public.document_number_log'::regclass and contype = 'f' and conname = 'document_number_log_credential_id_fk' $$,
  $$ values (1::bigint) $$,
  'document number credential slot should now reference credentials'
);
select results_eq(
  $$ select indisunique from pg_index where indexrelid = 'public.document_number_log_credential_id_idx'::regclass $$,
  $$ values (true) $$,
  'one credential should link to only one document number log row'
);

select is((select relrowsecurity from pg_class where oid = 'public.credentials'::regclass), true, 'credentials should enable RLS');
select is((select relforcerowsecurity from pg_class where oid = 'public.credentials'::regclass), true, 'credentials should force RLS');
select policies_are('public', 'credentials', array['credentials_authorized_read'], 'credentials should expose only the private authorized read policy');

select results_eq($$ select has_table_privilege('anon', 'public.credentials', 'select') $$, $$ values (false) $$, 'anonymous clients must not read credentials directly');
select results_eq($$ select has_table_privilege('authenticated', 'public.credentials', 'select') $$, $$ values (true) $$, 'authenticated credential admins receive select subject to RLS');
select results_eq($$ select has_table_privilege('authenticated', 'public.credentials', 'insert') $$, $$ values (false) $$, 'authenticated users cannot create credentials outside controlled workflow');
select results_eq($$ select has_table_privilege('authenticated', 'public.credentials', 'update') $$, $$ values (false) $$, 'authenticated users cannot mutate credentials outside controlled workflow');
select results_eq($$ select has_table_privilege('authenticated', 'public.credentials', 'delete') $$, $$ values (false) $$, 'authenticated users cannot delete credentials');
select results_eq($$ select has_table_privilege('service_role', 'public.credentials', 'insert') $$, $$ values (false) $$, 'service role cannot bypass controlled credential creation with direct insert');
select results_eq($$ select has_function_privilege('anon', 'public.move_credential_to_set(uuid,uuid)', 'execute') $$, $$ values (false) $$, 'anonymous clients cannot move credentials between sets');
select results_eq($$ select has_function_privilege('authenticated', 'public.move_credential_to_set(uuid,uuid)', 'execute') $$, $$ values (true) $$, 'authenticated credential admins can invoke controlled set move subject to role and MFA');

select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' and tablename = 'credentials' and coalesce(qual, '') like '%is_mfa_requirement_satisfied%' $$,
  $$ values (1::bigint) $$,
  'credential read policy should enforce MFA'
);
select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' and tablename = 'credentials' and coalesce(qual, '') like '%credential_manager%' $$,
  $$ values (1::bigint) $$,
  'Credential Manager should read credentials after MFA'
);
select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' and tablename = 'credentials' and coalesce(qual, '') like '%content_manager%' $$,
  $$ values (0::bigint) $$,
  'Content Manager must not appear in credential policies'
);

select hasnt_column('public', 'credentials', 'partner_id', 'partners must not be stored on credentials');
select hasnt_column('public', 'credentials', 'raw_verification_token', 'raw verification token must never be stored');
select hasnt_column('public', 'credentials', 'expires_at', 'Release 1 credentials must not expire');
select hasnt_column('public', 'credentials', 'reissued_at', 'Release 1 has no reissued lifecycle');

select * from finish();

rollback;
