import { notFound } from 'next/navigation';
import { ManagedContentPage } from '@/components/managed-content-page';
import { getStructuredContentPage } from '@/lib/content/pages';
import { managedPageMetadata } from '@/lib/content/page-metadata';

export async function generateMetadata() {
  const page = await getStructuredContentPage('about', 'en');
  return page ? managedPageMetadata(page) : {};
}
export default async function AboutPage() {
  const page = await getStructuredContentPage('about', 'en');
  if (!page) notFound();
  return <ManagedContentPage page={page} locale="en" />;
}
