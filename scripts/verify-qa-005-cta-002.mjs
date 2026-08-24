import { readFileSync } from 'node:fs';

const errors = [];
const migrationPath = 'supabase/migrations/20260824113000_qa_005_space_business_and_b2b_ctas.sql';
const testPath = 'supabase/tests/database/qa_005_space_business_and_b2b_ctas.test.sql';
const reportPath = 'docs/qa/QA_005_SPACE_BUSINESS_AND_B2B_CTA_ACCEPTANCE_2026-08-24.md';
const migration = readFileSync(migrationPath, 'utf8');
const tests = readFileSync(testPath, 'utf8');
const report = readFileSync(reportPath, 'utf8');
const programmeLanding = readFileSync('components/programme-landing.tsx', 'utf8');
const programmeLoader = readFileSync('lib/programmes/landing.ts', 'utf8');
const managedPage = readFileSync('components/managed-content-page.tsx', 'utf8');
const siteSettings = readFileSync('lib/content/site-settings.ts', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

for (const value of [
  'space-business',
  'https://event.duan.edu.ua/et6naw',
  'for_organisations_application_url',
]) {
  if (!migration.includes(value)) errors.push(`Migration is missing: ${value}`);
  if (!tests.includes(value)) errors.push(`Database test is missing: ${value}`);
}

for (const guard of [
  "application_provider = 'leeloo'",
  'active Space Business run URL override',
  'active Space Business pricing URL override',
  'For Organisations to use the on-site form fallback',
  'v_updated <> 1',
]) {
  if (!migration.includes(guard)) errors.push(`Migration is missing guard: ${guard}`);
}

if (!programmeLoader.includes('primaryCtaUrl: run?.application_url ?? row.application_url')) {
  errors.push('Programme loader must preserve active-run then programme URL priority.');
}
if (!programmeLanding.includes("entity.primaryCtaUrl ?? '#programme-question'")) {
  errors.push('Programme landing must preserve the question fallback.');
}
if (!programmeLanding.includes('entity.primaryCtaUrl ? <QuestionCta')) {
  errors.push('External programme CTA pages must retain the secondary question CTA.');
}
if (!siteSettings.includes("forOrganisationsSettingKey = 'for_organisations_application_url'")) {
  errors.push('For Organisations must continue to use the controlled site setting.');
}
if (!managedPage.includes("page.pageKey === 'for_organisations' || page.pageKey === 'partnerships'")) {
  errors.push('Managed page must preserve the For Organisations fallback branch.');
}
if (!managedPage.includes("? '#contact'")) {
  errors.push('For Organisations fallback must target the on-site contact form.');
}
if (!managedPage.includes("page.pageKey === 'for_organisations' ? 'organisation_enquiry'")) {
  errors.push('For Organisations must render the organisation enquiry form.');
}

for (const [label, pattern] of [
  ['approved Space Business destination', /https:\/\/event\.duan\.edu\.ua\/et6naw/],
  ['For Organisations fallback decision', /For Organisations remains on the on-site organisation enquiry form/],
  ['secret and learner privacy', /No secret, service-role key, or learner data/],
]) {
  if (!pattern.test(report)) errors.push(`QA report is missing ${label}.`);
}

if (pkg.scripts?.['verify:qa-005:cta-002'] !== 'node scripts/verify-qa-005-cta-002.mjs') {
  errors.push('package.json must expose verify:qa-005:cta-002.');
}

if (errors.length) {
  console.error('QA-005 CTA-002 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('QA-005 CTA-002 static verification passed.');
