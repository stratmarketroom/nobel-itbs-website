import { existsSync, readFileSync } from 'node:fs';

const migrationPath = 'supabase/migrations/20260807120000_lrn_003_learner_phones.sql';
const testPath = 'supabase/tests/database/lrn_003_learner_phones.test.sql';
const errors = [];

for (const path of [migrationPath, testPath]) {
  if (!existsSync(path)) errors.push(`Missing required path: ${path}`);
}

if (existsSync(migrationPath)) {
  const sql = readFileSync(migrationPath, 'utf8');
  for (const snippet of [
    'create table public.learner_phones',
    'learner_id uuid not null references public.learners(id) on delete cascade',
    'phone text not null unique',
    'has_telegram boolean not null default false',
    'telegram_username text null',
    'has_viber boolean not null default false',
    'has_whatsapp boolean not null default false',
    'is_primary boolean not null default false',
    "phone ~ '^\\+[1-9][0-9]{6,14}$'",
    'learner_phones_one_primary_idx',
    'where is_primary',
    'learner_phones_telegram_username_requires_flag',
    'enable row level security',
    'force row level security',
    'learner_phones_authorized_read',
    'learner_phones_authorized_insert',
    'learner_phones_authorized_update',
    'learner_phones_authorized_delete',
    "array['owner', 'super_admin', 'credential_manager']::public.app_role[]",
    'internal.is_mfa_requirement_satisfied()',
    'grant update (phone, has_telegram, telegram_username, has_viber, has_whatsapp, is_primary)',
  ]) if (!sql.includes(snippet)) errors.push(`LRN-003 migration missing required behavior: ${snippet}`);

  for (const [pattern, message] of [
    [/array\[[^\]]*'content_manager'[^\]]*\]/i, 'Content Manager must not receive learner phone access.'],
    [/create\s+table\s+(?:if\s+not\s+exists\s+)?public\.(?:credential_sets|credentials)/i, 'LRN-003 must not create credential tables.'],
    [/grant\s+(?:select|insert|update|delete)[^;]*public\.learner_phones[^;]*to\s+anon/i, 'Anonymous users must receive no learner phone privileges.'],
    [/grant\s+update\s*\([^)]*learner_id[^)]*\)/i, 'Learner phone ownership must be immutable to authenticated admins.'],
  ]) if (pattern.test(sql)) errors.push(message);
}

if (existsSync(testPath)) {
  const test = readFileSync(testPath, 'utf8').toLowerCase();
  for (const snippet of ['select plan(32);', "has_table('public', 'learner_phones'", 'telegram consistency', 'one-primary', 'content manager', 'satisfied mfa', 'select * from finish();']) {
    if (!test.includes(snippet)) errors.push(`LRN-003 database test missing required coverage: ${snippet}`);
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:lrn-003'] !== 'node scripts/verify-lrn-003.mjs') {
    errors.push('package.json must expose verify:lrn-003.');
  }
}

if (errors.length) {
  console.error('LRN-003 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('LRN-003 verification passed.');
