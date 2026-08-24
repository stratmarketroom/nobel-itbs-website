import { readFileSync } from 'node:fs';

const errors = [];
const migrationPath = 'supabase/migrations/20260824093000_qa_005_programme_cta_urls.sql';
const testPath = 'supabase/tests/database/qa_005_programme_cta_urls.test.sql';
const reportPath = 'docs/qa/QA_005_PROGRAMME_CTA_ACCEPTANCE_2026-08-24.md';
const migration = readFileSync(migrationPath, 'utf8');
const tests = readFileSync(testPath, 'utf8');
const landing = readFileSync('components/programme-landing.tsx', 'utf8');
const loader = readFileSync('lib/programmes/landing.ts', 'utf8');
const report = readFileSync(reportPath, 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

const expected = [
  ['General Psychology slug', 'general-psychology'],
  ['General Psychology URL', 'https://event.duan.edu.ua/ie80iq'],
  ['Child Psychology slug', 'child-psychology'],
  ['Child Psychology URL', 'https://event.duan.edu.ua/830uga'],
  ['AI Production slug', 'ai-production'],
];

for (const [label, value] of expected) {
  if (!migration.includes(value)) errors.push(`Migration is missing ${label}: ${value}`);
  if (!tests.includes(value)) errors.push(`Database test is missing ${label}: ${value}`);
}

for (const snippet of [
  "application_provider = 'leeloo'",
  "application_provider = 'partner_site'",
  'application_url = null',
  'active run URL override',
  'active pricing URL override',
  'v_updated <> 2',
  'v_updated <> 1',
]) {
  if (!migration.includes(snippet)) errors.push(`Migration is missing guard: ${snippet}`);
}

if (!loader.includes('primaryCtaUrl: run?.application_url ?? row.application_url')) {
  errors.push('Programme loader must preserve active-run then programme URL priority.');
}
if (!landing.includes("entity.primaryCtaUrl ?? '#programme-question'")) {
  errors.push('Programme landing must preserve the on-site question fallback.');
}
if (!landing.includes('entity.primaryCtaUrl ? <QuestionCta')) {
  errors.push('Configured external CTA pages must retain the secondary question CTA.');
}

for (const [label, pattern] of [
  ['AI question fallback', /AI Production remains on the on-site question fallback/],
  ['no higher-priority override', /No pricing-option or\s+active-run URL override was added/],
  ['secret and learner privacy', /No secret, service-role key, or learner data/],
]) {
  if (!pattern.test(report)) errors.push(`QA report is missing ${label}.`);
}

if (pkg.scripts?.['verify:qa-005:cta'] !== 'node scripts/verify-qa-005-cta.mjs') {
  errors.push('package.json must expose verify:qa-005:cta.');
}

if (errors.length) {
  console.error('QA-005 CTA verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('QA-005 CTA static verification passed.');
