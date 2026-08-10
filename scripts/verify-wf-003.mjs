import { existsSync, readFileSync } from 'node:fs';

const files = {
  migration: 'supabase/migrations/20260809120000_wf_003_activate_and_email.sql',
  test: 'supabase/tests/database/wf_003_activate_and_email.test.sql',
  route: 'app/api/v1/admin/credentials/[id]/activate/route.ts',
  service: 'lib/credentials/activation.ts',
  input: 'lib/credentials/activation-input.ts',
  types: 'lib/credentials/activation-types.ts',
  token: 'lib/credentials/token.ts',
  email: 'lib/email/google-workspace.ts',
  workspace: 'lib/credentials/workspace.ts',
  workspaceTypes: 'lib/credentials/workspace-types.ts',
  component: 'components/admin-credentials.tsx',
  env: '.env.example',
};
const errors = [];

for (const path of Object.values(files)) if (!existsSync(path)) errors.push(`Missing required path: ${path}`);

if (!errors.length) {
  const source = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, readFileSync(path, 'utf8')]));

  for (const snippet of [
    'credential_email_send_status',
    'public.email_templates',
    'public.credential_email_sends',
    "'credential_delivery'",
    "'en'",
    "'ua'",
    'public.activate_credential',
    'public.complete_credential_email_send',
    "array['owner', 'super_admin', 'credential_manager']::public.app_role[]",
    'internal.is_mfa_requirement_satisfied()',
    "v_credential.status <> 'pending'",
    'a primary PDF is required for activation',
    'file manifest must include every current credential file',
    "set status = 'issued'",
    "set status = 'valid', activated_at = v_activated_at",
    'insert into public.credential_email_sends',
    'skipped_empty_recipient',
    'credential.activated',
    'credential_email.queued',
    'internal.write_audit_log',
    'email_send.sent_by = auth.uid()',
    'credential_email_sends_enforce_mutation',
    'force row level security',
    'from public, anon, authenticated',
    'to authenticated, postgres, service_role',
  ]) if (!source.migration.includes(snippet)) errors.push(`WF-003 migration missing required behavior: ${snippet}`);

  for (const [pattern, message] of [
    [/array\[[^\]]*'content_manager'[^\]]*\]/i, 'Content Manager must not receive credential activation access.'],
    [/grant\s+(?:insert|update|delete)[^;]*(?:email_templates|credential_email_sends)[^;]*to\s+authenticated/i, 'Authenticated actors must not mutate delivery tables directly.'],
    [/create\s+policy[^;]*on\s+storage\.objects/i, 'WF-003 must not expose the private bucket to browser JWTs.'],
    [/(?:https?:\/\/|http_post|net\.http|gmail\.googleapis)/i, 'External provider coordination must not run inside the database transaction.'],
    [/jsonb_build_object\([^;]*(?:storage_path|file_content|bytes)/i, 'History/Audit must not contain private paths or PDF content.'],
    [/create\s+(?:or\s+replace\s+)?function\s+public\.(?:resend|revoke|void|verify)/i, 'WF-003 must not implement later credential workflows.'],
  ]) if (pattern.test(source.migration)) errors.push(message);

  for (const snippet of ['export async function POST', 'getAdminContext(request)', 'readActivateCredentialInput(request)', 'activateCredential(', 'jsonError(error)']) {
    if (!source.route.includes(snippet)) errors.push(`WF-003 route missing protected contract: ${snippet}`);
  }
  for (const snippet of ["assertKeys(body, ['recipientEmail', 'emailSubject', 'emailBody'])", 'Enter a valid recipient email or leave it empty.', 'Email subject', 'Email body']) {
    if (!source.input.includes(snippet)) errors.push(`WF-003 request validation missing: ${snippet}`);
  }

  for (const snippet of [
    'assertCanManageCredentials',
    'getSupabaseRequestClient',
    "db.rpc('activate_credential'",
    "row.email_status === 'skipped_empty_recipient'",
    'isGoogleWorkspaceConfigured()',
    "getSupabaseAdminClient().storage.from('private-credentials')",
    'Promise.all(files.map',
    'sendGoogleWorkspaceMessage({',
    'attachments,',
    "db.rpc('complete_credential_email_send'",
    "status: resultRecorded ? deliveryStatus : 'pending'",
    'Do not retry activation.',
  ]) if (!source.service.includes(snippet)) errors.push(`WF-003 server coordination missing: ${snippet}`);

  const authorizationIndex = source.service.indexOf('assertCanManageCredentials');
  const activationIndex = source.service.indexOf("db.rpc('activate_credential'");
  const storageIndex = source.service.indexOf("getSupabaseAdminClient().storage.from('private-credentials')");
  const providerIndex = source.service.indexOf('sendGoogleWorkspaceMessage({');
  if (authorizationIndex < 0 || activationIndex < 0 || storageIndex < 0 || providerIndex < 0
    || authorizationIndex > activationIndex || activationIndex > storageIndex || storageIndex > providerIndex) {
    errors.push('Actor authorization and atomic activation must happen before private Storage and provider access.');
  }
  if (/console\.(?:log|info|warn|error)/.test(source.service + source.token + source.email)) {
    errors.push('Credential tokens, delivery content, and provider failures must not be logged.');
  }

  for (const snippet of ['createDecipheriv', 'aes-256-gcm', 'storedKeyVersion !== keyVersion', '/verify/', 'encodeURIComponent(token)']) {
    if (!source.token.includes(snippet)) errors.push(`WF-003 secure verification-link rendering missing: ${snippet}`);
  }
  for (const snippet of ['attachments?: Array', 'multipart/mixed', 'Content-Disposition: attachment', "contentType: 'application/pdf'", 'isGoogleWorkspaceConfigured', 'gmail.googleapis.com/gmail/v1/users/me/messages/send']) {
    if (!source.email.includes(snippet)) errors.push(`WF-003 Google Workspace adapter missing: ${snippet}`);
  }

  for (const snippet of [
    'credential.status === \'pending\' && credential.activationDraft',
    'Activate credential',
    'recipientEmail',
    'emailSubject',
    'emailBody',
    'even if email delivery fails',
    'disabled={saving || !draft.hasPrimaryPdf}',
    'Email delivery',
    'credential.emailSends',
  ]) if (!source.component.includes(snippet)) errors.push(`WF-003 admin UI missing: ${snippet}`);
  // Revoke is allowed here after WF-005; resend and void remain later workflows.
  for (const forbidden of ['Resend credential', 'Void credential']) {
    if (source.component.includes(forbidden)) errors.push(`WF-003 must not expose later action: ${forbidden}`);
  }

  for (const snippet of [".from('email_templates')", 'decryptCredentialVerificationUrl(', "templateLanguage = credential.language_code === 'ua' ? 'ua' : 'en'", "PUBLIC_SITE_URL", ".from('credential_email_sends')"]) {
    if (!(source.service + source.workspace).includes(snippet)) errors.push(`WF-003 draft/history integration missing: ${snippet}`);
  }
  for (const snippet of ['CredentialActivationDraft', 'CredentialEmailSendItem', 'emailSends', 'activationDraft']) {
    if (!(source.types + source.workspaceTypes).includes(snippet)) errors.push(`WF-003 types missing: ${snippet}`);
  }

  const test = source.test.toLowerCase();
  for (const snippet of ['select plan(40);', 'credential manager', 'mfa', 'pending-only', 'primary pdf', 'every current file', 'permanent document number', 'empty recipient', 'history', 'audit', 'anonymous', 'immutable', 'select * from finish();']) {
    if (!test.includes(snippet)) errors.push(`WF-003 database test missing coverage: ${snippet}`);
  }
  for (const name of ['GOOGLE_WORKSPACE_SERVICE_ACCOUNT_EMAIL=', 'GOOGLE_WORKSPACE_PRIVATE_KEY=', 'GOOGLE_WORKSPACE_DELEGATED_USER=', 'PUBLIC_SITE_URL=']) {
    if (!source.env.includes(name)) errors.push(`.env.example missing server configuration: ${name}`);
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:wf-003'] !== 'node scripts/verify-wf-003.mjs') errors.push('package.json must expose verify:wf-003.');
}

if (errors.length) {
  console.error('WF-003 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('WF-003 verification passed.');
