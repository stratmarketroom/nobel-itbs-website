import { existsSync, readFileSync } from 'node:fs';

const requiredPaths = [
  'app/api/v1/admin/me/route.ts',
  'app/api/v1/admin/users/route.ts',
  'app/api/v1/admin/users/[id]/route.ts',
  'app/api/v1/admin/users/[id]/roles/route.ts',
  'app/admin/users/page.tsx',
  'lib/supabase/server.ts',
  'lib/admin/user-management.ts',
  'lib/api/responses.ts',
  'package.json',
  'supabase/migrations/20260727154750_auth_005_admin_user_management_functions.sql',
  'supabase/tests/auth_005_admin_user_management_functions.test.sql',
];

const errors = [];

for (const path of requiredPaths) {
  if (!existsSync(path)) {
    errors.push(`Missing required path: ${path}`);
  }
}

if (existsSync('lib/supabase/server.ts')) {
  const server = readFileSync('lib/supabase/server.ts', 'utf8');
  const requiredSnippets = [
    "import 'server-only';",
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'auth.getUser()',
    'readJwtAal',
    "aal === 'aal2'",
    'assertCanManageUsers',
    'assertCanManageRoles',
    'Only Owner can change Owner or Super Admin roles.',
  ];

  for (const snippet of requiredSnippets) {
    if (!server.includes(snippet)) {
      errors.push(`Server auth helper missing required snippet: ${snippet}`);
    }
  }
}

if (existsSync('app/api/v1/admin/users/route.ts')) {
  const usersRoute = readFileSync('app/api/v1/admin/users/route.ts', 'utf8');
  const requiredSnippets = ['export async function GET', 'export async function POST', 'temporaryPassword'];

  for (const snippet of requiredSnippets) {
    if (!usersRoute.includes(snippet)) {
      errors.push(`Users route missing required snippet: ${snippet}`);
    }
  }
}

if (existsSync('app/api/v1/admin/users/[id]/roles/route.ts')) {
  const rolesRoute = readFileSync('app/api/v1/admin/users/[id]/roles/route.ts', 'utf8');
  const requiredSnippets = ['export async function PUT', 'export async function DELETE', 'assertCanManageRoles'];

  for (const snippet of requiredSnippets) {
    if (!rolesRoute.includes(snippet)) {
      errors.push(`Roles route missing required snippet: ${snippet}`);
    }
  }
}

if (existsSync('lib/admin/user-management.ts')) {
  const userManagement = readFileSync('lib/admin/user-management.ts', 'utf8');
  const requiredSnippets = [
    'getSupabaseRequestClient(context.accessToken)',
    "rpc('create_admin_profile'",
    "rpc('update_admin_profile'",
    "rpc('assign_admin_roles'",
    "rpc('remove_admin_roles'",
  ];

  for (const snippet of requiredSnippets) {
    if (!userManagement.includes(snippet)) {
      errors.push(`User management service missing required snippet: ${snippet}`);
    }
  }

  if (/console\.log|console\.error/.test(userManagement)) {
    errors.push('User management code must not log user-management data.');
  }
}

if (existsSync('supabase/migrations/20260727154750_auth_005_admin_user_management_functions.sql')) {
  const migration = readFileSync('supabase/migrations/20260727154750_auth_005_admin_user_management_functions.sql', 'utf8');
  const requiredSnippets = [
    'security definer',
    'internal.assert_sensitive_action_allowed',
    'revoke all on function public.create_admin_profile',
    'grant execute on function public.create_admin_profile',
    'grant execute on function public.assign_admin_roles',
  ];

  for (const snippet of requiredSnippets) {
    if (!migration.includes(snippet)) {
      errors.push(`AUTH-005 migration missing required snippet: ${snippet}`);
    }
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (!pkg.dependencies?.['@supabase/supabase-js']) {
    errors.push('package.json must include @supabase/supabase-js.');
  }

  if (pkg.scripts?.['verify:auth-005'] !== 'node scripts/verify-auth-005.mjs') {
    errors.push('package.json must expose verify:auth-005.');
  }
}

if (errors.length > 0) {
  console.error('AUTH-005 verification failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('AUTH-005 verification passed.');
