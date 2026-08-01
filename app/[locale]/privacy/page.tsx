import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { LegalPage } from '@/components/legal-page';
import { isPrefixedLocale, type PrefixedLocale } from '@/lib/i18n';
import { getLegalPageCopy } from '@/lib/legal-content';

type LocaleLegalPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: LocaleLegalPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (locale === 'ua') {
    return {
      title: 'Політика конфіденційності | Nobel ITBS',
      description: 'Як Nobel ITBS обробляє та захищає персональні дані.',
      robots: { index: false, follow: true },
    };
  }

  if (locale === 'cz') {
    return {
      title: 'Zásady ochrany osobních údajů | Nobel ITBS',
      description: 'Jak Nobel ITBS zpracovává a chrání osobní údaje.',
      robots: { index: false, follow: true },
    };
  }

  return {};
}

export function generateStaticParams() {
  return [{ locale: 'ua' }, { locale: 'cz' }];
}

export default async function LocalePrivacyPage({ params }: LocaleLegalPageProps) {
  const { locale } = await params;

  if (!isPrefixedLocale(locale)) {
    notFound();
  }

  return <LegalPage copy={getLegalPageCopy(locale, 'privacy')} locale={locale as PrefixedLocale} />;
}
