export const contentLocales = ['en', 'ua', 'cz'] as const;
export const translationStatuses = ['missing', 'draft', 'published'] as const;

export type ContentLocale = (typeof contentLocales)[number];
export type TranslationStatus = (typeof translationStatuses)[number];

export const defaultContentLocale: ContentLocale = 'en';

export const contentLocalePrefixes: Record<ContentLocale, string> = {
  en: '',
  ua: '/ua',
  cz: '/cz',
};

export function isContentLocale(value: string): value is ContentLocale {
  return contentLocales.includes(value as ContentLocale);
}

export function resolveContentLocale(value: string | null | undefined): ContentLocale {
  return value && isContentLocale(value) ? value : defaultContentLocale;
}

export function localizePublicPath(locale: ContentLocale, path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${contentLocalePrefixes[locale]}${normalizedPath}` || '/';
}

type LocalizedRecord = {
  languageCode: ContentLocale;
  translationStatus: TranslationStatus;
};

export function selectPublishedTranslation<T extends LocalizedRecord>(
  translations: readonly T[],
  requestedLocale: ContentLocale,
): T | null {
  const requestedTranslation = translations.find(
    (translation) =>
      translation.languageCode === requestedLocale && translation.translationStatus === 'published',
  );

  if (requestedTranslation) {
    return requestedTranslation;
  }

  return (
    translations.find(
      (translation) =>
        translation.languageCode === defaultContentLocale && translation.translationStatus === 'published',
    ) ?? null
  );
}
