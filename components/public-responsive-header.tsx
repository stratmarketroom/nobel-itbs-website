import Image from 'next/image';
import Link from 'next/link';
import type { ContentLocale } from '@/lib/content/localization';
import { homeCopy } from '@/lib/i18n';

type PublicResponsiveHeaderProps = {
  className: string;
  currentSection: '/programmes' | '/verify';
  locale: ContentLocale;
  localeHrefs: Record<ContentLocale, string>;
};

const localeLabels: Record<ContentLocale, string> = { en: 'EN', ua: 'UA', cz: 'CZ' };
const menuLabels: Record<ContentLocale, string> = { en: 'Menu', ua: 'Меню', cz: 'Menu' };

export function PublicResponsiveHeader({ className, currentSection, locale, localeHrefs }: PublicResponsiveHeaderProps) {
  const copy = homeCopy[locale];
  const isCurrentSection = (href: string) => href.endsWith(currentSection);

  return (
    <header className={`site-header ${className}`}>
      <Link className="brand" href={copy.homeHref} aria-label="Nobel ITBS home">
        <Image src="/brand/nobel-logo-full-horizontal-web.svg" width={230} height={54} alt="Nobel ITBS" priority />
      </Link>

      <nav className="nav" aria-label={copy.navLabel}>
        {copy.nav.map((item) => (
          <Link key={item.href} href={item.href} aria-current={isCurrentSection(item.href) ? 'page' : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>

      <nav className="locale-switcher public-header-desktop-locales" aria-label={copy.localeLabel}>
        {(['en', 'ua', 'cz'] as const).map((itemLocale) => (
          <Link key={itemLocale} href={localeHrefs[itemLocale]} aria-current={itemLocale === locale ? 'page' : undefined}>
            {localeLabels[itemLocale]}
          </Link>
        ))}
      </nav>

      <details className="public-header-mobile-menu">
        <summary aria-label={menuLabels[locale]}>
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <span aria-hidden="true" />
        </summary>
        <div className="public-header-mobile-panel">
          <nav aria-label={copy.navLabel}>
            {copy.nav.map((item) => (
              <Link key={item.href} href={item.href} aria-current={isCurrentSection(item.href) ? 'page' : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>
          <nav className="public-header-mobile-locales" aria-label={copy.localeLabel}>
            {(['en', 'ua', 'cz'] as const).map((itemLocale) => (
              <Link key={itemLocale} href={localeHrefs[itemLocale]} aria-current={itemLocale === locale ? 'page' : undefined}>
                {localeLabels[itemLocale]}
              </Link>
            ))}
          </nav>
        </div>
      </details>
    </header>
  );
}
