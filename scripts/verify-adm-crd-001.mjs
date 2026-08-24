import { existsSync, readFileSync } from 'node:fs';

const files = {
  page: 'app/admin/credentials/page.tsx',
  component: 'components/admin-credentials.tsx',
  shell: 'components/admin-shell.tsx',
  workspace: 'lib/credentials/workspace.ts',
  types: 'lib/credentials/workspace-types.ts',
  collection: 'app/api/v1/admin/credentials/route.ts',
  detail: 'app/api/v1/admin/credentials/[id]/route.ts',
  sets: 'app/api/v1/admin/credential-sets/route.ts',
  numbers: 'app/api/v1/admin/document-numbers/route.ts',
  notes: 'app/api/v1/admin/credentials/[id]/notes/route.ts',
  note: 'app/api/v1/admin/credentials/[id]/notes/[noteId]/route.ts',
  learners: 'lib/learners/admin.ts',
  learnerUi: 'components/admin-learners.tsx',
};
const errors = [];
for (const path of Object.values(files)) if (!existsSync(path)) errors.push(`Missing required path: ${path}`);

if (!errors.length) {
  const source = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, readFileSync(path, 'utf8')]));
  const routes = [source.collection, source.detail, source.sets, source.numbers, source.notes, source.note].join('\n');
  for (const snippet of [
    "href: '/admin/credentials'",
    "roles: ['owner', 'super_admin', 'credential_manager']",
  ]) if (!source.shell.includes(snippet)) errors.push(`Credential navigation missing: ${snippet}`);

  for (const snippet of [
    'assertCanManageCredentials',
    'getSupabaseRequestClient',
    ".from('credentials')",
    ".from('credential_sets')",
    ".from('document_number_log')",
    ".from('credential_history')",
    ".from('credential_notes')",
    "db.rpc('add_credential_note'",
    "db.rpc('update_credential_note'",
    "db.rpc('delete_credential_note'",
    'ensureCredentialNote',
  ]) if (!source.workspace.includes(snippet)) errors.push(`Actor-scoped credential workspace missing: ${snippet}`);

  for (const forbidden of ['verification_token_lookup_hash', 'verification_token_encrypted', 'storage_path', 'getSupabaseAdminClient']) {
    if (source.workspace.includes(forbidden)) errors.push(`Credential workspace must not select or expose ${forbidden}.`);
  }

  for (const snippet of ['getAdminContext(request)', 'jsonError(error)']) {
    if (!routes.includes(snippet)) errors.push(`Credential routes missing protected response contract: ${snippet}`);
  }

  for (const snippet of [
    'Create pending credential',
    'Credential sets',
    'Number log',
    'Private PDFs',
    'History & notes',
    'Create pending credential',
    'Copy verification URL',
    '/api/v1/admin/credentials',
    '/api/v1/admin/credential-sets',
    '/api/v1/admin/document-numbers',
  ]) if (!source.component.includes(snippet)) errors.push(`Credential UI missing: ${snippet}`);

  // Later credential workflows may coexist; server secrets must never enter the client workspace.
  for (const forbidden of ['SUPABASE_SERVICE_ROLE_KEY']) {
    if (source.component.includes(forbidden)) errors.push(`ADM-CRD-001 must not expose later workflow action: ${forbidden}`);
  }

  for (const snippet of ['credentials (id, document_number', 'LearnerCredentialSummary', '/admin/credentials?credential=']) {
    if (!(source.learners + source.learnerUi + readFileSync('lib/learners/types.ts', 'utf8')).includes(snippet)) errors.push(`Learner credential list integration missing: ${snippet}`);
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:adm-crd-001'] !== 'node scripts/verify-adm-crd-001.mjs') errors.push('package.json must expose verify:adm-crd-001.');
}

if (errors.length) {
  console.error('ADM-CRD-001 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('ADM-CRD-001 verification passed.');
