import { existsSync, readFileSync, readdirSync } from 'node:fs';

const requiredPaths = [
  'docs/development/MIGRATION_STANDARDS.md',
  'supabase/migrations/README.md',
  'supabase/tests/README.md',
  'package.json',
];

const errors = [];

for (const path of requiredPaths) {
  if (!existsSync(path)) {
    errors.push(`Missing required path: ${path}`);
  }
}

if (existsSync('docs/development/MIGRATION_STANDARDS.md')) {
  const standards = readFileSync('docs/development/MIGRATION_STANDARDS.md', 'utf8');
  const requiredPhrases = [
    'YYYYMMDDHHMMSS_ticket_id_short_description.sql',
    'One logical step per migration',
    'Forward-only',
    'Schema-qualified names',
    'Fixed search_path',
    'RLS deny-by-default',
    'Migration Checklist',
    'Rollback / Remediation Note',
  ];

  for (const phrase of requiredPhrases) {
    if (!standards.includes(phrase)) {
      errors.push(`Migration standards missing required phrase: ${phrase}`);
    }
  }
}

if (existsSync('supabase/migrations')) {
  const dbf002SqlFiles = readdirSync('supabase/migrations').filter(
    (name) => name.endsWith('.sql') && name.includes('dbf_002'),
  );
  if (dbf002SqlFiles.length > 0) {
    errors.push(`DBF-002 must not include DBF-002 SQL migrations. Found: ${dbf002SqlFiles.join(', ')}`);
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:dbf-002'] !== 'node scripts/verify-dbf-002.mjs') {
    errors.push('package.json must expose verify:dbf-002.');
  }
}

if (errors.length > 0) {
  console.error('DBF-002 verification failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('DBF-002 verification passed.');
