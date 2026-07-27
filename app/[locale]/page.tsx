import { notFound } from 'next/navigation';
import { PublicShell } from '@/components/public-shell';
import { homeCopy, isPrefixedLocale, type PrefixedLocale } from '@/lib/i18n';

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

  return <PublicShell copy={homeCopy[locale]} locale={locale as PrefixedLocale} />;
}
