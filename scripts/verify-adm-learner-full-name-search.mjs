import { existsSync, readFileSync } from 'node:fs';

const errors = [];
const files = {
  search: 'lib/learners/search.ts',
  data: 'lib/learners/admin.ts',
  route: 'app/api/v1/admin/learners/route.ts',
  component: 'components/admin-learners.tsx',
  qa: 'docs/qa/ADM_LEARNER_FULL_NAME_SEARCH_2026-09-02.md',
};

const source = {};
for (const [name, path] of Object.entries(files)) {
  if (!existsSync(path)) errors.push(`Missing ADM-LEARNER-FULL-NAME-SEARCH file: ${path}`);
  source[name] = existsSync(path) ? readFileSync(path, 'utf8') : '';
}

for (const snippet of ['normalizeLearnerSearch', "replace(/\\s+/gu, ' ')", 'latinFullName', 'learnerMatchesQuery']) {
  if (!source.search.includes(snippet)) errors.push(`Learner full-name matcher is missing: ${snippet}`);
}
for (const snippet of ['learnerMatchesQuery(row, needle)', 'collectPaginatedRows<SearchRow>', 'matchingIds.slice(offset, offset + limit)']) {
  if (!source.data.includes(snippet)) errors.push(`Learner server search integration is missing: ${snippet}`);
}
if (!source.route.includes('getAdminContext(request)') || !source.route.includes('adminSearch(url.searchParams)')) {
  errors.push('Learner route must preserve protected admin context and validated query input.');
}
if (/getSupabaseAdminClient|SUPABASE_SERVICE_ROLE_KEY/.test(source.search + source.data + source.route)) {
  errors.push('Learner full-name search must remain caller-scoped and must not use service role.');
}
if (!source.component.includes('placeholder="Full name, email, or phone"')) {
  errors.push('Learner search control must describe full-name support.');
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (pkg.scripts?.['verify:adm-learner-full-name-search'] !== 'node scripts/verify-adm-learner-full-name-search.mjs') {
  errors.push('package.json must expose verify:adm-learner-full-name-search.');
}
if (pkg.scripts?.['test:adm-learner-full-name-search'] !== 'node --experimental-strip-types scripts/test-adm-learner-full-name-search.mjs') {
  errors.push('package.json must expose test:adm-learner-full-name-search.');
}

if (errors.length) {
  console.error('ADM-LEARNER-FULL-NAME-SEARCH verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('ADM-LEARNER-FULL-NAME-SEARCH static verification passed.');
