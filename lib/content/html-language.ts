export const htmlLanguages = ['en', 'uk', 'cs'] as const;

export type HtmlLanguage = (typeof htmlLanguages)[number];

export const htmlLanguageHeader = 'x-nobel-html-language';

export function htmlLanguageForPathname(pathname: string): HtmlLanguage {
  const firstSegment = pathname.split('/').filter(Boolean)[0];

  if (firstSegment === 'ua') return 'uk';
  if (firstSegment === 'cz') return 'cs';
  return 'en';
}

export function resolveHtmlLanguage(value: string | null | undefined): HtmlLanguage {
  return htmlLanguages.includes(value as HtmlLanguage) ? value as HtmlLanguage : 'en';
}
