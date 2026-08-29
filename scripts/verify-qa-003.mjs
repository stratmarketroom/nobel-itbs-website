import { existsSync, readFileSync, readdirSync } from 'node:fs';

const files = {
  test: 'supabase/tests/database/qa_003_mfa_matrix.test.sql',
  authMigration: 'supabase/migrations/20260727145835_auth_006_mfa_enforcement.sql',
  roleHelpers: 'supabase/migrations/20260727145222_auth_004_role_helpers.sql',
  server: 'lib/supabase/server.ts',
};
const errors = [];

for (const path of Object.values(files)) {
  if (!existsSync(path)) errors.push(`Missing required path: ${path}`);
}

if (!errors.length) {
  const source = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, readFileSync(path, 'utf8')]));
  const migrations = readdirSync('supabase/migrations')
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .map((name) => readFileSync(`supabase/migrations/${name}`, 'utf8'))
    .join('\n');

  for (const snippet of [
    "role === 'owner' || role === 'super_admin' || role === 'credential_manager'",
    "const mfaSatisfied = !profile.mfa_required && !roleRequiresMfa ? true : aal === 'aal2';",
    "readJwtAal(accessToken)",
    "MFA/AAL2 is required for user management.",
    "MFA/AAL2 is required for contact submissions.",
    "MFA/AAL2 is required for learner management.",
    "MFA/AAL2 is required for credential management.",
    "MFA/AAL2 is required for email template management.",
    "MFA/AAL2 is required for content management.",
    "MFA/AAL2 is required for site settings.",
  ]) {
    if (!source.server.includes(snippet)) errors.push(`Server MFA boundary missing: ${snippet}`);
  }

  if (/role\s*===\s*['"]content_manager['"]/.test(
    source.server.match(/export function requiresMfaForRole[\s\S]*?\n\}/)?.[0] ?? '',
  )) errors.push('Content Manager must remain MFA-optional unless the profile is explicitly marked mfa_required.');

  for (const snippet of [
    "'owner'::public.app_role",
    "'super_admin'::public.app_role",
    "'credential_manager'::public.app_role",
    'internal.assert_mfa_requirement_satisfied()',
    'internal.has_mfa_aal()',
    'internal.has_any_role(p_required_roles)',
    'user_profiles_enforce_mfa_rules',
    'user_roles_enforce_mfa_rules',
  ]) {
    if (!source.authMigration.includes(snippet)) errors.push(`AUTH-006 foundation missing: ${snippet}`);
  }

  for (const snippet of ['auth.uid()', "auth.jwt() ->> 'aal' = 'aal2'", 'profile.is_active', 'profile.mfa_required']) {
    if (!source.roleHelpers.includes(snippet)) errors.push(`Role helper MFA boundary missing: ${snippet}`);
  }

  const requiredGuardedModules = {
    'lib/contact/admin.ts': 'assertCanAccessContactSubmissions(context)',
    'lib/content/admin.ts': 'assertCanManageContent(context)',
    'lib/content/site-settings.ts': 'assertCanManageSiteSettings(context)',
    'lib/learners/admin.ts': 'assertCanManageLearners(context)',
    'lib/credentials/admin.ts': 'assertCanManageCredentials(context)',
    'lib/credentials/workspace.ts': 'assertCanManageCredentials(context)',
    'lib/credentials/files.ts': 'assertCanManageCredentials(context)',
    'lib/credentials/generation.ts': 'assertCanManageCredentials(context)',
    'lib/credentials/batch-generation.ts': 'assertCanManageCredentials(context)',
    'lib/credentials/activation.ts': 'assertCanManageCredentials(context)',
    'lib/credentials/public-data.ts': 'assertCanManageCredentials(context)',
    'lib/credentials/revoke.ts': 'assertCanManageCredentials(context)',
    'lib/credentials/void.ts': 'assertCanManageCredentials(context)',
    'lib/email-templates/admin.ts': 'assertCanManageEmailTemplates(context)',
    'lib/credential-templates/admin.ts': 'assertCanManageCredentialTemplates(context)',
    'lib/credential-templates/storage.ts': 'assertCanManageCredentialTemplates(context)',
    'lib/programmes/admin.ts': 'assertCanManageContent(context)',
    'lib/partnerships/admin.ts': 'assertCanManageContent(context)',
  };
  for (const [path, guard] of Object.entries(requiredGuardedModules)) {
    if (!existsSync(path)) errors.push(`Missing protected admin module: ${path}`);
    else if (!readFileSync(path, 'utf8').includes(guard)) errors.push(`${path} must call ${guard}.`);
  }

  for (const route of readdirSync('app/api/v1/admin', { recursive: true })) {
    const path = `app/api/v1/admin/${route}`;
    if (!path.endsWith('/route.ts') && !path.endsWith('admin/route.ts')) continue;
    const routeSource = readFileSync(path, 'utf8');
    if (!routeSource.includes('getAdminContext(request)')) errors.push(`Admin route does not establish actor/MFA context: ${path}`);
  }

  for (const snippet of [
    'internal.is_mfa_requirement_satisfied()',
    'internal.assert_sensitive_action_allowed(',
    'internal.require_credential_file_mutation(',
  ]) {
    if (!migrations.includes(snippet)) errors.push(`Migration chain missing MFA enforcement path: ${snippet}`);
  }

  const plan = source.test.match(/select\s+plan\((\d+)\)/i)?.[1];
  const assertions = [...source.test.matchAll(/^select\s+(?:results_eq|has_trigger)\s*\(/gim)].length;
  if (Number(plan) !== assertions) errors.push(`pgTAP plan mismatch: plan(${plan ?? 'missing'}) but found ${assertions} assertions.`);

  for (const required of [
    'owner', 'super_admin', 'content_manager', 'credential_manager',
    'aal1', 'aal2', 'site_settings', 'email_templates', 'create_pending_credential',
    'activate_credential', 'resend_credential', 'revoke_credential', 'void_pending_credential',
    'update_valid_credential_public_data', 'require_credential_file_mutation',
    'can_manage_credential_templates', 'assert_single_generation_actor',
    'assert_batch_generation_actor', 'prepare_credential_generation_batch_activation',
  ]) {
    if (!source.test.includes(required)) errors.push(`QA-003 matrix missing coverage: ${required}`);
  }

  for (const root of ['app', 'components']) {
    for (const relative of readdirSync(root, { recursive: true })) {
      const path = `${root}/${relative}`;
      if (!existsSync(path) || !/\.(?:ts|tsx|js|jsx)$/.test(path)) continue;
      const clientSource = readFileSync(path, 'utf8');
      if (/^['\"]use client['\"];?/m.test(clientSource) && /SUPABASE_SERVICE_ROLE_KEY|SUPABASE_DB_PASSWORD|SUPABASE_ACCESS_TOKEN/.test(clientSource)) {
        errors.push(`Server secret referenced by client module: ${path}`);
      }
      if (/console\.(?:log|info|warn|error)\([^\n]*(?:totp|mfa|factor|accessToken)/i.test(clientSource)) {
        errors.push(`Possible MFA/session logging in client module: ${path}`);
      }
    }
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:qa-003'] !== 'node scripts/verify-qa-003.mjs') errors.push('package.json must expose verify:qa-003.');
}

if (errors.length) {
  console.error('QA-003 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('QA-003 static MFA verification passed.');
