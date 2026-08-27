import { existsSync, readFileSync } from 'node:fs';

const files = {
  migration: 'supabase/migrations/20260827140000_lrn_lint_001_import_learners_relation_resolution.sql',
  focusedTest: 'supabase/tests/database/lrn_lint_001_import_learners_relation_resolution.test.sql',
  lrn005Test: 'supabase/tests/database/lrn_005_learner_import.test.sql',
};
const errors = [];

for (const path of Object.values(files)) {
  if (!existsSync(path)) errors.push(`Missing required path: ${path}`);
}

if (!errors.length) {
  const migration = readFileSync(files.migration, 'utf8');
  const focusedTest = readFileSync(files.focusedTest, 'utf8');
  const lrn005Test = readFileSync(files.lrn005Test, 'utf8');

  for (const required of [
    'create or replace function public.import_learners(p_rows jsonb)',
    'v_normalized_rows jsonb',
    'jsonb_agg(',
    'jsonb_to_recordset(v_normalized_rows)',
    'internal.assert_sensitive_action_allowed(',
    "array['owner'::public.app_role, 'super_admin'::public.app_role, 'credential_manager'::public.app_role]",
    'v_count < 1 or v_count > 500',
    'Learner import contains duplicate rows or contacts.',
    'Learner import conflicts with an existing learner or contact.',
    "p_action => 'learners.imported'",
    "jsonb_build_object('count', v_count)",
    'security definer',
    'set search_path = internal, public, extensions, pg_temp',
    'revoke all on function public.import_learners(jsonb) from public, anon',
    'grant execute on function public.import_learners(jsonb) to authenticated, service_role',
  ]) {
    if (!migration.includes(required)) errors.push(`Correction migration missing: ${required}`);
  }

  if (/create\s+(?:temporary|temp)\s+table/iu.test(migration) || migration.includes('lrn_005_import_rows')) {
    errors.push('Correction migration must not retain the transaction-scoped temporary relation.');
  }
  if ((migration.match(/create or replace function/giu) ?? []).length !== 1) {
    errors.push('Correction migration must redefine exactly one function.');
  }
  if (/\b(?:create|alter|drop)\s+(?:table|policy|type|trigger)\b/iu.test(migration)) {
    errors.push('Correction migration must not modify adjacent database objects.');
  }
  if (/\b(?:update|delete\s+from)\s+public\./iu.test(migration)) {
    errors.push('Correction migration must not update or delete application data.');
  }

  const focusedPlan = Number(focusedTest.match(/select\s+plan\((\d+)\)/iu)?.[1] ?? 0);
  const focusedAssertions = [
    ...focusedTest.matchAll(/^select\s+(?:results_eq|lives_ok|throws_ok)\s*\(/gimu),
  ].length;
  if (focusedPlan !== 13 || focusedAssertions !== focusedPlan) {
    errors.push(`Focused pgTAP mismatch: plan=${focusedPlan}, assertions=${focusedAssertions}.`);
  }
  for (const required of [
    'a second learner import call in the same transaction should also succeed',
    "to_regclass('pg_temp.lrn_005_import_rows') is null",
    "metadata = '{\"count\":1}'::jsonb",
    'rollback;',
  ]) {
    if (!focusedTest.includes(required)) errors.push(`Focused pgTAP missing: ${required}`);
  }

  const aggregatePlan = Number(lrn005Test.match(/select\s+plan\((\d+)\)/iu)?.[1] ?? 0);
  const aggregateAssertions = [
    ...lrn005Test.matchAll(/^select\s+(?:results_eq|has_function)\s*\(/gimu),
  ].length;
  if (aggregatePlan !== 15 || aggregateAssertions !== aggregatePlan) {
    errors.push(`LRN-005 pgTAP mismatch: plan=${aggregatePlan}, assertions=${aggregateAssertions}.`);
  }
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (pkg.scripts?.['verify:lrn-lint-001'] !== 'node scripts/verify-lrn-lint-001.mjs') {
  errors.push('package.json must expose verify:lrn-lint-001.');
}

if (errors.length) {
  console.error('LRN-LINT-001 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('LRN-LINT-001 static verification passed.');
