import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PartnershipsPage } from '@/components/partnerships-page';
import { isPrefixedLocale, partnershipsCopy, type PrefixedLocale } from '@/lib/i18n';

type LocalePartnershipsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return [{ locale: 'ua' }, { locale: 'cz' }];
}

export async function generateMetadata({ params }: LocalePartnershipsPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (locale === 'ua') {
    return {
      title: 'Партнерства Nobel ITBS | Освіта та експертиза',
      description: 'Моделі партнерства Nobel ITBS для освітніх організацій, онлайн-шкіл, експертів і авторів професійних програм.',
      openGraph: {
        title: 'Партнерства Nobel ITBS',
        description: 'Об’єднуємо освітню експертизу, авторські програми та інфраструктуру для створення зрозумілих професійних результатів.',
      },
    };
  }

  if (locale === 'cz') {
    return {
      title: 'Partnerství Nobel ITBS | Vzdělávání a expertiza',
      description: 'Modely partnerství Nobel ITBS pro vzdělávací organizace, online školy, experty a autory profesních programů.',
      openGraph: {
        title: 'Partnerství Nobel ITBS',
        description: 'Propojujeme vzdělávací expertizu, autorské programy a infrastrukturu pro vytváření srozumitelných profesních výsledků.',
      },
    };
  }

  return {};
}

export default async function LocalePartnershipsRoute({ params }: LocalePartnershipsPageProps) {
  const { locale } = await params;

  if (!isPrefixedLocale(locale)) {
    notFound();
  }

  return <PartnershipsPage copy={partnershipsCopy[locale]} locale={locale as PrefixedLocale} />;
}
