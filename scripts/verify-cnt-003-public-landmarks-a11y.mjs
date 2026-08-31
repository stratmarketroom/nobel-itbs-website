import { existsSync, readFileSync } from 'node:fs';

const files = {
  header: 'components/public-responsive-header.tsx',
  footer: 'components/public-footer.tsx',
  home: 'components/content-managed-home.tsx',
  managed: 'components/managed-content-page.tsx',
  legal: 'components/legal-content-page.tsx',
  catalogue: 'components/programme-catalogue.tsx',
  landing: 'components/programme-landing.tsx',
  verification: 'components/public-verification.tsx',
  notFound: 'components/public-not-found.tsx',
  css: 'app/public.css',
  package: 'package.json',
};

const errors = Object.values(files)
  .filter((file) => !existsSync(file))
  .map((file) => `Missing ${file}`);
const read = (file) => existsSync(file) ? readFileSync(file, 'utf8') : '';
const header = read(files.header);
const footer = read(files.footer);
const css = read(files.css);

for (const snippet of [
  'export function PublicSkipLink',
  'href="#main-content"',
  "en: 'Skip to main content'",
  "ua: 'Перейти до основного вмісту'",
  "cz: 'Přejít k hlavnímu obsahu'",
  'role="banner"',
]) {
  if (!header.includes(snippet)) errors.push(`Shared public header missing ${snippet}`);
}

for (const snippet of [
  'role="contentinfo"',
  'currentHref?: string',
  "aria-current={isCurrentFooterHref(item.href, currentHref) ? 'page' : undefined}",
  "aria-current={item.href === currentHref ? 'page' : undefined}",
]) {
  if (!footer.includes(snippet)) errors.push(`Shared public footer missing ${snippet}`);
}

for (const file of [files.home, files.managed, files.legal, files.catalogue, files.landing, files.verification, files.notFound]) {
  const source = read(file);
  const headerIndex = source.indexOf(file === files.home ? '<header className="content-home-header" role="banner">' : '<PublicResponsiveHeader');
  const mainIndex = source.indexOf('<main id="main-content" tabIndex={-1}>');
  const footerIndex = source.indexOf('<PublicFooter');
  if (headerIndex < 0 || mainIndex < 0 || footerIndex < 0 || !(headerIndex < mainIndex && mainIndex < footerIndex)) {
    errors.push(`${file} must render banner, main, and contentinfo in document order.`);
  }
  if (/<main className=/.test(source)) errors.push(`${file} must not use the page-shell main as the visual root.`);
}

for (const snippet of [
  '.public-skip-link {',
  '.public-skip-link:focus-visible {',
  'transform: translateY(0);',
  '.public-footer a[aria-current="page"]',
]) {
  if (!css.includes(snippet)) errors.push(`Public accessibility CSS missing ${snippet}`);
}

const pkg = read(files.package) ? JSON.parse(read(files.package)) : {};
if (pkg.scripts?.['verify:cnt-003:public-landmarks-a11y'] !== 'node scripts/verify-cnt-003-public-landmarks-a11y.mjs') {
  errors.push('package.json must expose verify:cnt-003:public-landmarks-a11y.');
}

if (errors.length) {
  console.error('CNT-003-PUBLIC-LANDMARKS-A11Y-001 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('CNT-003-PUBLIC-LANDMARKS-A11Y-001 verification passed.');
