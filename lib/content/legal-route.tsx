import { notFound } from 'next/navigation';
import { LegalContentPage } from '@/components/legal-content-page';
import type { ContentLocale } from './localization';
import { getStructuredContentPage } from './pages';
import { legalMetadata, type LegalPageKey } from './legal-pages';

export async function renderLegalPage(pageKey: LegalPageKey, locale: ContentLocale) {
  const page = await getStructuredContentPage(pageKey, locale);
  if (!page) notFound();
  return <LegalContentPage page={page} locale={locale} />;
}
export async function renderLegalMetadata(pageKey: LegalPageKey, locale: ContentLocale) {
  const page = await getStructuredContentPage(pageKey, locale);
  return page ? legalMetadata(page) : {};
}
