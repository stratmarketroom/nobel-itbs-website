import { existsSync, readFileSync } from 'node:fs';

const migrationPath = 'supabase/migrations/20260804110000_prg_003_programme_core.sql';
const testPath = 'supabase/tests/database/prg_003_programme_core.test.sql';
const generatorPath = 'scripts/generate-prg-003.mjs';
const errors = [];

for (const path of [migrationPath, testPath, generatorPath]) {
  if (!existsSync(path)) errors.push(`Missing required path: ${path}`);
}

if (existsSync(migrationPath)) {
  const sql = readFileSync(migrationPath, 'utf8');
  const requiredSnippets = [
    'create type public.programme_publication_status as enum',
    'create type public.programme_format as enum',
    'create type public.programme_application_provider as enum',
    'create table public.programmes',
    'create table public.programme_translations',
    "'ai-production'",
    "'general-psychology'",
    "'child-psychology'",
    "'neuroplastic-reconstruction'",
    "'space-business'",
    "'partner_site'",
    "'leeloo'",
    'https://school.kholodenko.net/',
    'Перейти на сайт програми',
    'Visit programme website',
    'Přejít na web programu',
    'application_provider public.programme_application_provider not null',
    'application_url text null',
    '5 жовтня 2026 року',
    'Університет імені Альфреда Нобеля',
    '"hours_on_certificate": false',
    'alter table public.programmes force row level security;',
    'alter table public.programme_translations force row level security;',
    'create policy programmes_public_read',
    'create policy programmes_reference_read',
    'create policy programmes_content_update',
    'create policy programme_translations_public_read',
    'create policy programme_translations_reference_read',
    'create policy programme_translations_content_update',
  ];

  for (const snippet of requiredSnippets) {
    if (!sql.includes(snippet)) errors.push(`Migration missing required SQL snippet: ${snippet}`);
  }

  const jsonBlocks = [...sql.matchAll(/\$json\$([\s\S]*?)\$json\$/g)];
  if (jsonBlocks.length !== 15) {
    errors.push(`Expected 15 structured translation blocks, found ${jsonBlocks.length}.`);
  }

  for (const [index, match] of jsonBlocks.entries()) {
    try {
      const sections = JSON.parse(match[1]);
      for (const key of [
        'eyebrow',
        'primary_cta_label',
        'facts',
        'value',
        'audience',
        'outcomes',
        'curriculum',
        'learning_experience',
        'assessment_document',
        'faq',
        'closing_cta',
      ]) {
        if (!(key in sections)) errors.push(`Translation ${index + 1} is missing ${key}.`);
      }
      if (!Array.isArray(sections.faq?.items) || sections.faq.items.length === 0) {
        errors.push(`Translation ${index + 1} has no structured FAQ items.`);
      }
    } catch (error) {
      errors.push(`Translation ${index + 1} is not valid JSON: ${error.message}`);
    }
  }

  const publishedRows = [...sql.matchAll(/'00000000-0000-4000-8000-00000000030[1-5]', '(?:en|ua|cz)', 'published'/g)];
  if (publishedRows.length !== 15) {
    errors.push(`Expected 15 published translation seed rows, found ${publishedRows.length}.`);
  }

  const forbiddenPatterns = [
    [/create\s+table\s+public\.programme_runs/i, 'PRG-003 must not create programme runs.'],
    [/create\s+table\s+public\.programme_pricing_options/i, 'PRG-003 must not create pricing options.'],
    [/default_leeloo_url|programmes_default_leeloo/i, 'Programme routing must use the vendor-neutral application contract.'],
    [/EUR\s*(?:990|1,390|2,090)|WayForPay/i, 'PRG-003 must not seed deferred pricing or payment links.'],
    [/Publication Dependencies|internal_note_not_for_publication/i, 'Internal preparation notes must not be seeded as public content.'],
  ];
  for (const [pattern, message] of forbiddenPatterns) {
    if (pattern.test(sql)) errors.push(message);
  }
}

if (existsSync(testPath)) {
  const testSql = readFileSync(testPath, 'utf8');
  for (const [pattern, label] of [
    [/select\s+plan\(30\);/i, 'select plan(30);'],
    [/select\s+has_table\(\s*'public'\s*,\s*'programmes'/i, "select has_table('public', 'programmes'"],
    [/select\s+has_table\(\s*'public'\s*,\s*'programme_translations'/i, "select has_table('public', 'programme_translations'"],
    [/select\s+results_eq\(/i, 'select results_eq('],
    [/select\s+\*\s+from\s+finish\(\);/i, 'select * from finish();'],
  ]) {
    if (!pattern.test(testSql)) errors.push(`PRG-003 test missing required snippet: ${label}`);
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:prg-003'] !== 'node scripts/verify-prg-003.mjs') {
    errors.push('package.json must expose verify:prg-003.');
  }
}

if (errors.length > 0) {
  console.error('PRG-003 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('PRG-003 verification passed.');
