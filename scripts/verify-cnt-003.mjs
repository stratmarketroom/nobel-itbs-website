import { existsSync, readFileSync } from 'node:fs';
const filePaths = {
  layoutMigration: 'supabase/migrations/20260805120000_cnt_003_public_layout_navigation.sql',
  homeCorrectionMigration: 'supabase/migrations/20260811130000_cnt_003_correct_home_content.sql',
  productionRepairMigration: 'supabase/migrations/20260812100000_cnt_003_restore_production_home_sections.sql',
  layoutTest: 'supabase/tests/database/cnt_003_public_layout_navigation.test.sql',
  homeCorrectionTest: 'supabase/tests/database/cnt_003_home_content_correction.test.sql',
  managedPage: 'components/managed-content-page.tsx',
  managedHome: 'components/content-managed-home.tsx',
  sharedCopy: 'lib/i18n.ts',
};
const routeFiles = [
  'app/(public)/about/page.tsx', 'app/(public)/[locale]/about/page.tsx',
  'app/(public)/for-organisations/page.tsx', 'app/(public)/[locale]/for-organisations/page.tsx',
  'app/(public)/partnerships/page.tsx', 'app/(public)/[locale]/partnerships/page.tsx',
];
const requiredFiles = [...Object.values(filePaths), ...routeFiles];
const errors = requiredFiles.filter((file) => !existsSync(file)).map((file) => `Missing ${file}`);
const readRequiredFile = (file) => existsSync(file) ? readFileSync(file, 'utf8') : '';

const managedPage = readRequiredFile(filePaths.managedPage);
if (
  !managedPage.includes("import { PublicResponsiveHeader, type PublicNavSection } from './public-responsive-header';")
  || !managedPage.includes('<PublicResponsiveHeader')
  || !managedPage.includes('const managedPageSections: Record<string, PublicNavSection>')
) {
  errors.push('Managed public pages must render the shared localized navigation.');
}

const sharedCopy = readRequiredFile(filePaths.sharedCopy);
const sharedNavStart = sharedCopy.indexOf('const englishNav');
const sharedNavEnd = sharedCopy.indexOf('const englishFooterColumns');
const sharedNav = sharedNavStart >= 0 && sharedNavEnd > sharedNavStart
  ? sharedCopy.slice(sharedNavStart, sharedNavEnd)
  : '';
const navPaths = ['/programmes', '/for-organisations', '/partnerships', '/verify', '/about'];
const localePrefixes = { en: '', ua: '/ua', cz: '/cz' };
for (const [locale, prefix] of Object.entries(localePrefixes)) {
  for (const path of navPaths) {
    if (!sharedNav.includes(`href: '${prefix}${path}'`)) errors.push(`${locale.toUpperCase()} shared navigation missing ${path}`);
  }
}

const managedHome = readRequiredFile(filePaths.managedHome);
const homeNavStart = managedHome.indexOf('const uiCopy');
const homeNavEnd = managedHome.indexOf('const localeLabels');
const homeNav = homeNavStart >= 0 && homeNavEnd > homeNavStart
  ? managedHome.slice(homeNavStart, homeNavEnd)
  : '';
for (const path of navPaths.filter((path) => path !== '/verify')) {
  const localizedEntries = homeNav.split(`path: '${path}'`).length - 1;
  if (localizedEntries !== 3) errors.push(`Home navigation must include ${path} for EN, UA, and CZ.`);
}
if (!managedHome.includes("targetFor(locale, verification?.fields?.link_target, '/verify')") || !managedHome.includes('content-home-verify-nav')) {
  errors.push('Home navigation missing the Verify utility action.');
}
if (/news/i.test(sharedNav) || /news/i.test(homeNav)) errors.push('News must not appear in Release 1 navigation.');

const migration = readRequiredFile(filePaths.layoutMigration);
for (const key of ['home', 'about', 'partnerships', 'for_organisations']) if (!migration.includes(`'${key}'`)) errors.push(`Migration missing ${key}`);

const homeCorrection = readRequiredFile(filePaths.homeCorrectionMigration);
const approvedSections = [...homeCorrection.matchAll(/\$json\$([\s\S]*?)\$json\$/g)].map((match) => {
  try { return JSON.parse(match[1]); } catch { errors.push('Home correction contains invalid JSON.'); return null; }
}).filter(Boolean);
if (approvedSections.length !== 3) errors.push('Home correction must contain EN, UA, and CZ payloads.');
for (const sections of approvedSections) {
  if (sections.blocks?.length !== 9) errors.push('Every corrected Home translation must contain nine blocks.');
  const areas = sections.blocks?.find((block) => block.key === 'programme_areas');
  if (areas?.cards?.length !== 3) errors.push('Every corrected Home translation must contain three programme areas.');
  const model = sections.blocks?.find((block) => block.key === 'how_the_model_works');
  if (!model?.fields?.step_4_title || !model?.fields?.step_4_body) errors.push('Every corrected Home translation must contain four model steps.');
}
const productionRepair = readRequiredFile(filePaths.productionRepairMigration);
if (!productionRepair.includes("when 'programme_areas'")) errors.push('Production repair must target programme areas.');
if (!productionRepair.includes("when 'why_nobel_itbs'")) errors.push('Production repair must target trust cards.');
if ((productionRepair.match(/\$json\$/g) ?? []).length !== 12) errors.push('Production repair must contain six approved JSON arrays.');
if (!productionRepair.includes("translation.language_code in ('en', 'ua', 'cz')")) errors.push('Production repair self-check must cover EN, UA, and CZ.');
if (errors.length) { console.error('CNT-003 verification failed:'); for (const error of errors) console.error(`- ${error}`); process.exit(1); }
console.log('CNT-003 verification passed.');
