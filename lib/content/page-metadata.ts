import type { Metadata } from 'next';
import type { ContentLocale } from './localization';
import type { ContentPageKey, StructuredContentPage } from './pages';
import { languageAlternates, localizedAbsoluteUrl } from '@/lib/seo/urls';

const paths: Record<ContentPageKey, string> = {
  home: '', about: '/about', partnerships: '/partnerships', for_organisations: '/for-organisations',
  privacy_policy: '/privacy-policy', terms_of_use: '/terms-of-use', refund_policy: '/refund-policy',
};

export function managedPageMetadata(page: StructuredContentPage, requestedLocale: ContentLocale): Metadata {
  const path = paths[page.pageKey];
  const locales = page.publishedLocales.filter((locale) => locale !== requestedLocale || page.renderedLocale === requestedLocale);
  return {
    title: page.seoTitle,
    description: page.seoDescription,
    alternates: {
      canonical: localizedAbsoluteUrl(page.renderedLocale, path || '/'),
      languages: languageAlternates(path || '/', locales),
    },
  };
}
