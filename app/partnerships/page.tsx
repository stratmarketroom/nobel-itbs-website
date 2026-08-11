import { notFound } from 'next/navigation';
import { ManagedContentPage } from '@/components/managed-content-page';
import { getStructuredContentPage } from '@/lib/content/pages';
import { managedPageMetadata } from '@/lib/content/page-metadata';
import { getPublicExperts } from '@/lib/experts/public';
import { getPublicPartners } from '@/lib/partners/public';

export const dynamic = 'force-dynamic';
export async function generateMetadata() { const page = await getStructuredContentPage('partnerships', 'en'); return page ? managedPageMetadata(page) : {}; }
export default async function PartnershipsPage() {
  const [page, partners, experts] = await Promise.all([getStructuredContentPage('partnerships', 'en'), getPublicPartners('en'), getPublicExperts('en')]);
  if (!page) notFound();
  return <ManagedContentPage page={page} locale="en" partners={partners.items} experts={experts.items} />;
}
