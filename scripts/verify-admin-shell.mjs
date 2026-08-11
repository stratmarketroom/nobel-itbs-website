import { existsSync, readFileSync } from 'node:fs';

const required = [
  'app/admin/layout.tsx',
  'components/admin-shell.tsx',
  'components/cookie-consent.tsx',
  'components/admin-user-management.tsx',
  'components/admin-content-pages.tsx',
  'components/admin-contact-submissions.tsx',
  'components/admin-site-settings.tsx',
];
const errors = required.filter((file) => !existsSync(file)).map((file) => `Missing ${file}`);
const shell = existsSync(required[1]) ? readFileSync(required[1], 'utf8') : '';
for (const snippet of [
  "fetch('/api/v1/admin/me'",
  "pathname === '/admin/login'",
  "'signed_out'",
  "'mfa_required'",
  "'forbidden'",
  "['owner', 'super_admin', 'content_manager']",
  "['owner', 'super_admin', 'credential_manager']",
  'aria-current={active',
  'No protected data has been loaded.',
]) if (!shell.includes(snippet)) errors.push(`Admin shell missing ${snippet}`);
if (shell.includes('SUPABASE_SERVICE_ROLE_KEY')) errors.push('Admin shell must not reference the service role.');
const cookie = existsSync(required[2]) ? readFileSync(required[2], 'utf8') : '';
if (!cookie.includes("path.startsWith('/admin/')")) errors.push('Cookie consent must stay out of protected admin routes.');
for (const file of required.slice(3)) {
  const source = existsSync(file) ? readFileSync(file, 'utf8') : '';
  if (!source.includes('admin-module-header')) errors.push(`${file} does not use the shared module header.`);
  if (source.includes('aria-label="Admin navigation"')) errors.push(`${file} still defines duplicate admin navigation.`);
}
if (errors.length) {
  console.error('Admin shell verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log('Admin shell verification passed.');
