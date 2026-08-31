import { existsSync, readFileSync, statSync } from 'node:fs';

const paths = {
  rootLayout: 'app/layout.tsx',
  publicLayout: 'app/(public)/layout.tsx',
  globalNotFound: 'app/global-not-found.tsx',
  publicNotFoundBoundary: 'app/(public)/not-found.tsx',
  publicNotFound: 'components/public-not-found.tsx',
  adminLayout: 'app/admin/layout.tsx',
  adminNotFound: 'app/admin/not-found.tsx',
  adminCatchAll: 'app/admin/[...not-found]/page.tsx',
  baseCss: 'app/base.css',
  publicCss: 'app/public.css',
  adminCss: 'app/admin.css',
  robots: 'app/robots.ts',
  sitemap: 'app/sitemap.ts',
  proxy: 'proxy.ts',
  analytics: 'lib/analytics/google-analytics.ts',
  config: 'next.config.mjs',
  package: 'package.json',
};

const publicRouteFiles = [
  'app/(public)/page.tsx',
  'app/(public)/[locale]/page.tsx',
  'app/(public)/about/page.tsx',
  'app/(public)/for-organisations/page.tsx',
  'app/(public)/partnerships/page.tsx',
  'app/(public)/privacy-policy/page.tsx',
  'app/(public)/programmes/page.tsx',
  'app/(public)/refund-policy/page.tsx',
  'app/(public)/terms-of-use/page.tsx',
  'app/(public)/verify/page.tsx',
];

const errors = [];
for (const path of [...Object.values(paths), ...publicRouteFiles]) {
  if (!existsSync(path)) errors.push(`Missing required boundary path: ${path}`);
}

const read = (path) => existsSync(path) ? readFileSync(path, 'utf8') : '';
const rootLayout = read(paths.rootLayout);
const publicLayout = read(paths.publicLayout);
const adminLayout = read(paths.adminLayout);
const baseCss = read(paths.baseCss);
const publicCss = read(paths.publicCss);
const adminCss = read(paths.adminCss);
const robots = read(paths.robots);
const sitemap = read(paths.sitemap);
const proxy = read(paths.proxy);
const analytics = read(paths.analytics);
const globalNotFound = read(paths.globalNotFound);
const publicNotFound = read(paths.publicNotFound);
const config = read(paths.config);

for (const snippet of ["import './base.css'", '<html lang={htmlLanguage}', '<body>{children}</body>']) {
  if (!rootLayout.includes(snippet)) errors.push(`Root layout is missing shared-only foundation: ${snippet}`);
}
for (const forbidden of ['public.css', 'admin.css', 'GoogleAnalytics', 'CookieConsent', 'createSocialMetadata', 'canonicalOrigin']) {
  if (rootLayout.includes(forbidden)) errors.push(`Root layout must not cross the public/admin boundary: ${forbidden}`);
}
for (const snippet of [
  "import './base.css'",
  "import './public.css'",
  '<html lang={htmlLanguageByLocale[locale]}',
  '<PublicNotFound locale={locale} />',
  '<GoogleAnalytics />',
  '<CookieConsent />',
]) {
  if (!globalNotFound.includes(snippet)) errors.push(`Global public 404 is missing: ${snippet}`);
}
for (const forbidden of ['admin.css', 'AdminShell']) {
  if (globalNotFound.includes(forbidden) || publicNotFound.includes(forbidden)) {
    errors.push(`Global public 404 must not import an admin concern: ${forbidden}`);
  }
}
if (!config.includes('globalNotFound: true')) errors.push('Next.js globalNotFound must remain enabled.');

for (const snippet of [
  "import '../public.css'",
  '<GoogleAnalytics />',
  '<CookieConsent />',
  'metadataBase: new URL(canonicalOrigin)',
  'createSocialMetadata',
]) {
  if (!publicLayout.includes(snippet)) errors.push(`Public layout is missing: ${snippet}`);
}
for (const forbidden of ['admin.css', 'AdminShell', 'robots: {', "from 'next/headers'", 'cookies()']) {
  if (publicLayout.includes(forbidden)) errors.push(`Public layout must not import an admin concern: ${forbidden}`);
}

