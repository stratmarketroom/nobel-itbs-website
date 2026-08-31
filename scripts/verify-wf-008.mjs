import { existsSync, readFileSync } from 'node:fs';

const files = {
  migration: 'supabase/migrations/20260810130000_wf_008_public_verification.sql',
  test: 'supabase/tests/database/wf_008_public_verification.test.sql',
  manualRoute: 'app/api/v1/public/verify/route.ts',
  tokenRoute: 'app/api/v1/public/verify/[token]/route.ts',
  service: 'lib/credentials/public-verification.ts',
  types: 'lib/credentials/verification-types.ts',
  copy: 'lib/credentials/verification-copy.ts',
  component: 'components/public-verification.tsx',
  enPage: 'app/(public)/verify/page.tsx',
  uaCzPage: 'app/(public)/[locale]/verify/page.tsx',
  tokenPage: 'app/(public)/verify/[token]/page.tsx',
  localizedTokenPage: 'app/(public)/[locale]/verify/[token]/page.tsx',
};
const errors = [];

for (const path of Object.values(files)) {
  if (!existsSync(path)) errors.push(`Missing required path: ${path}`);
}

if (!errors.length) {
  const source = Object.fromEntries(Object.entries(files).map(([key, path]) => [key, readFileSync(path, 'utf8')]));

  for (const snippet of [
    'internal.credential_verification_rate_limits',
    'public.verify_public_credential',
    "v_kind not in ('token_hash', 'document_number')",
    "v_request_count > 30",
    "interval '15 minutes'",
    'verification_token_lookup_hash = v_value',
    "status in ('pending', 'voided')",
    "'not_found'::text",
    "status = 'revoked'",
    "'Відкликаний'::text",
    'v_credential.public_holder_name',
    'v_credential.public_programme_title',
    'v_credential.public_credential_type',
    'from public, anon, authenticated',
    'to service_role',
  ]) if (!source.migration.includes(snippet)) errors.push(`WF-008 migration missing required behavior: ${snippet}`);

  for (const [pattern, message] of [
    [/grant\s+(?:select|all).*credentials\s+to\s+anon/is, 'WF-008 must not grant anonymous access to the credentials table.'],
    [/partner|credential_files|learner_emails|learner_phones|revocation_reason/i, 'WF-008 database lookup must not read partner, PDF, contact, or revocation-reason data.'],
    [/verification_token_encrypted\s*=\s*v_value/i, 'WF-008 token lookup must never use encrypted/raw token material.'],
  ]) if (pattern.test(source.migration)) errors.push(message);

  for (const snippet of [
    "createHmac('sha256', secret)",
    'credential-verification:',
    'credentialTokenLookupHashes(rawToken)',
    "lookup('token_hash', lookupHash, request)",
    "lookup('document_number', normalizeDocumentNumber(documentNumber), request)",
    "error.message.includes('CREDENTIAL_VERIFICATION_RATE_LIMITED')",
    "result: 'not_found'",
    "result: 'revoked'",
    "result: 'valid'",
  ]) if (!source.service.includes(snippet)) errors.push(`WF-008 service missing required behavior: ${snippet}`);

  for (const snippet of ['export async function POST', 'documentNumber', 'Cache-Control', 'no-store', "'Retry-After': '900'"]) {
    if (!source.manualRoute.includes(snippet)) errors.push(`Manual verification route missing: ${snippet}`);
  }
  for (const snippet of ['export async function GET', 'verifyCredentialByToken', 'X-Robots-Tag', 'noindex, nofollow', "'Retry-After': '900'"]) {
    if (!source.tokenRoute.includes(snippet)) errors.push(`Token verification route missing: ${snippet}`);
  }

  const allPublic = source.manualRoute + source.tokenRoute + source.service + source.types + source.component;
  for (const forbidden of ['pdfUrl', 'downloadUrl', 'partnerName', 'learnerId', 'credentialId', 'credentialSetId', 'revocationReason']) {
    if (allPublic.includes(forbidden)) errors.push(`Public verification must not expose ${forbidden}.`);
  }
  if (/console\.(?:log|info|warn|error)/.test(allPublic)) errors.push('Public verification must not log token or lookup data.');
  if (/nameSearch|surname|emailSearch|phoneSearch/i.test(allPublic)) errors.push('Public verification must not implement person-based search.');

  for (const locale of ['en', 'ua', 'cz']) {
    if (!source.copy.includes(`${locale}: {`)) errors.push(`Missing ${locale.toUpperCase()} verification copy.`);
  }
  for (const snippet of ['result === \'valid\'', "result === 'revoked'", "result === 'not_found'", 'aria-live="polite"', 'formatIssueDate', 'localizePublicPath']) {
    if (!source.component.includes(snippet)) errors.push(`Verification UI missing: ${snippet}`);
  }
  if (!source.tokenPage.includes('index: false') || !source.localizedTokenPage.includes('index: false')) {
    errors.push('All token-result pages must be noindex.');
  }

  const test = source.test.toLowerCase();
  for (const snippet of ['select plan(19);', 'pending and voided', 'revoked verification', 'partner, pdf, contact', 'anonymous clients', 'select * from finish();']) {
    if (!test.includes(snippet)) errors.push(`WF-008 database test missing coverage: ${snippet}`);
  }
}

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:wf-008'] !== 'node scripts/verify-wf-008.mjs') errors.push('package.json must expose verify:wf-008.');
}

if (errors.length) {
  console.error('WF-008 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('WF-008 verification passed.');
