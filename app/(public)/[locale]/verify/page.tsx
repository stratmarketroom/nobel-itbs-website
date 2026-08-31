import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicVerification } from '@/components/public-verification';
import { isContentLocale } from '@/lib/content/localization';
import { verificationCopy } from '@/lib/credentials/verification-copy';
import { isPrefixedLocale } from '@/lib/i18n';
import { createSocialMetadata, getVerificationSocialAlt, socialImagePaths } from '@/lib/seo/social';
import { languageAlternates, localizedAbsoluteUrl } from '@/lib/seo/urls';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ documentNumber?: string | string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isPrefixedLocale(locale) || !isContentLocale(locale)) return {};
  const copy = verificationCopy[locale];
  const canonical = localizedAbsoluteUrl(locale, '/verify');
  return {
    title: copy.seo.title,
    description: copy.seo.description,
    ...createSocialMetadata({
      title: copy.seo.ogTitle,
      description: copy.seo.ogDescription,
      canonical,
      locale,
      imagePath: socialImagePaths.verify,
      imageAlt: getVerificationSocialAlt(locale),
    }),
    alternates: { canonical, languages: languageAlternates('/verify') },
  };
}

export default async function LocaleVerifyPage({ params, searchParams }: Props) {
  const { locale } = await params;
  if (!isPrefixedLocale(locale) || !isContentLocale(locale)) notFound();
  const value = (await searchParams).documentNumber;
  return <PublicVerification locale={locale} initialDocumentNumber={Array.isArray(value) ? value[0] : value} />;
}
