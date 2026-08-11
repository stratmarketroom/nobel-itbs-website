import { existsSync, readFileSync } from 'node:fs';

const paths = {
  migration: 'supabase/migrations/20260804200000_pce_002_experts.sql',
  test: 'supabase/tests/database/pce_002_experts.test.sql',
  types: 'lib/experts/types.ts',
  seed: 'lib/experts/seed.ts',
  loader: 'lib/experts/public.ts',
  api: 'app/api/v1/public/experts/route.ts',
  cards: 'components/expert-cards.tsx',
  assetScript: 'scripts/generate-pce-002-assets.mjs',
};
const errors = [];

for (const path of Object.values(paths)) {
  if (!existsSync(path)) errors.push(`Missing required path: ${path}`);
}

for (const portrait of ['nataliia-kholodenko', 'dmytro-shevchuk', 'alina-yudina']) {
  if (!existsSync(`public/experts/${portrait}.webp`)) errors.push(`Missing approved expert portrait: ${portrait}.webp`);
}

if (existsSync(paths.migration)) {
  const sql = readFileSync(paths.migration, 'utf8');
  for (const snippet of [
    'create table if not exists public.experts',
    'create table if not exists public.expert_translations',
    'photo_path text null',
    'force row level security',
    'experts_public_read',
    'expert_translations_public_read',
    "array['owner', 'super_admin', 'content_manager']",
    "'alina-yudina', 'published', '/experts/alina-yudina.webp'",
  ]) if (!sql.includes(snippet)) errors.push(`Migration missing required behavior: ${snippet}`);
  if (/credential_id|credential_number|programme_id/i.test(sql)) errors.push('PCE-002 must not add credential or programme relations.');
}

if (existsSync(paths.loader)) {
  const loader = readFileSync(paths.loader, 'utf8');
  for (const snippet of ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'AbortSignal.timeout', 'getSeedExperts', 'selectPublishedTranslation']) {
    if (!loader.includes(snippet)) errors.push(`Expert loader missing required behavior: ${snippet}`);
  }
  if (loader.includes('SUPABASE_SERVICE_ROLE_KEY')) errors.push('Public expert loading must not use the service role.');
}

if (existsSync(paths.cards)) {
  const cards = readFileSync(paths.cards, 'utf8');
  for (const snippet of ['experts.map', 'expert.photoPath', 'expert.category', 'expert.role']) {
    if (!cards.includes(snippet)) errors.push(`Expert cards missing required behavior: ${snippet}`);
  }
  if (/<Link|href=/.test(cards)) errors.push('Release 1 expert cards must not link to public expert profiles.');
}

if (existsSync(paths.test)) {
  const test = readFileSync(paths.test, 'utf8').toLowerCase();
  for (const snippet of ['select plan(', 'three approved experts', 'nine approved translations', 'approved received portrait', 'later programme-expert relation', 'select * from finish();']) {
    if (!test.includes(snippet)) errors.push(`Database test missing required coverage: ${snippet}`);
  }
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (pkg.scripts?.['verify:pce-002'] !== 'node scripts/verify-pce-002.mjs') errors.push('package.json must expose verify:pce-002.');

if (errors.length) {
  console.error('PCE-002 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('PCE-002 verification passed.');
