import { existsSync, readFileSync } from 'node:fs';

const migrationPath = 'supabase/migrations/20260810181500_qa_004_fix_activation_manifest_keys.sql';
const errors = [];

if (!existsSync(migrationPath)) {
  errors.push(`Missing migration: ${migrationPath}`);
} else {
  const sql = readFileSync(migrationPath, 'utf8');

  for (const snippet of [
    'create or replace function public.activate_credential',
    'cross join lateral jsonb_object_keys(manifest_file) manifest_key',
    "manifest_key in ('storage_path', 'storage_bucket', 'file_content', 'bytes')",
    "credential_file.size_bytes = (manifest_file ->> 'size_bytes')::bigint",
    "set status = 'issued'",
    "set status = 'valid', activated_at = v_activated_at",
    'internal.is_mfa_requirement_satisfied()',
    'internal.write_credential_history',
    'internal.write_audit_log',
    'from public, anon, authenticated',
    'to authenticated, postgres, service_role',
  ]) {
    if (!sql.includes(snippet)) errors.push(`Activation fix is missing: ${snippet}`);
  }

  if (/p_files::text\s*~\*/i.test(sql)) {
    errors.push('Activation fix must not reject allowed manifest fields through a broad text regex.');
  }
  if (/manifest_key\s+in\s*\([^)]*'size_bytes'/i.test(sql)) {
    errors.push('The approved size_bytes manifest key must remain allowed.');
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:qa-004:activation-fix'] !== 'node scripts/verify-qa-004-activation-fix.mjs') {
    errors.push('package.json must expose verify:qa-004:activation-fix.');
  }
}

if (errors.length) {
  console.error('QA-004 activation-fix verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('QA-004 activation-fix verification passed.');
