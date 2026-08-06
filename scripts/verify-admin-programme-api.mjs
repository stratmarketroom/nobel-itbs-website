import fs from 'node:fs';

const routeFiles = [
  'app/api/v1/admin/programme-areas/route.ts',
  'app/api/v1/admin/programme-areas/[id]/route.ts',
  'app/api/v1/admin/programme-types/route.ts',
  'app/api/v1/admin/programme-types/[id]/route.ts',
  'app/api/v1/admin/programmes/route.ts',
  'app/api/v1/admin/programmes/[id]/route.ts',
  'app/api/v1/admin/programme-runs/route.ts',
  'app/api/v1/admin/programme-runs/[id]/route.ts',
  'app/api/v1/admin/programme-pricing-options/route.ts',
  'app/api/v1/admin/programme-pricing-options/[id]/route.ts',
  'app/api/v1/admin/programme-slug-redirects/route.ts',
];
const requiredFiles = [...routeFiles, 'lib/programmes/admin.ts', 'lib/programmes/admin-input.ts', 'lib/programmes/admin-payloads.ts'];
const errors = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) errors.push(`Missing required file: ${file}`);
}

if (errors.length === 0) {
  const routes = routeFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
  const data = fs.readFileSync('lib/programmes/admin.ts', 'utf8');
  const input = fs.readFileSync('lib/programmes/admin-input.ts', 'utf8');
  const payloads = fs.readFileSync('lib/programmes/admin-payloads.ts', 'utf8');

  for (const snippet of ['getAdminContext(request)', 'jsonError(error)', 'export async function GET']) {
    if (!routes.includes(snippet)) errors.push(`Admin programme routes missing: ${snippet}`);
  }
  for (const snippet of [
    "'programme_areas'", "'programme_types'", "'programmes'", "'programme_runs'",
    "'programme_pricing_options'", "'programme_slug_redirects'", 'getSupabaseRequestClient',
    'assertCanManageContent', "'credential_manager'", 'requiresMfaForRole',
  ]) {
    if (!data.includes(snippet)) errors.push(`Admin programme data layer missing: ${snippet}`);
  }
  for (const snippet of ['programmeLocales', 'nullableHttpsUrl', 'assertUuid', 'instructionLanguages']) {
    if (!input.includes(snippet)) errors.push(`Admin programme validation missing: ${snippet}`);
  }
  for (const snippet of ['programmeRecordPayload', 'programmeTranslationPayload', 'runRecordPayload', 'pricingRecordPayload', 'pricingTranslationPayload']) {
    if (!payloads.includes(snippet)) errors.push(`Admin programme payload validation missing: ${snippet}`);
  }
  if (/getSupabaseAdminClient|SUPABASE_SERVICE_ROLE_KEY/.test(data + routes)) {
    errors.push('Programme API must preserve actor-scoped RLS and must not use the service-role client.');
  }
  const redirects = fs.readFileSync('app/api/v1/admin/programme-slug-redirects/route.ts', 'utf8');
  if (/export async function (?:POST|PATCH|DELETE)/.test(redirects)) {
    errors.push('Slug redirects are trigger-managed and must remain read-only in the admin API.');
  }
}

if (errors.length) {
  console.error('Admin Programme API verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Admin Programme API verification passed.');
