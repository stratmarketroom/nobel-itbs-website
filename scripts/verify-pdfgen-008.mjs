import { existsSync, readFileSync, readdirSync } from 'node:fs';

const requiredPaths = [
  'supabase/tests/database/pdfgen_008_generation_security_acceptance.test.sql',
  'supabase/tests/database/qa_001_rls_matrix.test.sql',
  'supabase/tests/database/qa_003_mfa_matrix.test.sql',
  'scripts/test-pdfgen-002-validation.mjs',
  'scripts/test-pdfgen-004-generation.mjs',
  'scripts/test-pdfgen-008-cohort-pagination.mjs',
  'docs/qa/PDFGEN_008_GENERATION_SECURITY_ACCEPTANCE_2026-08-27.md',
];
const errors = [];
for (const path of requiredPaths) if (!existsSync(path)) errors.push(`Missing ${path}`);

const migrationSource = readdirSync('supabase/migrations')
  .filter((name) => /pdfgen_00[1-7].*\.sql$/u.test(name))
  .sort()
  .map((name) => readFileSync(`supabase/migrations/${name}`, 'utf8'))
  .join('\n');

const expectedFunctions = [
  'attach_credential_template_document',
  'begin_credential_generation_batch_item',
  'begin_single_credential_generation',
  'bind_credential_generation_batch_activation_email_send',
  'claim_credential_generation_batch_activation_item',
  'complete_credential_generation_batch_activation_item',
  'complete_credential_generation_batch_email_send',
  'complete_credential_generation_batch_item',
  'complete_single_credential_generation',
  'confirm_credential_generation_batch',
  'create_credential_template_package',
  'create_credential_template_version',
  'delete_credential_template_document',
  'fail_credential_generation_batch_activation_item',
  'fail_credential_generation_batch_item',
  'fail_single_credential_generation',
  'prepare_credential_generation_batch_activation',
  'prepare_credential_generation_batch_item',
  'preview_credential_generation_batch',
  'publish_credential_template_version',
  'queue_credential_generation_batch_item',
  'record_credential_template_preview',
  'refresh_credential_generation_batch_item',
  'refresh_single_credential_generation',
  'replace_credential_template_document_placements',
  'requeue_credential_generation_batch_activation_item',
  'retire_credential_template_version',
  'review_credential_generation_batch_item',
  'update_credential_template_document',
  'validate_credential_template_version',
].sort();

const actualFunctions = [...new Set(
  [...migrationSource.matchAll(/^create or replace function public\.([a-z0-9_]+)/gimu)].map((match) => match[1]),
)].sort();
if (JSON.stringify(actualFunctions) !== JSON.stringify(expectedFunctions)) {
  errors.push(`PDFGEN public function inventory mismatch. Expected ${expectedFunctions.length}, found ${actualFunctions.length}.`);
}

const qa001 = existsSync(requiredPaths[1]) ? readFileSync(requiredPaths[1], 'utf8') : '';
for (const part of [
  'values (46::bigint)',
  'credential_generation_batch_activation_requests',
  'credential_generation_batch_activation_items',
  'all 30 PDFGEN functions should deny anonymous execution',
]) if (!qa001.includes(part)) errors.push(`QA-001 PDFGEN coverage missing ${part}`);

const qa003 = existsSync(requiredPaths[2]) ? readFileSync(requiredPaths[2], 'utf8') : '';
for (const part of [
  'can_manage_credential_templates',
  'assert_single_generation_actor',
  'assert_batch_generation_actor',
  'credential_generation_batch_activation_requests',
  'credential_generation_batch_activation_items',
]) if (!qa003.includes(part)) errors.push(`QA-003 PDFGEN coverage missing ${part}`);

