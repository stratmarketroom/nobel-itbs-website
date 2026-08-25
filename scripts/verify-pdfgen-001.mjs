import { existsSync, readFileSync } from 'node:fs';

const migrationPath = 'supabase/migrations/20260825090000_pdfgen_001_template_generation_foundation.sql';
const triggerFixPath = 'supabase/migrations/20260825100000_pdfgen_001_template_content_trigger_fix.sql';
const testPath = 'supabase/tests/database/pdfgen_001_template_generation_foundation.test.sql';
const specificationPath = 'docs/product/CREDENTIAL_DOCUMENT_GENERATION_SPECIFICATION_v2.md';
const errors = [];

for (const path of [migrationPath, triggerFixPath, testPath, specificationPath]) {
  if (!existsSync(path)) errors.push(`Missing required path: ${path}`);
}

if (existsSync(triggerFixPath)) {
  const sql = readFileSync(triggerFixPath, 'utf8');
  for (const snippet of [
    "tg_table_name = 'credential_template_documents'",
    "tg_table_name = 'credential_template_document_pages'",
    "tg_table_name = 'credential_template_field_placements'",
    'credential template document identity is immutable',
    'credential template page identity is immutable',
    'credential template placement identity is immutable',
    'published or retired credential template content is immutable',
  ]) {
    if (!sql.includes(snippet)) errors.push(`PDFGEN-001 trigger fix missing required behavior: ${snippet}`);
  }

  if (/tg_op\s*=\s*'UPDATE'\s+and\s+tg_table_name/i.test(sql)) {
    errors.push('PDFGEN-001 trigger fix must branch by table before dereferencing table-specific OLD/NEW fields.');
  }
}

if (existsSync(migrationPath)) {
  const sql = readFileSync(migrationPath, 'utf8');

  for (const snippet of [
    'create table public.credential_template_packages',
    'create table public.credential_template_versions',
    'create table public.credential_template_documents',
    'create table public.credential_template_document_pages',
    'create table public.credential_template_field_placements',
    'create table public.credential_generation_batches',
    'create table public.credential_generation_batch_items',
    'create table public.credential_file_generations',
    "'draft',\n  'published',\n  'retired'",
    'credential_template_documents_one_primary_idx',
    'credential_template_versions_one_draft_idx',
    'nulls not distinct',
    'page_count integer not null',
    'credential_template_field_placements_validate_bounds',
    'processing_chunk_size between 1 and 250',
    'idempotency_key uuid not null',
    'lease_expires_at timestamptz null',
    'credential_file_generations_prevent_truncate',
    'internal.assert_sensitive_action_allowed',
    "array['owner'::public.app_role, 'super_admin'::public.app_role]",
    "internal.has_role('credential_manager'::public.app_role)",
    'internal.is_mfa_requirement_satisfied()',
    'alter table public.credential_template_packages force row level security',
    'alter table public.credential_template_versions force row level security',
    'alter table public.credential_template_documents force row level security',
    'alter table public.credential_template_document_pages force row level security',
    'alter table public.credential_template_field_placements force row level security',
    'alter table public.credential_generation_batches force row level security',
    'alter table public.credential_generation_batch_items force row level security',
    'alter table public.credential_file_generations force row level security',
    'No storage bucket or storage.objects policy is created in PDFGEN-001',
    'No direct authenticated DML grant exists for versions, batches, items, or provenance',
  ]) {
    if (!sql.includes(snippet)) errors.push(`PDFGEN-001 migration missing required behavior: ${snippet}`);
  }

  for (const [pattern, message] of [
    [/\b500\b/, 'PDFGEN-001 must not add a 500-learner product cap.'],
    [/array\[[^\]]*'content_manager'[^\]]*\]/i, 'Content Manager must not receive template or generation access.'],
    [/insert\s+into\s+storage\.buckets/i, 'PDFGEN-001 must not create the PDFGEN-002 template bucket.'],
    [/create\s+policy[^;]*on\s+storage\.objects/i, 'PDFGEN-001 must not create PDFGEN-002 Storage policies.'],
    [/alter\s+type\s+public\.credential_status/i, 'PDFGEN-001 must not change credential lifecycle statuses.'],
    [/grant\s+(?:insert|update|delete)[^;]*(?:credential_template_versions|credential_generation_batches|credential_generation_batch_items|credential_file_generations)[^;]*to\s+(?:authenticated|service_role)/i, 'Sensitive state must not receive direct authenticated/service-role mutations.'],
    [/p_metadata\s*=>[^;]*(?:source_storage_path|storage_path|static_text|input_sha256|output_sha256|learner_id|last_error_code)/i, 'Audit metadata must not contain private paths, content, learner identity, errors, or generation hashes.'],
    [/create\s+(?:or\s+replace\s+)?function\s+public\.(?:generate|render|create_credential_generation_batch|process_credential_generation_batch)/i, 'PDFGEN-001 must not implement later rendering or batch workflows.'],
  ]) {
    if (pattern.test(sql)) errors.push(message);
  }
}

if (existsSync(testPath)) {
  const test = readFileSync(testPath, 'utf8').toLowerCase();
  for (const snippet of [
    'select plan(65);',
    'credential_template_packages',
    'credential_template_document_pages',
    'credential_generation_batch_items',
    'credential_file_generations_prevent_truncate',
    'all pdf generation tables should enable and force rls',
    'content manager should have no template, batch, or generation access',
    'service role should not receive direct foundation mutation grants',
    'pdf generation must not add credential lifecycle statuses',
    'select * from finish();',
  ]) {
    if (!test.includes(snippet)) errors.push(`PDFGEN-001 database test missing required coverage: ${snippet}`);
  }
}

if (existsSync(specificationPath)) {
  const specification = readFileSync(specificationPath, 'utf8');
  for (const snippet of [
    'PDFGEN-001 Template and generation database foundation',
    'credential_template_packages',
    'credential_template_versions',
    'credential_template_documents',
    'credential_template_field_placements',
    'credential_generation_batches',
    'credential_generation_batch_items',
    'credential_file_generations',
    'no fixed 500-learner cap',
    '200, 540, 1000',
  ]) {
    if (!specification.includes(snippet)) errors.push(`Generation specification missing approved contract: ${snippet}`);
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:pdfgen-001'] !== 'node scripts/verify-pdfgen-001.mjs') {
    errors.push('package.json must expose verify:pdfgen-001.');
  }
}

if (errors.length) {
  console.error('PDFGEN-001 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('PDFGEN-001 verification passed.');
