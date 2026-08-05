import { existsSync, readFileSync } from 'node:fs';

const paths = {
  migration: 'supabase/migrations/20260805090000_pce_004_contact_submissions.sql',
  test: 'supabase/tests/database/pce_004_contact_submissions.test.sql',
  types: 'lib/contact/types.ts',
  adminModel: 'lib/contact/admin.ts',
  notification: 'lib/contact/notification.ts',
  googleWorkspace: 'lib/email/google-workspace.ts',
  publicApi: 'app/api/v1/public/contact-submissions/route.ts',
  adminListApi: 'app/api/v1/admin/contact-submissions/route.ts',
  adminDetailApi: 'app/api/v1/admin/contact-submissions/[id]/route.ts',
  adminComponent: 'components/admin-contact-submissions.tsx',
  adminPage: 'app/admin/contact-submissions/page.tsx',
};
const errors = [];

for (const path of Object.values(paths)) if (!existsSync(path)) errors.push(`Missing required path: ${path}`);

if (existsSync(paths.migration)) {
  const sql = readFileSync(paths.migration, 'utf8');
  for (const snippet of [
    'grant update (status)',
    'contact_submissions_authorized_update',
    "array['owner', 'super_admin', 'credential_manager']",
    'internal.is_mfa_requirement_satisfied()',
    'audit_contact_submission_status_change',
    "'contact_submission.status_changed'",
  ]) if (!sql.includes(snippet)) errors.push(`PCE-004 migration missing required behavior: ${snippet}`);
  if (/array\[[^\]]*'content_manager'[^\]]*\]/i.test(sql)) errors.push('Content Manager must not receive contact-submission access.');
  if (/grant\s+update\s+on\s+table\s+public\.contact_submissions/i.test(sql)) errors.push('Authenticated users must receive status-column update only, not whole-table update.');
}

if (existsSync(paths.adminModel)) {
  const model = readFileSync(paths.adminModel, 'utf8');
  for (const snippet of ['assertCanAccessContactSubmissions', 'getSupabaseRequestClient', ".update({ status })"]) {
    if (!model.includes(snippet)) errors.push(`Admin contact model missing required behavior: ${snippet}`);
  }
  if (/SUPABASE_SERVICE_ROLE_KEY|getSupabaseAdminClient/.test(model)) errors.push('Admin contact data should remain subject to the signed-in user RLS context.');
}

if (existsSync(paths.types)) {
  const types = readFileSync(paths.types, 'utf8');
  for (const snippet of ['contactSubmissionTypes', "['new', 'processed', 'archived']", 'ContactSubmissionAdminItem']) {
    if (!types.includes(snippet)) errors.push(`Shared contact types missing required behavior: ${snippet}`);
  }
}

if (existsSync(paths.adminDetailApi)) {
  const api = readFileSync(paths.adminDetailApi, 'utf8');
  for (const snippet of ['getAdminContext', 'updateContactSubmissionStatus', 'contactSubmissionStatuses.includes', 'uuidPattern']) {
    if (!api.includes(snippet)) errors.push(`Admin detail API missing required behavior: ${snippet}`);
  }
}

if (existsSync(paths.notification)) {
  const notification = readFileSync(paths.notification, 'utf8');
  for (const snippet of ['CONTACT_NOTIFICATION_EMAIL', 'sendGoogleWorkspaceMessage', "return 'failed'"]) {
    if (!notification.includes(snippet)) errors.push(`Contact notification missing required behavior: ${snippet}`);
  }
  if (/console\.(log|error)/.test(notification)) errors.push('Notification workflow must not log contact PII or provider errors.');
}

if (existsSync(paths.googleWorkspace)) {
  const email = readFileSync(paths.googleWorkspace, 'utf8');
  for (const snippet of ['GOOGLE_WORKSPACE_SERVICE_ACCOUNT_EMAIL', 'GOOGLE_WORKSPACE_PRIVATE_KEY', 'GOOGLE_WORKSPACE_DELEGATED_USER', 'gmail.send', 'AbortSignal.timeout']) {
    if (!email.includes(snippet)) errors.push(`Google Workspace adapter missing required behavior: ${snippet}`);
  }
  if (/NEXT_PUBLIC_|console\.(log|error)/.test(email)) errors.push('Google Workspace configuration must remain server-only and must not be logged.');
}

if (existsSync(paths.publicApi)) {
  const api = readFileSync(paths.publicApi, 'utf8');
  for (const snippet of ['after(async () =>', 'sendContactSubmissionNotification']) {
    if (!api.includes(snippet)) errors.push(`Public contact workflow missing non-blocking manager notification behavior: ${snippet}`);
  }
  if (/console\.(log|error)/.test(api)) errors.push('Public contact API must not log raw public submissions or errors.');
}

if (existsSync(paths.adminComponent)) {
  const component = readFileSync(paths.adminComponent, 'utf8');
  for (const snippet of ['All statuses', 'All types', 'aria-pressed', 'changeStatus', 'Status changes are recorded in the audit log']) {
    if (!component.includes(snippet)) errors.push(`Admin contact UI missing required behavior: ${snippet}`);
  }
}

if (existsSync(paths.test)) {
  const test = readFileSync(paths.test, 'utf8').toLowerCase();
  for (const snippet of ['select plan(12);', 'status column only', 'content manager', 'mfa', 'select * from finish();']) {
    if (!test.includes(snippet)) errors.push(`PCE-004 database test missing required coverage: ${snippet}`);
  }
}

if (existsSync('.env.example')) {
  const env = readFileSync('.env.example', 'utf8');
  for (const name of ['CONTACT_NOTIFICATION_EMAIL=', 'GOOGLE_WORKSPACE_SERVICE_ACCOUNT_EMAIL=', 'GOOGLE_WORKSPACE_PRIVATE_KEY=', 'GOOGLE_WORKSPACE_DELEGATED_USER=']) {
    if (!env.includes(name)) errors.push(`.env.example missing server email configuration: ${name}`);
  }
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (pkg.scripts?.['verify:pce-004'] !== 'node scripts/verify-pce-004.mjs') errors.push('package.json must expose verify:pce-004.');

if (errors.length) {
  console.error('PCE-004 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('PCE-004 verification passed.');
