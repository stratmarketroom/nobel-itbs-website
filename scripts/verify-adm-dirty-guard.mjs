import { existsSync, readFileSync } from 'node:fs';

const files = {
  guard: 'components/admin-dirty-guard.tsx',
  shell: 'components/admin-shell.tsx',
  css: 'app/admin.css',
  content: 'components/admin-content-pages.tsx',
  programmes: 'components/admin-programmes.tsx',
  taxonomy: 'components/admin-programme-taxonomy.tsx',
  partnerships: 'components/admin-partnership-entities.tsx',
  operations: 'components/admin-programme-operations.tsx',
  email: 'components/admin-email-templates.tsx',
  settings: 'components/admin-site-settings.tsx',
  users: 'components/admin-user-management.tsx',
  learners: 'components/admin-learners.tsx',
  credentials: 'components/admin-credentials.tsx',
  batches: 'components/admin-credential-batches.tsx',
  templates: 'components/admin-credential-templates.tsx',
};

const errors = [];
const source = {};

for (const [name, path] of Object.entries(files)) {
  if (!existsSync(path)) errors.push(`Missing ADM-DIRTY-GUARD file: ${path}`);
  source[name] = existsSync(path) ? readFileSync(path, 'utf8') : '';
}

for (const snippet of [
  'AdminDirtyGuardProvider',
  'useAdminUnsavedChanges',
  'useAdminFormChanges',
  "window.addEventListener('beforeunload'",
  "window.addEventListener('popstate'",
  "document.addEventListener('click', click, true)",
  'window.history.forward()',
  'window.confirm(discardMessage)',
  'event.returnValue',
  'role="status"',
  'aria-live="polite"',
]) {
  if (!source.guard.includes(snippet)) errors.push(`Shared dirty guard missing: ${snippet}`);
}

if (!source.shell.includes('<AdminDirtyGuardProvider>')) errors.push('Protected admin shell must own the shared dirty-guard provider.');
if ((source.shell.match(/data-admin-guard-navigation/g) ?? []).length < 2) errors.push('Desktop and mobile sign-out actions must be guarded.');
if (!source.css.includes('.admin-unsaved-indicator')) errors.push('Visible unsaved-state indicator styling is missing.');

for (const name of ['content', 'programmes', 'taxonomy', 'partnerships', 'operations', 'email', 'settings', 'users', 'batches', 'templates']) {
  if (!source[name].includes('useAdminUnsavedChanges')) errors.push(`${files[name]} must register controlled unsaved state.`);
}

for (const name of ['learners', 'credentials', 'templates']) {
  if (!source[name].includes('useAdminFormChanges')) errors.push(`${files[name]} must protect locally managed form state.`);
}

for (const name of ['content', 'programmes', 'taxonomy', 'partnerships', 'users', 'learners', 'credentials', 'batches']) {
  if (!source[name].includes('confirmDiscardChanges')) errors.push(`${files[name]} must guard local record, locale, tab, or workflow navigation.`);
}

if (!source.templates.includes('placementsDirty')) errors.push('Template placement changes must be compared with the saved placement baseline.');
if (!source.email.includes('hasDirtyDrafts')) errors.push('Email template guard must retain dirty state across language tabs.');

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (pkg.scripts?.['verify:adm-dirty-guard'] !== 'node scripts/verify-adm-dirty-guard.mjs') {
  errors.push('package.json must expose verify:adm-dirty-guard.');
}

if (errors.length) {
  console.error('ADM-DIRTY-GUARD verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('ADM-DIRTY-GUARD verification passed across protected admin editors.');
