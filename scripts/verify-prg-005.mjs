import { existsSync, readFileSync } from 'node:fs';

const migrationPath = 'supabase/migrations/20260804130000_prg_005_pricing_options.sql';
const testPath = 'supabase/tests/database/prg_005_pricing_options.test.sql';
const errors = [];

for (const path of [migrationPath, testPath]) {
  if (!existsSync(path)) errors.push(`Missing required path: ${path}`);
}

if (existsSync(migrationPath)) {
  const sql = readFileSync(migrationPath, 'utf8');
  const requiredSnippets = [
    'create table public.programme_pricing_options',
    'create table public.programme_pricing_option_translations',
    'application_url text null',
    'translation_status public.translation_status',
    'unique (programme_id, sort_order)',
    'create or replace function public.resolve_programme_application_url',
    'security invoker',
    'set search_path = public, pg_temp',
    'alter table public.programme_pricing_options force row level security;',
    'alter table public.programme_pricing_option_translations force row level security;',
    'create policy programme_pricing_options_public_read',
    'create policy programme_pricing_options_content_update',
    'create policy programme_pricing_option_translations_public_read',
    'create policy programme_pricing_option_translations_content_update',
  ];
  for (const snippet of requiredSnippets) {
    if (!sql.includes(snippet)) errors.push(`Migration missing required SQL snippet: ${snippet}`);
  }

  for (const [pattern, message] of [
    [/insert\s+into\s+public\.programme_pricing_options/i, 'PRG-005 must not seed partner or unconfirmed launch prices.'],
    [/previous_price|compare_at|discount_price/i, 'Promotional pricing is outside Release 1 pricing scope.'],
    [/leeloo_url|default_leeloo_url/i, 'Pricing must use the vendor-neutral application URL contract.'],
    [/security\s+definer/i, 'Public URL resolution should not bypass RLS.'],
  ]) {
    if (pattern.test(sql)) errors.push(message);
  }
}

if (existsSync(testPath)) {
  const testSql = readFileSync(testPath, 'utf8');
  for (const [pattern, label] of [
    [/select\s+plan\(34\);/i, 'select plan(34);'],
    [/select\s+has_table\(\s*'public'\s*,\s*'programme_pricing_options'/i, "select has_table('public', 'programme_pricing_options'"],
    [/resolve_programme_application_url/i, 'resolve_programme_application_url'],
    [/select\s+throws_ok\(/i, 'select throws_ok('],
    [/select\s+\*\s+from\s+finish\(\);/i, 'select * from finish();'],
  ]) {
    if (!pattern.test(testSql)) errors.push(`PRG-005 test missing required snippet: ${label}`);
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:prg-005'] !== 'node scripts/verify-prg-005.mjs') {
    errors.push('package.json must expose verify:prg-005.');
  }
}

if (errors.length > 0) {
  console.error('PRG-005 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('PRG-005 verification passed.');
