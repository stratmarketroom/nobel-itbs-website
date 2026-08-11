import { existsSync, readFileSync } from 'node:fs';

const migrationPath = 'supabase/migrations/20260808120000_crd_005_credential_files.sql';
const testPath = 'supabase/tests/database/crd_005_credential_files.test.sql';
const errors = [];

for (const path of [migrationPath, testPath]) if (!existsSync(path)) errors.push(`Missing required path: ${path}`);

if (existsSync(migrationPath)) {
  const sql = readFileSync(migrationPath, 'utf8');
  for (const snippet of [
    "'private-credentials'",
    'public,\n  file_size_limit,\n  allowed_mime_types',
    '20971520',
    "array['application/pdf']::text[]",
    'create table public.credential_file_types',
    "'main_certificate', 'Main certificate', true",
    "'supplement', 'Supplement', true",
    "'transcript', 'Transcript', true",
    'create table public.credential_files',
    'credential_id uuid not null references public.credentials(id) on delete restrict',
    'file_type_id uuid not null references public.credential_file_types(id) on delete restrict',
    "storage_bucket text not null default 'private-credentials'",
    "storage_path = credential_id::text || '/' || id::text || '.pdf'",
    "mime_type = 'application/pdf'",
    'size_bytes between 1 and 20971520',
    'create unique index credential_files_one_primary_idx',
    'where is_primary',
    'credential_files_enforce_identity',
    'credential_files_audit_change',
    "p_action => 'credential_file.attached'",
    "'credential_file.replaced'",
    "p_action => 'credential_file.deleted'",
    'alter table public.credential_file_types enable row level security',
    'alter table public.credential_file_types force row level security',
    'alter table public.credential_files enable row level security',
    'alter table public.credential_files force row level security',
    "array['owner', 'super_admin', 'credential_manager']::public.app_role[]",
    "array['owner', 'super_admin']::public.app_role[]",
    'internal.is_mfa_requirement_satisfied()',
    'No storage.objects policy is created for private-credentials',
  ]) if (!sql.includes(snippet)) errors.push(`CRD-005 migration missing required behavior: ${snippet}`);

  for (const [pattern, message] of [
    [/array\[[^\]]*'content_manager'[^\]]*\]/i, 'Content Manager must not receive credential file access.'],
    [/grant\s+(?:select|insert|update|delete)[^;]*credential_files[^;]*to\s+anon/i, 'Anonymous users must receive no credential file privileges.'],
    [/grant\s+(?:insert|update|delete)[^;]*credential_files[^;]*to\s+(?:authenticated|service_role)/i, 'File metadata mutations must remain behind WF-002 controlled routes.'],
    [/create\s+policy[^;]*on\s+storage\.objects[^;]*private-credentials/i, 'Browser JWTs must receive no direct private bucket policy.'],
    [/\bpublic\s*=\s*true/i, 'The credential bucket must never be public.'],
    [/create\s+table\s+(?:if\s+not\s+exists\s+)?public\.(?:credential_history|credential_notes|email_templates)/i, 'CRD-005 must not create later modules.'],
    [/create\s+(?:or\s+replace\s+)?function\s+public\.(?:upload|replace|delete|activate|send)/i, 'CRD-005 must not implement later file or activation workflows.'],
    [/p_metadata\s*=>[^;]*(?:storage_path|file_content)/i, 'File audit metadata must not log private paths or content.'],
  ]) if (pattern.test(sql)) errors.push(message);
}

if (existsSync(testPath)) {
  const test = readFileSync(testPath, 'utf8').toLowerCase();
  for (const snippet of ['select plan(55);', 'private credential bucket', "has_table('public', 'credential_file_types'", "has_table('public', 'credential_files'", 'credential_files_one_primary_idx', '20 mb', 'anonymous clients', 'content manager', 'credential manager', 'select * from finish();']) {
    if (!test.includes(snippet)) errors.push(`CRD-005 database test missing required coverage: ${snippet}`);
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:crd-005'] !== 'node scripts/verify-crd-005.mjs') errors.push('package.json must expose verify:crd-005.');
}

if (errors.length) {
  console.error('CRD-005 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('CRD-005 verification passed.');
