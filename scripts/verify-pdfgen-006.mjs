import { existsSync, readFileSync } from 'node:fs';

const requiredPaths = [
  'supabase/migrations/20260826120000_pdfgen_006_batch_generation.sql',
  'supabase/migrations/20260826123000_pdfgen_006_batch_confirm_enum_fix.sql',
  'supabase/tests/database/pdfgen_006_batch_generation.test.sql',
  'lib/credentials/batch-generation.ts',
  'lib/credentials/batch-generation-types.ts',
  'lib/credentials/batch-generation-input.ts',
  'app/api/v1/admin/credential-generation-batches/route.ts',
  'app/api/v1/admin/credential-generation-batches/preview/route.ts',
  'app/api/v1/admin/credential-generation-batches/confirm/route.ts',
  'app/api/v1/admin/credential-generation-batches/[id]/process/route.ts',
  'components/admin-credential-batches.tsx',
  'docs/qa/PDFGEN_006_BATCH_GENERATION_REVIEW_2026-08-26.md',
];
const errors = [];
for (const path of requiredPaths) if (!existsSync(path)) errors.push(`Missing ${path}`);

const migration = existsSync(requiredPaths[0]) ? readFileSync(requiredPaths[0], 'utf8') : '';
const confirmFix = existsSync(requiredPaths[1]) ? readFileSync(requiredPaths[1], 'utf8') : '';
for (const part of [
  'preview_credential_generation_batch',
  'confirm_credential_generation_batch',
  'begin_credential_generation_batch_item',
  'prepare_credential_generation_batch_item',
  'refresh_credential_generation_batch_item',
  'complete_credential_generation_batch_item',
  'fail_credential_generation_batch_item',
  'queue_credential_generation_batch_item',
  'review_credential_generation_batch_item',
  'internal.assert_batch_generation_actor',
  "array['owner', 'super_admin', 'credential_manager']",
  'existing_non_voided_credential',
  'create_pending_credential',
  "status = 'retryable'",
  'generation_batch_item_id',
  'exactly one primary PDF',
  'to authenticated, service_role',
]) if (!migration.includes(part)) errors.push(`PDFGEN-006 migration missing ${part}`);
if (/\b500\b/u.test(migration)) errors.push('Batch workflow must not contain a fixed 500-learner cap.');
if (/create\s+policy[\s\S]*private-credentials/iu.test(migration)) errors.push('PDFGEN-006 must not add browser Storage access.');
if (/status\s*=\s*'valid'/u.test(migration)) errors.push('PDFGEN-006 must not activate credentials.');
for (const part of [
  'create or replace function public.confirm_credential_generation_batch',
  "'queued'::public.credential_generation_item_status",
  "'conflict'::public.credential_generation_item_status",
  'set search_path = public, internal, pg_temp',
]) if (!confirmFix.includes(part)) errors.push(`PDFGEN-006 confirm correction missing ${part}`);

const server = existsSync(requiredPaths[3]) ? readFileSync(requiredPaths[3], 'utf8') : '';
for (const part of [
  'assertCanManageCredentials',
  'preview_credential_generation_batch',
  'confirm_credential_generation_batch',
  'generateCredentialBatchItem',
  "eq('status', 'queued')",
  'processing_chunk_size',
  'queue_credential_generation_batch_item',
  'review_credential_generation_batch_item',
]) if (!server.includes(part)) errors.push(`Batch server workflow missing ${part}`);
if (/console\.(?:log|error|warn)|rawToken|signedUrl/u.test(server)) errors.push('Batch server workflow must not log or return token/path material.');

const generation = readFileSync('lib/credentials/generation.ts', 'utf8');
for (const part of ['generateCredentialBatchItem', 'createCredentialTokenRpcMaterial', 'prepare_credential_generation_batch_item', 'rollbackObjects', 'fail_credential_generation_batch_item']) {
  if (!generation.includes(part)) errors.push(`Server-only batch renderer bridge missing ${part}`);
}

const ui = existsSync(requiredPaths[10]) ? readFileSync(requiredPaths[10], 'utf8') : '';
for (const part of ['No cohort-size cap', 'Preview conflicts', 'Confirm batch', 'Generate remaining', 'Retry this item', 'Private preview', 'Mark package reviewed', 'PDFGEN-007']) {
  if (!ui.includes(part)) errors.push(`Batch review UI missing ${part}`);
}
if (ui.includes('Activate credential')) errors.push('PDFGEN-006 batch UI must not provide activation.');

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (pkg.scripts?.['verify:pdfgen-006'] !== 'node scripts/verify-pdfgen-006.mjs') errors.push('Missing PDFGEN-006 verifier script.');

if (errors.length) {
  console.error('PDFGEN-006 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('PDFGEN-006 static verification passed.');
