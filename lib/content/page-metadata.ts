import type { Metadata } from 'next';
import type { ContentLocale } from './localization';
import { contentLocalePrefixes } from './localization';
import type { ContentPageKey, StructuredContentPage } from './pages';

const paths: Record<ContentPageKey, string> = {
  home: '', about: '/about', partnerships: '/partnerships', for_organisations: '/for-organisations',
};

export function managedPageMetadata(page: StructuredContentPage): Metadata {
  const path = paths[page.pageKey];
  const languageUrls = Object.fromEntries((['en', 'ua', 'cz'] as ContentLocale[]).map((locale) => [locale, `${contentLocalePrefixes[locale]}${path}` || '/']));
  return {
    title: page.seoTitle,
    description: page.seoDescription,
    alternates: { canonical: `${contentLocalePrefixes[page.renderedLocale]}${path}` || '/', languages: languageUrls },
  };
}
