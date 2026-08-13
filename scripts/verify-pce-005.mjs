import { existsSync, readFileSync } from 'node:fs';

const paths = {
  notification: 'lib/contact/notification.ts',
  publicApi: 'app/api/v1/public/contact-submissions/route.ts',
  env: '.env.example',
  documentation: 'docs/development/CONTACT_NOTIFICATIONS.md',
};
const errors = [];

for (const path of Object.values(paths)) {
  if (!existsSync(path)) errors.push(`Missing required path: ${path}`);
}

if (existsSync(paths.notification)) {
  const source = readFileSync(paths.notification, 'utf8');
  for (const snippet of [
    "import 'server-only'",
    'TELEGRAM_BOT_TOKEN',
    'TELEGRAM_CONTACT_CHAT_ID',
    'ADMIN_BASE_URL',
    'https://api.telegram.org/bot',
    '/sendMessage',
    '/admin/contact-submissions',
    'AbortSignal.timeout(5000)',
    "return 'not_configured'",
    "return 'failed'",
  ]) {
    if (!source.includes(snippet)) errors.push(`Telegram adapter missing required behavior: ${snippet}`);
  }

  for (const forbidden of [
    /\bname:\s*string/,
    /\bemail:\s*string/,
    /\bphone:\s*string/,
    /\bmessage:\s*string/,
    /CONTACT_NOTIFICATION_EMAIL/,
    /GOOGLE_WORKSPACE_/,
    /sendGoogleWorkspaceMessage/,
    /NEXT_PUBLIC_/,
    /console\.(log|error)/,
    /parse_mode/,
  ]) {
    if (forbidden.test(source)) errors.push(`Telegram adapter contains forbidden PII, legacy provider, public-secret, logging, or rich-text behavior: ${forbidden}`);
  }
}

if (existsSync(paths.publicApi)) {
  const source = readFileSync(paths.publicApi, 'utf8');
  const call = source.match(/sendContactSubmissionNotification\(\{([\s\S]*?)\}\);/)?.[1] ?? '';
  for (const snippet of ['after(async () =>', 'sendContactSubmissionNotification', 'submittedAt: new Date().toISOString()']) {
    if (!source.includes(snippet)) errors.push(`Public contact route missing required non-blocking behavior: ${snippet}`);
  }
  for (const forbidden of ['name:', 'email:', 'phone:', 'message:']) {
    if (call.includes(forbidden)) errors.push(`Public contact route must not pass visitor PII to Telegram notification: ${forbidden}`);
  }
}

if (existsSync(paths.env)) {
  const source = readFileSync(paths.env, 'utf8');
  for (const name of ['TELEGRAM_BOT_TOKEN=', 'TELEGRAM_CONTACT_CHAT_ID=', 'ADMIN_BASE_URL=']) {
    if (!source.includes(name)) errors.push(`.env.example missing server-only Telegram configuration: ${name}`);
  }
  for (const forbidden of ['CONTACT_NOTIFICATION_EMAIL=', 'GOOGLE_WORKSPACE_SERVICE_ACCOUNT_EMAIL=', 'NEXT_PUBLIC_TELEGRAM_']) {
    if (source.includes(forbidden)) errors.push(`.env.example still exposes a legacy or public notification variable: ${forbidden}`);
  }
}

if (existsSync('lib/email/google-workspace.ts')) {
  errors.push('Dormant Google Workspace contact adapter must be removed after the Telegram channel decision.');
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (pkg.scripts?.['verify:pce-005'] !== 'node scripts/verify-pce-005.mjs') {
  errors.push('package.json must expose verify:pce-005.');
}

if (errors.length) {
  console.error('PCE-005 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('PCE-005 verification passed.');
