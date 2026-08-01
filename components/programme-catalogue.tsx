import Image from 'next/image';
import Link from 'next/link';
import type { CatalogueCopy, Locale } from '@/lib/i18n';

type ProgrammeCatalogueProps = {
  copy: CatalogueCopy;
  locale: Locale;
};

export function ProgrammeCatalogue({ copy, locale }: ProgrammeCatalogueProps) {
  const verifyItem = copy.nav.find((item) => item.href.endsWith('/verify') || item.href === '/verify');
  const visibleNav = copy.nav.filter((item) => item.label !== verifyItem?.label);

  return (
    <main className="catalogue-page">
      <header className="site-header catalogue-header">
        <Link className="brand" href={copy.homeHref} aria-label="Nobel ITBS home">
          <Image src="/brand/nobel-logo-full-horizontal-web.svg" width={230} height={54} alt="Nobel ITBS" priority />
        </Link>

        <nav className="nav" aria-label={copy.navLabel}>
          {visibleNav.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          {verifyItem ? (
            <Link className="verify-nav-button catalogue-verify" href={verifyItem.href}>
              {verifyItem.label}
            </Link>
          ) : null}
          <nav className="locale-switcher catalogue-locales" aria-label={copy.localeLabel}>
            {copy.localeLinks.map((item) => (
              <Link key={item.locale} href={item.href} aria-current={item.locale === locale ? 'page' : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <section className="catalogue-hero" aria-labelledby="catalogue-title">
        <div>
          <p className="eyebrow dark">{copy.hero.eyebrow}</p>
          <h1 id="catalogue-title">{copy.hero.title}</h1>
        </div>
        <div>
          <p className="catalogue-lead">{copy.hero.lead}</p>
          <p className="catalogue-intro">{copy.hero.intro}</p>
        </div>
      </section>

      <section className="catalogue-note" aria-label="Catalogue rule">
        <span>{String(copy.programmes.length).padStart(2, '0')}</span>
        <p>{copy.note}</p>
      </section>

      <section className="catalogue-programmes" aria-label={copy.hero.title}>
        {copy.programmes.length > 0 ? (
          copy.programmes.map((programme, index) => (
            <Link className="catalogue-programme" href={programme.href} key={programme.title}>
              <div className="catalogue-number">{String(index + 1).padStart(2, '0')}</div>
              <div className="catalogue-programme-title">
                <div className="programme-meta">
                  <span>{programme.status}</span>
                  <span>{programme.area}</span>
                  <span>{programme.type}</span>
                </div>
                <h2>{programme.title}</h2>
              </div>
              <div className="catalogue-programme-body">
                <p>{programme.description}</p>
                <dl>
                  <div>
                    <dt>Format</dt>
                    <dd>{programme.facts}</dd>
                  </div>
                  <div>
                    <dt>Document</dt>
                    <dd>{programme.document}</dd>
                  </div>
                </dl>
                <strong>
                  {programme.cta}
                  <span aria-hidden="true">→</span>
                </strong>
              </div>
            </Link>
          ))
        ) : (
          <article className="catalogue-empty">
            <h2>{copy.empty.heading}</h2>
            <p>{copy.empty.body}</p>
            <Link className="button primary" href={copy.empty.cta.href}>
              {copy.empty.cta.label}
              <span aria-hidden="true">→</span>
            </Link>
          </article>
        )}
      </section>

      <footer className="site-footer">
        <div className="footer-brand">
          <Image src="/brand/nobel-logo-full-horizontal-web.svg" width={180} height={42} alt="Nobel ITBS" />
          <p>{copy.footer.text}</p>
        </div>
        {copy.footer.columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2>{column.title}</h2>
            {column.links.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        ))}
        <address>
          <h2>Contact</h2>
          {copy.footer.contact.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </address>
      </footer>
    </main>
  );
}
