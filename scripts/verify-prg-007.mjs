import { existsSync, readFileSync } from 'node:fs';

const requiredPaths = [
  'supabase/migrations/20260804150000_prg_007_seo_landing_pages.sql',
  'supabase/tests/database/prg_007_seo_landing_pages.test.sql',
  'lib/programmes/generated-programme-content.json',
  'lib/programmes/generated-taxonomy-content.json',
  'lib/programmes/landing.ts',
  'lib/programmes/landing-seed.ts',
  'components/programme-landing.tsx',
  'app/(public)/programmes/[slug]/page.tsx',
  'app/(public)/[locale]/programmes/[slug]/page.tsx',
  'app/api/v1/public/programmes/[slug]/route.ts',
];
const errors = [];

for (const path of requiredPaths) if (!existsSync(path)) errors.push(`Missing required path: ${path}`);

if (existsSync(requiredPaths[0])) {
  const sql = readFileSync(requiredPaths[0], 'utf8');
  for (const snippet of [
    'add column sections jsonb not null',
    'programme_area_translations_published_landing_complete',
    'internal.assert_programme_slug_available',
    'internal.enforce_programme_shared_slug',
    'programmes_enforce_shared_slug',
    'programme_areas_enforce_shared_slug',
    'programme_types_enforce_shared_slug',
    "constraint = 'programme_shared_slug_unique'",
  ]) if (!sql.includes(snippet)) errors.push(`Migration missing required SQL snippet: ${snippet}`);
  if (/create table public\.programme_slug_redirects/i.test(sql)) errors.push('Slug redirects belong to PRG-008.');
}

if (existsSync('lib/programmes/generated-programme-content.json')) {
  const content = JSON.parse(readFileSync('lib/programmes/generated-programme-content.json', 'utf8'));
  if (content.programmes?.length !== 5 || content.translations?.length !== 15) errors.push('Programme fallback must contain five programmes and fifteen translations.');
}

if (existsSync('lib/programmes/generated-taxonomy-content.json')) {
  const content = JSON.parse(readFileSync('lib/programmes/generated-taxonomy-content.json', 'utf8'));
  if (content.entities?.length !== 6) errors.push('Taxonomy fallback must contain six landing pages.');
  if (content.entities?.some((entity) => entity.translations?.length !== 3)) errors.push('Every taxonomy landing page must contain three translations.');
}

if (existsSync('components/programme-landing.tsx')) {
  const component = readFileSync('components/programme-landing.tsx', 'utf8');
  for (const snippet of ['entity.pricingOptions.length > 0', 'entity.sections.curriculum', 'entity.sections.assessment_document', 'entity.programmes.map']) {
    if (!component.includes(snippet)) errors.push(`Landing UI missing required behavior: ${snippet}`);
  }
  const programmeQuestionImplemented = existsSync('components/programme-question-form.tsx');
  if (programmeQuestionImplemented && !component.includes("'#programme-question'")) errors.push('PRG-009 should replace the temporary mailto fallback with the on-site programme question form.');
  if (!programmeQuestionImplemented && !component.includes('mailto:info@nobel-itbs.eu')) errors.push('Landing UI needs a temporary contact fallback before PRG-009 exists.');
  if (/contact-submissions|fetch\(/i.test(component)) errors.push('PRG-007 must not implement the PRG-009 question submission workflow.');
}

if (existsSync('lib/programmes/landing.ts')) {
  const data = readFileSync('lib/programmes/landing.ts', 'utf8');
  if (!data.includes("client.from('programmes')") || !data.includes("client.from('programme_areas')") || !data.includes("client.from('programme_types')")) errors.push('Resolver must query all three shared-namespace entity types.');
  if (/SUPABASE_SERVICE_ROLE_KEY/.test(data)) errors.push('Public landing resolver must not use the service role.');
}

if (existsSync(requiredPaths[1])) {
  const test = readFileSync(requiredPaths[1], 'utf8');
  for (const snippet of ['select plan(22);', 'select throws_ok(', 'programme_shared_slug', 'select * from finish();']) {
    if (!test.toLowerCase().includes(snippet.toLowerCase())) errors.push(`PRG-007 test missing required snippet: ${snippet}`);
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:prg-007'] !== 'node scripts/verify-prg-007.mjs') errors.push('package.json must expose verify:prg-007.');
}

if (errors.length) {
  console.error('PRG-007 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('PRG-007 verification passed.');
