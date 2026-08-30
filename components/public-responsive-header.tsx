import Image from 'next/image';
import Link from 'next/link';
import { localizePublicPath, type ContentLocale } from '@/lib/content/localization';
import { homeCopy } from '@/lib/i18n';

export type PublicNavSection = '/programmes' | '/for-organisations' | '/partnerships' | '/verify' | '/about';

type PublicResponsiveHeaderProps = {
  className: string;
  currentSection?: PublicNavSection;
  locale: ContentLocale;
  localeHrefs: Record<ContentLocale, string>;
};

type PublicResponsiveMobileMenuProps = Omit<PublicResponsiveHeaderProps, 'className'> & {
  verifyHref?: string;
};

const localeLabels: Record<ContentLocale, string> = { en: 'EN', ua: 'UA', cz: 'CZ' };
const menuLabels: Record<ContentLocale, string> = { en: 'Menu', ua: 'Меню', cz: 'Menu' };
const skipLinkLabels: Record<ContentLocale, string> = {
  en: 'Skip to main content',
  ua: 'Перейти до основного вмісту',
  cz: 'Přejít k hlavnímu obsahu',
};

function isVerificationHref(href: string): boolean {
  return href.endsWith('/verify');
}

function isCurrentHref(href: string, locale: ContentLocale, currentSection?: PublicNavSection): boolean {
  return currentSection ? href === localizePublicPath(locale, currentSection) : false;
}

function LocaleLinks({ className, locale, localeHrefs }: {
  className: string;
  locale: ContentLocale;
  localeHrefs: Record<ContentLocale, string>;
}) {
  const copy = homeCopy[locale];

  return (
    <nav className={className} aria-label={copy.localeLabel}>
      {(['en', 'ua', 'cz'] as const).map((itemLocale) => (
        <Link key={itemLocale} href={localeHrefs[itemLocale]} aria-current={itemLocale === locale ? 'page' : undefined}>
          {localeLabels[itemLocale]}
        </Link>
      ))}
    </nav>
  );
}

export function PublicSkipLink({ locale }: { locale: ContentLocale }) {
  return <a className="public-skip-link" href="#main-content">{skipLinkLabels[locale]}</a>;
}

export function PublicResponsiveMobileMenu({ currentSection, locale, localeHrefs, verifyHref }: PublicResponsiveMobileMenuProps) {
  const copy = homeCopy[locale];
  const primaryItems = copy.nav.filter((item) => !isVerificationHref(item.href));
  const verificationItem = copy.nav.find((item) => isVerificationHref(item.href));
  const resolvedVerifyHref = verifyHref ?? verificationItem?.href ?? localizePublicPath(locale, '/verify');

  return (
    <details className="public-header-mobile-menu">
      <summary aria-label={menuLabels[locale]}>
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </summary>
      <div className="public-header-mobile-panel">
        <nav aria-label={copy.navLabel}>
          {primaryItems.map((item) => (
            <Link key={item.href} href={item.href} aria-current={isCurrentHref(item.href, locale, currentSection) ? 'page' : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
        <Link
          className="public-header-mobile-verify"
          href={resolvedVerifyHref}
          aria-current={currentSection === '/verify' ? 'page' : undefined}
        >
          {verificationItem?.label ?? copy.verify.navLabel}
        </Link>
        <LocaleLinks className="public-header-mobile-locales" locale={locale} localeHrefs={localeHrefs} />
      </div>
    </details>
  );
}

export function PublicResponsiveHeader({ className, currentSection, locale, localeHrefs }: PublicResponsiveHeaderProps) {
  const copy = homeCopy[locale];
  const primaryItems = copy.nav.filter((item) => !isVerificationHref(item.href));
  const verificationItem = copy.nav.find((item) => isVerificationHref(item.href));

  return (
    <header className={`site-header ${className}`} role="banner">
      <PublicSkipLink locale={locale} />
      <Link className="brand" href={copy.homeHref} aria-label="Nobel ITBS home">
        <Image src="/brand/nobel-logo-full-horizontal-web.svg" width={230} height={54} alt="Nobel ITBS" priority />
      </Link>

      <nav className="nav public-header-nav" aria-label={copy.navLabel}>
        {primaryItems.map((item) => (
          <Link key={item.href} href={item.href} aria-current={isCurrentHref(item.href, locale, currentSection) ? 'page' : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="public-header-desktop-actions">
        <Link
          className="public-header-verify-nav"
          href={verificationItem?.href ?? localizePublicPath(locale, '/verify')}
          aria-current={currentSection === '/verify' ? 'page' : undefined}
        >
          {verificationItem?.label ?? copy.verify.navLabel}
        </Link>
        <LocaleLinks className="locale-switcher" locale={locale} localeHrefs={localeHrefs} />
      </div>

      <PublicResponsiveMobileMenu
        currentSection={currentSection}
        locale={locale}
        localeHrefs={localeHrefs}
      />
    </header>
  );
}
