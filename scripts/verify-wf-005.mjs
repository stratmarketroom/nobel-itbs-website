import { existsSync, readFileSync } from 'node:fs';

const files = {
  migration: 'supabase/migrations/20260810100000_wf_005_revoke_credential.sql',
  test: 'supabase/tests/database/wf_005_revoke_credential.test.sql',
  route: 'app/api/v1/admin/credentials/[id]/revoke/route.ts',
  service: 'lib/credentials/revoke.ts',
  input: 'lib/credentials/revoke-input.ts',
  types: 'lib/credentials/revoke-types.ts',
  component: 'components/admin-credentials.tsx',
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
    'public.revoke_credential',
    "array['owner', 'super_admin', 'credential_manager']::public.app_role[]",
    'internal.is_mfa_requirement_satisfied()',
    "nullif(btrim(p_reason), '')",
    'char_length(v_reason) > 4000',
    'for update',
    "v_credential.status <> 'valid'",
    "status = 'revoked'",
    'revoked_at = v_revoked_at',
    'revoked_by = v_actor_id',
    'revocation_reason = v_reason',
    "p_action => 'credential.revoked'",
    'internal.write_audit_log',
    'from public, anon, authenticated',
    'to authenticated, postgres, service_role',
  ]) {
    if (!source.migration.includes(snippet)) errors.push(`WF-005 migration missing required behavior: ${snippet}`);
  }

  for (const [pattern, message] of [
    [/array\[[^\]]*'content_manager'[^\]]*\]/i, 'Content Manager must not receive credential revocation access.'],
    [/update\s+public\.document_number_log/i, 'Revocation must not change or release the issued document number.'],
    [/set\s+status\s*=\s*'(?:pending|valid|voided)'/i, 'WF-005 must not implement a reverse or adjacent lifecycle transition.'],
    [/create\s+(?:or\s+replace\s+)?function\s+public\.(?:void|verify|resend)/i, 'WF-005 must not implement later credential workflows.'],
    [/p_metadata\s*=>[^;]*v_reason/is, 'The security audit metadata must not copy the free-text revocation reason.'],
  ]) {
    if (pattern.test(source.migration)) errors.push(message);
  }

  for (const snippet of [
    'export async function POST',
    'getAdminContext(request)',
    'readRevokeCredentialInput(request)',
    'revokeCredential(',
    'jsonError(error)',
  ]) {
    if (!source.route.includes(snippet)) errors.push(`WF-005 route missing protected contract: ${snippet}`);
  }

  for (const snippet of [
    "assertKeys(body, ['reason'])",
    'Revocation reason is required.',
    'reason.length > 4000',
  ]) {
    if (!source.input.includes(snippet)) errors.push(`WF-005 request validation missing: ${snippet}`);
  }

  for (const snippet of [
    'assertCanManageCredentials',
    'getSupabaseRequestClient',
    "db.rpc('revoke_credential'",
    'Only a valid credential can be revoked.',
    "status: row.credential_status",
  ]) {
    if (!source.service.includes(snippet)) errors.push(`WF-005 server workflow missing: ${snippet}`);
  }

  for (const snippet of [
    "credential.status === 'valid'",
    'Revoke credential',
    'Revocation reason',
    'maxLength={4000}',
    'This action is permanent',
    'Revoke permanently',
    "credential.status === 'revoked'",
    'credential.revocationReason',
  ]) {
    if (!source.component.includes(snippet)) errors.push(`WF-005 admin UI missing: ${snippet}`);
  }

  if (/publicStatus|verify_revoked|\/api\/v1\/verify/.test(source.migration + source.route + source.service)) {
    errors.push('WF-005 must not implement the separate public verification workflow.');
  }
  if (/console\.(?:log|info|warn|error)/.test(source.service)) {
    errors.push('Credential revocation data and failures must not be logged.');
  }

  const test = source.test.toLowerCase();
  for (const snippet of [
    'select plan(16);',
    'credential manager',
    'mfa',
    'reason',
    'valid-only',
    'concurrent',
    'audit',
    'history',
    'permanent document number',
    'anonymous',
    'irreversible',
    'select * from finish();',
  ]) {
    if (!test.includes(snippet)) errors.push(`WF-005 database test missing coverage: ${snippet}`);
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:wf-005'] !== 'node scripts/verify-wf-005.mjs') {
    errors.push('package.json must expose verify:wf-005.');
  }
}

if (errors.length) {
  console.error('WF-005 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('WF-005 verification passed.');