for (const snippet of [
  "import '../admin.css'",
  '<AdminShell>{children}</AdminShell>',
  'index: false',
  'follow: false',
  'nocache: true',
  'noarchive: true',
  'noimageindex: true',
  'nosnippet: true',
]) {
  if (!adminLayout.includes(snippet)) errors.push(`Admin layout is missing private-space protection: ${snippet}`);
}
for (const forbidden of [
  'public.css',
  'GoogleAnalytics',
  'CookieConsent',
  'createSocialMetadata',
  'canonicalOrigin',
  'alternates:',
  'openGraph:',
  'twitter:',
]) {
  if (adminLayout.includes(forbidden)) errors.push(`Admin layout must not inherit a public concern: ${forbidden}`);
}

for (const snippet of [':root {', 'box-sizing: border-box', 'font-family: var(--font-manrope)']) {
  if (!baseCss.includes(snippet)) errors.push(`Shared CSS foundation is missing: ${snippet}`);
}
for (const forbidden of ['.admin-shell', '.auth-shell', '.home-page', '.public-footer']) {
  if (baseCss.includes(forbidden)) errors.push(`Shared CSS must not contain route-specific selector: ${forbidden}`);
}

for (const snippet of ['.home-page', '.public-footer', '.public-header-mobile-menu', '.verification-page']) {
  if (!publicCss.includes(snippet)) errors.push(`Public CSS is missing public selector: ${snippet}`);
}
for (const forbidden of ['.admin-shell', '.auth-shell', '.admin-module-header', '.credential-registry-table']) {
  if (publicCss.includes(forbidden)) errors.push(`Public CSS contains admin selector: ${forbidden}`);
}

for (const snippet of ['.admin-shell', '.auth-shell', '.admin-module-header', '.credential-registry-table']) {
  if (!adminCss.includes(snippet)) errors.push(`Admin CSS is missing admin selector: ${snippet}`);
}
for (const forbidden of ['.home-page', '.public-footer', '.public-header-mobile-menu', '.verification-page']) {
  if (adminCss.includes(forbidden)) errors.push(`Admin CSS contains public selector: ${forbidden}`);
}

if (existsSync(paths.baseCss) && statSync(paths.baseCss).size > 5_000) errors.push('Shared CSS must remain a small foundation under 5 KB.');
if (existsSync(paths.publicCss) && statSync(paths.publicCss).size > 120_000) errors.push('Public CSS must remain below the 120 KB source budget.');

for (const snippet of ["'/admin'", "'/admin/'", "'/api'", "'/api/'"]) {
  if (!robots.includes(snippet)) errors.push(`robots.txt contract is missing private prefix: ${snippet}`);
}
for (const forbidden of ['/admin', '/api']) {
  if (sitemap.includes(forbidden)) errors.push(`Sitemap source must not publish private path: ${forbidden}`);
}
for (const snippet of [
  "pathname === '/admin'",
  "pathname.startsWith('/admin/')",
  "pathname.startsWith('/api')",
  "'X-Robots-Tag'",
  "'noindex, nofollow, noarchive, nosnippet, noimageindex'",
  "'CDN-Cache-Control'",
  'nextPublicWithHtmlLanguage',
]) {
  if (!proxy.includes(snippet)) errors.push(`Private response-header boundary is missing: ${snippet}`);
}
for (const snippet of ["segments[0] === 'admin'", 'return null']) {
  if (!analytics.includes(snippet)) errors.push(`Analytics privacy guard is missing: ${snippet}`);
}

const pkg = read(paths.package) ? JSON.parse(read(paths.package)) : {};
if (pkg.scripts?.['verify:qa-005:public-admin-boundary'] !== 'node scripts/verify-qa-005-public-admin-boundary.mjs') {
  errors.push('package.json must expose verify:qa-005:public-admin-boundary.');
}

if (errors.length) {
  console.error('QA-005 public/admin boundary verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('QA-005 public/admin CSS, analytics, and indexing boundary verification passed.');
