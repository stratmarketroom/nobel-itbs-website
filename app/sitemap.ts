import type { MetadataRoute } from 'next';
import type { ContentLocale } from '@/lib/content/localization';
import { getSitemapPublication } from '@/lib/seo/publication';
import { languageAlternates, localizedAbsoluteUrl } from '@/lib/seo/urls';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const publication = await getSitemapPublication();

  return publication.flatMap((entity) => {
    const languages = languageAlternates(entity.path, entity.publishedLocales);
    return entity.publishedLocales.map((locale: ContentLocale) => ({
      url: localizedAbsoluteUrl(locale, entity.path),
      alternates: { languages },
    }));
  });
}
