import { notFound } from 'next/navigation';
import { ManagedContentPage } from '@/components/managed-content-page';
import { getStructuredContentPage } from '@/lib/content/pages';
import { managedPageMetadata } from '@/lib/content/page-metadata';

export async function generateMetadata() { const page = await getStructuredContentPage('for_organisations', 'en'); return page ? managedPageMetadata(page) : {}; }
export default async function ForOrganisationsPage() { const page = await getStructuredContentPage('for_organisations', 'en'); if (!page) notFound(); return <ManagedContentPage page={page} locale="en" />; }
