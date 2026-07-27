import { existsSync, readFileSync } from 'node:fs';

const migrationPath = 'supabase/migrations/20260727105232_dbf_004_audit_foundation.sql';
const testPath = 'supabase/tests/database/dbf_004_audit_foundation.test.sql';
const errors = [];

for (const path of [migrationPath, testPath]) {
  if (!existsSync(path)) {
    errors.push(`Missing required path: ${path}`);
  }
}

if (existsSync(migrationPath)) {
  const sql = readFileSync(migrationPath, 'utf8');
  const requiredSnippets = [
    'create table if not exists public.audit_log',
    'alter table public.audit_log enable row level security;',
    'alter table public.audit_log force row level security;',
    'create or replace function internal.prevent_audit_log_mutation()',
    'create trigger audit_log_prevent_mutation',
    'create trigger audit_log_prevent_truncate',
    'create or replace function internal.write_audit_log(',
    'set search_path = internal, public, pg_temp',
    'revoke all on table public.audit_log from public, anon, authenticated;',
    'revoke all on function internal.write_audit_log',
    'grant execute on function internal.write_audit_log',
    'raw_token',
    'mfa_secret',
    'private_file_content',
  ];

  for (const snippet of requiredSnippets) {
    if (!sql.includes(snippet)) {
      errors.push(`Migration missing required SQL snippet: ${snippet}`);
    }
  }

  const forbiddenPatterns = [
    [/create\s+table\s+public\.(?!audit_log\b)/i, 'DBF-004 must not create non-audit public tables.'],
    [/create\s+type\s+public\./i, 'DBF-004 must not create business enums.'],
    [
      /create\s+(?:table|view|function|trigger|policy|index)\s+(?:if\s+not\s+exists\s+)?(?:public\.)?(?:programme|learner|credential|gmail|leeloo)/i,
      'DBF-004 migration must not create future module objects or integrations.',
    ],
  ];

  for (const [pattern, message] of forbiddenPatterns) {
    if (pattern.test(sql)) {
      errors.push(message);
    }
  }
}

if (existsSync(testPath)) {
  const testSql = readFileSync(testPath, 'utf8');
  const requiredTestPatterns = [
    [/select\s+plan\(9\);/i, 'select plan(9);'],
    [/select\s+has_table\(\s*'public'\s*,\s*'audit_log'/i, "select has_table('public', 'audit_log'"],
    [/select\s+has_function\(\s*'internal'\s*,\s*'write_audit_log'/i, "select has_function('internal', 'write_audit_log'"],
    [/select\s+has_function\(\s*'internal'\s*,\s*'prevent_audit_log_mutation'/i, "select has_function('internal', 'prevent_audit_log_mutation'"],
    [/select\s+throws_ok\(/i, 'select throws_ok('],
    [/select\s+\*\s+from\s+finish\(\);/i, 'select * from finish();'],
  ];

  for (const [pattern, label] of requiredTestPatterns) {
    if (!pattern.test(testSql)) {
      errors.push(`DBF-004 test missing required snippet: ${label}`);
    }
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:dbf-004'] !== 'node scripts/verify-dbf-004.mjs') {
    errors.push('package.json must expose verify:dbf-004.');
  }
}

if (errors.length > 0) {
  console.error('DBF-004 verification failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('DBF-004 verification passed.');
