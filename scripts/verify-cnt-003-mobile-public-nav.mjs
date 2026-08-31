import { existsSync, readFileSync } from 'node:fs';

const files = {
  header: 'components/public-responsive-header.tsx',
  home: 'components/content-managed-home.tsx',
  managed: 'components/managed-content-page.tsx',
  legal: 'components/legal-content-page.tsx',
  notFound: 'app/(public)/not-found.tsx',
  catalogue: 'components/programme-catalogue.tsx',
  landing: 'components/programme-landing.tsx',
  verification: 'components/public-verification.tsx',
  css: 'app/public.css',
  package: 'package.json',
};

const errors = Object.values(files)
  .filter((file) => !existsSync(file))
  .map((file) => `Missing ${file}`);
const read = (file) => existsSync(file) ? readFileSync(file, 'utf8') : '';
const header = read(files.header);
const css = read(files.css);

for (const snippet of [
  "export type PublicNavSection = '/programmes' | '/for-organisations' | '/partnerships' | '/verify' | '/about';",
  'export function PublicResponsiveMobileMenu',
  '<details className="public-header-mobile-menu">',
  '<summary aria-label={menuLabels[locale]}>',
  'className="public-header-mobile-panel"',
  'className="public-header-mobile-verify"',
  'className="public-header-mobile-locales"',
  'className="public-header-verify-nav"',
  'className="nav public-header-nav"',
  'className="public-header-desktop-actions"',
  "en: 'Menu'",
  "ua: 'Меню'",
  "cz: 'Menu'",
  "aria-current={isCurrentHref(item.href, locale, currentSection) ? 'page' : undefined}",
  "aria-current={currentSection === '/verify' ? 'page' : undefined}",
  "aria-current={itemLocale === locale ? 'page' : undefined}",
]) {
  if (!header.includes(snippet)) errors.push(`Responsive public header missing ${snippet}`);
}

if (!header.includes('copy.nav.filter((item) => !isVerificationHref(item.href))')) {
  errors.push('Verify must be separated from the standard navigation links and rendered as a clear utility button.');
}

const targetChecks = [
  [files.catalogue, 'className="catalogue-header"', 'currentSection="/programmes"'],
  [files.landing, 'className="landing-header"', 'currentSection="/programmes"'],
  [files.verification, 'className="verification-header"', 'currentSection="/verify"'],
];

for (const [file, className, section] of targetChecks) {
  const source = read(file);
  if (!source.includes("import { PublicResponsiveHeader } from './public-responsive-header';")) {
    errors.push(`${file} must import the shared responsive public header.`);
  }
  if (!source.includes('<PublicResponsiveHeader') || !source.includes(className) || !source.includes(section)) {
    errors.push(`${file} must render the shared header with its existing visual class and current section.`);
  }
}

const sharedSurfaceChecks = [
  [files.home, "import { PublicResponsiveMobileMenu, PublicSkipLink } from './public-responsive-header';", '<PublicResponsiveMobileMenu'],
  [files.managed, "import { PublicResponsiveHeader, type PublicNavSection } from './public-responsive-header';", 'className="managed-public-header"'],
  [files.legal, "import { PublicResponsiveHeader } from './public-responsive-header';", 'className="managed-public-header legal-public-header"'],
  [files.notFound, "import { PublicResponsiveHeader } from '@/components/public-responsive-header';", 'className="managed-public-header not-found-header"'],
];

for (const [file, importSnippet, renderSnippet] of sharedSurfaceChecks) {
  const source = read(file);
  if (!source.includes(importSnippet) || !source.includes(renderSnippet)) {
    errors.push(`${file} must use the shared responsive public navigation.`);
  }
}

const managed = read(files.managed);
for (const [key, path] of [
  ['about', '/about'],
  ['for_organisations', '/for-organisations'],
  ['partnerships', '/partnerships'],
]) {
  if (!managed.includes(`${key}: '${path}'`)) errors.push(`Managed navigation missing active-section mapping ${key} -> ${path}.`);
}
for (const locale of ['en', 'ua', 'cz']) {
  if (!managed.includes(`${locale}: localizePublicPath('${locale}', currentPath)`)) {
    errors.push(`Managed navigation missing the correct ${locale.toUpperCase()} page transition.`);
  }
  if (!read(files.legal).includes(`${locale}: localizePublicPath('${locale}', legalPath)`)) {
    errors.push(`Legal navigation missing the correct ${locale.toUpperCase()} page transition.`);
  }
}

const home = read(files.home);
if (!home.includes("en: localizePublicPath('en', '/')") || !home.includes('verifyHref={verifyHref}')) {
  errors.push('Home must use the shared mobile menu while preserving its configured Verify destination.');
}

const notFound = read(files.notFound);
for (const locale of ['en', 'ua', 'cz']) {
  if (!notFound.includes(`${locale}: localizePublicPath('${locale}', '/')`)) {
    errors.push(`404 navigation missing the safe ${locale.toUpperCase()} home transition.`);
  }
}

for (const selector of [
  '/* CNT-003-MOBILE-NAV-002: one complete navigation pattern across every public page */',
  '.public-header-mobile-menu {',
  '@media (max-width: 1180px)',
  '.content-home-header .public-header-mobile-menu { display: block; }',
  '@media (max-width: 1040px)',
  '.site-header .public-header-nav { display: none; }',
  '.site-header .public-header-desktop-actions { display: none; }',
  '.site-header .public-header-mobile-menu { display: block; }',
  '.public-header-mobile-menu summary:focus-visible {',
  '.public-header-mobile-panel a {',
  '.public-header-mobile-verify {',
  '.public-header-mobile-panel > nav:first-child a[aria-current="page"]',
  '.public-header-mobile-locales a[aria-current="page"] {',
  '.public-header-nav a[aria-current="page"]::after {',
  '.public-header-verify-nav[aria-current="page"] {',
]) {
  if (!css.includes(selector)) errors.push(`Mobile navigation CSS missing ${selector}`);
}

if (!/\.public-header-mobile-panel a \{[\s\S]*?min-height: 2\.75rem;/.test(css)) {
  errors.push('Mobile navigation links must retain a 44px minimum touch target.');
}

const pkg = read(files.package) ? JSON.parse(read(files.package)) : {};
if (pkg.scripts?.['verify:cnt-003:mobile-nav'] !== 'node scripts/verify-cnt-003-mobile-public-nav.mjs') {
  errors.push('package.json must expose verify:cnt-003:mobile-nav.');
}

if (errors.length) {
  console.error('CNT-003-MOBILE-NAV-002 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('CNT-003-MOBILE-NAV-002 verification passed.');
