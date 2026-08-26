import { existsSync, readFileSync } from 'node:fs';

const requiredPaths = [
  'supabase/migrations/20260826100000_pdfgen_005_single_generation.sql',
  'supabase/tests/database/pdfgen_005_single_generation.test.sql',
  'lib/credentials/generation.ts',
  'lib/credentials/generation-types.ts',
  'lib/credentials/generation-input.ts',
  'app/api/v1/admin/credentials/[id]/generate/route.ts',
  'components/admin-credentials.tsx',
  'docs/qa/PDFGEN_005_SINGLE_CREDENTIAL_GENERATION_2026-08-26.md',
];
const errors = [];
for (const path of requiredPaths) if (!existsSync(path)) errors.push(`Missing ${path}`);

const migration = existsSync(requiredPaths[0]) ? readFileSync(requiredPaths[0], 'utf8') : '';
for (const part of [
  'internal.credential_single_generation_locks',
  'force row level security',
  'begin_single_credential_generation',
  'refresh_single_credential_generation',
  'complete_single_credential_generation',
  'fail_single_credential_generation',
  'internal.assert_single_generation_actor',
  "array['owner', 'super_admin', 'credential_manager']",
  "v_credential.status <> 'pending'",
  'same immutable template version',
  'credential_file_generations',
  'credential_generation.regenerated',
  'credential_generation.failed',
  'exactly one primary PDF',
  'to authenticated, service_role',
]) {
  if (!migration.includes(part)) errors.push(`PDFGEN-005 migration missing ${part}`);
}
if (/create\s+policy[\s\S]*private-credentials/iu.test(migration)) {
  errors.push('PDFGEN-005 must not add browser Storage access to private generated PDFs.');
}

const server = existsSync(requiredPaths[2]) ? readFileSync(requiredPaths[2], 'utf8') : '';
for (const part of [
  'assertCanManageCredentials',
  'begin_single_credential_generation',
  'refresh_single_credential_generation',
  'complete_single_credential_generation',
  'fail_single_credential_generation',
  'decryptCredentialVerificationUrl',
  'generateCredentialPdfPackage',
  "const templateBucket = 'credential-templates'",
  "const credentialBucket = 'private-credentials'",
  'exactPublicOrigin',
  'rollbackObjects',
  'generation_attempt',
]) {
  if (!server.includes(part)) errors.push(`Single-generation server workflow missing ${part}`);
}
if (/console\.(?:log|error|warn)|signedUrl|rawToken|lookupHash/u.test(server)) {
  errors.push('Single-generation server workflow must not log or return protected token/path material.');
}

const route = existsSync(requiredPaths[5]) ? readFileSync(requiredPaths[5], 'utf8') : '';
for (const part of ['getAdminContext', 'getCredentialGenerationState', 'generateSingleCredential', 'readSingleGenerationInput']) {
  if (!route.includes(part)) errors.push(`Generation route missing ${part}`);
}

const ui = existsSync(requiredPaths[6]) ? readFileSync(requiredPaths[6], 'utf8') : '';
for (const part of ['Generate complete package', 'Regenerate same version', 'Preview', 'Review every file before activation', 'templateVersionId', 'saving || !generation.eligible']) {
  if (!ui.includes(part)) errors.push(`Credential UI missing ${part}`);
}

const qa = existsSync(requiredPaths[7]) ? readFileSync(requiredPaths[7], 'utf8') : '';
for (const part of ['Status: complete in dev', '58th dev migration', 'PDFGEN-006 Batch']) {
  if (!qa.includes(part)) errors.push(`PDFGEN-005 QA record missing ${part}`);
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (pkg.scripts?.['verify:pdfgen-005'] !== 'node scripts/verify-pdfgen-005.mjs') {
  errors.push('Missing PDFGEN-005 static verifier script.');
}

if (errors.length) {
  console.error('PDFGEN-005 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('PDFGEN-005 static verification passed.');
