import { existsSync, readFileSync } from 'node:fs';

const migrationPath = 'supabase/migrations/20260807140000_crd_002_credential_sets.sql';
const testPath = 'supabase/tests/database/crd_002_credential_sets.test.sql';
const errors = [];

for (const path of [migrationPath, testPath]) if (!existsSync(path)) errors.push(`Missing required path: ${path}`);

if (existsSync(migrationPath)) {
  const sql = readFileSync(migrationPath, 'utf8');
  for (const snippet of [
    'create table public.credential_sets',
    'learner_id uuid not null references public.learners(id) on delete restrict',
    'programme_id uuid not null references public.programmes(id) on delete restrict',
    'programme_run_id uuid null',
    'completion_date date null',
    'credential_sets_programme_run_context_fk',
    'credential_sets_context_unique_idx',
    'nulls not distinct',
    'credential_sets_audit_creation',
    'create or replace function public.find_or_create_credential_set',
    'security invoker',
    'on conflict do nothing',
    'is not distinct from p_programme_run_id',
    'is not distinct from p_completion_date',
    'enable row level security',
    'force row level security',
    'credential_sets_authorized_read',
    'credential_sets_authorized_insert',
    "array['owner', 'super_admin', 'credential_manager']::public.app_role[]",
    'internal.is_mfa_requirement_satisfied()',
  ]) if (!sql.includes(snippet)) errors.push(`CRD-002 migration missing required behavior: ${snippet}`);

  for (const [pattern, message] of [
    [/array\[[^\]]*'content_manager'[^\]]*\]/i, 'Content Manager must not receive credential set access.'],
    [/grant\s+(?:select|insert|update|delete)[^;]*credential_sets[^;]*to\s+anon/i, 'Anonymous users must receive no direct credential set privileges.'],
    [/grant\s+(?:update|delete)[^;]*credential_sets[^;]*to\s+authenticated/i, 'Authenticated admins must not mutate or delete established set context.'],
    [/create\s+table\s+(?:if\s+not\s+exists\s+)?public\.(?:credentials|document_number_log|credential_files)/i, 'CRD-002 must not create later Credential Core tables.'],
    [/create\s+type\s+public\.(?:credential_status|document_number_status)/i, 'CRD-002 must not implement later lifecycle enums.'],
    [/\bstatus\s+public\.|\bverification_token|\bqr_token/i, 'Credential Set must have no status or verification token.'],
  ]) if (pattern.test(sql)) errors.push(message);
}

if (existsSync(testPath)) {
  const test = readFileSync(testPath, 'utf8').toLowerCase();
  for (const snippet of ['select plan(31);', "has_table('public', 'credential_sets'", 'find_or_create_credential_set', 'anonymous clients', 'content manager', 'credential manager', 'select * from finish();']) {
    if (!test.includes(snippet)) errors.push(`CRD-002 database test missing required coverage: ${snippet}`);
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:crd-002'] !== 'node scripts/verify-crd-002.mjs') errors.push('package.json must expose verify:crd-002.');
}

if (errors.length) {
  console.error('CRD-002 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('CRD-002 verification passed.');
