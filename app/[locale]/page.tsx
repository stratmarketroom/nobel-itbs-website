import { notFound } from 'next/navigation';
import { ContentManagedHome } from '@/components/content-managed-home';
import { isContentLocale } from '@/lib/content/localization';
import { getStructuredContentPage } from '@/lib/content/pages';
import { managedPageMetadata } from '@/lib/content/page-metadata';
import { getProgrammeCatalogue } from '@/lib/programmes/catalogue';

type Props = { params: Promise<{ locale: string }> };
export function generateStaticParams() { return [{ locale: 'ua' }, { locale: 'cz' }]; }
async function data(props: Props) {
  const { locale } = await props.params;
  if (!isContentLocale(locale) || locale === 'en') notFound();
  const [page, catalogue] = await Promise.all([getStructuredContentPage('home', locale), getProgrammeCatalogue(locale)]);
  return { locale, page, programmes: catalogue.items };
}
export async function generateMetadata(props: Props) { const { page } = await data(props); return page ? managedPageMetadata(page) : {}; }
export default async function LocaleHomePage(props: Props) {
  const { locale, page, programmes } = await data(props);
  if (!page) notFound();
  return <ContentManagedHome page={page} locale={locale} programmes={programmes} />;
}
