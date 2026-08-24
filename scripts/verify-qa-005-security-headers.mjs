import { readFileSync } from 'node:fs';

const errors = [];
const configSource = readFileSync('next.config.mjs', 'utf8');
const { default: nextConfig } = await import('../next.config.mjs');
const rules = await nextConfig.headers?.();

if (!Array.isArray(rules) || rules.length !== 1 || rules[0]?.source !== '/:path*') {
  errors.push('Security headers must cover every application path with one /:path* rule.');
}

const headers = new Map((rules?.[0]?.headers ?? []).map(({ key, value }) => [key.toLowerCase(), value]));
const expectedHeaders = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), geolocation=(), microphone=(), payment=(), usb=()',
  'x-frame-options': 'DENY',
};

for (const [name, expected] of Object.entries(expectedHeaders)) {
  if (headers.get(name) !== expected) errors.push(`${name} must equal ${expected}.`);
}

const csp = headers.get('content-security-policy') ?? '';
for (const directive of [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline'",
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
  "media-src 'self'",
  "frame-src 'none'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  'upgrade-insecure-requests',
]) {
  if (!csp.split('; ').includes(directive)) errors.push(`CSP is missing: ${directive}.`);
}

for (const forbidden of ["'unsafe-eval'", 'SUPABASE_SERVICE_ROLE_KEY', 'api.telegram.org', 'smtp', 'data: *', 'https: *']) {
  if (csp.includes(forbidden)) errors.push(`Production CSP must not contain: ${forbidden}.`);
}

if (/\*\s*(?:;|$)/.test(csp)) errors.push('CSP must not use a wildcard source.');
if (!configSource.includes("process.env.NODE_ENV === 'development'")) {
  errors.push('Development-only CSP compatibility must be explicitly environment-scoped.');
}
if (!configSource.includes("isDevelopment ? \" 'unsafe-eval'\" : ''")) {
  errors.push('unsafe-eval must be limited to the Next.js development runtime.');
}
if (configSource.includes('Strict-Transport-Security')) {
  errors.push('Application config must not duplicate the platform-owned HSTS policy.');
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (pkg.scripts?.['verify:qa-005:security-headers'] !== 'node scripts/verify-qa-005-security-headers.mjs') {
  errors.push('package.json must expose verify:qa-005:security-headers.');
}

if (errors.length) {
  console.error('QA-005 security-header verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('QA-005 security-header static verification passed.');
