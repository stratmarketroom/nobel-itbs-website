import { existsSync, readFileSync } from 'node:fs';

const migrationPath = 'supabase/migrations/20260727145222_auth_004_role_helpers.sql';
const testPath = 'supabase/tests/database/auth_004_role_helpers.test.sql';
const errors = [];

for (const path of [migrationPath, testPath]) {
  if (!existsSync(path)) {
    errors.push(`Missing required path: ${path}`);
  }
}

if (existsSync(migrationPath)) {
  const sql = readFileSync(migrationPath, 'utf8');
  const requiredSnippets = [
    'create or replace function internal.has_role(p_role public.app_role)',
    'create or replace function internal.has_any_role(p_roles public.app_role[])',
    'create or replace function internal.is_owner()',
    'create or replace function internal.is_active_admin()',
    'create or replace function internal.has_mfa_aal()',
    'create or replace function internal.is_mfa_requirement_satisfied()',
    'auth.uid()',
    'auth.jwt()',
    "auth.jwt() ->> 'aal' = 'aal2'",
    'set search_path = internal, public, pg_temp',
    'security definer',
    'grant execute on function internal.has_role(public.app_role) to authenticated, service_role;',
    'grant execute on function internal.is_owner() to authenticated, service_role;',
  ];

  for (const snippet of requiredSnippets) {
    if (!sql.includes(snippet)) {
      errors.push(`Migration missing required SQL snippet: ${snippet}`);
    }
  }

  const forbiddenPatterns = [
    [/p_actor/i, 'AUTH-004 helpers must not accept actor ID parameters.'],
    [/create\s+table\s+public\./i, 'AUTH-004 must not create public tables.'],
    [/create\s+type\s+public\./i, 'AUTH-004 must not create public types.'],
    [/gmail|leeloo|programme|learner|credential/i, 'AUTH-004 must not include future modules or integrations.'],
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
    [/select\s+plan\(6\);/i, 'select plan(6);'],
    [/select\s+has_function\(\s*'internal'\s*,\s*'has_role'/i, "select has_function('internal', 'has_role'"],
    [/select\s+has_function\(\s*'internal'\s*,\s*'has_any_role'/i, "select has_function('internal', 'has_any_role'"],
    [/select\s+has_function\(\s*'internal'\s*,\s*'is_owner'/i, "select has_function('internal', 'is_owner'"],
    [/select\s+has_function\(\s*'internal'\s*,\s*'is_active_admin'/i, "select has_function('internal', 'is_active_admin'"],
    [/select\s+has_function\(\s*'internal'\s*,\s*'has_mfa_aal'/i, "select has_function('internal', 'has_mfa_aal'"],
    [/select\s+has_function\(\s*'internal'\s*,\s*'is_mfa_requirement_satisfied'/i, "select has_function('internal', 'is_mfa_requirement_satisfied'"],
    [/select\s+\*\s+from\s+finish\(\);/i, 'select * from finish();'],
  ];

  for (const [pattern, label] of requiredTestPatterns) {
    if (!pattern.test(testSql)) {
      errors.push(`AUTH-004 test missing required snippet: ${label}`);
    }
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:auth-004'] !== 'node scripts/verify-auth-004.mjs') {
    errors.push('package.json must expose verify:auth-004.');
  }
}

if (errors.length > 0) {
  console.error('AUTH-004 verification failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('AUTH-004 verification passed.');
