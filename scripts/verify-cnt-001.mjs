import { existsSync, readFileSync } from 'node:fs';

const migrationPath = 'supabase/migrations/20260803100000_cnt_001_languages.sql';
const testPath = 'supabase/tests/database/cnt_001_languages.test.sql';
const localizationPath = 'lib/content/localization.ts';
const errors = [];

for (const path of [migrationPath, testPath, localizationPath]) {
  if (!existsSync(path)) {
    errors.push(`Missing required path: ${path}`);
  }
}

if (existsSync(migrationPath)) {
  const sql = readFileSync(migrationPath, 'utf8');
  const requiredSnippets = [
    'create type public.translation_status as enum',
    "'missing'",
    "'draft'",
    "'published'",
    'create table if not exists public.languages',
    'code text primary key',
    "('en', 'English', 'English', null, true, true, 10)",
    "('ua', 'Ukrainian', 'Українська', '/ua', false, true, 20)",
    "('cz', 'Czech', 'Čeština', '/cz', false, true, 30)",
    'alter table public.languages enable row level security;',
    'alter table public.languages force row level security;',
    'grant select on table public.languages to anon, authenticated;',
    'create policy languages_read_active',
  ];

  for (const snippet of requiredSnippets) {
    if (!sql.includes(snippet)) {
      errors.push(`Migration missing required SQL snippet: ${snippet}`);
    }
  }

  const forbiddenPatterns = [
    [/create\s+table\s+public\.(?:content_pages|programmes|learners|credentials)/i, 'CNT-001 must not create later module tables.'],
    [/gmail|leeloo|credential_files|document_number_log/i, 'CNT-001 must not include integrations or credential objects.'],
  ];

  for (const [pattern, message] of forbiddenPatterns) {
    if (pattern.test(sql)) {
      errors.push(message);
    }
  }
}

if (existsSync(testPath)) {
  const testSql = readFileSync(testPath, 'utf8');
  const requiredTestPatterns = [
    [/select\s+plan\(15\);/i, 'select plan(15);'],
    [/select\s+has_type\(\s*'public'\s*,\s*'translation_status'/i, "select has_type('public', 'translation_status'"],
    [/select\s+has_table\(\s*'public'\s*,\s*'languages'/i, "select has_table('public', 'languages'"],
    [/select\s+results_eq\(/i, 'select results_eq('],
    [/select\s+\*\s+from\s+finish\(\);/i, 'select * from finish();'],
  ];

  for (const [pattern, label] of requiredTestPatterns) {
    if (!pattern.test(testSql)) {
      errors.push(`CNT-001 test missing required snippet: ${label}`);
    }
  }
}

if (existsSync(localizationPath)) {
  const localization = readFileSync(localizationPath, 'utf8');
  const requiredSnippets = [
    "export const contentLocales = ['en', 'ua', 'cz'] as const;",
    "export const defaultContentLocale: ContentLocale = 'en';",
    "en: ''",
    "ua: '/ua'",
    "cz: '/cz'",
    'export function selectPublishedTranslation',
    "translation.translationStatus === 'published'",
  ];

  for (const snippet of requiredSnippets) {
    if (!localization.includes(snippet)) {
      errors.push(`Localization contract missing required snippet: ${snippet}`);
    }
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:cnt-001'] !== 'node scripts/verify-cnt-001.mjs') {
    errors.push('package.json must expose verify:cnt-001.');
  }
}

if (errors.length > 0) {
  console.error('CNT-001 verification failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('CNT-001 verification passed.');
