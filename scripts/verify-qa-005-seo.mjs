import { existsSync, readFileSync } from 'node:fs';

const paths = {
  robots: 'app/robots.ts',
  sitemap: 'app/sitemap.ts',
  publication: 'lib/seo/publication.ts',
  urls: 'lib/seo/urls.ts',
  layout: 'app/layout.tsx',
  proxy: 'proxy.ts',
  nextConfig: 'next.config.mjs',
  managedMetadata: 'lib/content/page-metadata.ts',
  legalMetadata: 'lib/content/legal-pages.ts',
  programmeMetadata: 'lib/programmes/landing-metadata.ts',
};
const errors = [];

for (const path of Object.values(paths)) {
  if (!existsSync(path)) errors.push(`Missing required SEO path: ${path}`);
}

const read = (path) => existsSync(path) ? readFileSync(path, 'utf8') : '';
const urls = read(paths.urls);
for (const snippet of [
  "canonicalOrigin = 'https://nobel-itbs.eu'",
  "canonicalHost = 'nobel-itbs.eu'",
  "ua: { pathPrefix: '/ua', hreflang: 'uk'",
  "cz: { pathPrefix: '/cz', hreflang: 'cs'",
  "alternates['x-default']",
]) if (!urls.includes(snippet)) errors.push(`SEO URL helper missing: ${snippet}`);

const robots = read(paths.robots);
for (const snippet of ["userAgent: '*'", "disallow: ['/admin/', '/api/']", "absolutePublicUrl('/sitemap.xml')"]) {
  if (!robots.includes(snippet)) errors.push(`Robots route missing: ${snippet}`);
}

const sitemap = read(paths.sitemap);
for (const snippet of ['getSitemapPublication', 'languageAlternates', 'localizedAbsoluteUrl', 'publishedLocales.map', "dynamic = 'force-dynamic'"]) {
  if (!sitemap.includes(snippet)) errors.push(`Sitemap route missing: ${snippet}`);
}
for (const forbidden of ['changeFrequency', 'priority:', 'lastModified', 'verify/[token]', 'privacy-policy', 'terms-of-use', 'refund-policy']) {
  if (sitemap.includes(forbidden)) errors.push(`Sitemap route must not contain: ${forbidden}`);
}

const publication = read(paths.publication);
for (const snippet of [
  "client.from('content_pages')",
  "client.from('programme_areas')",
  "client.from('programme_types')",
  "client.from('programmes')",
  ".eq('status', 'published')",
  ".eq('publication_status', 'published')",
  "translation.translation_status === 'published'",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "path: '/programmes'",
  "path: '/verify'",
]) if (!publication.includes(snippet)) errors.push(`Publication resolver missing: ${snippet}`);
if (publication.includes('SUPABASE_SERVICE_ROLE_KEY')) errors.push('Sitemap publication must not use the service role.');
for (const forbidden of ['privacy-policy', 'terms-of-use', 'refund-policy', 'verify/[token]']) {
  if (publication.includes(forbidden)) errors.push(`Publication resolver must exclude ${forbidden}.`);
}

const layout = read(paths.layout);
if (!layout.includes('metadataBase: new URL(canonicalOrigin)')) errors.push('Root metadata must define the canonical metadataBase.');

const managedMetadata = read(paths.managedMetadata);
for (const snippet of ['localizedAbsoluteUrl', 'languageAlternates', 'publishedLocales']) {
  if (!managedMetadata.includes(snippet)) errors.push(`Managed metadata missing: ${snippet}`);
}

const legalMetadata = read(paths.legalMetadata);
if (!legalMetadata.includes('robots: { index: false, follow: true }')) errors.push('Legal metadata must remain noindex, follow.');
if (legalMetadata.includes('languages:')) errors.push('Unapproved legal translations must not emit hreflang.');

const programmeMetadata = read(paths.programmeMetadata);
for (const snippet of ['languageAlternates', 'localizedAbsoluteUrl', 'entity.publishedLocales']) {
  if (!programmeMetadata.includes(snippet)) errors.push(`Programme metadata missing: ${snippet}`);
}

const proxy = read(paths.proxy);
for (const snippet of [
  "const localeAliases = { en: '', uk: '/ua', cs: '/cz' }",
  "'/human': '/programmes/psychology-human'",
  "'/tracks': '/programmes'",
  "'/works': '/about'",
  "'/termsofservice': '/terms-of-use'",
  "'/privacypolicy': '/privacy-policy'",
  "new Set(['/blog-en'])",
  "status: 410",
  "'X-Robots-Tag': 'noindex, nofollow'",
  "canonicalHostRedirect",
  "NextResponse.redirect(destination, 301)",
  "getProgrammeSlugRedirect",
]) if (!proxy.includes(snippet)) errors.push(`Proxy SEO contract missing: ${snippet}`);
if (/console\.(log|error|warn)/.test(proxy)) errors.push('Proxy must not log paths or verification tokens.');

const nextConfig = read(paths.nextConfig);
if (!nextConfig.includes('skipTrailingSlashRedirect: true')) errors.push('Next config must delegate trailing-slash normalization to the one-hop proxy redirect.');

if (existsSync('package.json')) {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.scripts?.['verify:qa-005:seo'] !== 'node scripts/verify-qa-005-seo.mjs') {
    errors.push('package.json must expose verify:qa-005:seo.');
  }
}

if (errors.length) {
  console.error('QA-005 SEO verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('QA-005 SEO static verification passed.');
