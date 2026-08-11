import type { Metadata } from 'next';
import type { ContentLocale } from '@/lib/content/localization';
import type { ProgrammeNamespaceEntity } from './landing-types';

const origin = 'https://nobel-itbs.eu';
const hrefLocale: Record<ContentLocale, string> = { en: 'en_GB', ua: 'uk_UA', cz: 'cs_CZ' };

function path(locale: ContentLocale, slug: string): string {
  const prefix = locale === 'en' ? '' : `/${locale}`;
  return `${origin}${prefix}/programmes/${slug}`;
}

export function programmeLandingMetadata(entity: ProgrammeNamespaceEntity, requestedLocale: ContentLocale): Metadata {
  const usesRequestedTranslation = entity.renderedLocale === requestedLocale;
  const canonical = path(usesRequestedTranslation ? requestedLocale : 'en', entity.slug);
  const languages = usesRequestedTranslation ? {
    en: path('en', entity.slug),
    uk: path('ua', entity.slug),
    cs: path('cz', entity.slug),
    'x-default': path('en', entity.slug),
  } : {
    en: path('en', entity.slug),
    'x-default': path('en', entity.slug),
  };

  return {
    title: entity.seo.title,
    description: entity.seo.description,
    alternates: { canonical, languages },
    openGraph: {
      type: 'website',
      url: canonical,
      title: entity.seo.ogTitle,
      description: entity.seo.ogDescription,
      siteName: 'Nobel ITBS',
      locale: hrefLocale[entity.renderedLocale],
      alternateLocale: (['en', 'ua', 'cz'] as const)
        .filter((locale) => locale !== entity.renderedLocale)
        .map((locale) => hrefLocale[locale]),
    },
  };
}
