import { existsSync, readFileSync } from 'node:fs';

const migrationPath = 'supabase/migrations/20260808130000_crd_006_credential_history_notes.sql';
const testPath = 'supabase/tests/database/crd_006_credential_history_notes.test.sql';
const errors = [];

for (const path of [migrationPath, testPath]) {
  if (!existsSync(path)) errors.push(`Missing required path: ${path}`);
}

if (existsSync(migrationPath)) {
  const sql = readFileSync(migrationPath, 'utf8');

  for (const snippet of [
    'create table public.credential_history',
    'credential_id uuid not null references public.credentials(id) on delete restrict',
    'actor_id uuid null references public.user_profiles(id) on delete set null',
    'credential_history_forbidden_data_keys',
    'credential_history_prevent_mutation',
    'credential_history_prevent_truncate',
    'internal.write_credential_history',
    'credentials_record_core_history',
    'document_number_log_record_history',
    'credential_files_record_history',
    'create table public.credential_notes',
    'author_id uuid not null references public.user_profiles(id) on delete restrict',
    'credential_notes_delete_consistency',
    'credential_notes_enforce_mutation',
    'credential_notes_record_event',
    'public.add_credential_note',
    'public.update_credential_note',
    'public.delete_credential_note',
    'v_note.author_id <> auth.uid()',
    "array['owner', 'super_admin']::public.app_role[]",
    "array['owner', 'super_admin', 'credential_manager']::public.app_role[]",
    'internal.is_mfa_requirement_satisfied()',
    'alter table public.credential_history enable row level security',
    'alter table public.credential_history force row level security',
    'alter table public.credential_notes enable row level security',
    'alter table public.credential_notes force row level security',
    "p_event_type => 'credential.status_changed'",
    "p_event_type => 'credential_file.deleted'",
    "when tg_op = 'INSERT' then 'credential_note.created'",
    "then 'credential_note.deleted'",
    "else 'credential_note.edited'",
  ]) {
    if (!sql.includes(snippet)) errors.push(`CRD-006 migration missing required behavior: ${snippet}`);
  }

  for (const [pattern, message] of [
    [/array\[[^\]]*'content_manager'[^\]]*\]/i, 'Content Manager must not receive credential history or note access.'],
    [/grant\s+(?:select|insert|update|delete)[^;]*(?:credential_history|credential_notes)[^;]*to\s+anon/i, 'Anonymous users must receive no history or note privileges.'],
    [/grant\s+(?:insert|update|delete)[^;]*(?:credential_history|credential_notes)[^;]*to\s+(?:authenticated|service_role)/i, 'History and note mutations must remain controlled.'],
    [/insert\s+into\s+public\.credential_notes[^;]*p_author/i, 'The note author must never be accepted from client input.'],
    [/jsonb_build_object\([^;]*(?:'body'|'storage_path'|'verification_token)/i, 'History and audit payloads must not copy note text, private paths, or token material.'],
    [/create\s+table\s+(?:if\s+not\s+exists\s+)?public\.(?:credential_email_sends|email_templates)/i, 'CRD-006 must not create later email modules.'],
    [/create\s+(?:or\s+replace\s+)?function\s+public\.(?:activate|revoke|void|send|verify)/i, 'CRD-006 must not implement later credential workflows.'],
  ]) {
    if (pattern.test(sql)) errors.push(message);
  }
}

if (existsSync(testPath)) {
  const test = readFileSync(testPath, 'utf8').toLowerCase();
  for (const snippet of [
    'select plan(64);',
    "has_table('public', 'credential_history'",
    "has_table('public', 'credential_notes'",
    'append-only',
    'soft-delete',
    'author-only',
    'anonymous users',
    'content manager',
    'credential manager',
    'select * from finish();',
  ]) {
    if (!test.includes(snippet)) errors.push(`CRD-006 database test missing required coverage: ${snippet}`);
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:crd-006'] !== 'node scripts/verify-crd-006.mjs') {
    errors.push('package.json must expose verify:crd-006.');
  }
}

if (errors.length) {
  console.error('CRD-006 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('CRD-006 verification passed.');
