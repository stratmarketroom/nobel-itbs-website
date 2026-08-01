import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProgrammeDetail } from '@/components/programme-detail';
import { ProgrammeLandingPage } from '@/components/programme-landing-page';
import { ProgrammeMasterPage } from '@/components/programme-master-page';
import { programmeDetails, programmeLandingCopy } from '@/lib/i18n';
import { getProgrammeMasterPageCopy, isProgrammeMasterSlug, programmeMasterSlugs } from '@/lib/programme-master-copy';

type ProgrammePageProps = {
  params: Promise<{
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

export async function generateMetadata({ params }: ProgrammePageProps): Promise<Metadata> {
  const { slug } = await params;

  if (slug === 'ai-production') {
    return {
      title: 'AI Production, Mini-MBA | Nobel ITBS',
      description:
        'A six-month Mini-MBA programme on creating, launching and scaling expert products with marketing, sales and AI. 360 hours, 12 ECTS.',
    };
  }

  const landingCopy = programmeLandingCopy.en[slug];

  if (landingCopy) {
    return {
      title: `${landingCopy.hero.title} | Nobel ITBS`,
      description: landingCopy.hero.lead,
    };
  }

  if (isProgrammeMasterSlug(slug)) {
    const programmeCopy = getProgrammeMasterPageCopy('en', slug);

    return {
      title: `${programmeCopy.metadata.title} | Nobel ITBS`,
      description: programmeCopy.metadata.description,
    };
  }

  return {};
}

export function generateStaticParams() {
  return [{ slug: 'ai-production' }, ...landingSlugs.map((slug) => ({ slug })), ...programmeMasterSlugs.map((slug) => ({ slug }))];
}

export default async function ProgrammePage({ params }: ProgrammePageProps) {
  const { slug } = await params;
  const copy = programmeDetails.en[slug];

  if (copy) {
    return <ProgrammeDetail copy={copy} locale="en" />;
  }

  const landingCopy = programmeLandingCopy.en[slug];

  if (landingCopy) {
    return <ProgrammeLandingPage copy={landingCopy} locale="en" />;
  }

  if (isProgrammeMasterSlug(slug)) {
    return <ProgrammeMasterPage copy={getProgrammeMasterPageCopy('en', slug)} locale="en" />;
  }

  notFound();
}
