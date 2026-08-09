import { existsSync, readFileSync } from 'node:fs';

const files = {
  migration: 'supabase/migrations/20260809100000_wf_001_create_pending_credential.sql',
  test: 'supabase/tests/database/wf_001_create_pending_credential.test.sql',
  route: 'app/api/v1/admin/credentials/route.ts',
  data: 'lib/credentials/admin.ts',
  input: 'lib/credentials/admin-input.ts',
  token: 'lib/credentials/token.ts',
  types: 'lib/credentials/types.ts',
  server: 'lib/supabase/server.ts',
  env: '.env.example',
};
const errors = [];

for (const path of Object.values(files)) {
  if (!existsSync(path)) errors.push(`Missing required path: ${path}`);
}

if (!errors.length) {
  const source = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, readFileSync(path, 'utf8')]));

  for (const snippet of [
    'create or replace function public.create_pending_credential',
    "array['owner', 'super_admin', 'credential_manager']::public.app_role[]",
    'internal.is_mfa_requirement_satisfied()',
    'public.find_or_create_credential_set',
    'public.reserve_document_number',
    'public.reserve_manual_document_number',
    'insert into public.credentials',
    "'pending'",
    'update public.document_number_log',
    "p_event_type => 'document_number.reserved'",
    'returns table',
    'verification_token_lookup_hash',
    'verification_token_encrypted',
    'from public, anon, authenticated',
    'to authenticated, postgres, service_role',
  ]) {
    if (!source.migration.includes(snippet)) errors.push(`WF-001 migration missing required behavior: ${snippet}`);
  }

  for (const [pattern, message] of [
    [/array\[[^\]]*'content_manager'[^\]]*\]/i, 'Content Manager must not receive credential creation access.'],
    [/\bpartner_id\b/i, 'Partner data must not enter credential creation.'],
    [/\braw_(?:verification_)?token\b/i, 'Raw token must never enter the database workflow.'],
    [/p_metadata\s*=>[^;]*(?:document_number|verification_token|learner_id)/i, 'Audit metadata must not copy number, token, or learner identity.'],
    [/create\s+(?:or\s+replace\s+)?function\s+public\.(?:activate|revoke|void|send|verify)/i, 'WF-001 must not implement later workflow functions.'],
    [/create\s+table\s+(?:if\s+not\s+exists\s+)?public\./i, 'WF-001 must reuse the approved Credential Core schema.'],
  ]) {
    if (pattern.test(source.migration)) errors.push(message);
  }

  for (const snippet of ['export async function POST', 'getAdminContext(request)', 'createPendingCredentialPayload', 'createPendingCredential(context, input)', 'status: 201', 'jsonError(error)']) {
    if (!source.route.includes(snippet)) errors.push(`WF-001 route missing required behavior: ${snippet}`);
  }

  for (const snippet of ['assertCanManageCredentials', 'getSupabaseRequestClient', "db.rpc('create_pending_credential'", 'createCredentialTokenMaterial', 'verificationUrl', 'manualDocumentNumber', "role === 'owner' || role === 'super_admin'"]) {
    if (!source.data.includes(snippet) && !source.server.includes(snippet)) errors.push(`WF-001 actor-scoped data layer missing: ${snippet}`);
  }

  if (/getSupabaseAdminClient|SUPABASE_SERVICE_ROLE_KEY/.test(source.data + source.route + source.token)) {
    errors.push('WF-001 must preserve actor-scoped RLS and never use service role in its route/data/token layer.');
  }

  for (const snippet of [
    "randomBytes(32).toString('base64url')",
    "createHmac('sha256'",
    "createCipheriv('aes-256-gcm'",
    'randomBytes(12)',
    'cipher.getAuthTag()',
    'CREDENTIAL_TOKEN_HMAC_SECRET',
    'CREDENTIAL_TOKEN_ENCRYPTION_KEY',
    'CREDENTIAL_TOKEN_ENCRYPTION_KEY_VERSION',
    'verificationUrl: `/verify/${encodeURIComponent(token)}`',
  ]) {
    if (!source.token.includes(snippet)) errors.push(`WF-001 token protection missing: ${snippet}`);
  }

  for (const [pattern, message] of [
    [/console\.(?:log|info|warn|error)\s*\([^)]*token/i, 'Credential tokens must never be logged.'],
    [/\brawToken\b/, 'Do not create a separately named raw-token response value.'],
    [/return\s*\{[^}]*\btoken\s*[:,]/s, 'The token must never be returned as a separate field.'],
    [/NEXT_PUBLIC_CREDENTIAL/i, 'Credential token secrets must remain server-only.'],
  ]) {
    if (pattern.test(source.token + source.data + source.route)) errors.push(message);
  }

  for (const snippet of ['learnerId', 'programmeId', 'credentialTypeId', 'languageCode', 'issueDate', 'publicHolderName', 'manualDocumentNumber', 'manualReason', 'Manual document number and reason must be provided together.']) {
    if (!source.input.includes(snippet)) errors.push(`WF-001 input validation missing: ${snippet}`);
  }

  for (const snippet of ['CREDENTIAL_TOKEN_HMAC_SECRET=', 'CREDENTIAL_TOKEN_ENCRYPTION_KEY=', 'CREDENTIAL_TOKEN_ENCRYPTION_KEY_VERSION=1', 'two independent secrets']) {
    if (!source.env.includes(snippet)) errors.push(`WF-001 environment contract missing: ${snippet}`);
  }

  const test = source.test.toLowerCase();
  for (const snippet of ['select plan(22);', "has_function(", 'security definer', 'role and mfa', 'raw verification token', 'partner data', 'direct credential inserts', 'select * from finish();']) {
    if (!test.includes(snippet)) errors.push(`WF-001 database test missing coverage: ${snippet}`);
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:wf-001'] !== 'node scripts/verify-wf-001.mjs') {
    errors.push('package.json must expose verify:wf-001.');
  }
}

if (errors.length) {
  console.error('WF-001 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('WF-001 verification passed.');
