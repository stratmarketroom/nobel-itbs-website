import type { Metadata } from 'next';
import { ProgrammeCatalogue } from '@/components/programme-catalogue';
import { getProgrammeCatalogue } from '@/lib/programmes/catalogue';
import { programmeCatalogueCopy } from '@/lib/programmes/catalogue-copy';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: programmeCatalogueCopy.en.seo.title,
  description: programmeCatalogueCopy.en.seo.description,
  alternates: {
    canonical: '/programmes',
    languages: {
      en: '/programmes',
      uk: '/ua/programmes',
      cs: '/cz/programmes',
    },
  },
};

export default async function ProgrammesPage() {
  const catalogue = await getProgrammeCatalogue('en');
  return <ProgrammeCatalogue locale="en" programmes={catalogue.items} />;
}
