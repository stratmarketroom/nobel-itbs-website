import { existsSync, readFileSync } from 'node:fs';

const errors = [];
const files = {
  pagination: 'lib/admin/pagination.ts',
  contactRoute: 'app/api/v1/admin/contact-submissions/route.ts',
  learnerRoute: 'app/api/v1/admin/learners/route.ts',
  credentialRoute: 'app/api/v1/admin/credentials/route.ts',
  setRoute: 'app/api/v1/admin/credential-sets/route.ts',
  numberRoute: 'app/api/v1/admin/document-numbers/route.ts',
  contactData: 'lib/contact/admin.ts',
  learnerData: 'lib/learners/admin.ts',
  credentialData: 'lib/credentials/workspace.ts',
  paginationUi: 'components/admin-pagination.tsx',
  contactUi: 'components/admin-contact-submissions.tsx',
  learnerUi: 'components/admin-learners.tsx',
  credentialUi: 'components/admin-credentials.tsx',
};

const source = {};
for (const [name, path] of Object.entries(files)) {
  if (!existsSync(path)) errors.push(`Missing ADM-PAGINATION file: ${path}`);
  source[name] = existsSync(path) ? readFileSync(path, 'utf8') : '';
}

for (const name of ['contactRoute', 'learnerRoute', 'credentialRoute', 'setRoute', 'numberRoute']) {
  if (!source[name].includes('adminPagination(url.searchParams)')) errors.push(`${files[name]} must validate limit and offset centrally.`);
  if (!source[name].includes('getAdminContext(request)')) errors.push(`${files[name]} must preserve the protected admin context.`);
}

for (const name of ['contactData', 'learnerData', 'credentialData']) {
  if (!source[name].includes('.range(')) errors.push(`${files[name]} must page rows at the database boundary.`);
  if (source[name].includes('getSupabaseAdminClient')) errors.push(`${files[name]} must not bypass caller-scoped RLS.`);
}

for (const [name, oldLimit] of [['learnerData', '.limit(250)'], ['credentialData', '.limit(500)'], ['credentialData', '.limit(1000)']]) {
  if (source[name].includes(oldLimit)) errors.push(`${files[name]} still contains the old visibility cap ${oldLimit}.`);
}

if (!source.learnerData.includes('collectPaginatedRows<SearchRow>')) errors.push('Learner search must scan the full caller-visible data set on the server.');
if (!source.learnerData.includes('matchingIds.slice(offset, offset + limit)')) errors.push('Learner search results must be paged after full-data matching.');
if (!source.credentialData.includes("{ count: 'exact' }")) errors.push('Credential registries must return exact totals.');

for (const name of ['contactUi', 'learnerUi', 'credentialUi']) {
  if (!source[name].includes('<AdminPagination')) errors.push(`${files[name]} must expose accessible Previous/Next controls.`);
  if (!source[name].includes("offset: String(")) errors.push(`${files[name]} must request a server page by offset.`);
}

if (!source.paginationUi.includes('role="group"') || !source.paginationUi.includes('aria-label={label}')) {
  errors.push('Shared pagination controls must expose a labelled control group.');
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (pkg.scripts?.['verify:adm-pagination'] !== 'node scripts/verify-adm-pagination.mjs') {
  errors.push('package.json must expose verify:adm-pagination.');
}

if (errors.length) {
  console.error('ADM-PAGINATION verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('ADM-PAGINATION verification passed for Contact Submissions, Learners, Credentials, Credential Sets, and Document Number Log.');
