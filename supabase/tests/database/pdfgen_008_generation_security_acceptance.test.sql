begin;

select plan(23);

select results_eq(
  $$
    select count(*)::bigint
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname in (
        'credential_template_packages', 'credential_template_versions',
        'credential_template_documents', 'credential_template_document_pages',
        'credential_template_field_placements', 'credential_generation_batches',
        'credential_generation_batch_items', 'credential_file_generations',
        'credential_generation_batch_activation_requests',
        'credential_generation_batch_activation_items'
      )
      and c.relrowsecurity and c.relforcerowsecurity
  $$,
  $$ values (10::bigint) $$,
  'all template, generation, provenance, and activation tables should force RLS'
);

select results_eq(
  $$
    select count(*)::bigint
    from unnest(array[
      'credential_template_packages', 'credential_template_versions',
      'credential_template_documents', 'credential_template_document_pages',
      'credential_template_field_placements', 'credential_generation_batches',
      'credential_generation_batch_items', 'credential_file_generations',
      'credential_generation_batch_activation_requests',
      'credential_generation_batch_activation_items'
    ]) table_name
    where has_table_privilege('anon', 'public.' || table_name, 'select')
      or has_any_column_privilege('anon', 'public.' || table_name, 'select')
  $$,
  $$ values (0::bigint) $$,
  'anonymous users should have no template, generation, or activation reads'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'credential_template_packages', 'credential_template_versions',
        'credential_template_documents', 'credential_template_document_pages',
        'credential_template_field_placements', 'credential_generation_batches',
        'credential_generation_batch_items', 'credential_file_generations',
        'credential_generation_batch_activation_requests',
        'credential_generation_batch_activation_items'
      )
      and (coalesce(qual, '') || coalesce(with_check, '')) like '%content_manager%'
  $$,
  $$ values (0::bigint) $$,
  'Content Manager should have no template, generation, provenance, or activation policy'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'credential_template_packages', 'credential_template_versions',
        'credential_template_documents', 'credential_template_document_pages',
        'credential_template_field_placements', 'credential_generation_batches',
        'credential_generation_batch_items', 'credential_file_generations',
        'credential_generation_batch_activation_requests',
        'credential_generation_batch_activation_items'
      )
      and (coalesce(qual, '') || coalesce(with_check, '')) not similar to
        '%(can_manage_credential_templates|can_read_credential_template_package|can_read_credential_template_version|is_mfa_requirement_satisfied)%'
  $$,
  $$ values (0::bigint) $$,
  'every PDFGEN policy should enforce MFA directly or through a scoped helper'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'credential_generation_batch_activation_requests',
        'credential_generation_batch_activation_items'
      )
      and roles @> array['authenticated'::name]
      and qual like '%owner%'
      and qual like '%super_admin%'
      and qual like '%credential_manager%'
      and qual not like '%content_manager%'
      and qual like '%is_mfa_requirement_satisfied%'
  $$,
  $$ values (2::bigint) $$,
  'activation ledger reads should require an approved credential role and MFA'
);

select results_eq(
  $$
    select count(*)::bigint
    from unnest(array[
      'credential_template_versions', 'credential_generation_batches',
      'credential_generation_batch_items', 'credential_file_generations',
      'credential_generation_batch_activation_requests',
      'credential_generation_batch_activation_items'
    ]) table_name
    where has_table_privilege('authenticated', 'public.' || table_name, 'insert')
      or has_table_privilege('authenticated', 'public.' || table_name, 'update')
      or has_table_privilege('authenticated', 'public.' || table_name, 'delete')
  $$,
  $$ values (0::bigint) $$,
  'browser roles should have no direct controlled-state mutation grants'
);

