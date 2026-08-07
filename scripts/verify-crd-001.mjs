import { existsSync, readFileSync } from 'node:fs';

const migrationPath = 'supabase/migrations/20260807130000_crd_001_credential_types.sql';
const testPath = 'supabase/tests/database/crd_001_credential_types.test.sql';
const errors = [];

for (const path of [migrationPath, testPath]) if (!existsSync(path)) errors.push(`Missing required path: ${path}`);

if (existsSync(migrationPath)) {
  const sql = readFileSync(migrationPath, 'utf8');
  for (const snippet of [
    'create table public.credential_types',
    'code text not null unique',
    'document_letter text not null',
    'is_active boolean not null default true',
    'credential_types_document_letter_format',
    'create table public.credential_type_translations',
    'language_code text not null references public.languages(code)',
    'display_name text not null',
    "'certificate', 'C', true",
    "'diploma', 'D', true",
    "'en', 'Certificate'",
    "'ua', 'Сертифікат'",
    "'cz', 'Certifikát'",
    'enable row level security',
    'force row level security',
    'credential_types_authorized_read',
    'credential_type_translations_authorized_read',
    "array['owner', 'super_admin', 'credential_manager']::public.app_role[]",
    "array['owner', 'super_admin']::public.app_role[]",
    'internal.is_mfa_requirement_satisfied()',
  ]) if (!sql.includes(snippet)) errors.push(`CRD-001 migration missing required behavior: ${snippet}`);

  for (const [pattern, message] of [
    [/array\[[^\]]*'content_manager'[^\]]*\]/i, 'Content Manager must not receive credential type access.'],
    [/grant\s+(?:select|insert|update|delete)[^;]*(?:credential_types|credential_type_translations)[^;]*to\s+anon/i, 'Anonymous users must receive no direct credential type privileges.'],
    [/create\s+table\s+(?:if\s+not\s+exists\s+)?public\.(?:credential_sets|credentials|document_number_log)/i, 'CRD-001 must not create later Credential Core tables.'],
    [/create\s+type\s+public\.(?:credential_status|document_number_status)/i, 'CRD-001 must not implement later lifecycle enums.'],
    [/grant\s+delete[^;]*(?:credential_types|credential_type_translations)[^;]*to\s+authenticated/i, 'Authenticated admins must deactivate rather than delete credential types.'],
  ]) if (pattern.test(sql)) errors.push(message);
}

if (existsSync(testPath)) {
  const test = readFileSync(testPath, 'utf8').toLowerCase();
  for (const snippet of ['select plan(38);', "has_table('public', 'credential_types'", "has_table('public', 'credential_type_translations'", 'certificate and diploma', 'anonymous clients', 'content manager', 'credential manager', 'select * from finish();']) {
    if (!test.includes(snippet)) errors.push(`CRD-001 database test missing required coverage: ${snippet}`);
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:crd-001'] !== 'node scripts/verify-crd-001.mjs') errors.push('package.json must expose verify:crd-001.');
}

if (errors.length) {
  console.error('CRD-001 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('CRD-001 verification passed.');
