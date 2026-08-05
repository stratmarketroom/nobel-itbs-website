import { existsSync, readFileSync } from 'node:fs';

const paths = {
  migration: 'supabase/migrations/20260804160000_prg_008_slug_redirects.sql',
  test: 'supabase/tests/database/prg_008_slug_redirects.test.sql',
  resolver: 'lib/programmes/slug-redirects.ts',
  proxy: 'proxy.ts',
  api: 'app/api/v1/public/programmes/[slug]/route.ts',
};
const errors = [];

for (const path of Object.values(paths)) {
  if (!existsSync(path)) errors.push(`Missing required path: ${path}`);
}

if (existsSync(paths.migration)) {
  const sql = readFileSync(paths.migration, 'utf8');
  for (const snippet of [
    'create table public.programme_slug_redirects',
    'old_slug text primary key',
    'programme_slug_redirects_no_self_redirect',
    'force row level security',
    'programme_slug_redirects_public_read',
    'internal.capture_published_programme_slug_redirect',
    'programmes_capture_slug_redirect',
    'programme_areas_capture_slug_redirect',
    'programme_types_capture_slug_redirect',
    "select 1 from public.programme_slug_redirects where old_slug = p_slug",
    "set new_slug = new.slug",
    'pg_advisory_xact_lock',
  ]) if (!sql.includes(snippet)) errors.push(`Migration missing required SQL snippet: ${snippet}`);
  if (/grant\s+(insert|update|delete|all)[^;]*\b(anon|authenticated)\b/i.test(sql)) {
    errors.push('Browser roles must not mutate slug redirects directly.');
  }
}

if (existsSync(paths.resolver)) {
  const resolver = readFileSync(paths.resolver, 'utf8');
  for (const snippet of ['programme_slug_redirects', "cache: 'no-store'", 'AbortSignal.timeout', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']) {
    if (!resolver.includes(snippet)) errors.push(`Redirect resolver missing required behavior: ${snippet}`);
  }
  if (resolver.includes('SUPABASE_SERVICE_ROLE_KEY')) errors.push('Public redirect lookup must not use the service role.');
}

if (existsSync(paths.proxy)) {
  const proxy = readFileSync(paths.proxy, 'utf8');
  for (const snippet of ['getProgrammeSlugRedirect', 'NextResponse.redirect(destination, 301)', '`/programmes/${currentSlug}`', '`/${programmePath.locale}/programmes/${currentSlug}`']) {
    if (!proxy.includes(snippet)) errors.push(`Proxy missing required redirect behavior: ${snippet}`);
  }
}

if (existsSync(paths.api)) {
  const api = readFileSync(paths.api, 'utf8');
  if (!api.includes('NextResponse.redirect(destination, 301)')) errors.push('Public programme API must return a 301 for historical slugs.');
}

if (existsSync(paths.test)) {
  const test = readFileSync(paths.test, 'utf8').toLowerCase();
  for (const snippet of ['select plan(', 'one hop', 'historical slug', 'draft slug', 'select * from finish();']) {
    if (!test.includes(snippet)) errors.push(`Database test missing required coverage: ${snippet}`);
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:prg-008'] !== 'node scripts/verify-prg-008.mjs') errors.push('package.json must expose verify:prg-008.');
}

if (errors.length) {
  console.error('PRG-008 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('PRG-008 verification passed.');
