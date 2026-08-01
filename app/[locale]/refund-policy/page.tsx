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
      title: 'Політика повернення коштів | Nobel ITBS',
      description: 'Правила відмови, розгляду скарг і повернення коштів за онлайн-програми Nobel ITBS.',
      robots: { index: false, follow: true },
    };
  }

  if (locale === 'cz') {
    return {
      title: 'Podmínky vrácení peněz | Nobel ITBS',
      description: 'Pravidla odstoupení, reklamací a vrácení peněz za online programy Nobel ITBS.',
      robots: { index: false, follow: true },
    };
  }

  return {};
}

export function generateStaticParams() {
  return [{ locale: 'ua' }, { locale: 'cz' }];
}

export default async function LocaleRefundPolicyPage({ params }: LocaleLegalPageProps) {
  const { locale } = await params;

  if (!isPrefixedLocale(locale)) {
    notFound();
  }

  return <LegalPage copy={getLegalPageCopy(locale, 'refund-policy')} locale={locale as PrefixedLocale} />;
}
