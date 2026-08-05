import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PartnershipsPage } from '@/components/partnerships-page';
import { isContentLocale } from '@/lib/content/localization';
import { getPublicExperts } from '@/lib/experts/public';
import { isPrefixedLocale } from '@/lib/i18n';
import { getPublicPartners } from '@/lib/partners/public';
import { getSeedPartnershipsPage } from '@/lib/partnerships/seed';

type LocalizedPartnershipsProps = { params: Promise<{ locale: string }> };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: LocalizedPartnershipsProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isPrefixedLocale(locale) || !isContentLocale(locale)) return {};
  const content = getSeedPartnershipsPage(locale);
  return {
    title: content.seo.title,
    description: content.seo.description,
    openGraph: { title: content.seo.ogTitle, description: content.seo.ogDescription },
    alternates: {
      canonical: `/${locale}/partnerships`,
      languages: { en: '/partnerships', uk: '/ua/partnerships', cs: '/cz/partnerships' },
    },
  };
}

export default async function LocalizedPartnershipsRoute({ params }: LocalizedPartnershipsProps) {
  const { locale } = await params;
  if (!isPrefixedLocale(locale) || !isContentLocale(locale)) notFound();
  const content = getSeedPartnershipsPage(locale);
  const [partners, experts] = await Promise.all([getPublicPartners(locale), getPublicExperts(locale)]);
  return <PartnershipsPage content={content} partners={partners.items} experts={experts.items} />;
}
