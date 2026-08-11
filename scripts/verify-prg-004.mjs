import { existsSync, readFileSync } from 'node:fs';

const migrationPath = 'supabase/migrations/20260804120000_prg_004_programme_runs.sql';
const testPath = 'supabase/tests/database/prg_004_programme_runs.test.sql';
const errors = [];

for (const path of [migrationPath, testPath]) {
  if (!existsSync(path)) errors.push(`Missing required path: ${path}`);
}

if (existsSync(migrationPath)) {
  const sql = readFileSync(migrationPath, 'utf8');
  const requiredSnippets = [
    'create type public.programme_run_status as enum',
    "'upcoming'",
    "'open'",
    "'ongoing'",
    "'closed'",
    'create table public.programme_runs',
    'application_url text null',
    'programmes_enrolment_badge_override_allowed',
    'create or replace function public.calculate_programme_enrolment_badge',
    'security invoker',
    'set search_path = public, pg_temp',
    "'2026-10-05'",
    'alter table public.programme_runs force row level security;',
    'create policy programme_runs_public_read',
    'create policy programme_runs_reference_read',
    'create policy programme_runs_content_update',
  ];
  for (const snippet of requiredSnippets) {
    if (!sql.includes(snippet)) errors.push(`Migration missing required SQL snippet: ${snippet}`);
  }

  const seedRows = [...sql.matchAll(/'00000000-0000-4000-8000-00000000040[1-5]'/g)];
  if (seedRows.length !== 5) errors.push(`Expected 5 programme-run seed rows, found ${seedRows.length}.`);

  for (const [pattern, message] of [
    [/create\s+table\s+public\.programme_pricing_options/i, 'PRG-004 must not create pricing options.'],
    [/leeloo_url|programme_runs_leeloo/i, 'Programme runs must use the vendor-neutral application URL contract.'],
    [/EUR\s*(?:990|1,390|2,090)|WayForPay/i, 'PRG-004 must not seed pricing or payment links.'],
    [/security\s+definer/i, 'Public badge calculation should not bypass RLS.'],
  ]) {
    if (pattern.test(sql)) errors.push(message);
  }
}

if (existsSync(testPath)) {
  const testSql = readFileSync(testPath, 'utf8');
  for (const [pattern, label] of [
    [/select\s+plan\(25\);/i, 'select plan(25);'],
    [/select\s+has_table\(\s*'public'\s*,\s*'programme_runs'/i, "select has_table('public', 'programme_runs'"],
    [/calculate_programme_enrolment_badge/i, 'calculate_programme_enrolment_badge'],
    [/select\s+throws_ok\(/i, 'select throws_ok('],
    [/select\s+\*\s+from\s+finish\(\);/i, 'select * from finish();'],
  ]) {
    if (!pattern.test(testSql)) errors.push(`PRG-004 test missing required snippet: ${label}`);
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:prg-004'] !== 'node scripts/verify-prg-004.mjs') {
    errors.push('package.json must expose verify:prg-004.');
  }
}

if (errors.length > 0) {
  console.error('PRG-004 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('PRG-004 verification passed.');
