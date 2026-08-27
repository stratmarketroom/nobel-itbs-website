import { existsSync, readFileSync } from 'node:fs';

const files = {
  migration: 'supabase/migrations/20260812110000_lrn_005_learner_import.sql',
  correctionMigration: 'supabase/migrations/20260827140000_lrn_lint_001_import_learners_relation_resolution.sql',
  data: 'lib/learners/import.ts',
  types: 'lib/learners/types.ts',
  component: 'components/admin-learners.tsx',
  preview: 'app/api/v1/admin/learners/import/preview/route.ts',
  commit: 'app/api/v1/admin/learners/import/commit/route.ts',
  template: 'app/api/v1/admin/learners/import/template/route.ts',
  styles: 'app/globals.css',
  databaseTest: 'supabase/tests/database/lrn_005_learner_import.test.sql',
};
const errors = Object.values(files).filter((file) => !existsSync(file)).map((file) => `Missing required file: ${file}`);

if (!errors.length) {
  const source = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, readFileSync(file, 'utf8')]));
  const routes = source.preview + source.commit + source.template;
  const effectiveMigration = source.correctionMigration;

  for (const snippet of ['security definer', 'assert_sensitive_action_allowed', "'owner'", "'super_admin'", "'credential_manager'", 'jsonb_to_recordset', 'write_audit_log', "'count'", 'v_normalized_rows jsonb']) {
    if (!effectiveMigration.includes(snippet)) errors.push(`Effective import migration missing: ${snippet}`);
  }
  for (const snippet of ['revoke all on function public.import_learners(jsonb) from public, anon', 'grant execute on function public.import_learners(jsonb) to authenticated, service_role']) {
    if (!effectiveMigration.includes(snippet)) errors.push(`Import function privilege contract missing: ${snippet}`);
  }
  if (!effectiveMigration.includes("set search_path = internal, public, extensions, pg_temp")) errors.push('Import function must use a fixed search path.');
  if (/create\s+(?:temporary|temp)\s+table/iu.test(effectiveMigration) || effectiveMigration.includes('lrn_005_import_rows')) {
    errors.push('Effective learner import must not depend on a transaction-scoped temporary relation.');
  }
  if (/getSupabaseAdminClient|SUPABASE_SERVICE_ROLE_KEY/.test(source.data + routes)) errors.push('Learner import must preserve actor-scoped RLS and never use service role in application code.');
  for (const snippet of ['maximumFileBytes', 'maximumRows = 500', "extension !== 'xlsx' && extension !== 'csv'", 'map: (value) => value', 'addFileDuplicates', 'addDatabaseConflicts', "rpc('import_learners'", 'learnerImportTemplate']) {
    if (!source.data.includes(snippet)) errors.push(`Import service missing: ${snippet}`);
  }
  for (const snippet of ['Import list', 'Download template', 'Check file', 'Nothing has been saved yet', 'Download errors CSV', 'Existing records are never overwritten', 'I reviewed the preview', 'validRows.map(toImportRow)']) {
    if (!source.component.includes(snippet)) errors.push(`Import manager UX missing: ${snippet}`);
  }
  for (const snippet of ['.learner-import', '.learner-import-summary', '.learner-import-table', '@media (max-width: 760px)']) {
    if (!source.styles.includes(snippet)) errors.push(`Import responsive styles missing: ${snippet}`);
  }
  if (!routes.includes("export const runtime = 'nodejs'")) errors.push('Import routes must run in the Node.js runtime.');
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (pkg.scripts?.['verify:lrn-005'] !== 'node scripts/verify-lrn-005.mjs') errors.push('package.json must expose verify:lrn-005.');
if (pkg.dependencies?.exceljs !== '^4.4.0') errors.push('ExcelJS runtime dependency is missing or unexpected.');

if (errors.length) {
  console.error('LRN-005 verification failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log('LRN-005 verification passed.');
