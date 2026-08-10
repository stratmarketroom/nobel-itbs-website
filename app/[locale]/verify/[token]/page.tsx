import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicVerification } from '@/components/public-verification';
import { isContentLocale } from '@/lib/content/localization';
import { verificationCopy } from '@/lib/credentials/verification-copy';
import { isPrefixedLocale } from '@/lib/i18n';

type Props = { params: Promise<{ locale: string; token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isPrefixedLocale(locale) || !isContentLocale(locale)) return {};
  return {
    title: verificationCopy[locale].seo.title,
    robots: { index: false, follow: false },
    alternates: { canonical: `/${locale}/verify` },
  };
}

export default async function LocaleTokenVerifyPage({ params }: Props) {
  const { locale, token } = await params;
  if (!isPrefixedLocale(locale) || !isContentLocale(locale)) notFound();
  return <PublicVerification locale={locale} token={token} />;
}
