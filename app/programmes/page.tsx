import type { Metadata } from 'next';
import { ProgrammeCatalogue } from '@/components/programme-catalogue';
import { getProgrammeCatalogue } from '@/lib/programmes/catalogue';
import { programmeCatalogueCopy } from '@/lib/programmes/catalogue-copy';
import { createSocialMetadata, getCatalogueSocialAlt, socialImagePaths } from '@/lib/seo/social';
import { languageAlternates, localizedAbsoluteUrl } from '@/lib/seo/urls';

export const dynamic = 'force-dynamic';

const canonical = localizedAbsoluteUrl('en', '/programmes');
const copy = programmeCatalogueCopy.en;

export const metadata: Metadata = {
  title: copy.seo.title,
  description: copy.seo.description,
  ...createSocialMetadata({
    title: copy.seo.ogTitle,
    description: copy.seo.ogDescription,
    canonical,
    locale: 'en',
    imagePath: socialImagePaths.catalogue,
    imageAlt: getCatalogueSocialAlt('en'),
  }),
  alternates: {
    canonical,
    languages: languageAlternates('/programmes'),
  },
};

export default async function ProgrammesPage() {
  const catalogue = await getProgrammeCatalogue('en');
  return <ProgrammeCatalogue locale="en" programmes={catalogue.items} />;
}
