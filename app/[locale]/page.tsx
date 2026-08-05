import { notFound } from 'next/navigation';
import { PublicShell } from '@/components/public-shell';
import { homeCopy, isPrefixedLocale, type PrefixedLocale } from '@/lib/i18n';
import { getPublicPartners } from '@/lib/partners/public';

type LocalePageProps = {
  params: Promise<{
    locale: string;
  }>;
};

export function generateStaticParams() {
  return [{ locale: 'ua' }, { locale: 'cz' }];
}

export default async function LocalePage({ params }: LocalePageProps) {
  const { locale } = await params;

  if (!isPrefixedLocale(locale)) {
    notFound();
  }

  const resolvedLocale = locale as PrefixedLocale;
  const partners = await getPublicPartners(resolvedLocale);
  return <PublicShell copy={homeCopy[resolvedLocale]} locale={resolvedLocale} partners={partners.items} />;
}
