import { notFound } from 'next/navigation';
import { ManagedContentPage } from '@/components/managed-content-page';
import { getStructuredContentPage } from '@/lib/content/pages';
import { managedPageMetadata } from '@/lib/content/page-metadata';
import { getForOrganisationsApplicationUrl } from '@/lib/content/site-settings';

export async function generateMetadata() { const page = await getStructuredContentPage('for_organisations', 'en'); return page ? managedPageMetadata(page, 'en') : {}; }
export default async function ForOrganisationsPage() { const [page, primaryHrefOverride] = await Promise.all([getStructuredContentPage('for_organisations', 'en'), getForOrganisationsApplicationUrl()]); if (!page) notFound(); return <ManagedContentPage page={page} locale="en" primaryHrefOverride={primaryHrefOverride} />; }
