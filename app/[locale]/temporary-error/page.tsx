import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SystemPage } from '@/components/system-page';
import { isPrefixedLocale } from '@/lib/i18n';
import { systemCopy } from '@/lib/system-copy';

type LocaleSystemPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: LocaleSystemPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isPrefixedLocale(locale)) {
    return {};
  }

  return {
    title: `${systemCopy[locale]['temporary-error'].seoTitle} | Nobel ITBS`,
    robots: { index: false, follow: false },
  };
}

export function generateStaticParams() {
  return [{ locale: 'ua' }, { locale: 'cz' }];
}

export default async function LocaleTemporaryErrorPage({ params }: LocaleSystemPageProps) {
  const { locale } = await params;

  if (!isPrefixedLocale(locale)) {
    notFound();
  }

  return <SystemPage copy={systemCopy[locale]['temporary-error']} />;
}
