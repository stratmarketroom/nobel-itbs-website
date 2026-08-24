import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProgrammeCatalogue } from '@/components/programme-catalogue';
import { isContentLocale } from '@/lib/content/localization';
import { isPrefixedLocale } from '@/lib/i18n';
import { getProgrammeCatalogue } from '@/lib/programmes/catalogue';
import { programmeCatalogueCopy } from '@/lib/programmes/catalogue-copy';
import { languageAlternates, localizedAbsoluteUrl } from '@/lib/seo/urls';

type LocaleProgrammesPageProps = {
  params: Promise<{ locale: string }>;
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: LocaleProgrammesPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isPrefixedLocale(locale) || !isContentLocale(locale)) return {};

  const copy = programmeCatalogueCopy[locale];
  return {
    title: copy.seo.title,
    description: copy.seo.description,
    alternates: {
      canonical: localizedAbsoluteUrl(locale, '/programmes'),
      languages: languageAlternates('/programmes'),
    },
  };
}

export default async function LocaleProgrammesPage({ params }: LocaleProgrammesPageProps) {
  const { locale } = await params;
  if (!isPrefixedLocale(locale) || !isContentLocale(locale)) notFound();

  const catalogue = await getProgrammeCatalogue(locale);
  return <ProgrammeCatalogue locale={locale} programmes={catalogue.items} />;
}
