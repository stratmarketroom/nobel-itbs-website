import { existsSync, readFileSync } from 'node:fs';

const files = {
  migration: 'supabase/migrations/20260829140000_adm_eml_001_email_template_management.sql',
  test: 'supabase/tests/database/adm_eml_001_email_template_management.test.sql',
  page: 'app/admin/email-templates/page.tsx',
  component: 'components/admin-email-templates.tsx',
  collectionRoute: 'app/api/v1/admin/email-templates/route.ts',
  itemRoute: 'app/api/v1/admin/email-templates/[id]/route.ts',
  service: 'lib/email-templates/admin.ts',
  input: 'lib/email-templates/input.ts',
  types: 'lib/email-templates/types.ts',
  server: 'lib/supabase/server.ts',
  shell: 'components/admin-shell.tsx',
  styles: 'app/globals.css',
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
    'public.update_email_template',
    'internal.audit_email_template_change',
    "'email_template.updated'",
    "array['owner', 'super_admin', 'credential_manager']",
    'internal.assert_sensitive_action_allowed',
    'subject_changed',
    'body_changed',
    'updated_by = v_actor_id',
    'from public, anon, authenticated',
    'to authenticated, postgres, service_role',
  ]) {
    if (!source.migration.includes(snippet)) errors.push(`Migration missing required behavior: ${snippet}`);
  }

  for (const forbidden of [
    /array\[[^\]]*content_manager[^\]]*\]/i,
    /p_metadata\s*=>[\s\S]{0,500}'(?:subject|body)'\s*,\s*(?:new|old)\./i,
    /grant\s+(?:insert|update|delete)[^;]*email_templates[^;]*to\s+authenticated/i,
    /(?:recipient_email|verification_token|storage_path)/i,
  ]) {
    if (forbidden.test(source.migration)) errors.push(`Migration contains forbidden email-template behavior: ${forbidden}`);
  }

  for (const snippet of [
    'assertCanManageEmailTemplates(context)',
    "getSupabaseRequestClient(context.accessToken)",
    ".from('email_templates')",
    ".rpc('update_email_template'",
    "'credential_delivery'",
    "['en', 'ua']",
  ]) {
    if (!source.service.includes(snippet)) errors.push(`Server module missing protected template behavior: ${snippet}`);
  }

  for (const snippet of [
    'getAdminContext(request)',
    'listEmailTemplates(context)',
    'jsonError(error)',
  ]) {
    if (!source.collectionRoute.includes(snippet)) errors.push(`Collection route missing: ${snippet}`);
  }

  for (const snippet of [
    'getAdminContext(request)',
    'assertUuid',
    'readEmailTemplateUpdate(request)',
    'updateEmailTemplate(',
    'jsonError(error)',
  ]) {
    if (!source.itemRoute.includes(snippet)) errors.push(`Item route missing: ${snippet}`);
  }

  for (const snippet of [
    "assertKeys(body, ['subject', 'body'])",
    'Email subject must stay on one line.',
    '20000',
  ]) {
    if (!source.input.includes(snippet)) errors.push(`Request validation missing: ${snippet}`);
  }

  for (const snippet of [
    'Email templates',
    'Owner, Super Admin, Credential Manager. MFA required.',
    'Credential delivery',
    'Available placeholders',
    '{{verification_url}}',
    'Save template',
    'Reset changes',
    "role=\"tablist\"",
    "role=\"tabpanel\"",
    "role={notice.kind === 'error' ? 'alert' : 'status'}",
  ]) {
    if (!source.component.includes(snippet)) errors.push(`Admin UI missing: ${snippet}`);
  }

  if (/SUPABASE_SERVICE_ROLE_KEY|console\.(?:log|info|warn|error)/.test(source.component)) {
    errors.push('Email-template client must not expose server secrets or log protected content.');
  }

  for (const snippet of [
    "href: '/admin/email-templates'",
    "roles: ['owner', 'super_admin', 'credential_manager']",
  ]) {
    if (!source.shell.includes(snippet)) errors.push(`Admin navigation missing: ${snippet}`);
  }

  for (const snippet of [
    'assertCanManageEmailTemplates',
    'MFA/AAL2 is required for email template management.',
  ]) {
    if (!source.server.includes(snippet)) errors.push(`Server authorization missing: ${snippet}`);
  }

  for (const snippet of [
    '.email-template-workspace',
    '.email-template-language-bar',
    '.email-template-editor',
    '.email-template-actions',
    '@media (max-width: 480px)',
    '@media (prefers-reduced-motion: reduce)',
  ]) {
    if (!source.styles.includes(snippet)) errors.push(`Responsive admin styling missing: ${snippet}`);
  }

  const plan = source.test.match(/select\s+plan\((\d+)\)/i)?.[1];
  const assertions = [...source.test.matchAll(/^select\s+(?:results_eq|has_function|has_trigger|lives_ok|throws_ok)\s*\(/gim)].length;
  if (Number(plan) !== assertions) {
    errors.push(`pgTAP plan mismatch: plan(${plan ?? 'missing'}) but found ${assertions} assertions.`);
  }

  for (const snippet of [
    'Credential Manager with AAL2',
    'Content Manager should be denied',
    'Credential Manager at AAL1',
    'one audit event',
    'should not copy email subject or body text',
  ]) {
    if (!source.test.includes(snippet)) errors.push(`Database test missing coverage: ${snippet}`);
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:adm-eml-001'] !== 'node scripts/verify-adm-eml-001.mjs') {
    errors.push('package.json must expose verify:adm-eml-001.');
  }
}

if (errors.length) {
  console.error('ADM-EML-001 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('ADM-EML-001 static verification passed.');
