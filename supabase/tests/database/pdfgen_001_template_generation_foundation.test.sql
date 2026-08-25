begin;

select plan(65);

select results_eq(
  $$ select enumlabel::text from pg_enum where enumtypid = 'public.credential_template_version_status'::regtype order by enumsortorder $$,
  $$ values ('draft'::text), ('published'::text), ('retired'::text) $$,
  'template versions should use the approved draft/published/retired lifecycle'
);
select results_eq(
  $$ select enumlabel::text from pg_enum where enumtypid = 'public.credential_template_field_key'::regtype order by enumsortorder $$,
  $$ values ('holder_name'::text), ('programme_title'::text), ('credential_type'::text), ('document_number'::text), ('issue_date'::text), ('completion_date'::text), ('programme_run_label'::text), ('verification_qr'::text), ('verification_url'::text), ('static_text'::text) $$,
  'placement fields should be a closed allow-list'
);
select results_eq(
  $$ select enumlabel::text from pg_enum where enumtypid = 'public.credential_template_text_alignment'::regtype order by enumsortorder $$,
  $$ values ('left'::text), ('center'::text), ('right'::text) $$,
  'text alignment should be constrained'
);
select results_eq(
  $$ select enumlabel::text from pg_enum where enumtypid = 'public.credential_template_fit_mode'::regtype order by enumsortorder $$,
  $$ values ('single_line'::text), ('wrap'::text), ('shrink_to_fit'::text), ('fixed'::text) $$,
  'fit behavior should be constrained'
);
select results_eq(
  $$ select enumlabel::text from pg_enum where enumtypid = 'public.credential_generation_batch_status'::regtype order by enumsortorder $$,
  $$ values ('draft'::text), ('confirmed'::text), ('processing'::text), ('review'::text), ('activating'::text), ('completed'::text), ('failed'::text) $$,
  'batch lifecycle should support confirmation, resumable work, review, activation, and terminal outcomes'
);
select results_eq(
  $$ select enumlabel::text from pg_enum where enumtypid = 'public.credential_generation_item_status'::regtype order by enumsortorder $$,
  $$ values ('queued'::text), ('processing'::text), ('generated'::text), ('retryable'::text), ('conflict'::text), ('reviewed'::text), ('activating'::text), ('activated'::text), ('failed'::text) $$,
  'batch items should expose resumable and review-safe outcomes'
);

select has_table('public', 'credential_template_packages', 'template package table should exist');
select has_table('public', 'credential_template_versions', 'template version table should exist');
select has_table('public', 'credential_template_documents', 'template document table should exist');
select has_table('public', 'credential_template_document_pages', 'per-page metadata table should exist');
select has_table('public', 'credential_template_field_placements', 'field placement table should exist');
select has_table('public', 'credential_generation_batches', 'generation batch table should exist');
select has_table('public', 'credential_generation_batch_items', 'generation batch item table should exist');
select has_table('public', 'credential_file_generations', 'generated-file provenance table should exist');

select col_is_pk('public', 'credential_template_packages', 'id', 'template packages should have a UUID primary key');
select col_is_pk('public', 'credential_template_versions', 'id', 'template versions should have a UUID primary key');
select col_is_pk('public', 'credential_template_documents', 'id', 'template documents should have a UUID primary key');
select col_is_pk('public', 'credential_template_field_placements', 'id', 'placements should have a UUID primary key');
select col_is_pk('public', 'credential_generation_batches', 'id', 'generation batches should have a UUID primary key');
select col_is_pk('public', 'credential_generation_batch_items', 'id', 'generation items should have a UUID primary key');
select col_is_pk('public', 'credential_file_generations', 'id', 'file provenance should have a UUID primary key');

