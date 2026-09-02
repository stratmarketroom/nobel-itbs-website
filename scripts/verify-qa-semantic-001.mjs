import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const files = {
  generator: 'scripts/generate-cnt-003.mjs',
  migration: 'supabase/migrations/20260902180000_qa_semantic_001_managed_content_structure.sql',
  databaseTest: 'supabase/tests/database/cnt_003_public_layout_navigation.test.sql',
  component: 'components/managed-content-page.tsx',
  stylesheet: 'app/public.css',
};

const errors = Object.values(files)
  .filter((file) => !existsSync(file))
  .map((file) => `Missing ${file}`);

const migration = existsSync(files.migration) ? readFileSync(files.migration, 'utf8') : '';
const databaseTest = existsSync(files.databaseTest) ? readFileSync(files.databaseTest, 'utf8') : '';
const component = existsSync(files.component) ? readFileSync(files.component, 'utf8') : '';
const stylesheet = existsSync(files.stylesheet) ? readFileSync(files.stylesheet, 'utf8') : '';

for (const required of [
  'affected_rows <> 9',
  '"items":[',
  '"title":"Distribution And Promotion Partnership"',
  '"title":"Educational Projects"',
  '"title":"Partnership Workflow"',
  '"key":"final_cta"',
  '"title":"Ключові факти про університет"',
  '"title":"Klíčová fakta o univerzitě"',
]) {
  if (!migration.includes(required)) errors.push(`Semantic migration missing ${required}`);
}

for (const forbidden of ['Editorial Guardrails', 'Partner card fields', 'Expert card fields', 'Publication dependency']) {
  if (migration.includes(forbidden)) errors.push(`Semantic migration exposes internal content: ${forbidden}`);
}

if ((migration.match(/"items":\[/g) ?? []).length !== 9) {
  errors.push('Semantic migration must contain nine structured list collections.');
}
if ((migration.match(/"title":"Distribution And Promotion Partnership"/g) ?? []).length !== 3) {
  errors.push('All three Partnerships translations must retain the terminal partnership model.');
}
if ((migration.match(/"key":"final_cta"/g) ?? []).length !== 9) {
  errors.push('All nine managed-page translations must retain their final CTA block.');
}

for (const required of [
  'function ManagedList',
  '<ul className="managed-list">',
  'function PairedContent',
  '<ol className="managed-process-list">',
  '<dl className="managed-detail-list">',
  "'h1', 'h2', 'heading', 'title'",
]) {
  if (!component.includes(required)) errors.push(`Managed renderer missing semantic behavior: ${required}`);
}

for (const required of ['.managed-list', '.managed-detail-list', '.managed-process-list']) {
  if (!stylesheet.includes(required)) errors.push(`Public stylesheet missing ${required}`);
}

for (const required of [
  'managed-page Markdown lists are stored as nine structured item collections',
  'managed-page list content is not flattened into paragraph strings',
  'managed pages retain terminal cards and final CTA sections in all locales',
  'managed pages exclude internal editorial and schema instructions',
]) {
  if (!databaseTest.includes(required)) errors.push(`Database test missing assertion: ${required}`);
}

if (existsSync(files.generator) && migration) {
  const temporaryDirectory = mkdtempSync(join(tmpdir(), 'verify-qa-semantic-001-'));
  const generatedMigrationPath = join(temporaryDirectory, 'generated-qa-semantic-001.sql');
  try {
    execFileSync(
      process.execPath,
      [files.generator, generatedMigrationPath, '--managed-sections-fix'],
      { encoding: 'utf8', stdio: 'pipe' },
    );
    const generatedMigration = readFileSync(generatedMigrationPath, 'utf8');
    if (generatedMigration !== migration) {
      errors.push('Committed semantic migration does not match the current approved source generator output.');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`Semantic migration generation failed: ${message}`);
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

if (errors.length) {
  console.error('QA-SEMANTIC-001 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('QA-SEMANTIC-001 verification passed.');
