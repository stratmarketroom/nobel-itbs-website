import type { Metadata } from 'next';
import { OrganisationsPage } from '@/components/organisations-page';
import { organisationsCopy } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Education Infrastructure for Online Schools | Nobel ITBS',
  description:
    'Nobel ITBS infrastructure services for online schools and experts: programme structuring, documents and supplements, registration and verification.',
  openGraph: {
    title: 'Nobel ITBS Infrastructure for Educational Projects',
    description: 'Turn an original programme into a structured educational product with a considered model for documents, registration and verification.',
  },
};

export default function OrganisationsRoute() {
  return <OrganisationsPage copy={organisationsCopy.en} locale="en" />;
}
