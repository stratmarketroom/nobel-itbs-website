import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProgrammeLanding } from '@/components/programme-landing';
import { isContentLocale } from '@/lib/content/localization';
import { isPrefixedLocale } from '@/lib/i18n';
import { getProgrammeNamespaceEntity } from '@/lib/programmes/landing';
import { programmeLandingMetadata } from '@/lib/programmes/landing-metadata';

type LocalizedProgrammeSlugPageProps = { params: Promise<{ locale: string; slug: string }> };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: LocalizedProgrammeSlugPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isPrefixedLocale(locale) || !isContentLocale(locale)) return {};
  const entity = await getProgrammeNamespaceEntity(slug, locale);
  return entity ? programmeLandingMetadata(entity, locale) : {};
}

export default async function LocalizedProgrammeSlugPage({ params }: LocalizedProgrammeSlugPageProps) {
  const { locale, slug } = await params;
  if (!isPrefixedLocale(locale) || !isContentLocale(locale)) notFound();
  const entity = await getProgrammeNamespaceEntity(slug, locale);
  if (!entity) notFound();
  return <ProgrammeLanding entity={entity} locale={locale} />;
}
