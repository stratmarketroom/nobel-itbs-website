import { existsSync, readFileSync } from 'node:fs';

const requiredPaths = [
  'supabase/migrations/20260826140000_pdfgen_007_batch_activation_delivery.sql',
  'supabase/tests/database/pdfgen_007_batch_activation_delivery.test.sql',
  'lib/credentials/activation.ts',
  'lib/credentials/batch-generation.ts',
  'lib/credentials/batch-generation-input.ts',
  'lib/credentials/batch-generation-types.ts',
  'app/api/v1/admin/credential-generation-batches/[id]/activate/route.ts',
  'app/api/v1/admin/credential-generation-batches/[id]/activation-requests/[activationRequestId]/process/route.ts',
  'app/api/v1/admin/credential-generation-batches/[id]/activation-items/[activationItemId]/retry/route.ts',
  'components/admin-credential-batches.tsx',
  'docs/qa/PDFGEN_007_BATCH_ACTIVATION_VEDOS_DELIVERY_2026-08-26.md',
];
const errors = [];
for (const path of requiredPaths) if (!existsSync(path)) errors.push(`Missing ${path}`);

const migration = existsSync(requiredPaths[0]) ? readFileSync(requiredPaths[0], 'utf8') : '';
for (const part of [
  'credential_generation_batch_activation_requests',
  'credential_generation_batch_activation_items',
  'prepare_credential_generation_batch_activation',
  'claim_credential_generation_batch_activation_item',
  'bind_credential_generation_batch_activation_email_send',
  'complete_credential_generation_batch_activation_item',
  'fail_credential_generation_batch_activation_item',
  'complete_credential_generation_batch_email_send',
  'requeue_credential_generation_batch_activation_item',
  'internal.assert_batch_generation_actor',
  "array['owner', 'super_admin', 'credential_manager']",
  'force row level security',
  'activation idempotency key is already bound to another exact selection',
  "item.status <> 'reviewed'",
  "credential.status = 'pending'",
  "credential.status <> 'valid'",
  "when v_send.status = 'sent'",
  "when v_send.status = 'pending'",
  "'credential_generation.batch_activation_requested'",
  "'credential_generation.batch_item_activated'",
  "'credential_generation.batch_item_activation_failed'",
]) if (!migration.includes(part)) errors.push(`PDFGEN-007 migration missing ${part}`);
if (/\b500\b/u.test(migration)) errors.push('Batch activation must not contain a fixed 500-learner cap.');
if (/create\s+policy[\s\S]*private-credentials/iu.test(migration)) errors.push('PDFGEN-007 must not add browser Storage access.');
if (/delete\s+from\s+public\.(?:credential|credential_generation)/iu.test(migration)) errors.push('PDFGEN-007 must not hard-delete credential or batch records.');

const server = existsSync(requiredPaths[3]) ? readFileSync(requiredPaths[3], 'utf8') : '';
for (const part of [
  'activateCredentialGenerationBatchChunk',
  'retryCredentialGenerationBatchActivationItem',
  'resumeCredentialGenerationBatchActivationRequest',
  'processing_chunk_size',
  "Math.min(250",
  'activateCredential(',
  'deliverCredentialEmailSend(',
  'bind_credential_generation_batch_activation_email_send',
  'complete_credential_generation_batch_activation_item',
  'fail_credential_generation_batch_activation_item',
]) if (!server.includes(part)) errors.push(`Batch activation server workflow missing ${part}`);
if (/console\.(?:log|error|warn)|rawToken|verification_token|storage_path|pdf_bytes/u.test(server)) {
  errors.push('Batch activation server workflow must not log or return token/path/PDF material.');
}

const activation = existsSync(requiredPaths[2]) ? readFileSync(requiredPaths[2], 'utf8') : '';
for (const part of ['currentFiles(', "storage.from('private-credentials')", 'Promise.all(files.map', 'sendCredentialSmtpMessage', 'batchActivation.leaseToken']) {
  if (!activation.includes(part)) errors.push(`Credential delivery bridge missing ${part}`);
}

const ui = existsSync(requiredPaths[9]) ? readFileSync(requiredPaths[9], 'utf8') : '';
for (const part of [
  'Select reviewed item for activation',
  'Select all eligible',
  'Activate selected',
  'Each credential becomes valid independently',
  'VEDOS failure will not roll back activation',
  'activatedSentCount',
  'activatedNotSentCount',
  'failedCount',
  'Retry activation/delivery',
  'Resume recorded activation',
]) if (!ui.includes(part)) errors.push(`Batch activation UI missing ${part}`);

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (pkg.scripts?.['verify:pdfgen-007'] !== 'node scripts/verify-pdfgen-007.mjs') {
  errors.push('Missing PDFGEN-007 verifier script.');
}

if (errors.length) {
  console.error('PDFGEN-007 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('PDFGEN-007 static verification passed.');
