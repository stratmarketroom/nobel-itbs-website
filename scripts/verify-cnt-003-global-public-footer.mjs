import { existsSync, readFileSync } from 'node:fs';

const files = {
  footer: 'components/public-footer.tsx',
  home: 'components/content-managed-home.tsx',
  managed: 'components/managed-content-page.tsx',
  legal: 'components/legal-content-page.tsx',
  catalogue: 'components/programme-catalogue.tsx',
  landing: 'components/programme-landing.tsx',
  verification: 'components/public-verification.tsx',
  legacyHome: 'components/public-shell.tsx',
  legacyPartnerships: 'components/partnerships-page.tsx',
  notFound: 'app/not-found.tsx',
  css: 'app/globals.css',
  package: 'package.json',
};

const errors = Object.values(files)
  .filter((file) => !existsSync(file))
  .map((file) => `Missing ${file}`);
const read = (file) => existsSync(file) ? readFileSync(file, 'utf8') : '';
const footer = read(files.footer);
const css = read(files.css);

for (const snippet of [
  'export function PublicFooter',
  '<footer className="public-footer" role="contentinfo">',
  'className="public-footer-inner"',
  'src="/brand/nobel-logo-full-horizontal-web.svg"',
  'primaryNavigation.map((item)',
  'aria-current={isCurrentFooterHref(verifyItem.href, currentHref)',
  'copy.footer.legal.map((item)',
  '<address>',
  'mailto:${email}',
]) {
  if (!footer.includes(snippet)) errors.push(`Shared public footer missing ${snippet}`);
}

for (const snippet of [
  "en: { navigation: 'Navigation', legal: 'Legal' }",
  "ua: { navigation: 'Навігація', legal: 'Правова інформація' }",
  "cz: { navigation: 'Navigace', legal: 'Právní informace' }",
]) {
  if (!footer.includes(snippet)) errors.push(`Shared public footer localization missing ${snippet}`);
}

for (const file of [
  files.home,
  files.managed,
  files.legal,
  files.catalogue,
  files.landing,
  files.verification,
  files.legacyHome,
  files.legacyPartnerships,
  files.notFound,
]) {
  const source = read(file);
  if (!source.includes('PublicFooter')) errors.push(`${file} must use the shared public footer.`);
  if (!source.includes('<PublicFooter locale={')) errors.push(`${file} must render the shared public footer with its route locale.`);
}

for (const snippet of [
  '.public-footer {',
  'width: 100%;',
  '.public-footer-inner {',
  'grid-template-columns: minmax(16rem, 1fr) repeat(3, minmax(9rem, .55fr));',
  'width: min(100% - 2rem, 88rem);',
  '.public-footer a { min-height: 2.75rem; }',
]) {
  if (!css.includes(snippet)) errors.push(`Global public footer CSS missing ${snippet}`);
}

if (!/@media \(max-width: 1180px\)[\s\S]*?\.public-footer-inner \{ grid-template-columns: repeat\(2, minmax\(0, 1fr\)\); \}/.test(css)) {
  errors.push('Global public footer must switch to two columns below the desktop layout.');
}

if (!/@media \(max-width: 720px\)[\s\S]*?\.public-footer-inner \{ grid-template-columns: 1fr; \}/.test(css)) {
  errors.push('Global public footer must switch to one column on mobile.');
}

const pkg = read(files.package) ? JSON.parse(read(files.package)) : {};
if (pkg.scripts?.['verify:cnt-003:global-footer'] !== 'node scripts/verify-cnt-003-global-public-footer.mjs') {
  errors.push('package.json must expose verify:cnt-003:global-footer.');
}

if (errors.length) {
  console.error('CNT-003-GLOBAL-FOOTER-001 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('CNT-003-GLOBAL-FOOTER-001 verification passed.');
