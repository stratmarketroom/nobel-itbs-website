import { readFileSync } from 'node:fs';

const errors = [];
const layout = readFileSync('app/layout.tsx', 'utf8');
const styles = readFileSync('app/globals.css', 'utf8');
const config = readFileSync('next.config.mjs', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

for (const snippet of [
  "import { Manrope } from 'next/font/google'",
  "subsets: ['latin']",
  "display: 'swap'",
  "variable: '--font-manrope'",
  'adjustFontFallback: true',
  'className={manrope.variable}',
]) {
  if (!layout.includes(snippet)) errors.push(`Root layout is missing: ${snippet}`);
}

if (!styles.includes('font-family: var(--font-manrope), ui-sans-serif, system-ui')) {
  errors.push('The root font stack must use the generated Manrope CSS variable first.');
}

if (/fonts\.(?:googleapis|gstatic)\.com/.test(layout) || /fonts\.(?:googleapis|gstatic)\.com/.test(styles)) {
  errors.push('Runtime Google Fonts URLs are forbidden; next/font must self-host the files.');
}

if (/fonts\.(?:googleapis|gstatic)\.com/.test(config)) {
  errors.push('CSP must not be expanded for Google Fonts because next/font self-hosts them.');
}

if (pkg.scripts?.['verify:qa-005:manrope-font'] !== 'node scripts/verify-qa-005-manrope-font.mjs') {
  errors.push('package.json must expose verify:qa-005:manrope-font.');
}

if (errors.length) {
  console.error('QA-005 Manrope font verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('QA-005 Manrope font verification passed.');
