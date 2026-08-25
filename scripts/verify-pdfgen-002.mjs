import { existsSync, readFileSync } from 'node:fs';

const requiredPaths = [
  'supabase/migrations/20260825120000_pdfgen_002_private_template_storage_validation.sql',
  'supabase/tests/database/pdfgen_002_private_template_storage_validation.test.sql',
  'lib/credential-templates/pdf-validation.ts',
  'lib/credential-templates/input.ts',
  'lib/credential-templates/storage.ts',
  'app/api/v1/admin/credential-templates/versions/[versionId]/documents/route.ts',
  'app/api/v1/admin/credential-templates/versions/[versionId]/documents/[documentId]/route.ts',
  'scripts/test-pdfgen-002-validation.mjs',
];
const errors = [];

for (const path of requiredPaths) {
  if (!existsSync(path)) errors.push(`Missing required path: ${path}`);
}

if (existsSync(requiredPaths[0])) {
  const sql = readFileSync(requiredPaths[0], 'utf8');
  for (const snippet of [
    "'credential-templates'",
    '20971520',
    "array['application/pdf']",
    'revoke select on table public.credential_template_documents from authenticated',
    'internal.enforce_credential_template_storage_object',
    'for share of template_version',
    'internal.require_template_source_objects_for_publication',
    'public.attach_credential_template_document',
    'public.delete_credential_template_document',
    'validated private template source PDF must be uploaded before metadata attachment',
    'private template source PDF must be removed through the controlled server route before metadata deletion',
    'internal.assert_sensitive_action_allowed',
    "array['owner'::public.app_role, 'super_admin'::public.app_role]",
    'No storage.objects policy is created',
  ]) {
    if (!sql.includes(snippet)) errors.push(`PDFGEN-002 migration missing required behavior: ${snippet}`);
  }
  if (/create\s+policy[^;]*on\s+storage\.objects/i.test(sql)) {
    errors.push('PDFGEN-002 must not expose browser Storage policies.');
  }
}

if (existsSync('lib/credential-templates/pdf-validation.ts')) {
  const validation = readFileSync('lib/credential-templates/pdf-validation.ts', 'utf8');
  for (const snippet of [
    "import('pdfjs-dist/legacy/build/pdf.mjs')",
    'stopAtErrors: true',
    'getAttachments()',
    'getJSActions()',
    'getOpenAction()',
    'getFieldObjects()',
    'getOperatorList',
    "createHash('sha256')",
    'widthPoints',
    'heightPoints',
  ]) {
    if (!validation.includes(snippet)) errors.push(`PDF validator missing required behavior: ${snippet}`);
  }
}

if (existsSync('lib/credential-templates/storage.ts')) {
  const storage = readFileSync('lib/credential-templates/storage.ts', 'utf8');
  for (const snippet of [
    'assertCanManageCredentialTemplates',
    "const bucket = 'credential-templates'",
    'attach_credential_template_document',
    'delete_credential_template_document',
    'restoreObject',
    '.download(objectPath',
  ]) {
    if (!storage.includes(snippet)) errors.push(`Template Storage workflow missing required behavior: ${snippet}`);
  }
  if (/createSignedUrl|source_storage_path/.test(storage)) {
    errors.push('Template workflow must not expose signed Storage paths to the browser.');
  }
}

if (existsSync(requiredPaths[6])) {
  const route = readFileSync(requiredPaths[6], 'utf8');
  for (const snippet of [
    "'Cache-Control': 'private, no-store, max-age=0'",
    "'Content-Disposition': 'inline; filename=\"template-preview.pdf\"'",
    "'Content-Type': 'application/pdf'",
  ]) {
    if (!route.includes(snippet)) errors.push(`Private preview route missing behavior: ${snippet}`);
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.dependencies?.['pdfjs-dist'] !== '^6.2.108') errors.push('pdfjs-dist 6.2.108 must be pinned as the validator dependency.');
  if (pkg.scripts?.['verify:pdfgen-002'] !== 'node scripts/verify-pdfgen-002.mjs') errors.push('Missing verify:pdfgen-002 script.');
  if (pkg.scripts?.['test:pdfgen-002:validation'] !== 'node scripts/test-pdfgen-002-validation.mjs') {
    errors.push('Missing test:pdfgen-002:validation script.');
  }
}

if (existsSync('next.config.mjs')) {
  const nextConfig = readFileSync('next.config.mjs', 'utf8');
  if (!nextConfig.includes("serverExternalPackages: ['@napi-rs/canvas', 'pdfjs-dist']")) {
    errors.push('pdfjs-dist must remain external to the Next.js server bundle.');
  }
}

if (errors.length) {
  console.error('PDFGEN-002 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('PDFGEN-002 static verification passed.');
