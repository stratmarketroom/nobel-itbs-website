import { existsSync, readFileSync } from 'node:fs';

const files = {
  migration: 'supabase/migrations/20260829160000_adm_aud_001_global_audit_read.sql',
  test: 'supabase/tests/database/adm_aud_001_global_audit_read.test.sql',
  aggregateRlsTest: 'supabase/tests/database/qa_001_rls_matrix.test.sql',
  page: 'app/admin/audit-history/page.tsx',
  component: 'components/admin-audit-history.tsx',
  collectionRoute: 'app/api/v1/admin/audit-events/route.ts',
  itemRoute: 'app/api/v1/admin/audit-events/[id]/route.ts',
  service: 'lib/audit/admin.ts',
  input: 'lib/audit/input.ts',
  types: 'lib/audit/types.ts',
  server: 'lib/supabase/server.ts',
  shell: 'components/admin-shell.tsx',
  styles: 'app/admin.css',
  apiSpec: 'docs/technical/API_SPECIFICATION_v2.md',
};

const errors = [];
for (const path of Object.values(files)) if (!existsSync(path)) errors.push(`Missing required path: ${path}`);

if (!errors.length) {
  const source = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, readFileSync(path, 'utf8')]));

  for (const snippet of [
    'grant select on table public.audit_log to authenticated',
    'audit_log_owner_super_admin_read',
    "array['owner', 'super_admin']",
    'internal.is_mfa_requirement_satisfied()',
    'grant select (id, full_name) on table public.user_profiles to authenticated',
    'user_profiles_audit_actor_read',
  ]) if (!source.migration.includes(snippet)) errors.push(`Audit read migration missing: ${snippet}`);

  for (const forbidden of [
    /array\[[^\]]*(?:content_manager|credential_manager)[^\]]*\]/i,
    /grant\s+(?:insert|update|delete)[^;]*audit_log[^;]*to\s+authenticated/i,
    /grant\s+select\s+on\s+table\s+public\.user_profiles\s+to\s+authenticated/i,
  ]) if (forbidden.test(source.migration)) errors.push(`Migration broadens protected access: ${forbidden}`);

  for (const snippet of [
    'assertCanViewGlobalAudit(context)',
    'getSupabaseRequestClient(context.accessToken)',
    "from('audit_log')",
    "from('user_profiles').select('id, full_name')",
    'safeMetadata(',
    'hiddenCount',
    'safeIdentifierKeys',
    'safeBooleanKeys',
    'safeNumberKeys',
    'safeStringKeys',
  ]) if (!source.service.includes(snippet)) errors.push(`Audit service missing: ${snippet}`);

  if (/getSupabaseAdminClient|SUPABASE_SERVICE_ROLE_KEY/.test(source.service)) {
    errors.push('Global Audit/History must read through caller JWT and RLS.');
  }
  for (const forbidden of ['request_id', 'ip_hash', 'user_agent_hash']) {
    if (source.service.includes(forbidden) || source.types.includes(forbidden)) {
      errors.push(`Audit API must not expose transport/security field: ${forbidden}`);
    }
  }

  for (const snippet of ['getAdminContext(request)', 'readAuditFilters(request.url)', 'listAuditEvents(context', 'jsonError(error)']) {
    if (!source.collectionRoute.includes(snippet)) errors.push(`Audit collection route missing: ${snippet}`);
  }
  for (const snippet of ['getAdminContext(request)', 'assertAuditId(id)', 'getAuditEvent(context', 'jsonError(error)']) {
    if (!source.itemRoute.includes(snippet)) errors.push(`Audit detail route missing: ${snippet}`);
  }

  for (const snippet of [
    'Audit / History', 'Owner and Super Admin only. MFA required.', 'Action contains',
    'Safe event context', 'Privacy-projected', 'Append-only record.',
    'role="alert"', 'aria-busy="true"', 'aria-pressed={selectedId === event.id}',
  ]) if (!source.component.includes(snippet)) errors.push(`Audit UI missing: ${snippet}`);

  for (const snippet of [
    "href: '/admin/audit-history'", "roles: ['owner', 'super_admin']",
  ]) if (!source.shell.includes(snippet)) errors.push(`Audit navigation missing: ${snippet}`);

  for (const snippet of ['assertCanViewGlobalAudit', 'Owner or Super Admin role is required', 'MFA/AAL2 is required']) {
    if (!source.server.includes(snippet)) errors.push(`Server authorization missing: ${snippet}`);
  }

  for (const snippet of [
    '.audit-admin-shell', '.audit-filters', '.audit-workspace', '.audit-row',
    '.audit-detail', '.audit-pagination', '@media (max-width: 620px)',
    '@media (prefers-reduced-motion: reduce)',
  ]) if (!source.styles.includes(snippet)) errors.push(`Audit styles missing: ${snippet}`);

  if (!/\.audit-filter-actions button,[\s\S]*?min-height:\s*2\.75rem;/u.test(source.styles)) {
    errors.push('Audit controls must keep a 44px minimum touch target.');
  }

  const plan = source.test.match(/select\s+plan\((\d+)\)/i)?.[1];
  const assertions = [...source.test.matchAll(/^select\s+(?:results_eq|lives_ok|throws_ok|has_[a-z_]+)\s*\(/gim)].length;
  if (Number(plan) !== assertions) errors.push(`pgTAP plan mismatch: plan(${plan ?? 'missing'}) but found ${assertions} assertions.`);
  for (const snippet of ['Owner with AAL2', 'Super Admin with AAL2', 'Content Manager cannot', 'Credential Manager cannot', 'Owner at AAL1']) {
    if (!source.test.includes(snippet)) errors.push(`Database role test missing: ${snippet}`);
  }

  for (const snippet of [
    "$$ values ('audit_log'::text) $$",
    "('audit_log_owner_super_admin_read'::text)",
    "('user_profiles_audit_actor_read'::text)",
  ]) if (!source.aggregateRlsTest.includes(snippet)) errors.push(`Aggregate RLS contract missing: ${snippet}`);

  if (!source.apiSpec.includes('GET /api/v1/admin/audit-events')) {
    errors.push('v2 API specification must document global Audit/History routes.');
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:adm-aud-001'] !== 'node scripts/verify-adm-aud-001.mjs') {
    errors.push('package.json must expose verify:adm-aud-001.');
  }
}

if (errors.length) {
  console.error('ADM-AUD-001 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('ADM-AUD-001 static verification passed.');
