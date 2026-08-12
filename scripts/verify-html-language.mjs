import { existsSync, readFileSync } from 'node:fs';

const files = ['proxy.ts', 'app/layout.tsx', 'lib/content/html-language.ts'];
const errors = files.filter((file) => !existsSync(file)).map((file) => `Missing ${file}`);
const proxy = existsSync(files[0]) ? readFileSync(files[0], 'utf8') : '';
const layout = existsSync(files[1]) ? readFileSync(files[1], 'utf8') : '';
const language = existsSync(files[2]) ? readFileSync(files[2], 'utf8') : '';

for (const expected of [
  "firstSegment === 'ua') return 'uk'",
  "firstSegment === 'cz') return 'cs'",
  "return 'en'",
]) {
  if (!language.includes(expected)) errors.push(`HTML language resolver missing: ${expected}`);
}

if (!proxy.includes('htmlLanguageForPathname(request.nextUrl.pathname)')) {
  errors.push('Proxy must derive the HTML language from the requested pathname.');
}
if (!proxy.includes('request: {') || !proxy.includes('headers: requestHeaders')) {
  errors.push('Proxy must forward the locale as an upstream request header.');
}
for (const preservedRule of ['programmeSlugPath', 'getProgrammeSlugRedirect', "NextResponse.rewrite(new URL('/404'", "pathname.startsWith('/api')"]) {
  if (!proxy.includes(preservedRule)) errors.push(`Existing proxy rule was not preserved: ${preservedRule}`);
}
if (!layout.includes('resolveHtmlLanguage(requestHeaders.get(htmlLanguageHeader))')) {
  errors.push('Root layout must read and validate the HTML language header.');
}
if (!layout.includes('<html lang={htmlLanguage}>')) {
  errors.push('Root layout must render the resolved HTML language.');
}

if (errors.length) {
  console.error('HTML language verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('HTML language verification passed.');
