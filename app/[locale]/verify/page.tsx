import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isPrefixedLocale, verifyCopy, type PrefixedLocale } from '@/lib/i18n';
import { VerifyPage } from '@/components/verify-page';

type LocaleVerifyPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return [{ locale: 'ua' }, { locale: 'cz' }];
}

export async function generateMetadata({ params }: LocaleVerifyPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (locale === 'ua') {
    return {
      title: 'Перевірити документ | Nobel ITBS',
      description: 'Перевірте дійсність документа Nobel ITBS за номером або відкрийте сторінку перевірки через QR-код на документі.',
      openGraph: {
        title: 'Перевірка документа Nobel ITBS',
        description: 'Перевірте статус документа за його номером або QR-кодом.',
      },
    };
  }

  if (locale === 'cz') {
    return {
      title: 'Ověření dokumentu | Nobel ITBS',
      description: 'Ověřte dokument Nobel ITBS podle čísla nebo otevřete ověřovací stránku pomocí QR kódu na dokumentu.',
      openGraph: {
        title: 'Ověření dokumentu Nobel ITBS',
        description: 'Ověřte stav dokumentu podle čísla nebo QR kódu.',
      },
    };
  }

  return {};
}

export default async function LocaleVerifyRoute({ params }: LocaleVerifyPageProps) {
  const { locale } = await params;

  if (!isPrefixedLocale(locale)) {
    notFound();
  }

  return <VerifyPage copy={verifyCopy[locale]} locale={locale as PrefixedLocale} />;
}
