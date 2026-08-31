import { notFound } from 'next/navigation';
import { ManagedContentPage } from '@/components/managed-content-page';
import { isContentLocale } from '@/lib/content/localization';
import { getStructuredContentPage } from '@/lib/content/pages';
import { managedPageMetadata } from '@/lib/content/page-metadata';
import { getPublicExperts } from '@/lib/experts/public';
import { getPublicPartners } from '@/lib/partners/public';

type Props = { params: Promise<{ locale: string }> };
export const dynamic = 'force-dynamic';
async function data(props: Props) { const { locale } = await props.params; if (!isContentLocale(locale) || locale === 'en') notFound(); const [page, partners, experts] = await Promise.all([getStructuredContentPage('partnerships', locale), getPublicPartners(locale), getPublicExperts(locale)]); return { locale, page, partners, experts }; }
export async function generateMetadata(props: Props) { const { locale, page } = await data(props); return page ? managedPageMetadata(page, locale) : {}; }
export default async function PartnershipsPage(props: Props) { const { locale, page, partners, experts } = await data(props); if (!page) notFound(); return <ManagedContentPage page={page} locale={locale} partners={partners.items} experts={experts.items} />; }
