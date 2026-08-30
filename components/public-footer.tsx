import Image from 'next/image';
import Link from 'next/link';
import type { ContentLocale } from '@/lib/content/localization';
import { homeCopy } from '@/lib/i18n';

const footerSectionLabels: Record<ContentLocale, { navigation: string; legal: string }> = {
  en: { navigation: 'Navigation', legal: 'Legal' },
  ua: { navigation: 'Навігація', legal: 'Правова інформація' },
  cz: { navigation: 'Navigace', legal: 'Právní informace' },
};

function isCurrentFooterHref(href: string, currentHref?: string): boolean {
  return Boolean(currentHref && (href === currentHref || currentHref.startsWith(`${href}/`)));
}

export function PublicFooter({ locale, currentHref }: { locale: ContentLocale; currentHref?: string }) {
  const copy = homeCopy[locale];
  const labels = footerSectionLabels[locale];
  const primaryNavigation = copy.nav.filter((item) => item.label !== copy.verify.navLabel);
  const verifyItem = copy.nav.find((item) => item.label === copy.verify.navLabel);
  const email = copy.footer.contact.find((line) => line.includes('@')) ?? 'info@nobel-itbs.eu';
  const location = copy.footer.contact.find((line) => line !== 'Nobel ITBS s.r.o.' && !line.includes('@')) ?? 'Praha, Czech Republic';

  return (
    <footer className="public-footer" role="contentinfo">
      <div className="public-footer-inner">
        <div className="public-footer-brand">
          <Image src="/brand/nobel-logo-full-horizontal-web.svg" width={180} height={42} alt="Nobel ITBS" />
          <p>Nobel ITBS s.r.o.</p>
        </div>

        <nav aria-label={labels.navigation}>
          <h2>{labels.navigation}</h2>
          {primaryNavigation.map((item) => (
            <Link href={item.href} key={item.href} aria-current={isCurrentFooterHref(item.href, currentHref) ? 'page' : undefined}>
              {item.label}
            </Link>
          ))}
          {verifyItem ? (
            <Link href={verifyItem.href} aria-current={isCurrentFooterHref(verifyItem.href, currentHref) ? 'page' : undefined}>
              {verifyItem.label}
            </Link>
          ) : null}
        </nav>

        <nav aria-label={labels.legal}>
          <h2>{labels.legal}</h2>
          {copy.footer.legal.map((item) => (
            <Link href={item.href} key={item.href} aria-current={item.href === currentHref ? 'page' : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>

        <address>
          <h2>{copy.footer.contactTitle}</h2>
          <span>{location}</span>
          <a href={`mailto:${email}`}>{email}</a>
        </address>
      </div>
    </footer>
  );
}
