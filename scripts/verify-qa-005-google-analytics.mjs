import { readFileSync } from 'node:fs';
import {
  GOOGLE_ANALYTICS_MEASUREMENT_ID,
  getPrivacySafeAnalyticsPath,
} from '../lib/analytics/google-analytics.ts';

const errors = [];
const component = readFileSync('components/google-analytics.tsx', 'utf8');
const consent = readFileSync('components/cookie-consent.tsx', 'utf8');
const layout = readFileSync('app/(public)/layout.tsx', 'utf8');
const config = readFileSync('next.config.mjs', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

if (GOOGLE_ANALYTICS_MEASUREMENT_ID !== 'G-RT0GQGPC6V') {
  errors.push('Google Analytics must use the Owner-approved measurement ID.');
}

for (const snippet of [
  "consent !== 'accepted'",
  'send_page_view: false',
  'allow_google_signals: false',
  'allow_ad_personalization_signals: false',
  "ad_storage: 'denied'",
  "ad_user_data: 'denied'",
  "ad_personalization: 'denied'",
  "window.gtag?.('consent', 'update', { analytics_storage: 'denied' })",
  'script.referrerPolicy = \'no-referrer\'',
]) {
  if (!component.includes(snippet)) errors.push(`Analytics component is missing: ${snippet}`);
}

if (component.includes('window.location.href') || component.includes('window.location.search')) {
  errors.push('Analytics must not send unfiltered locations or query strings.');
}

if (!consent.includes('COOKIE_CONSENT_STORAGE_KEY') || !consent.includes('COOKIE_CONSENT_CHANGE_EVENT')) {
  errors.push('Cookie banner and analytics must share the consent contract.');
}

if (!layout.includes('<GoogleAnalytics />') || !layout.includes('<CookieConsent />')) {
  errors.push('Public layout must mount analytics and the cookie consent banner.');
}
if (layout.includes("from 'next/headers'") || layout.includes('cookies()')) {
  errors.push('Public analytics/consent mounting must not disable public response caching.');
}

for (const source of [
  'https://www.googletagmanager.com',
  'https://*.google-analytics.com',
  'https://*.analytics.google.com',
]) {
  if (!config.includes(source)) errors.push(`CSP is missing the scoped Analytics source: ${source}`);
}

const safePathCases = new Map([
  ['/', '/'],
  ['/ua/programmes', '/ua/programmes'],
  ['/cz/verify', '/cz/verify'],
  ['/verify/private-token', '/verify/result'],
  ['/ua/verify/private-token', '/ua/verify/result'],
  ['/cz/verify/private-token', '/cz/verify/result'],
  ['/admin', null],
  ['/admin/credentials', null],
]);

for (const [pathname, expected] of safePathCases) {
  const actual = getPrivacySafeAnalyticsPath(pathname);
  if (actual !== expected) errors.push(`Expected ${pathname} to map to ${String(expected)}, received ${String(actual)}.`);
}

if (pkg.scripts?.['verify:qa-005:google-analytics'] !== 'node --experimental-strip-types scripts/verify-qa-005-google-analytics.mjs') {
  errors.push('package.json must expose verify:qa-005:google-analytics.');
}

if (errors.length) {
  console.error('QA-005 Google Analytics verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('QA-005 Google Analytics verification passed.');