select has_column('public', 'credential_template_packages', 'programme_run_id', 'template context should support an optional programme run');
select has_column('public', 'credential_template_packages', 'variant_code', 'template context should include an explicit variant');
select has_column('public', 'credential_template_documents', 'is_primary', 'template documents should identify one primary output');
select has_column('public', 'credential_template_documents', 'page_count', 'template documents should record multi-page size');
select has_column('public', 'credential_template_field_placements', 'min_font_size_points', 'placements should record safe shrink-to-fit limits');
select has_column('public', 'credential_generation_batches', 'processing_chunk_size', 'batches should keep an internal bounded chunk size');
select has_column('public', 'credential_generation_batch_items', 'lease_token', 'batch items should support resumable worker leases');
select has_column('public', 'credential_generation_batch_items', 'idempotency_key', 'batch items should have stable idempotency keys');
select has_column('public', 'credential_file_generations', 'input_sha256', 'provenance should record input hashes');
select has_column('public', 'credential_file_generations', 'output_sha256', 'provenance should record output hashes');

select results_eq(
  $$ select indisunique and indpred is not null from pg_index where indexrelid = 'public.credential_template_documents_one_primary_idx'::regclass $$,
  $$ values (true) $$,
  'one partial unique primary-document index should exist per version'
);
select results_eq(
  $$ select indisunique and indpred is not null from pg_index where indexrelid = 'public.credential_template_versions_one_draft_idx'::regclass $$,
  $$ values (true) $$,
  'one partial unique draft-version index should exist per package'
);
select has_index('public', 'credential_generation_batch_items', 'credential_generation_batch_items_batch_status_position_idx', 'batch progress should be indexed');
select has_index('public', 'credential_generation_batch_items', 'credential_generation_batch_items_retry_lease_idx', 'retry and expired-lease work should be indexed');

select has_trigger('public', 'credential_template_packages', 'credential_template_packages_enforce_identity', 'published package context and package identity should be protected');
select has_trigger('public', 'credential_template_versions', 'credential_template_versions_enforce_lifecycle', 'template version lifecycle should be protected');
select has_trigger('public', 'credential_template_documents', 'credential_template_documents_require_draft', 'document changes should require a draft version');
select has_trigger('public', 'credential_template_document_pages', 'credential_template_document_pages_require_draft', 'page changes should require a draft version');
select has_trigger('public', 'credential_template_field_placements', 'credential_template_field_placements_require_draft', 'placement changes should require a draft version');
select has_trigger('public', 'credential_template_field_placements', 'credential_template_field_placements_validate_bounds', 'placements should remain inside page bounds');
select has_trigger('public', 'credential_generation_batches', 'credential_generation_batches_validate_context', 'batches should match a published template context');
select has_trigger('public', 'credential_generation_batches', 'credential_generation_batches_enforce_identity', 'batch issuing context should be immutable');
select has_trigger('public', 'credential_generation_batch_items', 'credential_generation_batch_items_enforce_identity', 'batch item identity and activated rows should be immutable');
select has_trigger('public', 'credential_file_generations', 'credential_file_generations_validate_context', 'file provenance should match document, version, credential, and batch context');
select has_trigger('public', 'credential_file_generations', 'credential_file_generations_prevent_mutation', 'file provenance should be append-only');
select has_trigger('public', 'credential_file_generations', 'credential_file_generations_prevent_truncate', 'file provenance truncation should be blocked');

select has_function('public', 'create_credential_template_package', array['uuid', 'uuid', 'uuid', 'text', 'text', 'text'], 'controlled template package creation should exist');
select has_function('public', 'create_credential_template_version', array['uuid'], 'controlled draft version creation should exist');
select has_function('public', 'publish_credential_template_version', array['uuid'], 'controlled template publication should exist');
select has_function('public', 'retire_credential_template_version', array['uuid'], 'controlled template retirement should exist');
select has_function('internal', 'can_manage_credential_templates', array[]::text[], 'template mutation authorization helper should exist');
select has_function('internal', 'can_read_credential_template_package', array['uuid'], 'package visibility helper should exist');
select has_function('internal', 'can_read_credential_template_version', array['uuid'], 'version visibility helper should exist');

