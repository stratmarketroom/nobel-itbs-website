import { notFound } from 'next/navigation';
import { PublicShell } from '@/components/public-shell';
import { isContentLocale } from '@/lib/content/localization';
import { getStructuredContentPage } from '@/lib/content/pages';
import { managedPageMetadata } from '@/lib/content/page-metadata';
import { getPublicPartners } from '@/lib/partners/public';
import { getProgrammeCatalogue } from '@/lib/programmes/catalogue';

type Props = { params: Promise<{ locale: string }> };
export const dynamic = 'force-dynamic';
export function generateStaticParams() { return [{ locale: 'ua' }, { locale: 'cz' }]; }
async function data(props: Props) { const { locale } = await props.params; if (!isContentLocale(locale) || locale === 'en') notFound(); return { locale, page: await getStructuredContentPage('home', locale) }; }
export async function generateMetadata(props: Props) { const { page } = await data(props); return page ? managedPageMetadata(page) : {}; }
export default async function LocaleHomePage(props: Props) {
  const { locale, page } = await data(props);
  if (!page) notFound();
  const [programmes, partners] = await Promise.all([getProgrammeCatalogue(locale), getPublicPartners(locale)]);
  return <PublicShell page={page} locale={locale} programmes={programmes.items} partners={partners.items} />;
}
