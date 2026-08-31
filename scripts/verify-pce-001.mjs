import { existsSync, readFileSync } from 'node:fs';

const paths = {
  migration: 'supabase/migrations/20260804180000_pce_001_partners.sql',
  test: 'supabase/tests/database/pce_001_partners.test.sql',
  types: 'lib/partners/types.ts',
  seed: 'lib/partners/seed.ts',
  loader: 'lib/partners/public.ts',
  api: 'app/api/v1/public/partners/route.ts',
  shell: 'components/public-shell.tsx',
  home: 'app/(public)/page.tsx',
  localizedHome: 'app/(public)/[locale]/page.tsx',
};
const errors = [];

for (const path of Object.values(paths)) {
  if (!existsSync(path)) errors.push(`Missing required path: ${path}`);
}

for (const logo of [
  'alfred-nobel-university',
  'riga-nordic-university',
  'nataliia-kholodenko-psychology-centre',
  'e-launch-online-school',
  'nobel-mental-health',
]) {
  if (!existsSync(`public/partners/${logo}.webp`)) errors.push(`Missing approved partner logo: ${logo}.webp`);
}

if (existsSync(paths.migration)) {
  const sql = readFileSync(paths.migration, 'utf8');
  for (const snippet of [
    'create table if not exists public.partners',
    'create table if not exists public.partner_translations',
    "partner_type in ('exclusive_academic_partner', 'partner_organisation')",
    'force row level security',
    'partners_public_read',
    'partner_translations_public_read',
    "array['owner', 'super_admin', 'content_manager']",
    'e-launch-online-school',
  ]) if (!sql.includes(snippet)) errors.push(`Migration missing required behavior: ${snippet}`);
  if (/credential_id|credential_number|credential_partner/i.test(sql)) errors.push('Partners must not be connected to credentials.');
}

if (existsSync(paths.loader)) {
  const loader = readFileSync(paths.loader, 'utf8');
  for (const snippet of ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'AbortSignal.timeout', 'getSeedPartners', 'selectPublishedTranslation']) {
    if (!loader.includes(snippet)) errors.push(`Partner loader missing required behavior: ${snippet}`);
  }
  if (loader.includes('SUPABASE_SERVICE_ROLE_KEY')) errors.push('Public partner loading must not use the service role.');
}

if (existsSync(paths.shell)) {
  const shell = readFileSync(paths.shell, 'utf8');
  for (const snippet of ['partners.map', 'partner.logoPath', 'partner.officialUrl', 'target="_blank"']) {
    if (!shell.includes(snippet)) errors.push(`Homepage partner cards missing behavior: ${snippet}`);
  }
  if (/ACCA|EduQual|OTHM|ATHE|QFHE|EU Partners/.test(shell)) errors.push('Unapproved placeholder partners remain in the homepage shell.');
}

const i18n = readFileSync('lib/i18n.ts', 'utf8');
if (/ACCA|EduQual|OTHM|ATHE|QFHE|EU Partners/.test(i18n)) errors.push('Unapproved placeholder partners remain in localized copy.');

if (existsSync(paths.test)) {
  const test = readFileSync(paths.test, 'utf8').toLowerCase();
  for (const snippet of ['select plan(', 'five approved partners', 'fifteen approved translations', 'never be connected to credential', 'select * from finish();']) {
    if (!test.includes(snippet)) errors.push(`Database test missing required coverage: ${snippet}`);
  }
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (pkg.scripts?.['verify:pce-001'] !== 'node scripts/verify-pce-001.mjs') errors.push('package.json must expose verify:pce-001.');

if (errors.length) {
  console.error('PCE-001 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('PCE-001 verification passed.');
