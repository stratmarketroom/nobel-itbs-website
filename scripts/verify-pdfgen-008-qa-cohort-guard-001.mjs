import { existsSync, readFileSync } from 'node:fs';

const requiredPaths = [
  'supabase/migrations/20260829120000_pdfgen_008_qa_cohort_activation_guard.sql',
  'supabase/tests/database/pdfgen_008_qa_cohort_activation_guard.test.sql',
  'lib/credentials/batch-generation.ts',
  'lib/credentials/batch-generation-types.ts',
  'components/admin-credential-batches.tsx',
  'docs/qa/PDFGEN_008_QA_COHORT_ACTIVATION_GUARD_2026-08-29.md',
];

const errors = [];
for (const path of requiredPaths) if (!existsSync(path)) errors.push(`Missing ${path}`);

const migration = existsSync(requiredPaths[0]) ? readFileSync(requiredPaths[0], 'utf8') : '';
for (const part of [
  'activation_blocked boolean not null default false',
  'activation_block_reason text null',
  'credential_generation_batches_activation_block_consistency',
  'internal.mark_synthetic_qa_generation_batch',
  'internal.block_synthetic_qa_activation_or_delivery',
  'PDFGEN-008 synthetic Development-only cohort A',
  'PDFGEN-008 synthetic Development-only cohort B',
  'PDFGEN-008 synthetic Development-only cohort C',
  'credential_generation_batch_items_mark_synthetic_qa',
  'credential_generation_batch_activation_requests_block_synthetic_qa',
  'credential_generation_batch_activation_items_block_synthetic_qa',
  'credentials_block_synthetic_qa_activation',
  'credential_email_sends_block_synthetic_qa_delivery',
  'credential generation batch activation block is permanent',
  'credential_generation.batch_activation_blocked',
  'synthetic QA batch activation and email delivery are permanently blocked',
]) if (!migration.includes(part)) errors.push(`QA cohort migration missing ${part}`);

if (!/update\s+public\.credential_generation_batches[\s\S]*activation_blocked\s*=\s*true[\s\S]*join\s+public\.learners/iu.test(migration)) {
  errors.push('Existing PDFGEN-008 batches are not backfilled into the activation-blocked state.');
}
if (!/before\s+insert\s+on\s+public\.credential_generation_batch_activation_requests/iu.test(migration)) {
  errors.push('Activation requests are not guarded before insertion.');
}
if (!/before\s+update\s+of\s+status\s+on\s+public\.credential_generation_batch_activation_items/iu.test(migration)) {
  errors.push('Activation claims are not guarded before processing.');
}
if (!/before\s+update\s+of\s+status\s+on\s+public\.credentials/iu.test(migration)) {
  errors.push('Credential pending-to-valid transitions are not independently guarded.');
}
if (!/before\s+insert\s+on\s+public\.credential_email_sends/iu.test(migration)) {
  errors.push('Credential email ledger insertion is not independently guarded.');
}
if (/delete\s+from\s+public\./iu.test(migration)) {
  errors.push('The QA cohort guard must not delete operational data.');
}

const server = existsSync(requiredPaths[2]) ? readFileSync(requiredPaths[2], 'utf8') : '';
for (const part of [
  'activation_blocked: boolean',
  'activation_block_reason:',
  'activation_blocked, activation_block_reason',
  'activationBlocked: batch.activation_blocked',
  'activationBlockReason: batch.activation_block_reason',
  'activationEligible: !batch.activation_blocked',
]) if (!server.includes(part)) errors.push(`Batch server mapping missing ${part}`);

const types = existsSync(requiredPaths[3]) ? readFileSync(requiredPaths[3], 'utf8') : '';
for (const part of [
  'activationBlocked: boolean',
  "activationBlockReason: 'synthetic_qa' | null",
]) if (!types.includes(part)) errors.push(`Batch API type missing ${part}`);

const ui = existsSync(requiredPaths[4]) ? readFileSync(requiredPaths[4], 'utf8') : '';
for (const part of [
  'Synthetic QA safety lock',
  'review is allowed',
  'activation and email delivery are permanently blocked',
  "if (batch.activationBlocked)",
  "item.activationBlocked ? ' \u00b7 QA locked'",
]) if (!ui.includes(part)) errors.push(`Batch QA safety UI missing ${part}`);

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (pkg.scripts?.['verify:pdfgen-008:qa-cohort-guard'] !== 'node scripts/verify-pdfgen-008-qa-cohort-guard-001.mjs') {
  errors.push('Missing QA cohort guard verifier package script.');
}

if (errors.length) {
  console.error('PDFGEN-008 QA cohort guard verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('PDFGEN-008 QA cohort activation guard static verification passed.');
