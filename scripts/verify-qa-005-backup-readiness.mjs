import { readFileSync } from 'node:fs';

const errors = [];
const runbookPath = 'docs/development/SUPABASE_BACKUP_AND_RESTORE.md';
const reportPath = 'docs/qa/QA_005_BACKUP_READINESS_2026-08-24.md';
const runbook = readFileSync(runbookPath, 'utf8');
const report = readFileSync(reportPath, 'utf8');
const gitignore = readFileSync('.gitignore', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

const requiredRunbookPatterns = [
  ['production project identity', /nobel-itbs-prod.*szratzjodgiacvnhqmhx/s],
  ['Free-plan blocker', /organisation plan: Free/],
  ['database backup retention', /seven daily\s+backups/],
  ['Storage-byte exclusion', /do not contain Storage\s+object bytes/],
  ['private credential bucket', /private-credentials/],
  ['database RPO', /database RPO: at most 24 hours/],
  ['private PDF RPO', /private-PDF RPO: at most 24 hours/],
  ['database RTO', /database-only RTO target: 8 hours/],
  ['full recovery RTO', /full database plus private-PDF RTO target: 24 hours/],
  ['new-project restore guard', /Never use Production as the target of a drill/],
  ['outbound integration isolation', /credential email, Telegram notifications/],
  ['Storage integrity checks', /object key, byte size, and SHA-256 checksum/],
  ['database and Storage reconciliation', /zero missing and zero orphan PDFs/],
  ['service-role privacy', /never expose a[\s\S]*service-role or S3 key to browser code/],
  ['billing approval boundary', /requires a separate explicit Owner confirmation/],
];

for (const [label, pattern] of requiredRunbookPatterns) {
  if (!pattern.test(runbook)) errors.push(`Runbook is missing ${label}.`);
}

for (const requiredReportText of [
  'No migration, policy, grant, database row, Auth user, Storage bucket,',
  'no scheduled database backups',
  'no independent encrypted object-backup',
  'readiness remains a launch blocker',
]) {
  if (!report.includes(requiredReportText)) {
    errors.push(`QA report is missing: ${requiredReportText}`);
  }
}

if (!gitignore.split(/\r?\n/).includes('backups/')) {
  errors.push('The backups/ directory must remain Git-ignored.');
}

if (
  pkg.scripts?.['verify:qa-005:backup-readiness']
  !== 'node scripts/verify-qa-005-backup-readiness.mjs'
) {
  errors.push('package.json must expose verify:qa-005:backup-readiness.');
}

const combined = `${runbook}\n${report}`;
for (const forbidden of [
  /SUPABASE_SERVICE_ROLE_KEY\s*=\s*\S+/,
  /SUPABASE_DB_PASSWORD\s*=\s*\S+/,
  /postgres(?:ql)?:\/\/[^\s:[\]]+:[^\s@]+@/,
  /eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}/,
]) {
  if (forbidden.test(combined)) errors.push(`Backup documentation appears to contain a secret: ${forbidden}`);
}

if (errors.length) {
  console.error('QA-005 backup-readiness verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('QA-005 backup-readiness static verification passed.');
