import type { Metadata } from 'next';
import { PartnershipsPage } from '@/components/partnerships-page';
import { getPublicExperts } from '@/lib/experts/public';
import { getPublicPartners } from '@/lib/partners/public';
import { getSeedPartnershipsPage } from '@/lib/partnerships/seed';

const content = getSeedPartnershipsPage('en');

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: content.seo.title,
  description: content.seo.description,
  openGraph: { title: content.seo.ogTitle, description: content.seo.ogDescription },
  alternates: {
    canonical: '/partnerships',
    languages: { en: '/partnerships', uk: '/ua/partnerships', cs: '/cz/partnerships' },
  },
};

export default async function PartnershipsRoute() {
  const [partners, experts] = await Promise.all([getPublicPartners('en'), getPublicExperts('en')]);
  return <PartnershipsPage content={content} partners={partners.items} experts={experts.items} />;
}
