import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const errors = [];
const socialDirectory = path.join('public', 'brand', 'social');
const expectedAssets = [
  'institutional-1200x630.png',
  'catalogue-1200x630.png',
  'area-business-management-1200x630.png',
  'area-technology-innovation-1200x630.png',
  'area-psychology-human-1200x630.png',
  'programme-format-1200x630.png',
  'programme-ai-production-1200x630.png',
  'programme-general-psychology-1200x630.png',
  'programme-child-psychology-1200x630.png',
  'programme-neuroplastic-reconstruction-1200x630.png',
  'programme-space-business-1200x630.png',
  'verify-1200x630.png',
];

for (const filename of expectedAssets) {
  const assetPath = path.join(socialDirectory, filename);
  if (!existsSync(assetPath)) {
    errors.push(`Missing social image: ${assetPath}`);
    continue;
  }

  const metadata = await sharp(assetPath).metadata();
  if (metadata.width !== 1200 || metadata.height !== 630) {
    errors.push(`${assetPath} must be exactly 1200x630, received ${metadata.width}x${metadata.height}.`);
  }
  if (metadata.format !== 'png') errors.push(`${assetPath} must be PNG.`);
  if (statSync(assetPath).size > 300_000) errors.push(`${assetPath} must remain under 300 KB.`);
}

const read = (filePath) => existsSync(filePath) ? readFileSync(filePath, 'utf8') : '';
const socialHelper = read('lib/seo/social.ts');

for (const snippet of [
  "card: 'summary_large_image'",
  'absolutePublicUrl(imagePath)',
  'width: 1200',
  'height: 630',
  "type: 'image/png'",
  'alternateLocale:',
  "en: 'Nobel ITBS professional education'",
  "ua: 'Професійна освіта Nobel ITBS'",
  "cz: 'Profesní vzdělávání Nobel ITBS'",
]) {
  if (!socialHelper.includes(snippet)) errors.push(`Social metadata helper missing: ${snippet}`);
}

for (const slug of [
  'business-management',
  'technology-innovation',
  'psychology-human',
  'certificate-programme',
  'mini-mba',
  'professional-development-course',
  'ai-production',
  'general-psychology',
  'child-psychology',
  'neuroplastic-reconstruction',
  'space-business',
]) {
  if (!socialHelper.includes(`'${slug}'`)) errors.push(`Social image mapping missing programme namespace slug: ${slug}`);
}

for (const forbidden of ['documentNumber', 'holderName', 'rawToken', 'credentialNumber']) {
  if (socialHelper.includes(forbidden)) errors.push(`Social metadata must not include verification data field: ${forbidden}`);
}

for (const filePath of [
  'app/(public)/layout.tsx',
  'lib/content/page-metadata.ts',
  'lib/content/legal-pages.ts',
  'app/(public)/programmes/page.tsx',
  'app/(public)/[locale]/programmes/page.tsx',
  'lib/programmes/landing-metadata.ts',
  'app/(public)/verify/page.tsx',
  'app/(public)/[locale]/verify/page.tsx',
  'app/(public)/verify/[token]/page.tsx',
  'app/(public)/[locale]/verify/[token]/page.tsx',
]) {
  const source = read(filePath);
  if (!source.includes('createSocialMetadata')) errors.push(`${filePath} must use the shared social metadata helper.`);
}

for (const tokenPage of ['app/(public)/verify/[token]/page.tsx', 'app/(public)/[locale]/verify/[token]/page.tsx']) {
  const source = read(tokenPage);
  if (!source.includes('robots: { index: false, follow: false }')) errors.push(`${tokenPage} must remain noindex, nofollow.`);
  if (!source.includes("localizedAbsoluteUrl('en', '/verify')") && !source.includes("localizedAbsoluteUrl(locale, '/verify')")) {
    errors.push(`${tokenPage} must canonicalize to manual Verify without exposing its token.`);
  }
}

const packageJson = JSON.parse(read('package.json'));
if (packageJson.scripts?.['generate:qa-005:og-images'] !== 'node scripts/generate-qa-005-social-images.mjs') {
  errors.push('package.json must expose generate:qa-005:og-images.');
}
if (packageJson.scripts?.['verify:qa-005:og-images'] !== 'node scripts/verify-qa-005-og-images.mjs') {
  errors.push('package.json must expose verify:qa-005:og-images.');
}

if (errors.length) {
  console.error('QA-005 Open Graph image verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`QA-005 Open Graph image verification passed (${expectedAssets.length} assets).`);
