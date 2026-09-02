import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const files = [
  'supabase/migrations/20260805140000_cnt_005_legal_pages.sql',
  'supabase/migrations/20260902160000_qa_legal_001_publication_content_fix.sql',
  'supabase/tests/database/cnt_005_legal_pages.test.sql',
  'scripts/generate-cnt-005.mjs',
  'components/legal-content-page.tsx',
  'components/cookie-consent.tsx',
  'lib/privacy/cookie-consent.ts',
  'app/(public)/privacy-policy/page.tsx', 'app/(public)/[locale]/privacy-policy/page.tsx',
  'app/(public)/terms-of-use/page.tsx', 'app/(public)/[locale]/terms-of-use/page.tsx',
  'app/(public)/refund-policy/page.tsx', 'app/(public)/[locale]/refund-policy/page.tsx',
];
const errors = files.filter((file) => !existsSync(file)).map((file) => `Missing ${file}`);
const migration = existsSync(files[0]) ? readFileSync(files[0], 'utf8') : '';
for (const key of ['privacy_policy', 'terms_of_use', 'refund_policy']) {
  if (!migration.includes(`'${key}'`)) errors.push(`Migration missing ${key}`);
}
for (const locale of ['en', 'ua', 'cz']) {
  const occurrences = migration.split(`'${locale}','published'`).length - 1;
  if (occurrences !== 3) errors.push(`Expected 3 ${locale} legal translations, found ${occurrences}`);
}
if (migration.length < 50_000) errors.push('Legal migration is unexpectedly short; full documents may be missing.');
const correction = existsSync(files[1]) ? readFileSync(files[1], 'utf8') : '';
for (const required of ['privacy_policy', "language_code = 'ua'", 'jsonb_array_elements', '**номер телефону**', 'не публікувати як частину Політики']) {
  if (!correction.includes(required)) errors.push(`Legal publication correction missing ${required}`);
}
const generator = existsSync(files[3]) ? readFileSync(files[3], 'utf8') : '';
for (const required of ['stripInlineMarkdown', 'isUnpublishedMarkdownHeading']) {
  if (!generator.includes(required)) errors.push(`Legal generator missing ${required} safeguard`);
}
if (generator) {
  const temporaryDirectory = mkdtempSync(join(tmpdir(), 'verify-cnt-005-'));
  const generatedMigrationPath = join(temporaryDirectory, 'generated-cnt-005.sql');
  try {
    execFileSync(process.execPath, [files[3], generatedMigrationPath], {
      encoding: 'utf8',
      stdio: 'pipe',
    });
    const generatedMigration = readFileSync(generatedMigrationPath, 'utf8');
    if (generatedMigration.includes('Примітка для Release 1 — не публікувати як частину Політики')) {
      errors.push('Generated legal migration includes an unpublished editorial heading');
    }
    if (generatedMigration.includes('**номер телефону**')) {
      errors.push('Generated legal migration includes raw Markdown emphasis');
    }
    if (!generatedMigration.includes('номер телефону')) {
      errors.push('Generated legal migration lost the published phone-number wording');
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(`Legal generator execution failed: ${message}`);
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}
const databaseTest = existsSync(files[2]) ? readFileSync(files[2], 'utf8') : '';
for (const required of ['raw Markdown emphasis', 'unpublished editorial instructions']) {
  if (!databaseTest.includes(required)) errors.push(`Legal database test missing ${required} assertion`);
}
const legalMetadata = existsSync('lib/content/legal-pages.ts') ? readFileSync('lib/content/legal-pages.ts', 'utf8') : '';
if (!legalMetadata.includes('index: false, follow: true')) errors.push('Legal routes must be noindex, follow.');
const cookie = [
  existsSync('components/cookie-consent.tsx') ? readFileSync('components/cookie-consent.tsx', 'utf8') : '',
  existsSync('lib/privacy/cookie-consent.ts') ? readFileSync('lib/privacy/cookie-consent.ts', 'utf8') : '',
].join('\n');
for (const value of ['accepted', 'declined', 'nobel_cookie_consent']) if (!cookie.includes(value)) errors.push(`Cookie consent missing ${value}`);
if (errors.length) {
  console.error('CNT-005 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('CNT-005 verification passed.');
