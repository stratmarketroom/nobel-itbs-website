import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AboutPage } from '@/components/about-page';
import { aboutCopy, isPrefixedLocale, type PrefixedLocale } from '@/lib/i18n';

type LocaleAboutPageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return [{ locale: 'ua' }, { locale: 'cz' }];
}

export async function generateMetadata({ params }: LocaleAboutPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (locale === 'ua') {
    return {
      title: 'Про Nobel ITBS | Професійна освіта в Європі',
      description:
        'Дізнайтеся про Nobel ITBS, європейську платформу професійної освіти для дорослих і організацій, власні та партнерські програми, документи й онлайн-верифікацію.',
      openGraph: {
        title: 'Про Nobel ITBS',
        description: 'Професійна освіта, партнерські програми та інфраструктура документів у європейському освітньому середовищі.',
      },
    };
  }

  if (locale === 'cz') {
    return {
      title: 'O Nobel ITBS | Profesní vzdělávání v Evropě',
      description:
        'Poznejte Nobel ITBS, evropskou platformu profesního vzdělávání pro dospělé a organizace, její vlastní a partnerské programy, dokumenty a online ověřování.',
      openGraph: {
        title: 'O Nobel ITBS',
        description: 'Profesní vzdělávání, partnerské programy a dokumentová infrastruktura v evropském vzdělávacím prostředí.',
      },
    };
  }

  return {};
}

export default async function LocaleAboutRoute({ params }: LocaleAboutPageProps) {
  const { locale } = await params;

  if (!isPrefixedLocale(locale)) {
    notFound();
  }

  return <AboutPage copy={aboutCopy[locale]} locale={locale as PrefixedLocale} />;
}
