import Image from 'next/image';
import Link from 'next/link';
import type { ContentLocale } from '@/lib/content/localization';
import { localizePublicPath } from '@/lib/content/localization';
import { homeCopy } from '@/lib/i18n';
import { programmeCatalogueCopy } from '@/lib/programmes/catalogue-copy';
import type { ProgrammeCatalogueItem } from '@/lib/programmes/catalogue-types';

type ProgrammeCatalogueProps = {
  locale: ContentLocale;
  programmes: ProgrammeCatalogueItem[];
};

const localeLabels: Record<ContentLocale, string> = {
  en: 'EN',
  ua: 'UA',
  cz: 'CZ',
};

const contactLabels: Record<ContentLocale, string> = {
  en: 'Contact',
  ua: 'Контакти',
  cz: 'Kontakt',
};

export function ProgrammeCatalogue({ locale, programmes }: ProgrammeCatalogueProps) {
  const copy = programmeCatalogueCopy[locale];
  const shellCopy = homeCopy[locale];
  const programmePath = (slug: string) => localizePublicPath(locale, `/programmes/${slug}`);

  return (
    <main className="catalogue-page">
      <header className="site-header catalogue-header">
        <Link className="brand" href={shellCopy.homeHref} aria-label="Nobel ITBS home">
          <Image src="/brand/nobel-logo-full-horizontal-web.svg" width={230} height={54} alt="Nobel ITBS" priority />
        </Link>

        <nav className="nav" aria-label={copy.navLabel}>
          {shellCopy.nav.map((item) => (
            <Link key={item.href} href={item.href} aria-current={item.href.endsWith('/programmes') ? 'page' : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>

        <nav className="locale-switcher" aria-label={copy.localeLabel}>
          {(['en', 'ua', 'cz'] as const).map((itemLocale) => (
            <Link
              key={itemLocale}
              href={localizePublicPath(itemLocale, '/programmes')}
              aria-current={itemLocale === locale ? 'page' : undefined}
            >
              {localeLabels[itemLocale]}
            </Link>
          ))}
        </nav>
      </header>

      <section className="catalogue-intro" aria-labelledby="catalogue-title">
        <div className="catalogue-intro-heading">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 id="catalogue-title">{copy.title}</h1>
        </div>
        <div className="catalogue-intro-copy">
          <p className="catalogue-lead">{copy.lead}</p>
          <p>{copy.intro}</p>
          <span>{copy.programmeCount(programmes.length)}</span>
        </div>
      </section>

      <section className="catalogue-list" aria-label={copy.title}>
        {programmes.length === 0 ? (
          <div className="catalogue-empty">
            <h2>{copy.empty.title}</h2>
            <p>{copy.empty.body}</p>
            <Link className="button primary" href={localizePublicPath(locale, '/contact')}>
              {copy.empty.cta}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        ) : (
          programmes.map((programme, index) => (
            <article className={`catalogue-card ${programme.featured || index === 0 ? 'catalogue-card-featured' : ''}`} key={programme.slug}>
              <div className="catalogue-card-index" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </div>

              <div className="catalogue-card-main">
                <div className="catalogue-card-status">
                  <span data-status={programme.enrolmentBadge}>{copy.badgeLabels[programme.enrolmentBadge]}</span>
                  {programme.currentRunStartsAt ? <small>{copy.startDate(programme.currentRunStartsAt)}</small> : null}
                </div>

                <div className="catalogue-taxonomy">
                  <Link href={programmePath(programme.area.slug)}>{programme.area.title}</Link>
                  <span aria-hidden="true">/</span>
                  <Link href={programmePath(programme.type.slug)}>{programme.type.title}</Link>
                </div>

                <h2>
                  <Link href={programmePath(programme.slug)}>{programme.title}</Link>
                </h2>
                <p className="catalogue-description">{programme.description}</p>
                <p className="catalogue-facts">{programme.facts}</p>
              </div>

              <div className="catalogue-card-document">
                <span>{copy.documentLabel}</span>
                <p>{programme.documentSummary}</p>
                <Link className="catalogue-card-cta" href={programmePath(programme.slug)}>
                  {copy.viewProgramme}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          ))
        )}
      </section>

      <footer className="site-footer catalogue-footer">
        <div className="footer-brand">
          <Image src="/brand/nobel-logo-full-horizontal-web.svg" width={180} height={42} alt="Nobel ITBS" />
          <p>{shellCopy.footer.text}</p>
        </div>
        {shellCopy.footer.columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2>{column.title}</h2>
            {column.links.map((link) => (
              <Link key={link.href} href={link.href}>{link.label}</Link>
            ))}
          </nav>
        ))}
        <address>
          <h2>{contactLabels[locale]}</h2>
          {shellCopy.footer.contact.map((line) => <span key={line}>{line}</span>)}
        </address>
      </footer>
    </main>
  );
}
