import { existsSync, readFileSync } from 'node:fs';

const files = [
  'supabase/migrations/20260805110000_cnt_002_structured_content_pages.sql',
  'supabase/tests/database/cnt_002_structured_content_pages.test.sql',
  'lib/content/pages.ts', 'lib/content/admin.ts',
  'app/api/v1/admin/content-pages/route.ts',
  'app/api/v1/admin/content-pages/[id]/route.ts',
  'app/api/v1/public/content-pages/[pageKey]/route.ts',
  'components/admin-content-pages.tsx', 'app/admin/content-pages/page.tsx',
];
const errors = files.filter((file) => !existsSync(file)).map((file) => `Missing ${file}`);
const migration = existsSync(files[0]) ? readFileSync(files[0], 'utf8') : '';
for (const snippet of ['create table public.content_pages', 'create table public.content_page_translations', 'sections jsonb', 'force row level security', "'content_manager'", 'audit_content_translation_change']) {
  if (!migration.includes(snippet)) errors.push(`Migration missing ${snippet}`);
}
if (/grant\s+(insert|update|delete|all)[^;]*content_pages[^;]*\banon\b/i.test(migration)) errors.push('Anon content mutation grant found.');
if (errors.length) {
  console.error('CNT-002 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('CNT-002 verification passed.');
