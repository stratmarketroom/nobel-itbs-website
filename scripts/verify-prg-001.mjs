import { existsSync, readFileSync } from 'node:fs';

const migrationPath = 'supabase/migrations/20260803110000_prg_001_programme_areas.sql';
const testPath = 'supabase/tests/database/prg_001_programme_areas.test.sql';
const errors = [];

for (const path of [migrationPath, testPath]) {
  if (!existsSync(path)) {
    errors.push(`Missing required path: ${path}`);
  }
}

if (existsSync(migrationPath)) {
  const sql = readFileSync(migrationPath, 'utf8');
  const requiredSnippets = [
    'create type public.record_status as enum',
    "'draft'",
    "'published'",
    "'archived'",
    'create table if not exists public.programme_areas',
    'create table if not exists public.programme_area_translations',
    'language_code text not null references public.languages(code) on delete restrict',
    'translation_status public.translation_status not null default',
    "'business-management'",
    "'technology-innovation'",
    "'psychology-human'",
    'alter table public.programme_areas enable row level security;',
    'alter table public.programme_area_translations enable row level security;',
    'create policy programme_areas_public_read',
    'create policy programme_areas_reference_read',
    'create policy programme_areas_content_read',
    'create policy programme_area_translations_public_read',
    'create policy programme_area_translations_reference_read',
    'create policy programme_area_translations_content_read',
    "array['owner', 'super_admin', 'content_manager']::public.app_role[]",
  ];

  for (const snippet of requiredSnippets) {
    if (!sql.includes(snippet)) {
      errors.push(`Migration missing required SQL snippet: ${snippet}`);
    }
  }

  const forbiddenPatterns = [
    [/create\s+table\s+public\.(?:programme_types|programmes|programme_runs|learners|credentials)/i, 'PRG-001 must not create later module tables.'],
    [/gmail|leeloo|credential_files|document_number_log/i, 'PRG-001 must not include integrations or credential objects.'],
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
    [/select\s+plan\(20\);/i, 'select plan(20);'],
    [/select\s+has_type\(\s*'public'\s*,\s*'record_status'/i, "select has_type('public', 'record_status'"],
    [/select\s+has_table\(\s*'public'\s*,\s*'programme_areas'/i, "select has_table('public', 'programme_areas'"],
    [/select\s+has_table\(\s*'public'\s*,\s*'programme_area_translations'/i, "select has_table('public', 'programme_area_translations'"],
    [/select\s+results_eq\(/i, 'select results_eq('],
    [/select\s+\*\s+from\s+finish\(\);/i, 'select * from finish();'],
  ];

  for (const [pattern, label] of requiredTestPatterns) {
    if (!pattern.test(testSql)) {
      errors.push(`PRG-001 test missing required snippet: ${label}`);
    }
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:prg-001'] !== 'node scripts/verify-prg-001.mjs') {
    errors.push('package.json must expose verify:prg-001.');
  }
}

if (errors.length > 0) {
  console.error('PRG-001 verification failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('PRG-001 verification passed.');
