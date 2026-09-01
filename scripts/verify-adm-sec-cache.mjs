import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const proxyPath = 'proxy.ts';
const packagePath = 'package.json';
const adminApiRoot = 'app/api/v1/admin';
const errors = [];

for (const path of [proxyPath, packagePath, adminApiRoot]) {
  if (!existsSync(path)) errors.push(`Missing required ADM-SEC-CACHE path: ${path}`);
}

const proxy = existsSync(proxyPath) ? readFileSync(proxyPath, 'utf8') : '';
const requiredProxySnippets = [
  "const adminApiCacheControl = 'private, no-store, max-age=0, must-revalidate'",
  "const privateCdnCacheControl = 'no-store'",
  "pathname === '/api/v1/admin' || pathname.startsWith('/api/v1/admin/')",
  "response.headers.set('Cache-Control', adminApiCacheControl)",
  "response.headers.set('CDN-Cache-Control', privateCdnCacheControl)",
  "response.headers.set('Vercel-CDN-Cache-Control', privateCdnCacheControl)",
  'protectAdminApiResponse(hostRedirect)',
  'protectAdminApiResponse(response)',
  'protectAdminApiResponse(nextWithoutPublicDiscovery(request))',
];

for (const snippet of requiredProxySnippets) {
  if (!proxy.includes(snippet)) errors.push(`Admin API cache boundary is missing: ${snippet}`);
}

const adminBranch = proxy.indexOf('if (isAdminApiPath(pathname))');
const genericApiBranch = proxy.indexOf("pathname.startsWith('/api')");
if (adminBranch === -1 || genericApiBranch === -1 || adminBranch > genericApiBranch) {
  errors.push('The specific admin API privacy branch must run before the generic API discovery boundary.');
}

if (!proxy.includes("const publicPageCacheControl = 'max-age=300, stale-while-revalidate=3600'")) {
  errors.push('Public page cache policy must remain unchanged.');
}

function routeFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return routeFiles(path);
    return entry.isFile() && entry.name === 'route.ts' ? [path] : [];
  });
}

const adminRoutes = routeFiles(adminApiRoot);
if (adminRoutes.length === 0) errors.push('No admin API routes were found for cache-policy coverage.');

const unsafeCachePattern = /['"]Cache-Control['"]\s*:\s*['"][^'"]*(?:public|s-maxage)/i;
for (const path of adminRoutes) {
  const source = readFileSync(path, 'utf8');
  if (unsafeCachePattern.test(source)) errors.push(`Admin API route declares a cacheable response: ${path}`);
}

if (existsSync(packagePath)) {
  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
  if (pkg.scripts?.['verify:adm-sec-cache'] !== 'node scripts/verify-adm-sec-cache.mjs') {
    errors.push('package.json must expose verify:adm-sec-cache.');
  }
}

if (errors.length) {
  console.error('ADM-SEC-CACHE verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`ADM-SEC-CACHE verification passed for ${adminRoutes.length} admin API route files.`);
