import { readFileSync } from 'node:fs';
import {
  COOKIE_CONSENT_MAX_AGE_SECONDS,
  COOKIE_CONSENT_STORAGE_KEY,
  parseCookieConsentDecision,
  readCookieConsentDecision,
  serializeCookieConsentDecision,
} from '../lib/privacy/cookie-consent.ts';

const errors = [];
const consent = readFileSync('components/cookie-consent.tsx', 'utf8');
const analytics = readFileSync('components/google-analytics.tsx', 'utf8');
const layout = readFileSync('app/(public)/layout.tsx', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

for (const [value, expected] of [
  ['accepted', 'accepted'],
  ['declined', 'declined'],
  ['pending', 'pending'],
  ['invalid', 'pending'],
  [undefined, 'pending'],
]) {
  const actual = parseCookieConsentDecision(value);
  if (actual !== expected) errors.push(`Expected ${String(value)} to parse as ${expected}, received ${actual}.`);
}

for (const [header, expected] of [
  ['', 'pending'],
  ['theme=dark; nobel_cookie_consent=accepted; locale=ua', 'accepted'],
  ['nobel_cookie_consent=declined', 'declined'],
  ['nobel_cookie_consent=invalid', 'pending'],
  ['nobel_cookie_consent=%E0%A4%A', 'pending'],
]) {
  const actual = readCookieConsentDecision(header);
  if (actual !== expected) errors.push(`Expected cookie header to resolve to ${expected}, received ${actual}.`);
}

const localCookie = serializeCookieConsentDecision('declined', false);
const secureCookie = serializeCookieConsentDecision('accepted', true);
for (const snippet of [
  `${COOKIE_CONSENT_STORAGE_KEY}=declined`,
  'Path=/',
  `Max-Age=${COOKIE_CONSENT_MAX_AGE_SECONDS}`,
  'SameSite=Lax',
]) {
  if (!localCookie.includes(snippet)) errors.push(`Serialized necessary cookie is missing: ${snippet}`);
}
if (localCookie.includes('Secure')) errors.push('Local HTTP cookie must not require Secure.');
if (!secureCookie.includes('Secure')) errors.push('HTTPS cookie must include Secure.');

for (const snippet of [
  "import { cookies } from 'next/headers'",
  'const cookieStore = await cookies()',
  'cookieStore.get(COOKIE_CONSENT_STORAGE_KEY)?.value',
  '<GoogleAnalytics initialConsent={initialConsent} />',
  '<CookieConsent initialConsent={initialConsent} />',
]) {
  if (!layout.includes(snippet)) errors.push(`Public layout is missing deterministic consent rendering: ${snippet}`);
}

for (const snippet of [
  '() => initialConsent',
  'serializeCookieConsentDecision(decision',
  'window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, decision)',
  "consent !== 'pending'",
  "path.startsWith('/admin/')",
]) {
  if (!consent.includes(snippet)) errors.push(`Cookie consent component is missing: ${snippet}`);
}

for (const snippet of [
  '() => initialConsent',
  "consent !== 'accepted'",
  'readCookieConsentDecision(document.cookie)',
]) {
  if (!analytics.includes(snippet)) errors.push(`Analytics consent boundary is missing: ${snippet}`);
}

if (consent.includes("() => 'unknown'") || analytics.includes("() => 'unknown'")) {
  errors.push('Consent server snapshots must not defer the first render to hydration.');
}

if (pkg.scripts?.['verify:qa-005:cookie-lcp'] !== 'node --experimental-strip-types scripts/verify-qa-005-cookie-lcp.mjs') {
  errors.push('package.json must expose verify:qa-005:cookie-lcp.');
}

if (errors.length) {
  console.error('QA-005 cookie/LCP verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('QA-005 cookie/LCP verification passed.');
