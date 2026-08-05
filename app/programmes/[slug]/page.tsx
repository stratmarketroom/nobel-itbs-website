import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProgrammeLanding } from '@/components/programme-landing';
import { getProgrammeNamespaceEntity } from '@/lib/programmes/landing';
import { programmeLandingMetadata } from '@/lib/programmes/landing-metadata';

type ProgrammeSlugPageProps = { params: Promise<{ slug: string }> };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: ProgrammeSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  const entity = await getProgrammeNamespaceEntity(slug, 'en');
  return entity ? programmeLandingMetadata(entity, 'en') : {};
}

export default async function ProgrammeSlugPage({ params }: ProgrammeSlugPageProps) {
  const { slug } = await params;
  const entity = await getProgrammeNamespaceEntity(slug, 'en');
  if (!entity) notFound();
  return <ProgrammeLanding entity={entity} locale="en" />;
}
