import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const files = {
  generator: 'scripts/generate-cnt-003.mjs',
  localizationMap: 'scripts/lib/managed-headings-localization.json',
  migration: 'supabase/migrations/20260902170000_qa_i18n_001_localized_managed_headings.sql',
  databaseTest: 'supabase/tests/database/cnt_003_public_layout_navigation.test.sql',
  component: 'components/managed-content-page.tsx',
  aboutUa: 'docs/preparation/pages/ABOUT_US_UA_MASTER_COPY.md',
  aboutCz: 'docs/preparation/pages/ABOUT_US_CZ_MASTER_COPY.md',
  partnershipsUa: 'docs/preparation/pages/PARTNERSHIPS_UA_MASTER_COPY.md',
  partnershipsCz: 'docs/preparation/pages/PARTNERSHIPS_CZ_MASTER_COPY.md',
  organisationsUa: 'docs/preparation/pages/FOR_ORGANISATIONS_UA_MASTER_COPY.md',
  organisationsCz: 'docs/preparation/pages/FOR_ORGANISATIONS_CZ_MASTER_COPY.md',
};

const expectedLabels = [
  'Для кого ми працюємо',
  'Pro koho pracujeme',
  'Партнерства',
  'Partnerství',
  'Принципи партнерства',
  'Zásady partnerství',
  'Моделі партнерства',
  'Modely partnerství',
  'Партнерство у створенні програм',
  'Partnerství při tvorbě programů',
  'Експертне партнерство',
  'Expertní partnerství',
  'Інфраструктурне партнерство',
  'Infrastrukturní partnerství',
  'Партнерство у представленні та просуванні',
  'Partnerství pro distribuci a propagaci',
  'Межі партнерства',
  'Hranice partnerství',
  'B2B-інфраструктура',
  'B2B infrastruktura',
  'Бізнес-потреба',
  'Obchodní potřeba',
  'З ким ми працюємо',
  'S kým spolupracujeme',
  'Онлайн-школи',
  'Online školy',
  'Експерти та автори програм',
  'Experti a autoři programů',
  'Освітні проєкти',
  'Vzdělávací projekty',
  'Інфраструктурні послуги',
  'Infrastrukturní služby',
  'Структурування програми',
  'Strukturování programu',
  'Модель документів',
  'Model dokumentů',
  'Підготовка документів і додатків',
  'Příprava dokumentů a dodatků',
  'Реєстрація та верифікація',
  'Registrace a ověřování',
  'Процес партнерства',
  'Průběh partnerství',
  'Що отримує клієнт',
  'Co klient získá',
  'Як відбувається співпраця',
  'Jak spolupráce probíhá',
  'Довіра та межі',
  'Důvěra a hranice',
  'Поширені запитання',
  'Časté dotazy',
];

const errors = Object.values(files)
  .filter((file) => !existsSync(file))
  .map((file) => `Missing ${file}`);

const migration = existsSync(files.migration) ? readFileSync(files.migration, 'utf8') : '';
const databaseTest = existsSync(files.databaseTest) ? readFileSync(files.databaseTest, 'utf8') : '';
const component = existsSync(files.component) ? readFileSync(files.component, 'utf8') : '';
const localizationMap = existsSync(files.localizationMap) ? readFileSync(files.localizationMap, 'utf8') : '';

for (const label of expectedLabels) {
  // Terminal cards missing in the baseline are restored by QA-SEMANTIC-001.
  if (!migration.includes(label) && !localizationMap.includes(label)) errors.push(`Localization mapping missing ${label}`);
}

for (const required of [
  'affected_rows <> 6',
  'translation.sections = localization.expected_sections',
  'Reconcile CMS edits before retrying',
  "page.page_key = localization.page_key",
  "translation.language_code = localization.language_code",
]) {
  if (!migration.includes(required)) errors.push(`Localization migration missing invariant: ${required}`);
}

for (const required of [
  'UA and CZ managed-page sections use localized display headings',
  'UA and CZ managed-page cards use localized display titles',
]) {
  if (!databaseTest.includes(required)) errors.push(`Database test missing assertion: ${required}`);
}

for (const required of [
  'const partnerSectionCopy',
  "ua: { eyebrow: 'Партнери', title: 'Організації-партнери' }",
  "cz: { eyebrow: 'Partneři', title: 'Partnerské organizace' }",
]) {
  if (!component.includes(required)) errors.push(`Managed partnership section missing localized UI copy: ${required}`);
}

if (existsSync(files.generator)) {
  const temporaryDirectory = mkdtempSync(join(tmpdir(), 'verify-qa-i18n-001-'));
  const generatedMigrationPath = join(temporaryDirectory, 'generated-cnt-003.sql');
  try {
    execFileSync(process.execPath, [files.generator, generatedMigrationPath], {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    const generatedMigration = readFileSync(generatedMigrationPath, 'utf8');
    for (const label of expectedLabels) {
      if (!generatedMigration.includes(label)) errors.push(`Generated managed content missing ${label}`);
    }
    for (const exactField of [
      '"h2":"Obchodní potřeba"',
      '"title":"Online školy"',
      '"h2":"Поширені запитання"',
      '"title":"Партнерство у створенні програм"',
    ]) {
      if (!generatedMigration.includes(exactField)) errors.push(`Generated managed content has a malformed field: ${exactField}`);
    }
    execFileSync(process.execPath, [files.generator, generatedMigrationPath, '--localized-headings-fix'], {
      encoding: 'utf8', stdio: 'pipe',
    });
    if (readFileSync(generatedMigrationPath, 'utf8') !== migration) errors.push('Committed heading migration does not match guarded generator output.');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`Managed-content generator execution failed: ${message}`);
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

if (errors.length) {
  console.error('QA-I18N-001 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('QA-I18N-001 verification passed.');
