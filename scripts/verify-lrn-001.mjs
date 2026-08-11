import { existsSync, readFileSync } from 'node:fs';

const migrationPath = 'supabase/migrations/20260807100000_lrn_001_learner_core.sql';
const testPath = 'supabase/tests/database/lrn_001_learner_core.test.sql';
const errors = [];

for (const path of [migrationPath, testPath]) {
  if (!existsSync(path)) errors.push(`Missing required path: ${path}`);
}

if (existsSync(migrationPath)) {
  const sql = readFileSync(migrationPath, 'utf8');
  for (const snippet of [
    'create table public.learners',
    'latin_first_name text not null',
    'latin_last_name text not null',
    'ukrainian_full_name text not null',
    'internal_note text null',
    'archived_at timestamptz null',
    'learners_set_updated_at',
    'enable row level security',
    'force row level security',
    'learners_authorized_read',
    'learners_authorized_insert',
    'learners_authorized_update',
    "array['owner', 'super_admin', 'credential_manager']::public.app_role[]",
    'internal.is_mfa_requirement_satisfied()',
    'grant insert (latin_first_name, latin_last_name, ukrainian_full_name, internal_note, archived_at)',
    'grant update (latin_first_name, latin_last_name, ukrainian_full_name, internal_note, archived_at)',
  ]) if (!sql.includes(snippet)) errors.push(`LRN-001 migration missing required behavior: ${snippet}`);

  for (const [pattern, message] of [
    [/array\[[^\]]*'content_manager'[^\]]*\]/i, 'Content Manager must not receive learner access.'],
    [/create\s+table\s+(?:if\s+not\s+exists\s+)?public\.(?:learner_emails|learner_phones|credential_sets|credentials)/i, 'LRN-001 must not create later learner or credential tables.'],
    [/create\s+policy\s+\S+\s+on\s+public\.learners\s+for\s+delete/i, 'LRN-001 must use soft archive and provide no authenticated delete policy.'],
    [/grant\s+delete\s+on\s+(?:table\s+)?public\.learners\s+to\s+authenticated/i, 'Authenticated admins must not hard-delete learners.'],
    [/\bemail\b|\bphone\b|telegram|viber|whatsapp/i, 'LRN-001 must not implement LRN-002/LRN-003 contact fields.'],
  ]) if (pattern.test(sql)) errors.push(message);
}

if (existsSync(testPath)) {
  const test = readFileSync(testPath, 'utf8').toLowerCase();
  for (const snippet of ['select plan(24);', "has_table('public', 'learners'", 'content manager', 'satisfied mfa', 'hard-delete', 'select * from finish();']) {
    if (!test.includes(snippet)) errors.push(`LRN-001 database test missing required coverage: ${snippet}`);
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:lrn-001'] !== 'node scripts/verify-lrn-001.mjs') {
    errors.push('package.json must expose verify:lrn-001.');
  }
}

if (errors.length) {
  console.error('LRN-001 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('LRN-001 verification passed.');