for (const path of requiredPaths.slice(0, 3)) {
  const source = existsSync(path) ? readFileSync(path, 'utf8') : '';
  const planned = Number(source.match(/select\s+plan\((\d+)\)/iu)?.[1] ?? 0);
  const assertions = [...source.matchAll(/select\s+(?:results_eq|has_index|has_trigger)\s*\(/giu)].length;
  if (planned !== assertions) errors.push(`${path} plans ${planned} assertions but defines ${assertions}.`);
}

const generationTest = existsSync(requiredPaths[4]) ? readFileSync(requiredPaths[4], 'utf8') : '';
for (const part of [
  "locale: 'en'", "locale: 'ua'", "locale: 'cz'",
  'longHolderName', 'longProgrammeTitle', 'exactSingleLineBox', 'NITBS-C-2026-000001', 'text_overflow',
  'rotatedDecoded', 'supplement.pdf',
]) if (!generationTest.includes(part)) errors.push(`PDF generation acceptance test missing ${part}`);

const validationTest = existsSync(requiredPaths[3]) ? readFileSync(requiredPaths[3], 'utf8') : '';
for (const part of ['/Encrypt', '/JavaScript', '/EmbeddedFiles', '/Launch', '/URI', '/AcroForm', '/SubmitForm', '/GoToR']) {
  if (!validationTest.includes(part)) errors.push(`PDF validation acceptance test missing ${part}`);
}

const validationSource = readFileSync('lib/credential-templates/pdf-validation.ts', 'utf8');
for (const part of [
  "from '@napi-rs/canvas'",
  'installPdfJsCanvasGlobals()',
  'CanvasDOMMatrix',
  'CanvasImageData',
  'CanvasPath2D',
  "{ cause: error }",
]) {
  if (!validationSource.includes(part)) errors.push(`PDF.js Node canvas bootstrap missing ${part}`);
}

const paginationTest = existsSync(requiredPaths[5]) ? readFileSync(requiredPaths[5], 'utf8') : '';
for (const part of ['length: 1740', '[[0, 999], [1000, 1999]]', 'collectPaginatedRows']) {
  if (!paginationTest.includes(part)) errors.push(`Cohort pagination acceptance test missing ${part}`);
}

const generationSource = readFileSync('lib/credentials/generation.ts', 'utf8');
if (/from\('credential_template_field_placements'\)[\s\S]{0,800}\.eq\('template_version_id'/u.test(generationSource)) {
  errors.push('Credential generation must not filter field placements by the nonexistent template_version_id column.');
}
if (!generationSource.includes(".in('template_document_id', documents.map((document) => document.id))")) {
  errors.push('Credential generation must load field placements through their template_document_id relationship.');
}

const pdfGenerationSource = readFileSync('lib/credential-templates/pdf-generation.ts', 'utf8');
for (const part of [
  'credential_template_pdf_validation_failed',
  '[redacted-url]',
  '[redacted-id]',
  '.slice(0, 240)',
]) {
  if (!pdfGenerationSource.includes(part)) errors.push(`Safe PDF validation diagnostics missing ${part}`);
}

for (const path of [
  'lib/credential-templates/admin.ts',
  'lib/credential-templates/storage.ts',
  'lib/credentials/generation.ts',
  'lib/credentials/batch-generation.ts',
  'lib/credentials/activation.ts',
]) {
  const source = readFileSync(path, 'utf8');
  if (/console\.(?:log|info|warn|error)/u.test(source)) errors.push(`Protected workflow must not log sensitive state: ${path}`);
}

const auditPayloads = [...migrationSource.matchAll(/p_(?:metadata|before_data|after_data)\s*=>\s*jsonb_build_object\(([\s\S]*?)\n\s*\)/giu)]
  .map((match) => match[1]);
for (const payload of auditPayloads) {
  if (/(?:raw_token|verification_token|storage_path|pdf_bytes|learner_email|recipient_email|email_body|email_subject)/iu.test(payload)) {
    errors.push('PDFGEN audit/history payload contains forbidden token, path, byte, or contact metadata.');
    break;
  }
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (pkg.scripts?.['verify:pdfgen-008'] !== 'node scripts/verify-pdfgen-008.mjs') {
  errors.push('Missing verify:pdfgen-008 package script.');
}
if (pkg.scripts?.['test:pdfgen-008:pagination'] !== 'node --experimental-strip-types scripts/test-pdfgen-008-cohort-pagination.mjs') {
  errors.push('Missing PDFGEN-008 cohort pagination test script.');
}

if (errors.length) {
  console.error('PDFGEN-008 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('PDFGEN-008 static security and acceptance verification passed.');
