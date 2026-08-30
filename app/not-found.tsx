'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { localizePublicPath, type ContentLocale } from '@/lib/content/localization';
import { PublicFooter } from '@/components/public-footer';
import { PublicResponsiveHeader } from '@/components/public-responsive-header';

const notFoundCopy: Record<ContentLocale, { eyebrow: string; title: string; action: string }> = {
  en: { eyebrow: '404', title: 'Page not found', action: 'Return home' },
  ua: { eyebrow: '404', title: 'Сторінку не знайдено', action: 'Повернутися на головну' },
  cz: { eyebrow: '404', title: 'Stránka nebyla nalezena', action: 'Zpět na hlavní stránku' },
};

function localeFromPathname(pathname: string): ContentLocale {
  if (pathname === '/ua' || pathname.startsWith('/ua/')) return 'ua';
  if (pathname === '/cz' || pathname.startsWith('/cz/')) return 'cz';
  return 'en';
}

export default function NotFound() {
  const locale = localeFromPathname(usePathname());
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
      <section className="not-found">
        <p className="eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <Link href={localizePublicPath(locale, '/')}>{copy.action}</Link>
      </section>
      </main>
      <PublicFooter locale={locale} />
    </div>
  );
}
