import { notFound } from 'next/navigation';
import { PublicShell } from '@/components/public-shell';
import { getStructuredContentPage } from '@/lib/content/pages';
import { managedPageMetadata } from '@/lib/content/page-metadata';
import { getPublicPartners } from '@/lib/partners/public';
import { getProgrammeCatalogue } from '@/lib/programmes/catalogue';

export const dynamic = 'force-dynamic';
export async function generateMetadata() { const page = await getStructuredContentPage('home', 'en'); return page ? managedPageMetadata(page) : {}; }
export default async function HomePage() {
  const [page, programmes, partners] = await Promise.all([
    getStructuredContentPage('home', 'en'),
    getProgrammeCatalogue('en'),
    getPublicPartners('en'),
  ]);
  if (!page) notFound();
  return <PublicShell page={page} locale="en" programmes={programmes.items} partners={partners.items} />;
}
