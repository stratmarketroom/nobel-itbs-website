import { existsSync, readFileSync } from 'node:fs';

const routes = [
  'app/api/v1/admin/learners/route.ts',
  'app/api/v1/admin/learners/[id]/route.ts',
  'app/api/v1/admin/learners/[id]/emails/route.ts',
  'app/api/v1/admin/learners/[id]/emails/[contactId]/route.ts',
  'app/api/v1/admin/learners/[id]/phones/route.ts',
  'app/api/v1/admin/learners/[id]/phones/[contactId]/route.ts',
];
const files = {
  data: 'lib/learners/admin.ts',
  input: 'lib/learners/admin-input.ts',
  types: 'lib/learners/types.ts',
  component: 'components/admin-learners.tsx',
  page: 'app/admin/learners/page.tsx',
  shell: 'components/admin-shell.tsx',
  server: 'lib/supabase/server.ts',
  styles: 'app/admin.css',
};
const required = [...routes, ...Object.values(files)];
const errors = required.filter((file) => !existsSync(file)).map((file) => `Missing required file: ${file}`);

if (errors.length === 0) {
  const routeSource = routes.map((file) => readFileSync(file, 'utf8')).join('\n');
  const source = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, readFileSync(file, 'utf8')]));

  for (const snippet of ['export async function GET', 'export async function POST', 'export async function PATCH', 'export async function DELETE', 'getAdminContext(request)']) {
    if (!routeSource.includes(snippet)) errors.push(`Learner routes missing required behavior: ${snippet}`);
  }
  for (const snippet of ['assertCanManageLearners', 'getSupabaseRequestClient', "'learners'", "'learner_emails'", "'learner_phones'", 'conflictReference', "'conflict'", 'credentials (id, document_number']) {
    if (!source.data.includes(snippet) && !source.server.includes(snippet)) errors.push(`Learner data layer missing: ${snippet}`);
  }
  if (/getSupabaseAdminClient|SUPABASE_SERVICE_ROLE_KEY/.test(source.data + source.input + routeSource)) errors.push('Learner management must preserve actor-scoped RLS and never use service role.');
  if (/credential_sets|create table/i.test(source.data + source.input + routeSource)) errors.push('Learner management must not implement Credential Core tables or Set workflows.');
  for (const snippet of ['latinFirstName', 'ukrainianFullName', 'internalNote', 'isPrimary', 'hasTelegram', 'telegramUsername', 'hasViber', 'hasWhatsapp', '+420123456789']) {
    if (!source.input.includes(snippet) && !source.component.includes(snippet)) errors.push(`Learner validation/UI missing: ${snippet}`);
  }
  for (const snippet of ['profile', 'contacts', 'credentials', 'Open {notice.conflict.displayName}', 'No credentials yet', 'Archive learner', 'No learners found']) {
    if (!source.component.includes(snippet)) errors.push(`Learner manager UX missing: ${snippet}`);
  }
  if (!source.shell.includes("href: '/admin/learners'") || !source.shell.includes("'credential_manager'")) errors.push('Learner navigation or role visibility is missing.');
  if (!source.page.includes('<AdminLearners />')) errors.push('Learner page is not connected to the manager component.');
  for (const snippet of ['.learner-admin-workspace', '.learner-contact-row', '@media (max-width: 760px)', '@media (prefers-reduced-motion: reduce)']) {
    if (!source.styles.includes(snippet)) errors.push(`Learner responsive/accessibility styles missing: ${snippet}`);
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:lrn-004'] !== 'node scripts/verify-lrn-004.mjs') errors.push('package.json must expose verify:lrn-004.');
}

if (errors.length) {
  console.error('LRN-004 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('LRN-004 verification passed.');
