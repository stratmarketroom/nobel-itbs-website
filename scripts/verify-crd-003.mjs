import { existsSync, readFileSync } from 'node:fs';

const migrationPath = 'supabase/migrations/20260808100000_crd_003_document_number_log.sql';
const testPath = 'supabase/tests/database/crd_003_document_number_log.test.sql';
const errors = [];

for (const path of [migrationPath, testPath]) if (!existsSync(path)) errors.push(`Missing required path: ${path}`);

if (existsSync(migrationPath)) {
  const sql = readFileSync(migrationPath, 'utf8');
  for (const snippet of [
    "create type public.document_number_status as enum (\n  'reserved',\n  'issued',\n  'voided'",
    'create sequence public.document_number_shared_seq',
    'start with 1',
    'no cycle',
    'create table public.document_number_log',
    'document_number text not null unique',
    'sequence_value bigint not null unique',
    'credential_id uuid null',
    'document_number_log_format',
    'document_number_log_void_consistency',
    'document_number_log_enforce_permanence',
    'create or replace function public.reserve_document_number',
    'create or replace function public.reserve_manual_document_number',
    'create or replace function public.void_reserved_document_number',
    'security definer',
    "'NITBS-%s-%s-%s'",
    "lpad(v_sequence_value::text, 6, '0')",
    'alter table public.document_number_log enable row level security',
    'alter table public.document_number_log force row level security',
    "array['owner', 'super_admin', 'credential_manager']::public.app_role[]",
    "array['owner', 'super_admin']::public.app_role[]",
    'internal.is_mfa_requirement_satisfied()',
    "p_action => 'document_number.reserved'",
    "p_action => 'document_number.reserved_manual'",
    "p_action => 'document_number.voided'",
  ]) if (!sql.includes(snippet)) errors.push(`CRD-003 migration missing required behavior: ${snippet}`);

  for (const [pattern, message] of [
    [/array\[[^\]]*'content_manager'[^\]]*\]/i, 'Content Manager must not receive document-number access.'],
    [/grant\s+(?:select|insert|update|delete)[^;]*document_number_log[^;]*to\s+anon/i, 'Anonymous users must receive no direct document-number privileges.'],
    [/grant\s+(?:insert|update|delete)[^;]*document_number_log[^;]*to\s+authenticated/i, 'Authenticated admins must use controlled functions for number mutations.'],
    [/grant\s+(?:usage|update)[^;]*document_number_shared_seq[^;]*to\s+(?:authenticated|service_role)/i, 'The shared sequence must be inaccessible outside controlled functions.'],
    [/create\s+table\s+(?:if\s+not\s+exists\s+)?public\.(?:credentials|credential_files)/i, 'CRD-003 must not create later Credential Core tables.'],
    [/create\s+type\s+public\.credential_status/i, 'CRD-003 must not implement the credential lifecycle enum.'],
    [/alter\s+sequence[^;]*(?:restart|cycle)/i, 'The permanent sequence must never restart or cycle.'],
  ]) if (pattern.test(sql)) errors.push(message);
}

if (existsSync(testPath)) {
  const test = readFileSync(testPath, 'utf8').toLowerCase();
  for (const snippet of ['select plan(46);', "has_type('public', 'document_number_status'", "has_sequence('public', 'document_number_shared_seq'", "has_table('public', 'document_number_log'", 'reserve_document_number', 'reserve_manual_document_number', 'void_reserved_document_number', 'anonymous clients', 'content manager', 'credential manager', 'select * from finish();']) {
    if (!test.includes(snippet)) errors.push(`CRD-003 database test missing required coverage: ${snippet}`);
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:crd-003'] !== 'node scripts/verify-crd-003.mjs') errors.push('package.json must expose verify:crd-003.');
}

if (errors.length) {
  console.error('CRD-003 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('CRD-003 verification passed.');
