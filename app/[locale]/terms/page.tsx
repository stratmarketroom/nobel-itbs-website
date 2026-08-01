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
      title: 'Умови використання | Nobel ITBS',
      description: 'Умови придбання та використання онлайн-освітніх програм Nobel ITBS.',
      robots: { index: false, follow: true },
    };
  }

  if (locale === 'cz') {
    return {
      title: 'Podmínky používání | Nobel ITBS',
      description: 'Podmínky nákupu a používání online vzdělávacích programů Nobel ITBS.',
      robots: { index: false, follow: true },
    };
  }

  return {};
}

export function generateStaticParams() {
  return [{ locale: 'ua' }, { locale: 'cz' }];
}

export default async function LocaleTermsPage({ params }: LocaleLegalPageProps) {
  const { locale } = await params;

  if (!isPrefixedLocale(locale)) {
    notFound();
  }

  return <LegalPage copy={getLegalPageCopy(locale, 'terms')} locale={locale as PrefixedLocale} />;
}
