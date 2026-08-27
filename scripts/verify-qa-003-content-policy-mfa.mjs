import { existsSync, readFileSync } from 'node:fs';

const files = {
  migration: 'supabase/migrations/20260827100000_qa_003_content_policy_mfa_hardening.sql',
  focusedTest: 'supabase/tests/database/qa_003_content_policy_mfa_hardening.test.sql',
  aggregateTest: 'supabase/tests/database/qa_003_mfa_matrix.test.sql',
  roleHelpers: 'supabase/migrations/20260727145222_auth_004_role_helpers.sql',
  report: 'docs/qa/QA_003_CONTENT_POLICY_MFA_HARDENING_2026-08-27.md',
};
const expectedTables = [
  'programme_areas',
  'programme_area_translations',
  'programme_types',
  'programme_type_translations',
  'programmes',
  'programme_translations',
  'programme_runs',
  'programme_pricing_options',
  'programme_pricing_option_translations',
  'partners',
  'partner_translations',
  'experts',
  'expert_translations',
  'content_pages',
  'content_page_translations',
];
const errors = [];

for (const path of Object.values(files)) {
  if (!existsSync(path)) errors.push(`Missing required path: ${path}`);
}

if (!errors.length) {
  const migration = readFileSync(files.migration, 'utf8');
  const focusedTest = readFileSync(files.focusedTest, 'utf8');
  const aggregateTest = readFileSync(files.aggregateTest, 'utf8');
  const roleHelpers = readFileSync(files.roleHelpers, 'utf8');
  const inventoryBlock = migration.match(/foreach target_table in array array\[([\s\S]*?)\]\s*loop/iu)?.[1] ?? '';
  const actualTables = [...inventoryBlock.matchAll(/'([a-z0-9_]+)'/giu)].map((match) => match[1]);

  if (JSON.stringify(actualTables) !== JSON.stringify(expectedTables)) {
    errors.push(`Editorial policy inventory mismatch: expected ${expectedTables.length} ordered tables, found ${actualTables.length}.`);
  }

  for (const suffix of ['insert', 'update', 'delete']) {
    if (!migration.includes(`target_table || '_content_${suffix}'`)) {
      errors.push(`Migration does not alter the editorial ${suffix.toUpperCase()} policy family.`);
    }
  }

  if ((migration.match(/alter policy %I/gu) ?? []).length !== 3) {
    errors.push('Migration must contain exactly one ALTER POLICY template per mutation command.');
  }
  if ((migration.match(/internal\.is_mfa_requirement_satisfied\(\)/gu) ?? []).length !== 4) {
    errors.push('Migration must enforce MFA in INSERT, UPDATE USING, UPDATE WITH CHECK, and DELETE.');
  }
  if ((migration.match(/internal\.has_any_role\(/gu) ?? []).length !== 4) {
    errors.push('Migration must preserve role checks in every mutation predicate.');
  }
  for (const role of ['owner', 'super_admin', 'content_manager']) {
    if (!migration.includes(`'${role}'`)) errors.push(`Migration role boundary is missing ${role}.`);
  }
  if (migration.includes("'credential_manager'")) {
    errors.push('Credential Manager must not enter the editorial mutation boundary.');
  }
  if (/\b(?:create|drop)\s+policy\b/iu.test(migration)) {
    errors.push('Hardening migration must alter existing policies, not recreate or drop them.');
  }
  if (/\b(?:insert\s+into|update|delete\s+from)\s+public\./iu.test(migration)) {
    errors.push('Hardening migration must not mutate application data.');
  }

  const plan = Number(focusedTest.match(/select\s+plan\((\d+)\)/iu)?.[1] ?? 0);
  const assertions = [...focusedTest.matchAll(/^select\s+(?:results_eq|has_trigger)\s*\(/gimu)].length;
  if (plan !== 10 || assertions !== plan) {
    errors.push(`Focused pgTAP suite should contain 10 assertions; plan=${plan}, assertions=${assertions}.`);
  }
  for (const required of [
    'values (45::bigint)',
    'values (15::bigint)',
    'is_mfa_requirement_satisfied',
    'credential_manager',
    "cmd = 'SELECT'",
  ]) {
    if (!focusedTest.includes(required)) errors.push(`Focused pgTAP coverage missing: ${required}`);
  }
  if (!aggregateTest.includes('content mutations should enforce MFA only when the current profile requires it')) {
    errors.push('Aggregate QA-003 regression does not cover editorial mutation MFA.');
  }
  for (const required of [
    'profile.is_active',
    'not profile.mfa_required',
    'internal.has_mfa_aal()',
  ]) {
    if (!roleHelpers.includes(required)) errors.push(`Shared MFA helper contract missing: ${required}`);
  }
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (pkg.scripts?.['verify:qa-003:content-policy-mfa'] !== 'node scripts/verify-qa-003-content-policy-mfa.mjs') {
  errors.push('package.json must expose verify:qa-003:content-policy-mfa.');
}

if (errors.length) {
  console.error('QA-003 editorial content MFA verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('QA-003 editorial content MFA verification passed.');
