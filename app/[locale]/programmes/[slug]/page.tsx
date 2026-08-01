import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProgrammeDetail } from '@/components/programme-detail';
import { ProgrammeLandingPage } from '@/components/programme-landing-page';
import { ProgrammeMasterPage } from '@/components/programme-master-page';
import { isPrefixedLocale, programmeDetails, programmeLandingCopy, type PrefixedLocale } from '@/lib/i18n';
import { getProgrammeMasterPageCopy, isProgrammeMasterSlug, programmeMasterSlugs } from '@/lib/programme-master-copy';

type LocaleProgrammePageProps = {
  params: Promise<{
    locale: string;
    slug: string;
  }>;
};

const landingSlugs = [
  'business-management',
  'technology-innovation',
  'psychology-human',
  'certificate-programme',
  'mini-mba',
  'professional-development-course',
];

export async function generateMetadata({ params }: LocaleProgrammePageProps): Promise<Metadata> {
  const { locale, slug } = await params;

  if (!isPrefixedLocale(locale)) {
    return {};
  }

  if (slug === 'ai-production') {
    if (locale === 'ua') {
      return {
        title: 'AI Production, Mini-MBA | Nobel ITBS',
        description:
          'Шестимісячна програма Mini-MBA про створення, запуск і масштабування експертних продуктів із маркетингом, продажами та AI. 360 годин, 12 ECTS.',
      };
    }

    if (locale === 'cz') {
      return {
        title: 'AI Production, Mini-MBA | Nobel ITBS',
        description:
          'Šestiměsíční program Mini-MBA o vytváření, uvádění na trh a škálování expertních produktů s marketingem, prodejem a AI. 360 hodin, 12 ECTS.',
      };
    }
  }

  const landingCopy = programmeLandingCopy[locale][slug];

  if (landingCopy) {
    return {
      title: `${landingCopy.hero.title} | Nobel ITBS`,
      description: landingCopy.hero.lead,
    };
  }

  if (isProgrammeMasterSlug(slug)) {
    const programmeCopy = getProgrammeMasterPageCopy(locale, slug);

    return {
      title: `${programmeCopy.metadata.title} | Nobel ITBS`,
      description: programmeCopy.metadata.description,
    };
  }

  return {};
}

export function generateStaticParams() {
  return [
    { locale: 'ua', slug: 'ai-production' },
    { locale: 'cz', slug: 'ai-production' },
    ...landingSlugs.flatMap((slug) => [
      { locale: 'ua', slug },
      { locale: 'cz', slug },
    ]),
    ...programmeMasterSlugs.flatMap((slug) => [
      { locale: 'ua', slug },
      { locale: 'cz', slug },
    ]),
  ];
}

export default async function LocaleProgrammePage({ params }: LocaleProgrammePageProps) {
  const { locale, slug } = await params;

  if (!isPrefixedLocale(locale)) {
    notFound();
  }

  const copy = programmeDetails[locale][slug];

  if (copy) {
    return <ProgrammeDetail copy={copy} locale={locale as PrefixedLocale} />;
  }

  const landingCopy = programmeLandingCopy[locale][slug];

  if (landingCopy) {
    return <ProgrammeLandingPage copy={landingCopy} locale={locale as PrefixedLocale} />;
  }

  if (isProgrammeMasterSlug(slug)) {
    return <ProgrammeMasterPage copy={getProgrammeMasterPageCopy(locale, slug)} locale={locale as PrefixedLocale} />;
  }

  notFound();
}
