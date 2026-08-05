import { existsSync, readFileSync } from 'node:fs';

const paths = {
  types: 'lib/partnerships/types.ts',
  seed: 'lib/partnerships/seed.ts',
  component: 'components/partnerships-page.tsx',
  experts: 'components/expert-cards.tsx',
  englishRoute: 'app/partnerships/page.tsx',
  localizedRoute: 'app/[locale]/partnerships/page.tsx',
};
const errors = [];

for (const path of Object.values(paths)) {
  if (!existsSync(path)) errors.push(`Missing required path: ${path}`);
}

if (existsSync(paths.seed)) {
  const seed = readFileSync(paths.seed, 'utf8');
  for (const snippet of [
    "en: {",
    "ua: {",
    "cz: {",
    'Exclusive academic partnership',
    'Ексклюзивне академічне партнерство',
    'Exkluzivní akademické partnerství',
    'Partners never appear in public credential verification data',
    'getSeedPartnershipsPage',
  ]) if (!seed.includes(snippet)) errors.push(`Partnership copy missing approved content: ${snippet}`);
}

if (existsSync(paths.component)) {
  const component = readFileSync(paths.component, 'utf8');
  for (const snippet of [
    "partner.type === 'exclusive_academic_partner'",
    "partner.type === 'partner_organisation'",
    '<ExpertCards experts={experts}',
    'content.models.items.map',
    'content.principles.items.map',
    'content.boundaries.items.map',
    'mailto:info@nobel-itbs.eu',
  ]) if (!component.includes(snippet)) errors.push(`Partnerships page missing required behavior: ${snippet}`);
  if (/href=\{[^}]*\/experts\//.test(component) || /href=\{[^}]*\/partners\//.test(component)) {
    errors.push('Release 1 must not create public expert or partner profile links.');
  }
}

if (existsSync(paths.localizedRoute)) {
  const route = readFileSync(paths.localizedRoute, 'utf8');
  for (const snippet of ['isPrefixedLocale', 'isContentLocale', 'getPublicPartners(locale)', 'getPublicExperts(locale)', 'languages:']) {
    if (!route.includes(snippet)) errors.push(`Localized route missing required behavior: ${snippet}`);
  }
}

for (const forbiddenPath of [
  'app/partners/[slug]/page.tsx',
  'app/experts/[slug]/page.tsx',
  'app/[locale]/partners/[slug]/page.tsx',
  'app/[locale]/experts/[slug]/page.tsx',
]) {
  if (existsSync(forbiddenPath)) errors.push(`Public profile page is out of scope: ${forbiddenPath}`);
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (pkg.scripts?.['verify:pce-003'] !== 'node scripts/verify-pce-003.mjs') errors.push('package.json must expose verify:pce-003.');

if (errors.length) {
  console.error('PCE-003 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('PCE-003 verification passed.');
