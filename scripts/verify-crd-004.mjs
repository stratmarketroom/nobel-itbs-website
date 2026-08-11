import { existsSync, readFileSync } from 'node:fs';

const migrationPath = 'supabase/migrations/20260808110000_crd_004_credentials.sql';
const moveMigrationPath = 'supabase/migrations/20260808111000_crd_004_credential_set_move.sql';
const testPath = 'supabase/tests/database/crd_004_credentials.test.sql';
const errors = [];

for (const path of [migrationPath, moveMigrationPath, testPath]) if (!existsSync(path)) errors.push(`Missing required path: ${path}`);

if (existsSync(migrationPath) && existsSync(moveMigrationPath)) {
  const sql = `${readFileSync(migrationPath, 'utf8')}\n${readFileSync(moveMigrationPath, 'utf8')}`;
  for (const snippet of [
    "create type public.credential_status as enum (\n  'pending',\n  'valid',\n  'revoked',\n  'voided'",
    'create table public.credentials',
    'credential_set_id uuid not null references public.credential_sets(id) on delete restrict',
    'learner_id uuid not null references public.learners(id) on delete restrict',
    'programme_id uuid not null references public.programmes(id) on delete restrict',
    'credentials_programme_run_context_fk',
    'credential_type_id uuid not null references public.credential_types(id) on delete restrict',
    'language_code text not null references public.languages(code) on delete restrict',
    "status public.credential_status not null default 'pending'",
    'document_number text not null unique references public.document_number_log(document_number)',
    'verification_token_lookup_hash text not null unique',
    'verification_token_encrypted text not null',
    'token_encryption_key_version integer not null',
    'public_holder_name text not null',
    'public_programme_title text not null',
    'public_credential_type text not null',
    'credentials_lifecycle_consistency',
    'document_number_log_credential_id_fk',
    'create unique index document_number_log_credential_id_idx',
    'credentials_validate_context',
    'credentials_enforce_lifecycle',
    'credentials_audit_change',
    'credentials_validate_number_link',
    'document_number_log_validate_credential_link',
    'deferrable initially deferred',
    'alter table public.credentials enable row level security',
    'alter table public.credentials force row level security',
    "array['owner', 'super_admin', 'credential_manager']::public.app_role[]",
    'internal.is_mfa_requirement_satisfied()',
    "p_action => 'credential.created_pending'",
    "p_action => 'credential.set_moved'",
    'create or replace function public.move_credential_to_set',
    'set credential_set_id = p_target_set_id',
  ]) if (!sql.includes(snippet)) errors.push(`CRD-004 migration missing required behavior: ${snippet}`);

  for (const [pattern, message] of [
    [/array\[[^\]]*'content_manager'[^\]]*\]/i, 'Content Manager must not receive credential access.'],
    [/grant\s+(?:select|insert|update|delete)[^;]*credentials[^;]*to\s+anon/i, 'Anonymous users must receive no direct credential privileges.'],
    [/grant\s+(?:insert|update|delete)[^;]*credentials[^;]*to\s+(?:authenticated|service_role)/i, 'Credential mutations must remain behind later controlled workflow functions.'],
    [/create\s+table\s+(?:if\s+not\s+exists\s+)?public\.(?:credential_files|credential_history|credential_notes)/i, 'CRD-004 must not create later Credential Core tables.'],
    [/create\s+(?:or\s+replace\s+)?function\s+public\.(?:activate|revoke|void|verify|create_pending)/i, 'CRD-004 must not implement later workflow or public verification functions.'],
    [/\bpartner_id\b/i, 'Partners must not be stored on credential identities.'],
    [/\braw_verification_token\b/i, 'Raw verification tokens must never be stored.'],
    [/'expired'|'cancelled'|'reissued'/i, 'Unsupported Release 1 credential statuses must not be introduced.'],
    [/p_metadata\s*=>[^;]*(?:document_number|verification_token|learner_id)/i, 'Credential audit metadata must not copy document numbers, tokens, or learner identity.'],
  ]) if (pattern.test(sql)) errors.push(message);
}

if (existsSync(testPath)) {
  const test = readFileSync(testPath, 'utf8').toLowerCase();
  for (const snippet of ['select plan(54);', "has_type('public', 'credential_status'", "has_table('public', 'credentials'", 'document_number_log_credential_id_fk', 'credentials_validate_number_link', 'move_credential_to_set', 'anonymous clients', 'content manager', 'credential manager', 'raw verification token', 'select * from finish();']) {
    if (!test.includes(snippet)) errors.push(`CRD-004 database test missing required coverage: ${snippet}`);
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:crd-004'] !== 'node scripts/verify-crd-004.mjs') errors.push('package.json must expose verify:crd-004.');
}

if (errors.length) {
  console.error('CRD-004 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('CRD-004 verification passed.');
