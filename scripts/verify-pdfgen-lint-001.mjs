import { existsSync, readFileSync } from 'node:fs';

const files = {
  migration: 'supabase/migrations/20260827120000_pdfgen_lint_001_single_generation_package_assignment.sql',
  focusedTest: 'supabase/tests/database/pdfgen_lint_001_single_generation_package_assignment.test.sql',
  pdfgen005Test: 'supabase/tests/database/pdfgen_005_single_generation.test.sql',
  report: 'docs/qa/PDFGEN_LINT_001_SINGLE_GENERATION_PACKAGE_ASSIGNMENT_2026-08-27.md',
};
const errors = [];

for (const path of Object.values(files)) {
  if (!existsSync(path)) errors.push(`Missing required path: ${path}`);
}

if (!errors.length) {
  const migration = readFileSync(files.migration, 'utf8');
  const focusedTest = readFileSync(files.focusedTest, 'utf8');
  const pdfgen005Test = readFileSync(files.pdfgen005Test, 'utf8');

  for (const required of [
    'create or replace function public.begin_single_credential_generation(',
    'select template_package.*',
    'internal.assert_single_generation_actor()',
    "v_credential.status <> 'pending'",
    'same immutable template version',
    'internal.credential_single_generation_locks',
    'security definer',
    'set search_path = public, internal, pg_temp',
    'return query select v_attempt, v_is_regeneration',
  ]) {
    if (!migration.includes(required)) errors.push(`Correction migration missing: ${required}`);
  }

  if (/select\s+template_package\s+into\s+v_package/iu.test(migration)) {
    errors.push('Correction migration retains the invalid nested-composite assignment.');
  }
  if ((migration.match(/create or replace function/giu) ?? []).length !== 1) {
    errors.push('Correction migration must redefine exactly one function.');
  }
  if (/\b(?:create|alter|drop)\s+(?:table|policy|type|trigger)\b/iu.test(migration)) {
    errors.push('Correction migration must not modify adjacent database objects.');
  }
  if (/\b(?:insert\s+into|update|delete\s+from)\s+public\./iu.test(migration)) {
    errors.push('Correction migration must not mutate application data.');
  }

  const focusedPlan = Number(focusedTest.match(/select\s+plan\((\d+)\)/iu)?.[1] ?? 0);
  const focusedAssertions = [...focusedTest.matchAll(/^select\s+results_eq\s*\(/gimu)].length;
  if (focusedPlan !== 6 || focusedAssertions !== focusedPlan) {
    errors.push(`Focused pgTAP mismatch: plan=${focusedPlan}, assertions=${focusedAssertions}.`);
  }

  const aggregatePlan = Number(pdfgen005Test.match(/select\s+plan\((\d+)\)/iu)?.[1] ?? 0);
  const aggregateAssertions = [...pdfgen005Test.matchAll(/^select\s+(?:results_eq|has_table|has_function)\s*\(/gimu)].length;
  if (aggregatePlan !== 21 || aggregateAssertions !== aggregatePlan) {
    errors.push(`PDFGEN-005 pgTAP mismatch: plan=${aggregatePlan}, assertions=${aggregateAssertions}.`);
  }
  if (!pdfgen005Test.includes('expand the Template Package composite before assignment')) {
    errors.push('PDFGEN-005 aggregate regression does not cover the corrected assignment.');
  }
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (pkg.scripts?.['verify:pdfgen-lint-001'] !== 'node scripts/verify-pdfgen-lint-001.mjs') {
  errors.push('package.json must expose verify:pdfgen-lint-001.');
}

if (errors.length) {
  console.error('PDFGEN-LINT-001 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('PDFGEN-LINT-001 static verification passed.');
