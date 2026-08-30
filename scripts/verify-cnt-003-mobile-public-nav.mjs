import { existsSync, readFileSync } from 'node:fs';

const files = {
  header: 'components/public-responsive-header.tsx',
  catalogue: 'components/programme-catalogue.tsx',
  landing: 'components/programme-landing.tsx',
  verification: 'components/public-verification.tsx',
  css: 'app/globals.css',
  package: 'package.json',
};

const errors = Object.values(files)
  .filter((file) => !existsSync(file))
  .map((file) => `Missing ${file}`);
const read = (file) => existsSync(file) ? readFileSync(file, 'utf8') : '';
const header = read(files.header);
const css = read(files.css);

for (const snippet of [
  'className="public-header-mobile-menu"',
  '<summary aria-label={menuLabels[locale]}>',
  'className="public-header-mobile-panel"',
  'className="public-header-mobile-locales"',
  "en: 'Menu'",
  "ua: 'Меню'",
  "cz: 'Menu'",
  "aria-current={isCurrentSection(item.href) ? 'page' : undefined}",
  "aria-current={itemLocale === locale ? 'page' : undefined}",
]) {
  if (!header.includes(snippet)) errors.push(`Responsive public header missing ${snippet}`);
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

for (const selector of [
  '.public-header-mobile-menu { display: none; }',
  '@media (max-width: 860px)',
  '.site-header .public-header-desktop-locales { display: none; }',
  '.site-header .public-header-mobile-menu {',
  '.public-header-mobile-menu summary:focus-visible {',
  '.public-header-mobile-panel a {',
  '.public-header-mobile-locales a[aria-current="page"] {',
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
  console.error('CNT-003-MOBILE-NAV-001 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('CNT-003-MOBILE-NAV-001 verification passed.');
