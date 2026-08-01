import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isPrefixedLocale, organisationsCopy, type PrefixedLocale } from '@/lib/i18n';
import { OrganisationsPage } from '@/components/organisations-page';

type LocaleOrganisationsPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return [{ locale: 'ua' }, { locale: 'cz' }];
}

export async function generateMetadata({ params }: LocaleOrganisationsPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (locale === 'ua') {
    return {
      title: 'Освітня інфраструктура для онлайн-шкіл | Nobel ITBS',
      description: 'Інфраструктурні послуги Nobel ITBS для онлайн-шкіл та експертів: структурування програм, документи й додатки, реєстрація та верифікація.',
      openGraph: {
        title: 'Інфраструктура Nobel ITBS для освітніх проєктів',
        description: 'Перетворюйте авторську програму на структурований освітній продукт із продуманою моделлю документів, реєстрації та верифікації.',
      },
    };
  }

  if (locale === 'cz') {
    return {
      title: 'Vzdělávací infrastruktura pro online školy | Nobel ITBS',
      description: 'Infrastrukturní služby Nobel ITBS pro online školy a experty: strukturování programů, dokumenty a dodatky, registrace a ověřování.',
      openGraph: {
        title: 'Infrastruktura Nobel ITBS pro vzdělávací projekty',
        description: 'Proměňte autorský program ve strukturovaný vzdělávací produkt s promyšleným modelem dokumentů, registrace a ověřování.',
      },
    };
  }

  return {};
}

export default async function LocaleOrganisationsRoute({ params }: LocaleOrganisationsPageProps) {
  const { locale } = await params;

  if (!isPrefixedLocale(locale)) {
    notFound();
  }

  return <OrganisationsPage copy={organisationsCopy[locale]} locale={locale as PrefixedLocale} />;
}