select results_eq(
  $$ select count(*)::bigint from pg_class where oid in (
    'public.credential_template_packages'::regclass,
    'public.credential_template_versions'::regclass,
    'public.credential_template_documents'::regclass,
    'public.credential_template_document_pages'::regclass,
    'public.credential_template_field_placements'::regclass,
    'public.credential_generation_batches'::regclass,
    'public.credential_generation_batch_items'::regclass,
    'public.credential_file_generations'::regclass
  ) and relrowsecurity and relforcerowsecurity $$,
  $$ values (8::bigint) $$,
  'all PDF generation tables should enable and force RLS'
);
select policies_are('public', 'credential_template_versions', array['credential_template_versions_authorized_read'], 'template versions should expose only controlled private read');
select policies_are('public', 'credential_generation_batches', array['credential_generation_batches_authorized_read'], 'generation batches should expose only controlled private read');
select policies_are('public', 'credential_generation_batch_items', array['credential_generation_batch_items_authorized_read'], 'generation items should expose only controlled private read');
select policies_are('public', 'credential_file_generations', array['credential_file_generations_authorized_read'], 'file provenance should expose only controlled private read');

select results_eq(
  $$ select count(*)::bigint from unnest(array[
    'credential_template_packages', 'credential_template_versions', 'credential_template_documents',
    'credential_template_document_pages', 'credential_template_field_placements',
    'credential_generation_batches', 'credential_generation_batch_items', 'credential_file_generations'
  ]) table_name where has_table_privilege('anon', 'public.' || table_name, 'select') $$,
  $$ values (0::bigint) $$,
  'anonymous users should have no PDF generation table read privilege'
);
select results_eq(
  $$ select count(*)::bigint from unnest(array[
    'credential_template_packages', 'credential_template_versions', 'credential_template_documents',
    'credential_template_document_pages', 'credential_template_field_placements',
    'credential_generation_batches', 'credential_generation_batch_items', 'credential_file_generations'
  ]) table_name where has_table_privilege('authenticated', 'public.' || table_name, 'select') $$,
  $$ values (8::bigint) $$,
  'authenticated admins should receive private reads subject to RLS'
);
select results_eq(
  $$ select count(*)::bigint from unnest(array[
    'credential_template_versions', 'credential_generation_batches',
    'credential_generation_batch_items', 'credential_file_generations'
  ]) table_name, unnest(array['insert', 'update', 'delete']) privilege_name
  where has_table_privilege('authenticated', 'public.' || table_name, privilege_name) $$,
  $$ values (0::bigint) $$,
  'authenticated clients should have no direct version, batch, item, or provenance mutations'
);
select results_eq(
  $$ select count(*)::bigint from unnest(array[
    'credential_template_packages', 'credential_template_versions', 'credential_template_documents',
    'credential_template_document_pages', 'credential_template_field_placements',
    'credential_generation_batches', 'credential_generation_batch_items', 'credential_file_generations'
  ]) table_name, unnest(array['insert', 'update', 'delete']) privilege_name
  where has_table_privilege('service_role', 'public.' || table_name, privilege_name) $$,
  $$ values (0::bigint) $$,
  'service role should not receive direct foundation mutation grants'
);
select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' and tablename in (
    'credential_template_packages', 'credential_template_versions', 'credential_template_documents',
    'credential_template_document_pages', 'credential_template_field_placements',
    'credential_generation_batches', 'credential_generation_batch_items', 'credential_file_generations'
  ) and (coalesce(qual, '') || coalesce(with_check, '')) like '%content_manager%' $$,
  $$ values (0::bigint) $$,
  'Content Manager should have no template, batch, or generation access'
);
select results_eq(
  $$ select enumlabel::text from pg_enum where enumtypid = 'public.credential_status'::regtype order by enumsortorder $$,
  $$ values ('pending'::text), ('valid'::text), ('revoked'::text), ('voided'::text) $$,
  'PDF generation must not add credential lifecycle statuses'
);

select * from finish();

rollback;
