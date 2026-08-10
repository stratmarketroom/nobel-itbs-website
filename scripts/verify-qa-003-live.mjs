import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const email = process.env.DEV_OWNER_EMAIL;
const password = process.env.DEV_OWNER_PASSWORD;
const baseUrl = (process.env.QA_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

if (!supabaseUrl || !anonKey || !email || !password) {
  console.error('QA-003 live verification requires Supabase public config and dev Owner credentials.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, anonKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const errors = [];

try {
  const { data: signIn, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError || !signIn.session?.access_token) throw new Error('Fresh Owner AAL1 sign-in failed.');
  const accessToken = signIn.session.access_token;

  const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assuranceError) throw new Error('Could not read authenticator assurance level.');
  if (assurance.currentLevel !== 'aal1' || assurance.nextLevel !== 'aal2') {
    errors.push(`Expected a fresh aal1 session upgradeable to aal2, received ${assurance.currentLevel}/${assurance.nextLevel}.`);
  }

  const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
  if (factorsError) throw new Error('Could not list MFA factors.');
  if (!factors.totp.some((factor) => factor.status === 'verified')) {
    errors.push('Dev Owner should have at least one verified TOTP factor.');
  }

  const headers = { authorization: `Bearer ${accessToken}` };
  const meResponse = await fetch(`${baseUrl}/api/v1/admin/me`, { headers, signal: AbortSignal.timeout(15_000) });
  const meBody = await meResponse.json().catch(() => null);
  if (!meResponse.ok) errors.push(`Authenticated AAL1 /admin/me failed: HTTP ${meResponse.status}.`);
  if (meBody?.mfa?.aal !== 'aal1' || meBody?.mfa?.satisfied !== false) {
    errors.push('Admin context did not report the fresh Owner session as unsatisfied AAL1.');
  }

  const sensitiveReads = [
    '/api/v1/admin/users',
    '/api/v1/admin/contact-submissions',
    '/api/v1/admin/learners',
    '/api/v1/admin/credentials',
    '/api/v1/admin/credential-sets',
    '/api/v1/admin/document-numbers',
    '/api/v1/admin/site-settings',
    '/api/v1/admin/content-pages',
    '/api/v1/admin/programmes',
    '/api/v1/admin/partners',
    '/api/v1/admin/experts',
  ];

  for (const path of sensitiveReads) {
    const response = await fetch(`${baseUrl}${path}`, { headers, signal: AbortSignal.timeout(15_000) });
    const body = await response.json().catch(() => null);
    if (response.status !== 403) errors.push(`AAL1 request was not blocked for ${path}: HTTP ${response.status}.`);
    if (!body?.error?.message?.includes('MFA/AAL2')) errors.push(`AAL1 denial did not explain MFA/AAL2 for ${path}.`);
  }
} finally {
  await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
}

if (errors.length) {
  console.error('QA-003 live AAL1 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('QA-003 live AAL1 verification passed: verified TOTP enrolment and 11 sensitive admin route denials.');
