import { readFile } from 'node:fs/promises';

const [logoComponent, managedPage, home, partnerships, css, pkgRaw] = await Promise.all([
  readFile('components/partner-logo-image.tsx', 'utf8'),
  readFile('components/managed-content-page.tsx', 'utf8'),
  readFile('components/public-shell.tsx', 'utf8'),
  readFile('components/partnerships-page.tsx', 'utf8'),
  readFile('app/public.css', 'utf8'),
  readFile('package.json', 'utf8'),
]);

const errors = [];

for (const snippet of [
  "import Image from 'next/image';",
  'fill',
  'sizes={sizes}',
  'src={partner.logoPath}',
  'alt={partner.logoAlt}',
  'partner-logo-image-${partner.slug}',
]) {
  if (!logoComponent.includes(snippet)) errors.push(`Shared partner logo image is missing: ${snippet}`);
}

if (managedPage.includes('<img alt={partner.logoAlt} src={partner.logoPath} />')) {
  errors.push('Managed Partnerships must not render raw partner <img> elements.');
}

for (const [source, label] of [
  [managedPage, 'managed Partnerships'],
  [home, 'Home trust row'],
  [partnerships, 'Partnerships presentation'],
]) {
  if (!source.includes('<PartnerLogoImage')) errors.push(`${label} must use the shared optimized partner logo image.`);
}

for (const snippet of [
  'className="managed-partner-logo"',
  '(max-width: 700px) calc(100vw - 5.5rem)',
  "partner.type === 'exclusive_academic_partner' ? '20rem' : '12rem'",
]) {
  if (!managedPage.includes(snippet) && !home.includes(snippet)) errors.push(`Responsive logo sizing is missing: ${snippet}`);
}

for (const rule of [
  '.managed-partner-logo {',
  'height: clamp(6rem, 8vw, 7.5rem);',
  'object-fit: contain;',
  'object-position: left center;',
  '.managed-partner-logo.partner-logo-image-riga-nordic-university,',
  '.managed-partner-logo.partner-logo-image-nataliia-kholodenko-psychology-centre {',
  'overflow-wrap: anywhere;',
]) {
  if (!css.includes(rule)) errors.push(`Responsive partner-logo CSS is missing: ${rule}`);
}

const pkg = JSON.parse(pkgRaw);
if (pkg.scripts?.['verify:qa-005:partner-logo-adaptation'] !== 'node scripts/verify-qa-005-partner-logo-adaptation.mjs') {
  errors.push('package.json must expose verify:qa-005:partner-logo-adaptation.');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('QA-005 partner logo adaptation verification passed.');
