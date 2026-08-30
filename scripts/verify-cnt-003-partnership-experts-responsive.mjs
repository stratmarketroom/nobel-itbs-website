import { readFile } from 'node:fs/promises';

const [page, cards, css, pkgRaw] = await Promise.all([
  readFile('components/managed-content-page.tsx', 'utf8'),
  readFile('components/expert-cards.tsx', 'utf8'),
  readFile('app/globals.css', 'utf8'),
  readFile('package.json', 'utf8'),
]);

const errors = [];

if (!page.includes('<div className="managed-experts-section">\n          <ExpertCards experts={experts} />')) {
  errors.push('Managed Partnerships experts must use the shared padded responsive section.');
}

if (!cards.includes('(max-width: 700px) calc(100vw - 2.5rem), (max-width: 1050px) 44vw, 28rem')) {
  errors.push('Expert image sizes must match the one, two, and three-column layouts.');
}

const requiredCss = [
  '.managed-experts-section {',
  'padding: clamp(3.5rem, 7vw, 7rem) clamp(1.25rem, 8vw, 9rem);',
  'width: min(100%, 88rem);',
  'grid-template-columns: repeat(3, minmax(0, 1fr));',
  'grid-template-columns: repeat(2, minmax(0, 1fr));',
  'grid-template-columns: 1fr;',
  'grid-template-rows: auto auto;',
  'aspect-ratio: 4 / 5;',
];

for (const rule of requiredCss) {
  if (!css.includes(rule)) errors.push(`Missing responsive expert-card rule: ${rule}`);
}

const pkg = JSON.parse(pkgRaw);
if (pkg.scripts?.['verify:cnt-003:partnership-experts-responsive'] !== 'node scripts/verify-cnt-003-partnership-experts-responsive.mjs') {
  errors.push('package.json must expose verify:cnt-003:partnership-experts-responsive.');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('CNT-003 partnership experts responsive verification passed.');
