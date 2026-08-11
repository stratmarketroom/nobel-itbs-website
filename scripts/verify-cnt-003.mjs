import { existsSync, readFileSync } from 'node:fs';
const files = [
  'supabase/migrations/20260805120000_cnt_003_public_layout_navigation.sql',
  'supabase/tests/database/cnt_003_public_layout_navigation.test.sql',
  'components/managed-content-page.tsx',
  'app/about/page.tsx', 'app/[locale]/about/page.tsx',
  'app/for-organisations/page.tsx', 'app/[locale]/for-organisations/page.tsx',
  'app/partnerships/page.tsx', 'app/[locale]/partnerships/page.tsx',
];
const errors = files.filter((file) => !existsSync(file)).map((file) => `Missing ${file}`);
const component = existsSync(files[2]) ? readFileSync(files[2], 'utf8') : '';
for (const href of ['/programmes', '/for-organisations', '/partnerships', '/about', '/verify']) if (!component.includes(href)) errors.push(`Navigation missing ${href}`);
if (/news/i.test(component)) errors.push('News must not appear in Release 1 navigation.');
const migration = existsSync(files[0]) ? readFileSync(files[0], 'utf8') : '';
for (const key of ['home', 'about', 'partnerships', 'for_organisations']) if (!migration.includes(`'${key}'`)) errors.push(`Migration missing ${key}`);
if (errors.length) { console.error('CNT-003 verification failed:'); for (const error of errors) console.error(`- ${error}`); process.exit(1); }
console.log('CNT-003 verification passed.');