select results_eq(
  $$
    select prosrc like '%owner%'
      and prosrc like '%super_admin%'
      and prosrc not like '%credential_manager%'
      and prosrc not like '%content_manager%'
      and prosrc like '%is_mfa_requirement_satisfied%'
    from pg_proc
    where oid = 'internal.can_manage_credential_templates()'::regprocedure
  $$,
  $$ values (true) $$,
  'template definition management should be Owner/Super Admin plus MFA only'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_proc
    where oid in (
      'internal.can_read_credential_template_package(uuid)'::regprocedure,
      'internal.can_read_credential_template_version(uuid)'::regprocedure
    )
      and prosrc like '%owner%'
      and prosrc like '%super_admin%'
      and prosrc like '%credential_manager%'
      and prosrc not like '%content_manager%'
      and prosrc like '%published%retired%'
      and prosrc like '%is_mfa_requirement_satisfied%'
  $$,
  $$ values (2::bigint) $$,
  'Credential Manager should read only published or retired template metadata after MFA'
);

select results_eq(
  $$
    select prosrc like '%owner%'
      and prosrc like '%super_admin%'
      and prosrc like '%credential_manager%'
      and prosrc not like '%content_manager%'
      and prosrc like '%assert_sensitive_action_allowed%'
    from pg_proc
    where oid = 'internal.assert_single_generation_actor()'::regprocedure
  $$,
  $$ values (true) $$,
  'single generation should use the approved credential-role MFA guard'
);

select results_eq(
  $$
    select prosrc like '%owner%'
      and prosrc like '%super_admin%'
      and prosrc like '%credential_manager%'
      and prosrc not like '%content_manager%'
      and prosrc like '%assert_sensitive_action_allowed%'
    from pg_proc
    where oid = 'internal.assert_batch_generation_actor()'::regprocedure
  $$,
  $$ values (true) $$,
  'batch generation, review, activation, retry, and delivery should share the approved MFA guard'
);

select results_eq(
  $$
    select count(distinct p.proname)::bigint
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'attach_credential_template_document',
        'begin_credential_generation_batch_item', 'begin_single_credential_generation',
        'bind_credential_generation_batch_activation_email_send',
        'claim_credential_generation_batch_activation_item',
        'complete_credential_generation_batch_activation_item',
        'complete_credential_generation_batch_email_send',
        'complete_credential_generation_batch_item', 'complete_single_credential_generation',
        'confirm_credential_generation_batch', 'create_credential_template_package',
        'create_credential_template_version', 'delete_credential_template_document',
        'fail_credential_generation_batch_activation_item',
        'fail_credential_generation_batch_item', 'fail_single_credential_generation',
        'prepare_credential_generation_batch_activation',
        'prepare_credential_generation_batch_item', 'preview_credential_generation_batch',
        'publish_credential_template_version', 'queue_credential_generation_batch_item',
        'record_credential_template_preview', 'refresh_credential_generation_batch_item',
        'refresh_single_credential_generation',
        'replace_credential_template_document_placements',
        'requeue_credential_generation_batch_activation_item',
        'retire_credential_template_version', 'review_credential_generation_batch_item',
        'update_credential_template_document', 'validate_credential_template_version'
      )
  $$,
  $$ values (30::bigint) $$,
  'the complete PDFGEN-001 through PDFGEN-007 public function inventory should exist'
);

select results_eq(
  $$
    select count(distinct p.proname)::bigint
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname like any (array[
        '%credential_template%', '%single_credential_generation%',
        '%credential_generation_batch%'
      ])
      and p.proname not in ('credential_template_validation_issues')
      and p.prosecdef
  $$,
  $$ values (30::bigint) $$,
  'all public PDFGEN functions should be security definer guarded workflows'
);

select results_eq(
  $$
    select count(distinct p.proname)::bigint
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname like any (array[
        '%credential_template%', '%single_credential_generation%',
        '%credential_generation_batch%'
      ])
      and p.proname not in ('credential_template_validation_issues')
      and exists (
        select 1 from unnest(coalesce(p.proconfig, array[]::text[])) setting
        where setting like 'search_path=%'
      )
  $$,
  $$ values (30::bigint) $$,
  'all public PDFGEN security-definer functions should pin search_path'
);

