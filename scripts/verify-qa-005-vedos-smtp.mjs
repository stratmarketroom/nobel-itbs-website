import { existsSync, readFileSync } from 'node:fs';

const files = {
  adapter: 'lib/email/credential-smtp.ts',
  activation: 'lib/credentials/activation.ts',
  component: 'components/admin-credentials.tsx',
  env: '.env.example',
  agents: 'AGENTS.md',
  decisions: 'docs/product/PRODUCT_DECISIONS_SPEC_ALIGNMENT_v2.md',
  scope: 'docs/product/RELEASE_1_SCOPE_v2.md',
  credentialSpec: 'docs/product/CREDENTIAL_MODULE_SPECIFICATION_v2.md',
  security: 'docs/security/SECURITY_IMPLEMENTATION_RULES.md',
  implementationPlan: 'docs/planning/IMPLEMENTATION_PLAN_RELEASE_1.md',
  ticketPack: 'docs/planning/CODEX_TICKET_PACK_v2.md',
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
    "import 'server-only'",
    "import nodemailer from 'nodemailer'",
    'CREDENTIAL_SMTP_HOST',
    'CREDENTIAL_SMTP_PASSWORD',
    'supportedPorts = new Set([465, 587])',
    "endsWith('.wedos.net')",
    'requireTLS: !config.secure',
    "minVersion: 'TLSv1.2'",
    'rejectUnauthorized: true',
    'connectionTimeout: 5_000',
    'greetingTimeout: 5_000',
    'socketTimeout: 20_000',
    'await smtp.sendMail',
    'result.accepted',
    'result.rejected',
    'smtp.close()',
  ]) {
    if (!source.adapter.includes(snippet)) errors.push(`VEDOS SMTP adapter missing: ${snippet}`);
  }

  for (const pattern of [
    /NEXT_PUBLIC_/,
    /console\.(?:log|info|warn|error)/,
    /rejectUnauthorized:\s*false/,
    /port:\s*25\b/,
  ]) {
    if (pattern.test(source.adapter)) errors.push(`Unsafe credential SMTP pattern found: ${pattern}`);
  }

  for (const snippet of [
    "from '@/lib/email/credential-smtp'",
    'isCredentialSmtpConfigured()',
    'sendCredentialSmtpMessage({',
    "getSupabaseAdminClient().storage.from('private-credentials')",
    "db.rpc('complete_credential_email_send'",
    "status: resultRecorded ? deliveryStatus : 'pending'",
  ]) {
    if (!source.activation.includes(snippet)) errors.push(`Credential activation missing SMTP coordination: ${snippet}`);
  }
  if (/google-workspace|sendGoogleWorkspaceMessage|isGoogleWorkspaceConfigured/.test(source.activation)) {
    errors.push('Credential activation must not retain the Google Workspace adapter.');
  }

  for (const name of [
    'CREDENTIAL_SMTP_HOST=wes1-smtp.wedos.net',
    'CREDENTIAL_SMTP_PORT=587',
    'CREDENTIAL_SMTP_SECURE=false',
    'CREDENTIAL_SMTP_USERNAME=documents@nobel-itbs.eu',
    'CREDENTIAL_SMTP_PASSWORD=',
    'CREDENTIAL_EMAIL_FROM=documents@nobel-itbs.eu',
    'CREDENTIAL_EMAIL_FROM_NAME=Nobel ITBS',
    'CREDENTIAL_EMAIL_REPLY_TO=documents@nobel-itbs.eu',
  ]) {
    if (!source.env.includes(name)) errors.push(`Credential SMTP env contract missing: ${name}`);
  }

  const currentDocs = [
    source.agents,
    source.decisions,
    source.scope,
    source.credentialSpec,
    source.security,
    source.implementationPlan,
    source.ticketPack,
  ].join('\n');
  if (!/VEDOS SMTP/.test(currentDocs)) errors.push('Current source-of-truth docs must approve VEDOS SMTP.');
  if (/Gmail|Google Workspace/.test(currentDocs)) {
    errors.push('Current source-of-truth docs must not retain Google Workspace as the credential provider.');
  }
  if (/Google Workspace/.test(source.component)) errors.push('Credential UI must use provider-neutral delivery copy.');
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (!pkg.dependencies?.nodemailer) errors.push('Nodemailer must be a runtime dependency.');
if (!pkg.devDependencies?.['@types/nodemailer']) errors.push('Nodemailer types must be a dev dependency.');
if (pkg.scripts?.['verify:qa-005:vedos-smtp'] !== 'node scripts/verify-qa-005-vedos-smtp.mjs') {
  errors.push('package.json must expose verify:qa-005:vedos-smtp.');
}

if (errors.length) {
  console.error('QA-005 VEDOS SMTP verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('QA-005 VEDOS SMTP verification passed.');
