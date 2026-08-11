import { existsSync, readFileSync } from 'node:fs';

const migrationPath =
  'supabase/migrations/20260811120000_qa_005_restore_partnership_service_grants.sql';
const errors = [];

if (!existsSync(migrationPath)) {
  errors.push(`Missing migration: ${migrationPath}`);
} else {
  const sql = readFileSync(migrationPath, 'utf8').toLowerCase();

  for (const snippet of [
    'on table public.partners, public.partner_translations',
    'on table public.experts, public.expert_translations',
    'to postgres, service_role',
  ]) {
    if (!sql.includes(snippet)) {
      errors.push(`Production grant migration is missing: ${snippet}`);
    }
  }

  const fullCrudGrantCount = (
    sql.match(/grant select, insert, update, delete/g) ?? []
  ).length;
  if (fullCrudGrantCount !== 2) {
    errors.push(
      `Expected exactly two server CRUD grants, found ${fullCrudGrantCount}.`,
    );
  }

  if (/\bto\s+(?:public|anon|authenticated)\b/.test(sql)) {
    errors.push(
      'QA-005 correction must not broaden public, anonymous, or authenticated grants.',
    );
  }

  if (/create\s+policy|alter\s+table[^;]+(?:enable|disable|force|no\s+force)\s+row\s+level\s+security/.test(sql)) {
    errors.push('QA-005 correction must not change existing RLS policies or mode.');
  }
}

for (const loaderPath of ['lib/partners/public.ts', 'lib/experts/public.ts']) {
  if (!existsSync(loaderPath)) {
    errors.push(`Missing public loader: ${loaderPath}`);
    continue;
  }

  const loader = readFileSync(loaderPath, 'utf8');
  if (loader.includes('SUPABASE_SERVICE_ROLE_KEY')) {
    errors.push(`Public loader must not use the service role: ${loaderPath}`);
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (
    pkg.scripts?.['verify:qa-005:production-grants'] !==
    'node scripts/verify-qa-005-production-grants.mjs'
  ) {
    errors.push('package.json must expose verify:qa-005:production-grants.');
  }
  if (
    pkg.scripts?.['verify:qa-005:production-grants:live'] !==
    'node scripts/verify-qa-005-production-grants-live.mjs'
  ) {
    errors.push(
      'package.json must expose verify:qa-005:production-grants:live.',
    );
  }
}

if (errors.length) {
  console.error('QA-005 production-grants verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('QA-005 production-grants verification passed.');
