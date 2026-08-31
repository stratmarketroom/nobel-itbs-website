import type { Metadata } from 'next';
import type { ContentLocale } from '@/lib/content/localization';
import { createSocialMetadata, getProgrammeSocialAlt, programmeSocialImagePath } from '@/lib/seo/social';
import { languageAlternates, localizedAbsoluteUrl } from '@/lib/seo/urls';
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
    ...createSocialMetadata({
      title: entity.seo.ogTitle,
      description: entity.seo.ogDescription,
      canonical,
      locale: entity.renderedLocale,
      imagePath: programmeSocialImagePath(entity),
      imageAlt: getProgrammeSocialAlt(entity.renderedLocale, entity.title),
      publishedLocales: entity.publishedLocales,
    }),
  };
}
