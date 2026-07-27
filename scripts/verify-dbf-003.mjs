import { existsSync, readFileSync } from 'node:fs';

const migrationPath = 'supabase/migrations/20260727104215_dbf_003_internal_schema_and_extensions.sql';
const testPath = 'supabase/tests/database/dbf_003_foundation.test.sql';
const errors = [];

for (const path of [migrationPath, testPath]) {
  if (!existsSync(path)) {
    errors.push(`Missing required path: ${path}`);
  }
}

if (existsSync(migrationPath)) {
  const sql = readFileSync(migrationPath, 'utf8');
  const requiredSnippets = [
    'create schema if not exists extensions;',
    'create extension if not exists pgcrypto with schema extensions;',
    'create extension if not exists citext with schema extensions;',
    'create extension if not exists pg_trgm with schema extensions;',
    'create schema if not exists internal;',
    'create or replace function internal.set_updated_at()',
    'set search_path = pg_catalog, public, pg_temp',
    'revoke all on schema internal from public, anon, authenticated;',
    'alter default privileges for role postgres in schema internal',
    'revoke execute on functions from public, anon, authenticated;',
  ];

  for (const snippet of requiredSnippets) {
    if (!sql.includes(snippet)) {
      errors.push(`Migration missing required SQL snippet: ${snippet}`);
    }
  }

  const forbiddenPatterns = [
    [/create\s+table\s+public\./i, 'DBF-003 must not create public business tables.'],
    [/create\s+type\s+public\.(?:app_role|credential|programme|learner)/i, 'DBF-003 must not create business enums.'],
    [/gmail|leeloo|credential|learner|programme/i, 'DBF-003 migration must not include future module objects or integrations.'],
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
    [/select\s+plan\(7\);/i, 'select plan(7);'],
    [/select\s+has_schema\(\s*'internal'/i, "select has_schema('internal'"],
    [/select\s+has_function\(\s*'internal'\s*,\s*'set_updated_at'/i, "select has_function('internal', 'set_updated_at'"],
    [
      /select\s+function_lang_is\(\s*'internal'\s*,\s*'set_updated_at'/i,
      "select function_lang_is('internal', 'set_updated_at'",
    ],
    [/select\s+\*\s+from\s+finish\(\);/i, 'select * from finish();'],
  ];

  for (const [pattern, label] of requiredTestPatterns) {
    if (!pattern.test(testSql)) {
      errors.push(`DBF-003 test missing required snippet: ${label}`);
    }
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:dbf-003'] !== 'node scripts/verify-dbf-003.mjs') {
    errors.push('package.json must expose verify:dbf-003.');
  }
}

if (errors.length > 0) {
  console.error('DBF-003 verification failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('DBF-003 verification passed.');
