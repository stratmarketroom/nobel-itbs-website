import { existsSync, readFileSync } from 'node:fs';

const migrationPath = 'supabase/migrations/20260804100000_prg_002_programme_types.sql';
const testPath = 'supabase/tests/database/prg_002_programme_types.test.sql';
const errors = [];

for (const path of [migrationPath, testPath]) {
  if (!existsSync(path)) {
    errors.push(`Missing required path: ${path}`);
  }
}

if (existsSync(migrationPath)) {
  const sql = readFileSync(migrationPath, 'utf8');
  const requiredSnippets = [
    'create table if not exists public.programme_types',
    'create table if not exists public.programme_type_translations',
    'language_code text not null references public.languages(code) on delete restrict',
    'landing_title text null',
    "sections jsonb not null default '{}'::jsonb",
    'og_title text null',
    'og_description text null',
    "'certificate-programme'",
    "'mini-mba'",
    "'professional-development-course'",
    "'Certificate programme'",
    "'Сертифікатна програма'",
    "'Certifikátový program'",
    "'Програма професійного підвищення кваліфікації'",
    "'Kurz profesního rozvoje'",
    'alter table public.programme_types enable row level security;',
    'alter table public.programme_type_translations enable row level security;',
    'create policy programme_types_public_read',
    'create policy programme_types_reference_read',
    'create policy programme_types_content_read',
    'create policy programme_type_translations_public_read',
    'create policy programme_type_translations_reference_read',
    'create policy programme_type_translations_content_read',
  ];

  for (const snippet of requiredSnippets) {
    if (!sql.includes(snippet)) {
      errors.push(`Migration missing required SQL snippet: ${snippet}`);
    }
  }

  const jsonBlocks = [...sql.matchAll(/\$json\$([\s\S]*?)\$json\$/g)];
  if (jsonBlocks.length !== 9) {
    errors.push(`Expected 9 structured translation blocks, found ${jsonBlocks.length}.`);
  }

  for (const [index, match] of jsonBlocks.entries()) {
    try {
      const sections = JSON.parse(match[1]);
      for (const key of ['primary_cta_label', 'audience', 'comparison', 'listing', 'closing_cta']) {
        if (!(key in sections)) {
          errors.push(`Structured translation ${index + 1} is missing ${key}.`);
        }
      }
    } catch (error) {
      errors.push(`Structured translation ${index + 1} is not valid JSON: ${error.message}`);
    }
  }

  const publishedTranslationRows = [...sql.matchAll(/'00000000-0000-4000-8000-00000000020[1-3]',\s*'(?:en|ua|cz)',\s*'published'/g)];
  if (publishedTranslationRows.length !== 9) {
    errors.push(`Expected 9 published translation seed rows, found ${publishedTranslationRows.length}.`);
  }

  const forbiddenPatterns = [
    [/create\s+table\s+public\.(?:programmes|programme_runs|learners|credentials)/i, 'PRG-002 must not create later module tables.'],
    [/gmail|leeloo|credential_files|document_number_log/i, 'PRG-002 must not include integrations or credential objects.'],
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
    [/select\s+plan\(22\);/i, 'select plan(22);'],
    [/select\s+has_table\(\s*'public'\s*,\s*'programme_types'/i, "select has_table('public', 'programme_types'"],
    [/select\s+has_table\(\s*'public'\s*,\s*'programme_type_translations'/i, "select has_table('public', 'programme_type_translations'"],
    [/select\s+results_eq\(/i, 'select results_eq('],
    [/select\s+\*\s+from\s+finish\(\);/i, 'select * from finish();'],
  ];

  for (const [pattern, label] of requiredTestPatterns) {
    if (!pattern.test(testSql)) {
      errors.push(`PRG-002 test missing required snippet: ${label}`);
    }
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:prg-002'] !== 'node scripts/verify-prg-002.mjs') {
    errors.push('package.json must expose verify:prg-002.');
  }
}

if (errors.length > 0) {
  console.error('PRG-002 verification failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('PRG-002 verification passed.');
