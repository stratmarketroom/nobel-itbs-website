import { existsSync, readFileSync, readdirSync } from 'node:fs';

const expectedPublicTables = [
  'audit_log',
  'contact_submissions',
  'content_page_translations',
  'content_pages',
  'credential_email_sends',
  'credential_file_types',
  'credential_file_generations',
  'credential_files',
  'credential_generation_batch_activation_items',
  'credential_generation_batch_activation_requests',
  'credential_generation_batch_items',
  'credential_generation_batches',
  'credential_history',
  'credential_notes',
  'credential_sets',
  'credential_template_document_pages',
  'credential_template_documents',
  'credential_template_field_placements',
  'credential_template_packages',
  'credential_template_versions',
  'credential_type_translations',
  'credential_types',
  'credentials',
  'document_number_log',
  'email_templates',
  'expert_translations',
  'experts',
  'languages',
  'learner_emails',
  'learner_phones',
  'learners',
  'partner_translations',
  'partners',
  'programme_area_translations',
  'programme_areas',
  'programme_pricing_option_translations',
  'programme_pricing_options',
  'programme_runs',
  'programme_slug_redirects',
  'programme_translations',
  'programme_type_translations',
  'programme_types',
  'programmes',
  'site_settings',
  'user_profiles',
  'user_roles',
].sort();

const requiredPaths = [
  'supabase/tests/database/qa_001_rls_matrix.test.sql',
  'supabase/migrations',
  'docs/technical/RLS_AND_PERMISSIONS_SPECIFICATION_v2.md',
  'docs/security/SECURITY_IMPLEMENTATION_RULES.md',
];
const errors = [];

for (const path of requiredPaths) {
  if (!existsSync(path)) errors.push(`Missing required path: ${path}`);
}

if (!errors.length) {
  const migrationSource = readdirSync('supabase/migrations')
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .map((name) => readFileSync(`supabase/migrations/${name}`, 'utf8'))
    .join('\n');
  const testSource = readFileSync(requiredPaths[0], 'utf8');

  const createdTables = new Set();
  for (const match of migrationSource.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?public\.([a-z0-9_]+)/gi)) {
    createdTables.add(match[1].toLowerCase());
  }
  const actualPublicTables = [...createdTables].sort();
  if (JSON.stringify(actualPublicTables) !== JSON.stringify(expectedPublicTables)) {
    errors.push(`Public table inventory mismatch. Expected ${expectedPublicTables.length}, found ${actualPublicTables.length}.`);
  }

  for (const table of expectedPublicTables) {
    const escaped = table.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const enablePattern = new RegExp(`alter\\s+table\\s+public\\.${escaped}\\s+enable\\s+row\\s+level\\s+security`, 'i');
    const forcePattern = new RegExp(`alter\\s+table\\s+public\\.${escaped}\\s+force\\s+row\\s+level\\s+security`, 'i');
    if (!enablePattern.test(migrationSource)) errors.push(`RLS is not enabled for public.${table}.`);
    if (!forcePattern.test(migrationSource)) errors.push(`RLS is not forced for public.${table}.`);
    if (!testSource.includes(`'${table}'`) && !testSource.includes(`public.${table}`)) {
      errors.push(`QA-001 matrix does not mention public.${table}.`);
    }
  }

  for (const role of ['owner', 'super_admin', 'content_manager', 'credential_manager']) {
    if (!testSource.includes(`'${role}'`)) errors.push(`QA-001 matrix does not cover ${role}.`);
  }
  for (const boundary of [
    'credential_verification_rate_limits',
    'contact_submission_rate_limits',
    'private-credentials',
    'verify_public_credential',
    'create_public_contact_submission',
    'service_role',
    'is_mfa_requirement_satisfied',
    'search_path=',
    'credential_generation_batch_activation_requests',
    'credential_generation_batch_activation_items',
  ]) {
    if (!testSource.includes(boundary)) errors.push(`QA-001 matrix is missing boundary: ${boundary}`);
  }

  const plan = testSource.match(/select\s+plan\((\d+)\)/i)?.[1];
  const assertions = [...testSource.matchAll(/^select\s+(?:results_eq|has_index)\s*\(/gim)].length;
  if (Number(plan) !== assertions) {
    errors.push(`pgTAP plan mismatch: plan(${plan ?? 'missing'}) but found ${assertions} assertions.`);
  }

  const clientFiles = [
    ...readdirSync('app', { recursive: true }),
    ...readdirSync('components', { recursive: true }).map((path) => `../components/${path}`),
  ];
  for (const relativePath of clientFiles) {
    const path = relativePath.startsWith('../') ? relativePath.slice(3) : `app/${relativePath}`;
    if (!existsSync(path) || !/\.(?:ts|tsx|js|jsx)$/.test(path)) continue;
    const source = readFileSync(path, 'utf8');
    if (/^['\"]use client['\"];?/m.test(source) && source.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      errors.push(`Service-role key referenced by client module: ${path}`);
    }
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:qa-001'] !== 'node scripts/verify-qa-001.mjs') {
    errors.push('package.json must expose verify:qa-001.');
  }
}

if (errors.length) {
  console.error('QA-001 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`QA-001 static verification passed for ${expectedPublicTables.length} protected public tables.`);
