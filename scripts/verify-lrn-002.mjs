import { existsSync, readFileSync } from 'node:fs';

const migrationPath = 'supabase/migrations/20260807110000_lrn_002_learner_emails.sql';
const testPath = 'supabase/tests/database/lrn_002_learner_emails.test.sql';
const errors = [];

for (const path of [migrationPath, testPath]) {
  if (!existsSync(path)) errors.push(`Missing required path: ${path}`);
}

if (existsSync(migrationPath)) {
  const sql = readFileSync(migrationPath, 'utf8');
  for (const snippet of [
    'create table public.learner_emails',
    'learner_id uuid not null references public.learners(id) on delete cascade',
    'email extensions.citext not null unique',
    'is_primary boolean not null default false',
    'learner_emails_one_primary_idx',
    'where is_primary',
    'learner_emails_set_updated_at',
    'enable row level security',
    'force row level security',
    'learner_emails_authorized_read',
    'learner_emails_authorized_insert',
    'learner_emails_authorized_update',
    'learner_emails_authorized_delete',
    "array['owner', 'super_admin', 'credential_manager']::public.app_role[]",
    'internal.is_mfa_requirement_satisfied()',
    'grant insert (learner_id, email, is_primary)',
    'grant update (email, is_primary)',
  ]) if (!sql.includes(snippet)) errors.push(`LRN-002 migration missing required behavior: ${snippet}`);

  for (const [pattern, message] of [
    [/array\[[^\]]*'content_manager'[^\]]*\]/i, 'Content Manager must not receive learner email access.'],
    [/create\s+table\s+(?:if\s+not\s+exists\s+)?public\.(?:learner_phones|credential_sets|credentials)/i, 'LRN-002 must not create later learner or credential tables.'],
    [/grant\s+(?:select|insert|update|delete)[^;]*public\.learner_emails[^;]*to\s+anon/i, 'Anonymous users must receive no learner email privileges.'],
    [/grant\s+update\s*\([^)]*learner_id[^)]*\)/i, 'Learner email ownership must be immutable to authenticated admins.'],
    [/telegram|viber|whatsapp|\bphone\b/i, 'LRN-002 must not implement LRN-003 phone or messenger fields.'],
  ]) if (pattern.test(sql)) errors.push(message);
}

if (existsSync(testPath)) {
  const test = readFileSync(testPath, 'utf8').toLowerCase();
  for (const snippet of ['select plan(27);', "has_table('public', 'learner_emails'", 'case-insensitive citext', 'one-primary', 'content manager', 'satisfied mfa', 'select * from finish();']) {
    if (!test.includes(snippet)) errors.push(`LRN-002 database test missing required coverage: ${snippet}`);
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:lrn-002'] !== 'node scripts/verify-lrn-002.mjs') {
    errors.push('package.json must expose verify:lrn-002.');
  }
}

if (errors.length) {
  console.error('LRN-002 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('LRN-002 verification passed.');
