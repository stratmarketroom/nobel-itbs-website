import { existsSync, readFileSync } from 'node:fs';

const requiredFiles = [
  'playwright.config.ts',
  'tests/e2e/admin-role-matrix.spec.ts',
];
const errors = requiredFiles.filter((file) => !existsSync(file)).map((file) => `Missing ${file}`);
const config = existsSync(requiredFiles[0]) ? readFileSync(requiredFiles[0], 'utf8') : '';
const suite = existsSync(requiredFiles[1]) ? readFileSync(requiredFiles[1], 'utf8') : '';

for (const snippet of [
  "name: 'desktop-chromium'",
  "name: 'mobile-chromium'",
  "NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54321'",
  "SUPABASE_SERVICE_ROLE_KEY: 'e2e-server-only-placeholder'",
]) {
  if (!config.includes(snippet)) errors.push(`Playwright config missing ${snippet}`);
}

for (const role of ['owner', 'super_admin', 'content_manager', 'credential_manager']) {
  if (!suite.includes(`role: '${role}'`)) errors.push(`Role matrix missing ${role}`);
}

for (const snippet of [
  "new Set<AdminRole>(['owner', 'super_admin', 'credential_manager'])",
  "name: 'MFA is required'",
  "name: 'Access not available'",
  "name: 'Sign in required'",
  'every allowed route opens the protected shell',
  "expect(requests).toEqual(['/api/v1/admin/me'])",
  "document.documentElement.scrollWidth - window.innerWidth",
  "page.locator('.admin-app-mobile-bar')",
  "page.locator('.admin-app-sidebar')",
]) {
  if (!suite.includes(snippet)) errors.push(`Role matrix suite missing ${snippet}`);
}

for (const forbidden of ['DEV_OWNER_PASSWORD', 'SUPABASE_SERVICE_ROLE_KEY=', 'TOTP_SECRET', 'service_role']) {
  if (suite.includes(forbidden)) errors.push(`Browser suite contains forbidden secret/test-account material: ${forbidden}`);
}

if (errors.length) {
  console.error('ADM-E2E-ROLE-MATRIX verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('ADM-E2E-ROLE-MATRIX static verification passed.');
