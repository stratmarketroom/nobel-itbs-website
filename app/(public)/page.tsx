import { notFound } from 'next/navigation';
import { ContentManagedHome } from '@/components/content-managed-home';
import { getStructuredContentPage } from '@/lib/content/pages';
import { managedPageMetadata } from '@/lib/content/page-metadata';
import { getProgrammeCatalogue } from '@/lib/programmes/catalogue';

export async function generateMetadata() { const page = await getStructuredContentPage('home', 'en'); return page ? managedPageMetadata(page, 'en') : {}; }
export default async function HomePage() {
  const [page, catalogue] = await Promise.all([getStructuredContentPage('home', 'en'), getProgrammeCatalogue('en')]);
  if (!page) notFound();
  return <ContentManagedHome page={page} locale="en" programmes={catalogue.items} />;
}
