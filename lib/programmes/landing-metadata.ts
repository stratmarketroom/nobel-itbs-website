import type { Metadata } from 'next';
import type { ContentLocale } from '@/lib/content/localization';
import { languageAlternates, localizedAbsoluteUrl, seoLocaleConfig } from '@/lib/seo/urls';
import type { ProgrammeNamespaceEntity } from './landing-types';

function path(locale: ContentLocale, slug: string): string {
  return localizedAbsoluteUrl(locale, `/programmes/${slug}`);
}

export function programmeLandingMetadata(entity: ProgrammeNamespaceEntity, requestedLocale: ContentLocale): Metadata {
  const usesRequestedTranslation = entity.renderedLocale === requestedLocale;
  const canonical = path(usesRequestedTranslation ? requestedLocale : 'en', entity.slug);
  const languages = languageAlternates(
    `/programmes/${entity.slug}`,
    entity.publishedLocales,
  );

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
      locale: seoLocaleConfig[entity.renderedLocale].openGraphLocale,
      alternateLocale: (['en', 'ua', 'cz'] as const)
        .filter((locale) => locale !== entity.renderedLocale)
        .map((locale) => seoLocaleConfig[locale].openGraphLocale),
    },
  };
}
