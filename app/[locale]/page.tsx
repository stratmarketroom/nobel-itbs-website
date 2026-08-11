import { notFound } from 'next/navigation';
import { ManagedContentPage } from '@/components/managed-content-page';
import { isContentLocale } from '@/lib/content/localization';
import { getStructuredContentPage } from '@/lib/content/pages';
import { managedPageMetadata } from '@/lib/content/page-metadata';

type Props = { params: Promise<{ locale: string }> };
export function generateStaticParams() { return [{ locale: 'ua' }, { locale: 'cz' }]; }
async function data(props: Props) { const { locale } = await props.params; if (!isContentLocale(locale) || locale === 'en') notFound(); return { locale, page: await getStructuredContentPage('home', locale) }; }
export async function generateMetadata(props: Props) { const { page } = await data(props); return page ? managedPageMetadata(page) : {}; }
export default async function LocaleHomePage(props: Props) { const { locale, page } = await data(props); if (!page) notFound(); return <ManagedContentPage page={page} locale={locale} />; }
