import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicVerification } from '@/components/public-verification';
import { isContentLocale } from '@/lib/content/localization';
import { verificationCopy } from '@/lib/credentials/verification-copy';
import { isPrefixedLocale } from '@/lib/i18n';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isPrefixedLocale(locale) || !isContentLocale(locale)) return {};
  const copy = verificationCopy[locale];
  return {
    title: copy.seo.title,
    description: copy.seo.description,
    openGraph: { title: copy.seo.ogTitle, description: copy.seo.ogDescription },
    alternates: { canonical: `/${locale}/verify`, languages: { en: '/verify', uk: '/ua/verify', cs: '/cz/verify' } },
  };
}

export default async function LocaleVerifyPage({ params }: Props) {
  const { locale } = await params;
  if (!isPrefixedLocale(locale) || !isContentLocale(locale)) notFound();
  return <PublicVerification locale={locale} />;
}
