import { existsSync, readFileSync } from 'node:fs';

const requiredPaths = [
  'supabase/migrations/20260804140000_prg_006_programme_catalogue.sql',
  'supabase/tests/database/prg_006_programme_catalogue.test.sql',
  'lib/programmes/catalogue.ts',
  'lib/programmes/catalogue-seed.ts',
  'lib/programmes/catalogue-copy.ts',
  'components/programme-catalogue.tsx',
  'app/(public)/programmes/page.tsx',
  'app/(public)/[locale]/programmes/page.tsx',
  'app/api/v1/public/programmes/route.ts',
];
const errors = [];

for (const path of requiredPaths) {
  if (!existsSync(path)) errors.push(`Missing required path: ${path}`);
}

if (existsSync(requiredPaths[0])) {
  const sql = readFileSync(requiredPaths[0], 'utf8');
  for (const snippet of [
    'catalogue_sort_order integer not null',
    "instruction_language_codes text[] not null",
    'catalogue_description text null',
    'catalogue_facts text null',
    'catalogue_document_summary text null',
    'programmes_public_catalogue_order_idx',
    'programmes_instruction_languages_idx',
    'години на сертифікаті не зазначаються',
  ]) {
    if (!sql.includes(snippet)) errors.push(`Migration missing required snippet: ${snippet}`);
  }
}

if (existsSync('lib/programmes/catalogue-seed.ts')) {
  const seed = readFileSync('lib/programmes/catalogue-seed.ts', 'utf8');
  if (!seed.includes("currentRunStartsAt: '2026-10-05'")) errors.push('Approved Neuroplastic Reconstruction start date is missing.');
  if (!seed.includes('години на сертифікаті не зазначаються')) errors.push('Approved Space Business certificate wording is missing.');
}

if (existsSync('components/programme-catalogue.tsx')) {
  const component = readFileSync('components/programme-catalogue.tsx', 'utf8');
  for (const snippet of ['programme.area.slug', 'programme.type.slug', 'programme.documentSummary', 'programme.currentRunStartsAt']) {
    if (!component.includes(snippet)) errors.push(`Catalogue component missing data field: ${snippet}`);
  }
  if (/price|pricing/i.test(component)) errors.push('Catalogue UI must not render prices.');
  if (/filter/i.test(component)) errors.push('Release 1 catalogue UI must not render visible filters.');
}

if (existsSync('app/api/v1/public/programmes/route.ts')) {
  const route = readFileSync('app/api/v1/public/programmes/route.ts', 'utf8');
  if (!route.includes('getProgrammeCatalogue')) errors.push('Public catalogue API must use the shared data projection.');
  if (/service.role|SUPABASE_SERVICE_ROLE_KEY/i.test(route)) errors.push('Public catalogue API must not use the service role.');
}

if (existsSync('lib/programmes/catalogue.ts')) {
  const dataLayer = readFileSync('lib/programmes/catalogue.ts', 'utf8');
  if (!dataLayer.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) errors.push('Catalogue data layer must use the public anon contract.');
  if (!dataLayer.includes('getSeedProgrammeCatalogue')) errors.push('Catalogue data layer must retain the approved local fallback.');
  if (/SUPABASE_SERVICE_ROLE_KEY/.test(dataLayer)) errors.push('Catalogue data layer must never use the service role.');
}

if (existsSync(requiredPaths[1])) {
  const testSql = readFileSync(requiredPaths[1], 'utf8');
  for (const snippet of ['select plan(18);', 'select throws_ok(', 'programmes_public_catalogue_order_idx', 'select * from finish();']) {
    if (!testSql.toLowerCase().includes(snippet.toLowerCase())) errors.push(`PRG-006 test missing required snippet: ${snippet}`);
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:prg-006'] !== 'node scripts/verify-prg-006.mjs') {
    errors.push('package.json must expose verify:prg-006.');
  }
}

if (errors.length > 0) {
  console.error('PRG-006 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('PRG-006 verification passed.');
