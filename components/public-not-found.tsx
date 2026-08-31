import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { localizePublicPath, type ContentLocale } from '@/lib/content/localization';
import { htmlLanguageHeader, resolveHtmlLanguage, type HtmlLanguage } from '@/lib/content/html-language';
import { PublicFooter } from './public-footer';
import { PublicResponsiveHeader } from './public-responsive-header';

type NotFoundCopy = {
  seoTitle: string;
  eyebrow: string;
  title: string;
  body: string;
  primaryAction: string;
  secondaryAction: string;
};

const notFoundCopy: Record<ContentLocale, NotFoundCopy> = {
  en: {
    seoTitle: 'Page Not Found',
    eyebrow: '404',
    title: 'Page not found',
    body: 'The page may have moved, changed its address, or no longer be available.',
    primaryAction: 'View programmes',
    secondaryAction: 'Return home',
  },
  ua: {
    seoTitle: 'Сторінку не знайдено',
    eyebrow: '404',
    title: 'Сторінку не знайдено',
    body: 'Можливо, сторінку переміщено, її адресу змінено або вона більше недоступна.',
    primaryAction: 'Переглянути програми',
    secondaryAction: 'На головну',
  },
  cz: {
    seoTitle: 'Stránka nenalezena',
    eyebrow: '404',
    title: 'Stránka nebyla nalezena',
    body: 'Stránka mohla být přesunuta, změnila adresu nebo již není dostupná.',
    primaryAction: 'Zobrazit programy',
    secondaryAction: 'Zpět na hlavní stránku',
  },
};

const localeByHtmlLanguage: Record<HtmlLanguage, ContentLocale> = {
  en: 'en',
  uk: 'ua',
  cs: 'cz',
};

export async function getRequestLocale(): Promise<ContentLocale> {
  const requestHeaders = await headers();
  return localeByHtmlLanguage[resolveHtmlLanguage(requestHeaders.get(htmlLanguageHeader))];
}

export async function generateNotFoundMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
  const copy = notFoundCopy[locale];

  return {
    title: copy.seoTitle,
    description: copy.body,
    robots: { index: false, follow: false },
    alternates: null,
    openGraph: null,
    twitter: null,
  };
}

export function PublicNotFound({ locale }: { locale: ContentLocale }) {
  const copy = notFoundCopy[locale];

  return (
    <div className="not-found-page">
      <PublicResponsiveHeader
        className="managed-public-header not-found-header"
        locale={locale}
        localeHrefs={{
          en: localizePublicPath('en', '/'),
          ua: localizePublicPath('ua', '/'),
          cz: localizePublicPath('cz', '/'),
        }}
      />
      <main id="main-content" tabIndex={-1}>
        <section className="not-found" aria-labelledby="not-found-title">
          <div className="not-found-copy">
            <p className="eyebrow">{copy.eyebrow}</p>
            <h1 id="not-found-title">{copy.title}</h1>
            <p className="not-found-body">{copy.body}</p>
            <div className="not-found-actions">
              <Link className="button primary" href={localizePublicPath(locale, '/programmes')}>
                {copy.primaryAction}
                <span aria-hidden="true">→</span>
              </Link>
              <Link className="not-found-secondary" href={localizePublicPath(locale, '/')}>
                {copy.secondaryAction}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter locale={locale} />
    </div>
  );
}

export default async function PublicNotFoundBoundary() {
  const locale = await getRequestLocale();
  return <PublicNotFound locale={locale} />;
}
