import { existsSync, readFileSync } from 'node:fs';

const requiredPaths = [
  'app/admin/login/page.tsx',
  'components/admin-mfa-login.tsx',
  'lib/supabase/browser.ts',
  'package.json',
];

const errors = [];

for (const path of requiredPaths) {
  if (!existsSync(path)) {
    errors.push(`Missing required path: ${path}`);
  }
}

if (existsSync('components/admin-mfa-login.tsx')) {
  const login = readFileSync('components/admin-mfa-login.tsx', 'utf8');
  const requiredSnippets = [
    "'use client';",
    'signInWithPassword',
    'getAuthenticatorAssuranceLevel',
    'listFactors',
    'enroll',
    'challengeAndVerify',
    '/api/v1/admin/me',
    "router.push('/admin/users')",
  ];

  for (const snippet of requiredSnippets) {
    if (!login.includes(snippet)) {
      errors.push(`Admin MFA login missing required snippet: ${snippet}`);
    }
  }

  if (/SUPABASE_SERVICE_ROLE_KEY|SUPABASE_ACCESS_TOKEN|SUPABASE_DB_PASSWORD/.test(login)) {
    errors.push('Admin MFA login must not reference server-only Supabase secrets.');
  }
}

if (existsSync('lib/supabase/browser.ts')) {
  const browser = readFileSync('lib/supabase/browser.ts', 'utf8');
  const requiredSnippets = [
    "'use client';",
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'createClient',
  ];

  for (const snippet of requiredSnippets) {
    if (!browser.includes(snippet)) {
      errors.push(`Browser Supabase helper missing required snippet: ${snippet}`);
    }
  }

  if (/SUPABASE_SERVICE_ROLE_KEY|service_role/i.test(browser)) {
    errors.push('Browser Supabase helper must not reference service role.');
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:auth-007'] !== 'node scripts/verify-auth-007.mjs') {
    errors.push('package.json must expose verify:auth-007.');
  }
}

if (errors.length > 0) {
  console.error('AUTH-007 verification failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('AUTH-007 verification passed.');
