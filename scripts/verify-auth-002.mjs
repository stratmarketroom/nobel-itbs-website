import { existsSync, readFileSync } from 'node:fs';

const migrationPath = 'supabase/migrations/20260727112603_auth_002_multi_role_model.sql';
const testPath = 'supabase/tests/database/auth_002_multi_role_model.test.sql';
const errors = [];

for (const path of [migrationPath, testPath]) {
  if (!existsSync(path)) {
    errors.push(`Missing required path: ${path}`);
  }
}

if (existsSync(migrationPath)) {
  const sql = readFileSync(migrationPath, 'utf8');
  const requiredSnippets = [
    'create type public.app_role as enum',
    "'owner'",
    "'super_admin'",
    "'content_manager'",
    "'credential_manager'",
    'create table if not exists public.user_roles',
    'user_id uuid not null references public.user_profiles(id) on delete cascade',
    'role public.app_role not null',
    'assigned_by uuid null references public.user_profiles(id) on delete set null',
    'assigned_at timestamptz not null default now()',
    'primary key (user_id, role)',
    'alter table public.user_roles enable row level security;',
    'alter table public.user_roles force row level security;',
    'create or replace function internal.audit_user_roles_change()',
    'set search_path = internal, public, pg_temp',
    'internal.write_audit_log',
    'revoke all on table public.user_roles from public, anon, authenticated;',
  ];

  for (const snippet of requiredSnippets) {
    if (!sql.includes(snippet)) {
      errors.push(`Migration missing required SQL snippet: ${snippet}`);
    }
  }

  const forbiddenPatterns = [
    [/create\s+table\s+public\.(?!user_roles\b)/i, 'AUTH-002 must not create non-user_roles public tables.'],
    [/create\s+table\s+public\.(?:programme|learner|credential)/i, 'AUTH-002 must not create future module tables.'],
    [/has_role|is_owner|is_active_admin/i, 'AUTH-002 must not create role helper functions.'],
    [/gmail|leeloo/i, 'AUTH-002 must not include integrations.'],
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
    [/select\s+plan\(10\);/i, 'select plan(10);'],
    [/select\s+has_type\(\s*'public'\s*,\s*'app_role'/i, "select has_type('public', 'app_role'"],
    [/select\s+has_table\(\s*'public'\s*,\s*'user_roles'/i, "select has_table('public', 'user_roles'"],
    [/select\s+col_is_pk\(\s*'public'\s*,\s*'user_roles'\s*,\s*array\['user_id',\s*'role'\]/i, "select col_is_pk('public', 'user_roles', array['user_id', 'role']"],
    [/select\s+has_trigger\(\s*'public'\s*,\s*'user_roles'\s*,\s*'user_roles_audit_changes'/i, "select has_trigger('public', 'user_roles', 'user_roles_audit_changes'"],
    [/select\s+\*\s+from\s+finish\(\);/i, 'select * from finish();'],
  ];

  for (const [pattern, label] of requiredTestPatterns) {
    if (!pattern.test(testSql)) {
      errors.push(`AUTH-002 test missing required snippet: ${label}`);
    }
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:auth-002'] !== 'node scripts/verify-auth-002.mjs') {
    errors.push('package.json must expose verify:auth-002.');
  }
}

if (errors.length > 0) {
  console.error('AUTH-002 verification failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('AUTH-002 verification passed.');
