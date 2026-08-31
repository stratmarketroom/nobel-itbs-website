import fs from 'node:fs';

const routeFiles = [
  'app/api/v1/admin/partners/route.ts', 'app/api/v1/admin/partners/[id]/route.ts',
  'app/api/v1/admin/experts/route.ts', 'app/api/v1/admin/experts/[id]/route.ts',
];
const files = {
  data: 'lib/partnerships/admin.ts', payloads: 'lib/partnerships/admin-payloads.ts',
  component: 'components/admin-partnership-entities.tsx', shell: 'components/admin-shell.tsx',
  partnerPage: 'app/admin/partners/page.tsx', expertPage: 'app/admin/experts/page.tsx', styles: 'app/admin.css',
};
const required = [...routeFiles, ...Object.values(files)];
const errors = required.filter((file) => !fs.existsSync(file)).map((file) => `Missing required file: ${file}`);

if (errors.length === 0) {
  const routes = routeFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
  const source = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, fs.readFileSync(file, 'utf8')]));
  for (const snippet of ['getAdminContext(request)', 'export async function GET', 'export async function POST', 'export async function PATCH', 'export async function DELETE']) {
    if (!routes.includes(snippet)) errors.push(`Partner/expert routes missing: ${snippet}`);
  }
  for (const snippet of ["'partners'", "'partner_translations'", "'experts'", "'expert_translations'", 'assertCanManageContent', 'requiresMfaForRole', 'getSupabaseRequestClient']) {
    if (!source.data.includes(snippet)) errors.push(`Partner/expert data layer missing: ${snippet}`);
  }
  if (/getSupabaseAdminClient|SUPABASE_SERVICE_ROLE_KEY/.test(source.data + routes)) errors.push('Partner/expert CRUD must preserve actor-scoped RLS.');
  for (const snippet of ['partnerRecordPayload', 'expertRecordPayload', 'partnerTranslationPayload', 'expertTranslationPayload', 'Only Alfred Nobel University', '/file-name.webp']) {
    if (!source.payloads.includes(snippet) && !source.component.includes(snippet)) errors.push(`Validation or controlled UI missing: ${snippet}`);
  }
  for (const snippet of ["type EntityKind = 'partner' | 'expert'", "const locales: Locale[] = ['en', 'ua', 'cz']", 'Public copy', 'Media', 'English public copy must be published', 'Archive records']) {
    if (!source.component.includes(snippet)) errors.push(`Manager UI missing: ${snippet}`);
  }
  for (const route of ['/admin/partners', '/admin/experts']) if (!source.shell.includes(route)) errors.push(`Admin navigation missing: ${route}`);
  if (!source.partnerPage.includes('kind="partner"') || !source.expertPage.includes('kind="expert"')) errors.push('Admin pages are not connected to the shared manager.');
  for (const snippet of ['.partnership-media-editor', '.partnership-media-preview']) if (!source.styles.includes(snippet)) errors.push(`Partner/expert styles missing: ${snippet}`);
}

if (errors.length) {
  console.error('Admin Partner and Expert verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Admin Partner and Expert verification passed.');
