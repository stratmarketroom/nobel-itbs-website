import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProgrammeCatalogue } from '@/components/programme-catalogue';
import { catalogueCopy, isPrefixedLocale, type PrefixedLocale } from '@/lib/i18n';

type LocaleProgrammesPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return [{ locale: 'ua' }, { locale: 'cz' }];
}

export async function generateMetadata({ params }: LocaleProgrammesPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (locale === 'ua') {
    return {
      title: 'Професійні програми | Nobel ITBS',
      description:
        'Обирайте професійні програми Nobel ITBS у бізнесі, технологіях та психології: дистанційні курси, сертифікатні програми й Mini-MBA.',
    };
  }

  if (locale === 'cz') {
    return {
      title: 'Profesní vzdělávací programy | Nobel ITBS',
      description:
        'Prohlédněte si profesní programy Nobel ITBS v oblasti byznysu, technologií a psychologie, včetně distančních kurzů, certifikátových programů a studia Mini-MBA.',
    };
  }

  return {};
}

export default async function LocaleProgrammesPage({ params }: LocaleProgrammesPageProps) {
  const { locale } = await params;

  if (!isPrefixedLocale(locale)) {
    notFound();
  }

  return <ProgrammeCatalogue copy={catalogueCopy[locale]} locale={locale as PrefixedLocale} />;
}
