import { existsSync, readFileSync } from 'node:fs';

const migrationPath = 'supabase/migrations/20260727111852_auth_001_user_profiles.sql';
const testPath = 'supabase/tests/database/auth_001_user_profiles.test.sql';
const errors = [];

for (const path of [migrationPath, testPath]) {
  if (!existsSync(path)) {
    errors.push(`Missing required path: ${path}`);
  }
}

if (existsSync(migrationPath)) {
  const sql = readFileSync(migrationPath, 'utf8');
  const requiredSnippets = [
    'create table if not exists public.user_profiles',
    'id uuid primary key references auth.users(id) on delete cascade',
    'is_active boolean not null default true',
    'is_owner boolean not null default false',
    'mfa_required boolean not null default false',
    'constraint user_profiles_owner_requires_mfa',
    'create unique index if not exists user_profiles_one_active_owner_idx',
    'where is_owner and is_active',
    'alter table public.user_profiles enable row level security;',
    'alter table public.user_profiles force row level security;',
    'execute function internal.set_updated_at();',
    'create or replace function internal.audit_user_profiles_change()',
    'set search_path = internal, public, pg_temp',
    'internal.write_audit_log',
    'revoke all on table public.user_profiles from public, anon, authenticated;',
  ];

  for (const snippet of requiredSnippets) {
    if (!sql.includes(snippet)) {
      errors.push(`Migration missing required SQL snippet: ${snippet}`);
    }
  }

  const forbiddenPatterns = [
    [/create\s+type\s+public\.app_role/i, 'AUTH-001 must not create app_role enum.'],
    [/create\s+table\s+public\.user_roles/i, 'AUTH-001 must not create user_roles.'],
    [/create\s+table\s+public\.(?:programme|learner|credential)/i, 'AUTH-001 must not create future module tables.'],
    [/gmail|leeloo/i, 'AUTH-001 must not include integrations.'],
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
    [/select\s+plan\(11\);/i, 'select plan(11);'],
    [/select\s+has_table\(\s*'public'\s*,\s*'user_profiles'/i, "select has_table('public', 'user_profiles'"],
    [/select\s+col_is_pk\(\s*'public'\s*,\s*'user_profiles'\s*,\s*'id'/i, "select col_is_pk('public', 'user_profiles', 'id'"],
    [/select\s+has_index\(\s*'public'\s*,\s*'user_profiles'\s*,\s*'user_profiles_one_active_owner_idx'/i, "select has_index('public', 'user_profiles', 'user_profiles_one_active_owner_idx'"],
    [/select\s+has_trigger\(\s*'public'\s*,\s*'user_profiles'\s*,\s*'user_profiles_set_updated_at'/i, "select has_trigger('public', 'user_profiles', 'user_profiles_set_updated_at'"],
    [/select\s+has_trigger\(\s*'public'\s*,\s*'user_profiles'\s*,\s*'user_profiles_audit_changes'/i, "select has_trigger('public', 'user_profiles', 'user_profiles_audit_changes'"],
    [/select\s+\*\s+from\s+finish\(\);/i, 'select * from finish();'],
  ];

  for (const [pattern, label] of requiredTestPatterns) {
    if (!pattern.test(testSql)) {
      errors.push(`AUTH-001 test missing required snippet: ${label}`);
    }
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:auth-001'] !== 'node scripts/verify-auth-001.mjs') {
    errors.push('package.json must expose verify:auth-001.');
  }
}

if (errors.length > 0) {
  console.error('AUTH-001 verification failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('AUTH-001 verification passed.');
