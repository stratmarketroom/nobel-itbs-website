import { existsSync, readFileSync } from 'node:fs';

const files = {
  globalNotFound: 'app/global-not-found.tsx',
  publicBoundary: 'app/(public)/not-found.tsx',
  publicNotFound: 'components/public-not-found.tsx',
  config: 'next.config.mjs',
  proxy: 'proxy.ts',
  css: 'app/public.css',
  package: 'package.json',
};

const errors = [];
for (const file of Object.values(files)) {
  if (!existsSync(file)) errors.push(`Missing required 404 file: ${file}`);
}

const read = (file) => existsSync(file) ? readFileSync(file, 'utf8') : '';
const globalNotFound = read(files.globalNotFound);
const publicNotFound = read(files.publicNotFound);
const publicBoundary = read(files.publicBoundary);
const config = read(files.config);
const proxy = read(files.proxy);
const css = read(files.css);

for (const forbidden of ["'use client'", 'usePathname', 'localeFromPathname']) {
  if (globalNotFound.includes(forbidden) || publicNotFound.includes(forbidden)) {
    errors.push(`Public 404 must not depend on client rendering: ${forbidden}`);
  }
}

for (const snippet of [
  "import { headers } from 'next/headers';",
  'htmlLanguageHeader',
  'resolveHtmlLanguage',
  'export async function generateNotFoundMetadata()',
  'robots: { index: false, follow: false }',
  'alternates: null',
  'openGraph: null',
  'twitter: null',
  'await getRequestLocale()',
  'export default async function PublicNotFoundBoundary()',
  'aria-labelledby="not-found-title"',
  'className="not-found-body"',
  'className="not-found-actions"',
  "localizePublicPath(locale, '/programmes')",
  "localizePublicPath(locale, '/')",
]) {
  if (!publicNotFound.includes(snippet)) errors.push(`Server-rendered 404 contract missing: ${snippet}`);
}

for (const snippet of [
  "import './base.css';",
  "import './public.css';",
  'export const generateMetadata = generateNotFoundMetadata;',
  'export default async function GlobalNotFound()',
  '<html lang={htmlLanguageByLocale[locale]} className={manrope.variable}>',
  '<PublicNotFound locale={locale} />',
  '<GoogleAnalytics />',
  '<CookieConsent />',
]) {
  if (!globalNotFound.includes(snippet)) errors.push(`Global 404 document contract missing: ${snippet}`);
}

for (const copy of [
  'The page may have moved, changed its address, or no longer be available.',
  'Можливо, сторінку переміщено, її адресу змінено або вона більше недоступна.',
  'Stránka mohla být přesunuta, změnila adresu nebo již není dostupná.',
  'View programmes',
  'Переглянути програми',
  'Zobrazit programy',
]) {
  if (!publicNotFound.includes(copy)) errors.push(`Approved EN/UA/CZ 404 copy missing: ${copy}`);
}

if (!config.includes('globalNotFound: true')) errors.push('Next.js globalNotFound must remain enabled.');

if (!publicBoundary.includes('generateNotFoundMetadata as generateMetadata')) {
  errors.push('Public segment-level notFound() calls must retain localized server metadata.');
}

for (const snippet of [
  'const publicRootSegments = new Set([',
  'function rewriteToGlobalNotFound(request: NextRequest)',
  "new URL('/__nobel-global-not-found__/404', request.url)",
  'request: { headers: requestHeaders }',
  '&& !publicRootSegments.has(firstSegment)',
]) {
  if (!proxy.includes(snippet)) errors.push(`Global 404 proxy routing missing: ${snippet}`);
}

for (const removedBoundary of [
  'app/not-found.tsx',
  'app/(public)/[...not-found]/page.tsx',
  'app/(public)/[locale]/[...not-found]/page.tsx',
]) {
  if (existsSync(removedBoundary)) errors.push(`Legacy public 404 boundary must stay removed: ${removedBoundary}`);
}

for (const snippet of [
  '.not-found-copy {',
  '.not-found-body {',
  '.not-found-actions {',
  '.not-found-secondary {',
  '@media (max-width: 520px)',
]) {
  if (!css.includes(snippet)) errors.push(`Responsive 404 CSS missing: ${snippet}`);
}

const pkg = read(files.package) ? JSON.parse(read(files.package)) : {};
if (pkg.scripts?.['verify:qa-005:server-404'] !== 'node scripts/verify-qa-005-server-rendered-404.mjs') {
  errors.push('package.json must expose verify:qa-005:server-404.');
}

if (errors.length) {
  console.error('QA-005 server-rendered 404 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('QA-005 server-rendered EN/UA/CZ 404 verification passed.');
