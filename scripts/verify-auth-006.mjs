import { existsSync, readFileSync } from 'node:fs';

const migrationPath = 'supabase/migrations/20260727145835_auth_006_mfa_enforcement.sql';
const testPath = 'supabase/tests/database/auth_006_mfa_enforcement.test.sql';
const errors = [];

for (const path of [migrationPath, testPath]) {
  if (!existsSync(path)) {
    errors.push(`Missing required path: ${path}`);
  }
}

if (existsSync(migrationPath)) {
  const sql = readFileSync(migrationPath, 'utf8');
  const requiredSnippets = [
    'create or replace function internal.role_requires_mfa(p_role public.app_role)',
    'create or replace function internal.current_user_requires_mfa()',
    'create or replace function internal.assert_mfa_requirement_satisfied()',
    'create or replace function internal.assert_sensitive_action_allowed(',
    'create or replace function internal.enforce_user_profiles_mfa_rules()',
    'create trigger user_profiles_enforce_mfa_rules',
    'create or replace function internal.enforce_user_roles_mfa_rules()',
    'create trigger user_roles_enforce_mfa_rules',
    "'owner'::public.app_role",
    "'super_admin'::public.app_role",
    "'credential_manager'::public.app_role",
    'auth.uid()',
    'internal.has_mfa_aal()',
    'internal.has_any_role(p_required_roles)',
    'MFA/AAL2 is required for this action.',
    'revoke all on function internal.assert_sensitive_action_allowed(public.app_role[], text) from public, anon;',
  ];

  for (const snippet of requiredSnippets) {
    if (!sql.includes(snippet)) {
      errors.push(`Migration missing required SQL snippet: ${snippet}`);
    }
  }

  const forbiddenPatterns = [
    [/p_actor/i, 'AUTH-006 helpers must not accept actor ID parameters.'],
    [/create\s+table\s+public\./i, 'AUTH-006 must not create public tables.'],
    [/create\s+type\s+public\./i, 'AUTH-006 must not create public types.'],
    [
      /create\s+(?:table|view|trigger|index|policy)\s+(?:if\s+not\s+exists\s+)?(?:public\.)?(?:programme|learner|credential|gmail|leeloo)/i,
      'AUTH-006 must not create future module objects or integrations.',
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
    [/select\s+plan\(8\);/i, 'select plan(8);'],
    [/select\s+has_function\(\s*'internal'\s*,\s*'role_requires_mfa'/i, "select has_function('internal', 'role_requires_mfa'"],
    [/select\s+has_function\(\s*'internal'\s*,\s*'current_user_requires_mfa'/i, "select has_function('internal', 'current_user_requires_mfa'"],
    [/select\s+has_function\(\s*'internal'\s*,\s*'assert_mfa_requirement_satisfied'/i, "select has_function('internal', 'assert_mfa_requirement_satisfied'"],
    [/select\s+has_function\(\s*'internal'\s*,\s*'assert_sensitive_action_allowed'/i, "select has_function('internal', 'assert_sensitive_action_allowed'"],
    [/select\s+has_function\(\s*'internal'\s*,\s*'enforce_user_profiles_mfa_rules'/i, "select has_function('internal', 'enforce_user_profiles_mfa_rules'"],
    [/select\s+has_function\(\s*'internal'\s*,\s*'enforce_user_roles_mfa_rules'/i, "select has_function('internal', 'enforce_user_roles_mfa_rules'"],
    [/select\s+has_trigger\(\s*'public'\s*,\s*'user_profiles'\s*,\s*'user_profiles_enforce_mfa_rules'/i, "select has_trigger('public', 'user_profiles', 'user_profiles_enforce_mfa_rules'"],
    [/select\s+has_trigger\(\s*'public'\s*,\s*'user_roles'\s*,\s*'user_roles_enforce_mfa_rules'/i, "select has_trigger('public', 'user_roles', 'user_roles_enforce_mfa_rules'"],
    [/select\s+\*\s+from\s+finish\(\);/i, 'select * from finish();'],
  ];

  for (const [pattern, label] of requiredTestPatterns) {
    if (!pattern.test(testSql)) {
      errors.push(`AUTH-006 test missing required snippet: ${label}`);
    }
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:auth-006'] !== 'node scripts/verify-auth-006.mjs') {
    errors.push('package.json must expose verify:auth-006.');
  }
}

if (errors.length > 0) {
  console.error('AUTH-006 verification failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('AUTH-006 verification passed.');
