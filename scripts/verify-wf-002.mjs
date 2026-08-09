import { existsSync, readFileSync } from 'node:fs';

const files = {
  migration: 'supabase/migrations/20260809110000_wf_002_manage_credential_files.sql',
  test: 'supabase/tests/database/wf_002_manage_credential_files.test.sql',
  collectionRoute: 'app/api/v1/admin/credentials/[id]/files/route.ts',
  itemRoute: 'app/api/v1/admin/credentials/[id]/files/[fileId]/route.ts',
  data: 'lib/credentials/files.ts',
  input: 'lib/credentials/file-input.ts',
  types: 'lib/credentials/file-types.ts',
};
const errors = [];

for (const path of Object.values(files)) {
  if (!existsSync(path)) errors.push(`Missing required path: ${path}`);
}

if (!errors.length) {
  const source = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, readFileSync(path, 'utf8')]));
  const routes = source.collectionRoute + source.itemRoute;

  for (const snippet of [
    'public.attach_credential_file',
    'public.replace_credential_file',
    'public.update_credential_file',
    'public.delete_credential_file',
    'internal.require_credential_file_mutation',
    "array['owner', 'super_admin', 'credential_manager']::public.app_role[]",
    'internal.is_mfa_requirement_satisfied()',
    "v_status not in ('pending', 'valid')",
    "p_allow_delete and v_status <> 'pending'",
    "v_status = 'valid'",
    'a reason is required to change a valid credential PDF',
    'valid credential must retain one primary PDF',
    "set_config('app.credential_file_change_reason'",
    "set_config('app.credential_file_operation'",
    "v_operation = 'replace'",
    'p_reason => v_reason',
    'from public, anon, authenticated',
    'to authenticated, postgres, service_role',
  ]) {
    if (!source.migration.includes(snippet)) errors.push(`WF-002 migration missing required behavior: ${snippet}`);
  }

  for (const [pattern, message] of [
    [/array\[[^\]]*'content_manager'[^\]]*\]/i, 'Content Manager must not receive credential file access.'],
    [/grant\s+(?:insert|update|delete)[^;]*credential_files[^;]*to\s+(?:authenticated|service_role)/i, 'Direct file metadata mutations must remain denied.'],
    [/create\s+policy[^;]*on\s+storage\.objects[^;]*private-credentials/i, 'Browser JWTs must receive no private bucket policy.'],
    [/create\s+table\s+(?:if\s+not\s+exists\s+)?public\./i, 'WF-002 must reuse the approved CRD-005 schema.'],
    [/create\s+(?:or\s+replace\s+)?function\s+public\.(?:activate|send|resend|revoke|void|verify)/i, 'WF-002 must not implement later workflows.'],
    [/jsonb_build_object\([^;]*(?:storage_path|file_content)/i, 'History/Audit must not contain private paths or file content.'],
  ]) {
    if (pattern.test(source.migration)) errors.push(message);
  }

  for (const snippet of ['export async function GET', 'export async function POST', 'export async function PUT', 'export async function PATCH', 'export async function DELETE', 'getAdminContext(request)', 'jsonError(error)']) {
    if (!routes.includes(snippet)) errors.push(`WF-002 routes missing required behavior: ${snippet}`);
  }

  for (const snippet of [
    'assertCanManageCredentials',
    'getSupabaseRequestClient',
    'getSupabaseAdminClient().storage',
    "const bucket = 'private-credentials'",
    "db.rpc('attach_credential_file'",
    "db.rpc('replace_credential_file'",
    "db.rpc('update_credential_file'",
    "db.rpc('delete_credential_file'",
    'removeUploadedObject(path)',
    'restoreObject(path, previousBytes)',
    'upsert: true',
    'signedUrlLifetimeSeconds = 60',
    '.createSignedUrl(',
  ]) {
    if (!source.data.includes(snippet)) errors.push(`WF-002 server coordination missing: ${snippet}`);
  }

  const authorizationIndex = source.data.indexOf('assertCanManageCredentials');
  const storageIndex = source.data.indexOf('getSupabaseAdminClient().storage');
  if (authorizationIndex < 0 || storageIndex < 0 || authorizationIndex > storageIndex) {
    errors.push('Actor authorization must be established before server-only Storage access.');
  }

  for (const [pattern, message] of [
    [/\.from\(['"]storage\.objects['"]\)/i, 'Storage object access must use the server-only Storage API.'],
    [/createSignedUrl\([^,]+,\s*(?:[6-9][1-9]|[1-9]\d{2,})/i, 'Signed URL lifetime must remain short.'],
    [/\.copy\(|replacement-|versions?\//i, 'WF-002 must not retain old PDF versions in Storage.'],
    [/console\.(?:log|info|warn|error)\s*\([^)]*(?:bytes|signedUrl|path)/i, 'Private file content, paths, and signed URLs must never be logged.'],
  ]) {
    if (pattern.test(source.data + routes)) errors.push(message);
  }

  for (const snippet of ['multipart/form-data', "file.type !== 'application/pdf'", '20 * 1024 * 1024', "Buffer.from('%PDF-'", 'file.size < 1', 'Unexpected upload field']) {
    if (!source.input.includes(snippet)) errors.push(`WF-002 upload validation missing: ${snippet}`);
  }

  const test = source.test.toLowerCase();
  for (const snippet of ['select plan(38);', 'controlled file attach', 'controlled file replacement', 'pending-only', 'valid credential', 'credential manager', 'history', 'audit', 'storage paths', 'browser jwts', 'select * from finish();']) {
    if (!test.includes(snippet)) errors.push(`WF-002 database test missing coverage: ${snippet}`);
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:wf-002'] !== 'node scripts/verify-wf-002.mjs') errors.push('package.json must expose verify:wf-002.');
}

if (errors.length) {
  console.error('WF-002 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('WF-002 verification passed.');