select results_eq(
  $$
    select count(distinct p.proname)::bigint
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname like any (array[
        '%credential_template%', '%single_credential_generation%',
        '%credential_generation_batch%'
      ])
      and p.proname not in ('credential_template_validation_issues')
      and has_function_privilege('anon', p.oid, 'execute')
  $$,
  $$ values (0::bigint) $$,
  'anonymous callers should execute no PDFGEN workflow function'
);

select results_eq(
  $$
    select count(distinct p.proname)::bigint
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname like any (array[
        '%credential_template%', '%single_credential_generation%',
        '%credential_generation_batch%'
      ])
      and p.proname not in ('credential_template_validation_issues')
      and has_function_privilege('authenticated', p.oid, 'execute')
  $$,
  $$ values (30::bigint) $$,
  'authenticated callers should reach all PDFGEN workflows only through their internal guards'
);

select results_eq(
  $$ select id::text, public from storage.buckets where id in ('credential-templates', 'private-credentials') order by id $$,
  $$ values ('credential-templates'::text, false), ('private-credentials'::text, false) $$,
  'template sources and generated credential files should remain in private buckets'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_policies
    where schemaname = 'storage' and tablename = 'objects'
      and (coalesce(qual, '') || coalesce(with_check, '')) similar to
        '%(credential-templates|private-credentials)%'
  $$,
  $$ values (0::bigint) $$,
  'browser JWTs should have no direct private template or generated-file Storage policy'
);

select results_eq(
  $$
    select count(*)::bigint
    from unnest(array['source_storage_bucket', 'source_storage_path', 'source_sha256']) column_name
    where has_column_privilege('authenticated', 'public.credential_template_documents', column_name, 'select')
  $$,
  $$ values (0::bigint) $$,
  'browser roles should not read template source paths or hashes'
);

select results_eq(
  $$
    select count(*)::bigint
    from information_schema.columns
    where table_schema in ('public', 'internal')
      and table_name in (
        'credential_single_generation_locks', 'credential_generation_batches',
        'credential_generation_batch_items', 'credential_file_generations',
        'credential_generation_batch_activation_requests',
        'credential_generation_batch_activation_items'
      )
      and column_name in (
        'raw_token', 'verification_token_encrypted', 'verification_token_lookup_hash',
        'storage_path', 'pdf_bytes', 'learner_email', 'recipient_email', 'email_body', 'email_subject'
      )
  $$,
  $$ values (0::bigint) $$,
  'generation state should store no raw token, private path, PDF byte, or contact content'
);

select results_eq(
  $$
    select count(*)::bigint
    from information_schema.columns
    where table_schema = 'public'
      and table_name in (
        'credential_generation_batch_activation_requests',
        'credential_generation_batch_activation_items'
      )
      and column_name in ('recipient_email', 'subject', 'body', 'files', 'technical_error')
  $$,
  $$ values (0::bigint) $$,
  'activation ledgers should contain outcomes and identifiers without delivery content'
);

select results_eq(
  $$
    select enumlabel::text collate "default"
    from pg_enum
    where enumtypid = 'public.credential_status'::regtype
    order by enumsortorder
  $$,
  $$ values ('pending'), ('valid'), ('revoked'), ('voided') $$,
  'PDF generation should not expand the credential lifecycle'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname like '%credential_generation_batch%'
      and p.prosrc ilike '%delete from public.%'
  $$,
  $$ values (0::bigint) $$,
  'batch generation and activation should never hard-delete operational records'
);

select results_eq(
  $$
    select count(*)::bigint
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'credential_file_generations'
      and column_name in (
        'source_storage_path', 'generated_storage_path', 'pdf_bytes',
        'verification_token', 'recipient_email', 'learner_email'
      )
  $$,
  $$ values (0::bigint) $$,
  'generated-file provenance should exclude private paths, bytes, tokens, and contact data'
);

select * from finish();

rollback;
