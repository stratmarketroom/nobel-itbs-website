import { existsSync, readFileSync } from 'node:fs';

const files = {
  migration: 'supabase/migrations/20260810110000_wf_006_void_pending_credential.sql',
  test: 'supabase/tests/database/wf_006_void_pending_credential.test.sql',
  route: 'app/api/v1/admin/credentials/[id]/void/route.ts',
  service: 'lib/credentials/void.ts',
  input: 'lib/credentials/void-input.ts',
  types: 'lib/credentials/void-types.ts',
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
    'public.void_pending_credential',
    "array['owner', 'super_admin', 'credential_manager']::public.app_role[]",
    'internal.is_mfa_requirement_satisfied()',
    "nullif(btrim(p_reason), '')",
    'char_length(v_reason) > 4000',
    "v_credential.status <> 'pending'",
    "number_log.status = 'reserved'",
    'for update',
    'update public.document_number_log',
    "status = 'voided'",
    'voided_by = v_actor_id',
    'void_reason = v_reason',
    'update public.credentials',
    'voided_at = v_voided_at',
    "p_action => 'document_number.voided'",
    "p_action => 'credential.voided'",
    'internal.write_audit_log',
    'from public, anon, authenticated',
    'to authenticated, postgres, service_role',
  ]) {
    if (!source.migration.includes(snippet)) errors.push(`WF-006 migration missing required behavior: ${snippet}`);
  }

  if ((source.migration.match(/for update/g) ?? []).length < 2) {
    errors.push('WF-006 must lock both the credential and its reserved number.');
  }
  for (const [pattern, message] of [
    [/array\[[^\]]*'content_manager'[^\]]*\]/i, 'Content Manager must not receive pending credential void access.'],
    [/set\s+status\s*=\s*'(?:pending|valid|revoked|issued|reserved)'/i, 'WF-006 must not reverse or activate either lifecycle.'],
    [/create\s+(?:or\s+replace\s+)?function\s+public\.(?:revoke|verify|resend|update_valid)/i, 'WF-006 must not implement adjacent credential workflows.'],
    [/p_metadata\s*=>[^;]*v_reason/is, 'Security Audit metadata must not copy the free-text void reason.'],
  ]) {
    if (pattern.test(source.migration)) errors.push(message);
  }

  for (const snippet of [
    'export async function POST',
    'getAdminContext(request)',
    'readVoidPendingCredentialInput(request)',
    'voidPendingCredential(',
    'jsonError(error)',
  ]) {
    if (!source.route.includes(snippet)) errors.push(`WF-006 route missing protected contract: ${snippet}`);
  }

  for (const snippet of [
    "assertKeys(body, ['reason'])",
    'Void reason is required.',
    'reason.length > 4000',
  ]) {
    if (!source.input.includes(snippet)) errors.push(`WF-006 request validation missing: ${snippet}`);
  }

  for (const snippet of [
    'assertCanManageCredentials',
    'getSupabaseRequestClient',
    "db.rpc('void_pending_credential'",
    'Only a pending credential with its reserved number can be voided.',
    'documentNumberStatus: row.document_number_status',
  ]) {
    if (!source.service.includes(snippet)) errors.push(`WF-006 server workflow missing: ${snippet}`);
  }

  for (const snippet of [
    "credential.status === 'pending'",
    'Void pending credential',
    'Void reason',
    'maxLength={4000}',
    'reserved document number will be voided permanently',
    'Void permanently',
    "credential.status === 'voided'",
    'credential.voidReason',
  ]) {
    if (!source.component.includes(snippet)) errors.push(`WF-006 admin UI missing: ${snippet}`);
  }

  if (/publicStatus|verify_not_found|\/api\/v1\/verify/.test(source.migration + source.route + source.service)) {
    errors.push('WF-006 must not implement the separate public verification workflow.');
  }
  if (/console\.(?:log|info|warn|error)/.test(source.service)) {
    errors.push('Credential void data and failures must not be logged.');
  }

  const test = source.test.toLowerCase();
  for (const snippet of [
    'select plan(18);',
    'credential manager',
    'mfa',
    'reason',
    'pending-only',
    'concurrent',
    'reserved number',
    'audit',
    'history',
    'non-reusable',
    'anonymous',
    'irreversible',
    'public verification',
    'select * from finish();',
  ]) {
    if (!test.includes(snippet)) errors.push(`WF-006 database test missing coverage: ${snippet}`);
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:wf-006'] !== 'node scripts/verify-wf-006.mjs') {
    errors.push('package.json must expose verify:wf-006.');
  }
}

if (errors.length) {
  console.error('WF-006 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('WF-006 verification passed.');
