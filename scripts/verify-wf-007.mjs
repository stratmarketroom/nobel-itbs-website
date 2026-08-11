import { existsSync, readFileSync } from 'node:fs';

const files = {
  migration: 'supabase/migrations/20260810120000_wf_007_update_valid_public_data.sql',
  test: 'supabase/tests/database/wf_007_update_valid_public_data.test.sql',
  route: 'app/api/v1/admin/credentials/[id]/public-data/route.ts',
  service: 'lib/credentials/public-data.ts',
  input: 'lib/credentials/public-data-input.ts',
  types: 'lib/credentials/public-data-types.ts',
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
    'public.update_valid_credential_public_data',
    "array['owner', 'super_admin', 'credential_manager']::public.app_role[]",
    'internal.is_mfa_requirement_satisfied()',
    "nullif(btrim(p_public_holder_name), '')",
    'char_length(v_holder_name) > 320',
    'char_length(v_programme_title) > 500',
    'char_length(v_credential_type) > 200',
    'char_length(v_reason) > 4000',
    'for update',
    "v_credential.status <> 'valid'",
    'at least one public credential value must change',
    'public_holder_name = v_holder_name',
    'public_programme_title = v_programme_title',
    'public_credential_type = v_credential_type',
    "p_event_type => 'credential.public_data_updated'",
    'p_reason => v_reason',
    'p_before_data => jsonb_build_object',
    'p_after_data => jsonb_build_object',
    "p_action => 'credential.public_data_updated'",
    "'changed_fields', to_jsonb(v_changed_fields)",
    'from public, anon, authenticated',
    'to authenticated, postgres, service_role',
  ]) {
    if (!source.migration.includes(snippet)) errors.push(`WF-007 migration missing required behavior: ${snippet}`);
  }

  for (const [pattern, message] of [
    [/array\[[^\]]*'content_manager'[^\]]*\]/i, 'Content Manager must not receive credential public-data access.'],
    [/update\s+public\.document_number_log/i, 'WF-007 must not mutate the permanent document number.'],
    [/set\s+[^;]*(?:learner_id|programme_id|programme_run_id|credential_type_id|language_code|issue_date|document_number|verification_token|status\s*=)/i, 'WF-007 must not mutate credential identity, token, or lifecycle fields.'],
    [/p_metadata\s*=>[^;]*(?:v_holder_name|v_programme_title|v_credential_type|v_reason)/is, 'Audit metadata must not copy public values or the free-text reason.'],
    [/create\s+(?:or\s+replace\s+)?function\s+public\.(?:revoke|void|verify|resend)/i, 'WF-007 must not implement adjacent credential workflows.'],
  ]) {
    if (pattern.test(source.migration)) errors.push(message);
  }

  for (const snippet of [
    'export async function PUT',
    'getAdminContext(request)',
    'readUpdateValidPublicDataInput(request)',
    'updateValidPublicData(',
    'jsonError(error)',
  ]) {
    if (!source.route.includes(snippet)) errors.push(`WF-007 route missing protected contract: ${snippet}`);
  }

  for (const snippet of [
    "assertKeys(body, ['publicHolderName', 'publicProgrammeTitle', 'publicCredentialType', 'reason'])",
    "requiredText(body.publicHolderName, 'Public holder name', 320)",
    "requiredText(body.publicProgrammeTitle, 'Public programme title', 500)",
    "requiredText(body.publicCredentialType, 'Public credential type', 200)",
    "requiredText(body.reason, 'Change reason', 4000)",
  ]) {
    if (!source.input.includes(snippet)) errors.push(`WF-007 request validation missing: ${snippet}`);
  }

  for (const snippet of [
    'assertCanManageCredentials',
    'getSupabaseRequestClient',
    "db.rpc('update_valid_credential_public_data'",
    'Only a valid credential can have its public data corrected.',
    'publicHolderName: row.public_holder_name',
  ]) {
    if (!source.service.includes(snippet)) errors.push(`WF-007 server workflow missing: ${snippet}`);
  }

  for (const snippet of [
    "credential.status === 'valid'",
    'Correct public verification data',
    'Public holder name',
    'Public programme title',
    'Public document type',
    'Change reason',
    'Save correction',
    'no revision notice is shown publicly',
    'key={credential.updatedAt}',
  ]) {
    if (!source.component.includes(snippet)) errors.push(`WF-007 admin UI missing: ${snippet}`);
  }

  if (/publicStatus|verify_valid|\/api\/v1\/verify/.test(source.migration + source.route + source.service)) {
    errors.push('WF-007 must not implement the separate public verification workflow.');
  }
  if (/console\.(?:log|info|warn|error)/.test(source.service)) {
    errors.push('Credential public data and failures must not be logged.');
  }

  const test = source.test.toLowerCase();
  for (const snippet of [
    'select plan(17);',
    'credential manager',
    'mfa',
    'mandatory reason',
    'concurrent',
    'valid-only',
    'unchanged',
    'current public record',
    'history',
    'audit',
    'document number',
    'token material',
    'anonymous',
    'public verification',
    'select * from finish();',
  ]) {
    if (!test.includes(snippet)) errors.push(`WF-007 database test missing coverage: ${snippet}`);
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:wf-007'] !== 'node scripts/verify-wf-007.mjs') {
    errors.push('package.json must expose verify:wf-007.');
  }
}

if (errors.length) {
  console.error('WF-007 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('WF-007 verification passed.');
