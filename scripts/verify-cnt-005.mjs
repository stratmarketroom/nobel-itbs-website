import { existsSync, readFileSync } from 'node:fs';

const files = [
  'supabase/migrations/20260805140000_cnt_005_legal_pages.sql',
  'supabase/tests/database/cnt_005_legal_pages.test.sql',
  'components/legal-content-page.tsx',
  'components/cookie-consent.tsx',
  'app/privacy-policy/page.tsx', 'app/[locale]/privacy-policy/page.tsx',
  'app/terms-of-use/page.tsx', 'app/[locale]/terms-of-use/page.tsx',
  'app/refund-policy/page.tsx', 'app/[locale]/refund-policy/page.tsx',
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
const legalMetadata = existsSync('lib/content/legal-pages.ts') ? readFileSync('lib/content/legal-pages.ts', 'utf8') : '';
if (!legalMetadata.includes('index: false, follow: true')) errors.push('Legal routes must be noindex, follow.');
const cookie = existsSync('components/cookie-consent.tsx') ? readFileSync('components/cookie-consent.tsx', 'utf8') : '';
for (const value of ['accepted', 'declined', 'nobel_cookie_consent']) if (!cookie.includes(value)) errors.push(`Cookie consent missing ${value}`);
if (errors.length) {
  console.error('CNT-005 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('CNT-005 verification passed.');
