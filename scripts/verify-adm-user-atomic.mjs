import { existsSync, readFileSync } from 'node:fs';

const files = {
  migration: 'supabase/migrations/20260901100000_adm_user_atomic_profile_roles.sql',
  test: 'supabase/tests/database/adm_user_atomic_profile_roles.test.sql',
  route: 'app/api/v1/admin/users/[id]/route.ts',
  component: 'components/admin-user-management.tsx',
  service: 'lib/admin/user-management.ts',
  server: 'lib/supabase/server.ts',
};

const errors = [];
const source = {};

for (const [name, path] of Object.entries(files)) {
  if (!existsSync(path)) errors.push(`Missing ADM-USER-ATOMIC file: ${path}`);
  source[name] = existsSync(path) ? readFileSync(path, 'utf8') : '';
}

for (const snippet of [
  'public.update_admin_user_atomic',
  'security definer',
  'set search_path = internal, public, pg_temp',
  'for update',
  'internal.assert_sensitive_action_allowed',
  'delete from public.user_roles',
  'insert into public.user_roles',
  'v_effective_mfa_required',
  'Owner role cannot be changed through this user update.',
  'from public, anon',
  'to authenticated, service_role',
]) {
  if (!source.migration.includes(snippet)) errors.push(`Atomic migration missing: ${snippet}`);
}

for (const functionName of ['assign_admin_roles', 'remove_admin_roles']) {
  const functionStart = source.migration.indexOf(`function public.${functionName}(`);
  const functionEnd = source.migration.indexOf('$$;', functionStart);
  const functionSource = source.migration.slice(functionStart, functionEnd);
  if (functionStart < 0 || !functionSource.includes('for update')) {
    errors.push(`${functionName} must serialize on the target profile row.`);
  }
}

for (const snippet of [
  'updateAdminUserAtomic',
  'normalizeRoles([...target.roles, ...body.roles])',
  "body.roles.every(isValidAppRole)",
  'Owner role cannot be changed through this user update.',
  'return jsonOk({ user })',
]) {
  if (!source.route.includes(snippet)) errors.push(`Atomic user route missing: ${snippet}`);
}

for (const snippet of [
  'export async function updateAdminUserAtomic',
  ".rpc('update_admin_user_atomic'",
  'p_full_name: input.fullName',
  'p_roles: input.roles',
  "error.code === '42501'",
]) {
  if (!source.service.includes(snippet)) errors.push(`Atomic user service missing: ${snippet}`);
}

for (const snippet of [
  "method: 'PATCH'",
  'fullName: editor.fullName.trim() || null',
  'isActive: editor.isActive',
  'mfaRequired: editor.mfaRequired',
  'roles: editor.roles',
  'User changes could not be saved.',
]) {
  if (!source.component.includes(snippet)) errors.push(`Atomic user UI missing: ${snippet}`);
}

if (source.component.includes('/roles`')) {
  errors.push('User Save must not call the legacy role endpoint separately.');
}

if (/SUPABASE_SERVICE_ROLE_KEY|console\.(?:log|info|warn|error)/.test(source.component)) {
  errors.push('User-management client must not expose server secrets or log protected user data.');
}

const plan = source.test.match(/select\s+plan\((\d+)\)/i)?.[1];
const assertions = [...source.test.matchAll(/^select\s+(?:results_eq|has_function|lives_ok|throws_ok)\s*\(/gim)].length;
if (Number(plan) !== assertions) {
  errors.push(`pgTAP plan mismatch: plan(${plan ?? 'missing'}) but found ${assertions} assertions.`);
}

for (const snippet of [
  'failure after role deletion begins should roll the deleted role back',
  'unchanged retry should not add audit noise',
  'Super Admin should not change a Super Admin account',
  'Super Admin at AAL1 should be denied',
  'Content Manager should be denied',
]) {
  if (!source.test.includes(snippet)) errors.push(`Atomic database test missing: ${snippet}`);
}

if (!source.server.includes('assertCanManageRoles') || !source.server.includes('MFA/AAL2 is required for user management.')) {
  errors.push('Shared Owner/Super Admin and MFA authorization must remain present.');
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:adm-user-atomic'] !== 'node scripts/verify-adm-user-atomic.mjs') {
    errors.push('package.json must expose verify:adm-user-atomic.');
  }
}

if (errors.length) {
  console.error('ADM-USER-ATOMIC verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('ADM-USER-ATOMIC static verification passed.');
