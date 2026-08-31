import { existsSync, readFileSync } from 'node:fs';

const files = {
  page: 'app/admin/page.tsx',
  component: 'components/admin-dashboard.tsx',
  route: 'app/api/v1/admin/dashboard/route.ts',
  service: 'lib/dashboard/admin.ts',
  types: 'lib/dashboard/types.ts',
  shell: 'components/admin-shell.tsx',
  login: 'components/admin-mfa-login.tsx',
  styles: 'app/admin.css',
  apiSpec: 'docs/technical/API_SPECIFICATION_v2.md',
};

const errors = [];
for (const path of Object.values(files)) {
  if (!existsSync(path)) errors.push(`Missing required path: ${path}`);
}

if (!errors.length) {
  const source = Object.fromEntries(
    Object.entries(files).map(([key, path]) => [key, readFileSync(path, 'utf8')]),
  );

  for (const snippet of [
    'getAdminContext(request)',
    'getAdminDashboardSummary(context)',
    'jsonError(error)',
  ]) if (!source.route.includes(snippet)) errors.push(`Dashboard route missing: ${snippet}`);

  for (const snippet of [
    "const contentRoles: AppRole[] = ['owner', 'super_admin', 'content_manager']",
    "const operationsRoles: AppRole[] = ['owner', 'super_admin', 'credential_manager']",
    'context.roles.some(requiresMfaForRole)',
    'getSupabaseRequestClient(context.accessToken)',
    "from('content_page_translations')",
    "from('programme_translations')",
    "from('contact_submissions')",
    "from('learners')",
    "from('credentials')",
    "eq('status', 'pending')",
    "eq('status', 'valid')",
    "eq('status', 'revoked')",
    "eq('status', 'voided')",
  ]) if (!source.service.includes(snippet)) errors.push(`Dashboard service missing: ${snippet}`);

  if (/getSupabaseAdminClient|SUPABASE_SERVICE_ROLE_KEY/.test(source.service)) {
    errors.push('Dashboard summary must use the caller JWT and RLS, not the service role.');
  }

  const selectedColumns = [...source.service.matchAll(/\.select\((['"`])([^'"`]*)\1/g)]
    .map((match) => match[2]).join(',');
  for (const sensitive of ['public_holder_name', 'email', 'phone', 'message', 'internal_note', 'verification_token']) {
    if (selectedColumns.includes(sensitive) || source.types.includes(sensitive)) {
      errors.push(`Dashboard summary must not select or return private row field: ${sensitive}`);
    }
  }

  for (const snippet of [
    'Operations overview',
    'Priority queues',
    'Content readiness',
    'Translations needing attention',
    'Counts follow your current role and database RLS.',
    'aria-busy="true"',
    'role="alert"',
  ]) if (!source.component.includes(snippet)) errors.push(`Dashboard UI missing: ${snippet}`);

  for (const snippet of [
    "href: '/admin', label: 'Dashboard'",
    "roles: ['owner', 'super_admin', 'content_manager', 'credential_manager']",
    "href === '/admin'",
    'matchesAdminRoute(pathname, item.href)',
  ]) if (!source.shell.includes(snippet)) errors.push(`Admin shell missing: ${snippet}`);

  if ((source.login.match(/router\.push\('\/admin'\)/g) ?? []).length !== 3) {
    errors.push('All successful login/MFA paths must route to the role-safe dashboard.');
  }
  if (source.login.includes("router.push('/admin/users')")) {
    errors.push('Login must not send every role to Owner/Super Admin-only user management.');
  }

  for (const snippet of [
    '.dashboard-admin-shell',
    '.dashboard-loading',
    '.dashboard-sections',
    '.dashboard-actions',
    '@media (max-width: 620px)',
    '@media (prefers-reduced-motion: reduce)',
  ]) if (!source.styles.includes(snippet)) errors.push(`Dashboard styles missing: ${snippet}`);

  if (!/\.dashboard-admin-header > button,[\s\S]*?min-height:\s*3rem;/u.test(source.styles)) {
    errors.push('Dashboard refresh and retry controls must keep a 48px touch target.');
  }

  if (!source.apiSpec.includes('GET /api/v1/admin/dashboard')) {
    errors.push('v2 API specification must document the dashboard summary route.');
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:adm-dsh-001'] !== 'node scripts/verify-adm-dsh-001.mjs') {
    errors.push('package.json must expose verify:adm-dsh-001.');
  }
}

if (errors.length) {
  console.error('ADM-DSH-001 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('ADM-DSH-001 static verification passed.');
