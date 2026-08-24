import { existsSync, readFileSync } from 'node:fs';

const files = {
  migration: 'supabase/migrations/20260824130000_wf_004_resend_credential.sql',
  test: 'supabase/tests/database/wf_004_resend_credential.test.sql',
  route: 'app/api/v1/admin/credentials/[id]/resend/route.ts',
  service: 'lib/credentials/resend.ts',
  input: 'lib/credentials/resend-input.ts',
  types: 'lib/credentials/resend-types.ts',
  workspace: 'lib/credentials/workspace.ts',
  workspaceTypes: 'lib/credentials/workspace-types.ts',
  component: 'components/admin-credentials.tsx',
};
const errors = [];

for (const path of Object.values(files)) if (!existsSync(path)) errors.push(`Missing required path: ${path}`);

if (!errors.length) {
  const source = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, readFileSync(path, 'utf8')]));

  for (const snippet of [
    'public.resend_credential',
    'security definer',
    'set search_path = public, internal, pg_temp',
    "array['owner', 'super_admin', 'credential_manager']::public.app_role[]",
    'internal.is_mfa_requirement_satisfied()',
    "v_credential.status <> 'valid'",
    'for update',
    'file manifest must include every current credential file',
    "manifest_key in ('storage_path', 'storage_bucket', 'file_content', 'bytes')",
    'file manifest contains unsupported data',
    'insert into public.credential_email_sends',
    'skipped_empty_recipient',
    'credential_email.resend_queued',
    'credential_email.resend_skipped',
    'internal.write_audit_log',
    'from public, anon, authenticated',
    'to authenticated, postgres, service_role',
  ]) if (!source.migration.includes(snippet)) errors.push(`WF-004 migration missing required behavior: ${snippet}`);

  for (const [pattern, message] of [
    [/array\[[^\]]*'content_manager'[^\]]*\]/i, 'Content Manager must not receive credential resend access.'],
    [/update\s+public\.credentials/i, 'Resend must not change credential lifecycle state.'],
    [/document_number_log/i, 'Resend must not change the permanent document-number ledger.'],
    [/(?:https?:\/\/|http_post|net\.http|gmail\.googleapis)/i, 'External provider coordination must not run inside the database transaction.'],
    [/jsonb_build_object\([^;]*(?:recipient_email|p_body|filename|storage_path|file_content)/i, 'History/Audit metadata must not contain recipient, body, filenames, private paths, or content.'],
    [/create\s+(?:or\s+replace\s+)?function\s+public\.(?:activate|revoke|void|verify)/i, 'WF-004 must not implement adjacent credential workflows.'],
  ]) if (pattern.test(source.migration)) errors.push(message);

  for (const snippet of ['export async function POST', 'getAdminContext(request)', 'readResendCredentialInput(request)', 'resendCredential(', 'jsonError(error)']) {
    if (!source.route.includes(snippet)) errors.push(`WF-004 route missing protected contract: ${snippet}`);
  }
  for (const snippet of ["assertKeys(body, ['recipientEmail', 'emailSubject', 'emailBody'])", 'Enter a valid recipient email or leave it empty.', 'Email subject', 'Email body']) {
    if (!source.input.includes(snippet)) errors.push(`WF-004 request validation missing: ${snippet}`);
  }

  for (const snippet of [
    'assertCanManageCredentials',
    'getSupabaseRequestClient',
    "db.rpc('resend_credential'",
    "row.email_status === 'skipped_empty_recipient'",
    'isCredentialSmtpConfigured()',
    "getSupabaseAdminClient().storage.from('private-credentials')",
    'Promise.all(files.map',
    'sendCredentialSmtpMessage({',
    'attachments,',
    "db.rpc('complete_credential_email_send'",
    "status: resultRecorded ? deliveryStatus : 'pending'",
    'Check delivery history before retrying.',
  ]) if (!source.service.includes(snippet)) errors.push(`WF-004 server coordination missing: ${snippet}`);

  const authorizationIndex = source.service.indexOf('assertCanManageCredentials');
  const resendIndex = source.service.indexOf("db.rpc('resend_credential'");
  const storageIndex = source.service.indexOf("getSupabaseAdminClient().storage.from('private-credentials')");
  const providerIndex = source.service.indexOf('sendCredentialSmtpMessage({');
  if (authorizationIndex < 0 || resendIndex < 0 || storageIndex < 0 || providerIndex < 0
    || authorizationIndex > resendIndex || resendIndex > storageIndex || storageIndex > providerIndex) {
    errors.push('Authorization and immutable resend history must happen before private Storage and provider access.');
  }
  if (/console\.(?:log|info|warn|error)/.test(source.service)) errors.push('Credential delivery content and provider failures must not be logged.');
  if (/NEXT_PUBLIC_|service_role/i.test(source.service.replace("getSupabaseAdminClient", ''))) errors.push('Resend secrets and service-role credentials must not be exposed by the workflow module.');

  for (const snippet of [
    "credential.status === 'valid' && credential.resendDraft",
    'Resend credential PDFs',
    'recipientEmail',
    'emailSubject',
    'emailBody',
    'immutable delivery record',
    'does not change the learner profile or the valid credential status',
    'disabled={saving || !draft.hasFiles}',
    'credential.emailSends',
  ]) if (!source.component.includes(snippet)) errors.push(`WF-004 admin UI missing: ${snippet}`);

  for (const snippet of [".from('email_templates')", 'decryptCredentialVerificationUrl(', "templateLanguage = credential.language_code === 'ua' ? 'ua' : 'en'", 'PUBLIC_SITE_URL']) {
    if (!source.service.includes(snippet)) errors.push(`WF-004 resend draft integration missing: ${snippet}`);
  }
  for (const snippet of ['getCredentialResendDraft', 'resendDraft']) {
    if (!source.workspace.includes(snippet)) errors.push(`WF-004 workspace integration missing: ${snippet}`);
  }
  for (const snippet of ['CredentialResendDraft', 'ResendCredentialResult', 'resendDraft']) {
    if (!(source.types + source.workspaceTypes).includes(snippet)) errors.push(`WF-004 types missing: ${snippet}`);
  }

  const test = source.test.toLowerCase();
  for (const snippet of ['select plan(24);', 'valid-only', 'custom recipient', 'every current pdf', 'empty recipient', 'history', 'audit', 'anonymous', 'credential status', 'document number', 'permanence trigger', 'select * from finish();']) {
    if (!test.includes(snippet)) errors.push(`WF-004 database test missing coverage: ${snippet}`);
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:wf-004'] !== 'node scripts/verify-wf-004.mjs') errors.push('package.json must expose verify:wf-004.');
}

if (errors.length) {
  console.error('WF-004 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('WF-004 verification passed.');
