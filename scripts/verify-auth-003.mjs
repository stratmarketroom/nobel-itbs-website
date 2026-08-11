import { existsSync, readFileSync } from 'node:fs';

const migrationPath = 'supabase/migrations/20260727114756_auth_003_owner_rules.sql';
const hardeningMigrationPath = 'supabase/migrations/20260727171000_auth_003_owner_minimum_guard.sql';
const testPath = 'supabase/tests/database/auth_003_owner_rules.test.sql';
const errors = [];

for (const path of [migrationPath, hardeningMigrationPath, testPath]) {
  if (!existsSync(path)) {
    errors.push(`Missing required path: ${path}`);
  }
}

if (existsSync(migrationPath)) {
  const sql = readFileSync(migrationPath, 'utf8');
  const requiredSnippets = [
    'create or replace function internal.enforce_user_profiles_owner_rules()',
    'create trigger user_profiles_enforce_owner_rules',
    'create unique index if not exists user_roles_one_owner_role_idx',
    'create or replace function internal.enforce_user_roles_owner_rules()',
    'create trigger user_roles_enforce_owner_rules',
    'set search_path = internal, public, pg_temp',
    'auth.uid()',
    "role in ('owner'::public.app_role, 'super_admin'::public.app_role)",
    'Only an active Owner can change Owner profile fields.',
    'Only an active Owner can change Owner or Super Admin role assignments.',
    'First active Owner bootstrap is allowed.',
    'First Owner role bootstrap is allowed',
    'Owner role requires an active Owner profile with MFA required.',
    'revoke all on function internal.enforce_user_profiles_owner_rules() from public, anon, authenticated;',
    'revoke all on function internal.enforce_user_roles_owner_rules() from public, anon, authenticated;',
  ];

  for (const snippet of requiredSnippets) {
    if (!sql.includes(snippet)) {
      errors.push(`Migration missing required SQL snippet: ${snippet}`);
    }
  }

  const forbiddenPatterns = [
    [/create\s+table\s+public\./i, 'AUTH-003 must not create new public tables.'],
    [/create\s+type\s+public\./i, 'AUTH-003 must not create new public types.'],
    [/create\s+or\s+replace\s+function\s+(?:public|internal)\.(?:has_role|is_owner|is_active_admin|has_any_role)/i, 'AUTH-003 must not create AUTH-004 role helper functions.'],
    [/gmail|leeloo|programme|learner|credential/i, 'AUTH-003 must not include future modules or integrations.'],
  ];

  for (const [pattern, message] of forbiddenPatterns) {
    if (pattern.test(sql)) {
      errors.push(message);
    }
  }
}

if (existsSync(hardeningMigrationPath)) {
  const sql = readFileSync(hardeningMigrationPath, 'utf8');
  const requiredSnippets = [
    'At least one active Owner is required.',
    'At least one Owner role assignment is required.',
    'before insert or update or delete on public.user_profiles',
    'before insert or update or delete on public.user_roles',
    'drop trigger if exists user_profiles_enforce_owner_rules',
    'drop trigger if exists user_roles_enforce_owner_rules',
    'old.role = \'owner\'::public.app_role',
    'new.role is distinct from old.role',
    'new.user_id is distinct from old.user_id',
  ];

  for (const snippet of requiredSnippets) {
    if (!sql.includes(snippet)) {
      errors.push(`Owner minimum guard migration missing required SQL snippet: ${snippet}`);
    }
  }
}

if (existsSync(testPath)) {
  const testSql = readFileSync(testPath, 'utf8');
  const requiredTestPatterns = [
    [/select\s+plan\(5\);/i, 'select plan(5);'],
    [/select\s+has_function\(\s*'internal'\s*,\s*'enforce_user_profiles_owner_rules'/i, "select has_function('internal', 'enforce_user_profiles_owner_rules'"],
    [/select\s+has_function\(\s*'internal'\s*,\s*'enforce_user_roles_owner_rules'/i, "select has_function('internal', 'enforce_user_roles_owner_rules'"],
    [/select\s+has_trigger\(\s*'public'\s*,\s*'user_profiles'\s*,\s*'user_profiles_enforce_owner_rules'/i, "select has_trigger('public', 'user_profiles', 'user_profiles_enforce_owner_rules'"],
    [/select\s+has_trigger\(\s*'public'\s*,\s*'user_roles'\s*,\s*'user_roles_enforce_owner_rules'/i, "select has_trigger('public', 'user_roles', 'user_roles_enforce_owner_rules'"],
    [/select\s+has_index\(\s*'public'\s*,\s*'user_roles'\s*,\s*'user_roles_one_owner_role_idx'/i, "select has_index('public', 'user_roles', 'user_roles_one_owner_role_idx'"],
    [/select\s+\*\s+from\s+finish\(\);/i, 'select * from finish();'],
  ];

  for (const [pattern, label] of requiredTestPatterns) {
    if (!pattern.test(testSql)) {
      errors.push(`AUTH-003 test missing required snippet: ${label}`);
    }
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:auth-003'] !== 'node scripts/verify-auth-003.mjs') {
    errors.push('package.json must expose verify:auth-003.');
  }
}

if (errors.length > 0) {
  console.error('AUTH-003 verification failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('AUTH-003 verification passed.');
