import { existsSync, readFileSync } from 'node:fs';

const required = [
  'components/admin-mfa-login.tsx',
  'app/globals.css',
  'package.json',
];
const errors = required.filter((file) => !existsSync(file)).map((file) => `Missing ${file}`);
const login = existsSync(required[0]) ? readFileSync(required[0], 'utf8') : '';
const css = existsSync(required[1]) ? readFileSync(required[1], 'utf8') : '';
const pkg = existsSync(required[2]) ? JSON.parse(readFileSync(required[2], 'utf8')) : {};

for (const snippet of [
  'signInWithPassword',
  'getAuthenticatorAssuranceLevel',
  'challengeAndVerify',
  "router.push('/admin/users')",
  'className="auth-error" role="alert"',
]) {
  if (!login.includes(snippet)) errors.push(`Admin login missing ${snippet}`);
}

for (const selector of [
  '.auth-shell {',
  '.auth-panel {',
  '.auth-form {',
  '.auth-form input {',
  '.auth-submit,',
  '.auth-shell :is(input, button):focus-visible {',
  '.auth-state {',
  '.mfa-enrollment {',
  '.auth-error {',
  '.auth-session {',
  '@media (max-width: 560px)',
  '@media (prefers-reduced-motion: reduce)',
]) {
  if (!css.includes(selector)) errors.push(`Admin login CSS missing ${selector}`);
}

if (!/\.auth-form input \{[\s\S]*?min-height: 3rem;[\s\S]*?font-size: 1rem;/.test(css)) {
  errors.push('Admin login inputs must preserve a 3rem target and 1rem mobile-safe text size.');
}
if (!/\.auth-submit,[\s\S]*?\.auth-session button \{[\s\S]*?min-height: 3rem;/.test(css)) {
  errors.push('Admin login primary controls must preserve a 3rem minimum target.');
}
if (!/\.auth-session button \{[\s\S]*?min-height: 3rem;/.test(css)) {
  errors.push('Admin login session control must preserve a 3rem minimum target.');
}
if (/SUPABASE_SERVICE_ROLE_KEY|SUPABASE_ACCESS_TOKEN|SUPABASE_DB_PASSWORD/.test(login)) {
  errors.push('Admin login must not reference server-only Supabase secrets.');
}
if (pkg.scripts?.['verify:qa-005:a11y-fix'] !== 'node scripts/verify-qa-005-a11y-fix.mjs') {
  errors.push('package.json must expose verify:qa-005:a11y-fix.');
}

if (errors.length) {
  console.error('QA-005-A11Y-FIX-001 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('QA-005-A11Y-FIX-001 verification passed.');
