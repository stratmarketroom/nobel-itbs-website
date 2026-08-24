import type { ContentLocale } from '@/lib/content/localization';

export const canonicalOrigin = 'https://nobel-itbs.eu';
export const canonicalHost = 'nobel-itbs.eu';

export const seoLocaleConfig: Record<ContentLocale, {
  pathPrefix: string;
  hreflang: 'en' | 'uk' | 'cs';
  htmlLanguage: 'en' | 'uk' | 'cs';
  openGraphLocale: 'en_GB' | 'uk_UA' | 'cs_CZ';
}> = {
  en: { pathPrefix: '', hreflang: 'en', htmlLanguage: 'en', openGraphLocale: 'en_GB' },
  ua: { pathPrefix: '/ua', hreflang: 'uk', htmlLanguage: 'uk', openGraphLocale: 'uk_UA' },
  cz: { pathPrefix: '/cz', hreflang: 'cs', htmlLanguage: 'cs', openGraphLocale: 'cs_CZ' },
};

export function normalizePublicPath(path: string): string {
  const withLeadingSlash = path.startsWith('/') ? path : `/${path}`;
  if (withLeadingSlash === '/') return '/';
  return withLeadingSlash.replace(/\/+$/, '') || '/';
}

export function localizedPublicPath(locale: ContentLocale, path: string): string {
  const normalized = normalizePublicPath(path);
  const prefix = seoLocaleConfig[locale].pathPrefix;
  return normalized === '/' ? prefix || '/' : `${prefix}${normalized}`;
}

export function absolutePublicUrl(path: string): string {
  return new URL(normalizePublicPath(path), canonicalOrigin).toString();
}

export function localizedAbsoluteUrl(locale: ContentLocale, path: string): string {
  return absolutePublicUrl(localizedPublicPath(locale, path));
}

export function languageAlternates(
  path: string,
  locales: readonly ContentLocale[] = ['en', 'ua', 'cz'],
): Record<string, string> {
  const alternates = Object.fromEntries(locales.map((locale) => [
    seoLocaleConfig[locale].hreflang,
    localizedAbsoluteUrl(locale, path),
  ]));

  if (locales.includes('en')) alternates['x-default'] = localizedAbsoluteUrl('en', path);
  return alternates;
}
