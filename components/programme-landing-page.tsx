import Image from 'next/image';
import Link from 'next/link';
import type { Locale, ProgrammeLandingCopy } from '@/lib/i18n';

type ProgrammeLandingPageProps = {
  copy: ProgrammeLandingCopy;
  locale: Locale;
};

const metaLabels: Record<Locale, { status: string; area: string; format: string; document: string }> = {
  en: { status: 'Status', area: 'Area', format: 'Format', document: 'Document' },
  ua: { status: 'Статус', area: 'Напрям', format: 'Формат', document: 'Документ' },
  cz: { status: 'Status', area: 'Oblast', format: 'Formát', document: 'Dokument' },
};

export function ProgrammeLandingPage({ copy, locale }: ProgrammeLandingPageProps) {
  const verifyItem = copy.nav.find((item) => item.href.endsWith('/verify') || item.href === '/verify');
  const visibleNav = copy.nav.filter((item) => item.label !== verifyItem?.label);
  const labels = metaLabels[locale];

  return (
    <main className="programme-landing-page">
      <header className="site-header programme-landing-header">
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
            <Link className="verify-nav-button programme-landing-verify" href={verifyItem.href}>
              {verifyItem.label}
            </Link>
          ) : null}
          <nav className="locale-switcher programme-landing-locales" aria-label={copy.localeLabel}>
            {copy.localeLinks.map((item) => (
              <Link key={item.locale} href={item.href} aria-current={item.locale === locale ? 'page' : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <section className="programme-landing-hero" aria-labelledby="programme-landing-title">
        <div>
          <p className="eyebrow">{copy.kind}</p>
          <h1 id="programme-landing-title">{copy.hero.title}</h1>
        </div>
        <aside className="programme-landing-intro">
          <p className="programme-landing-lead">{copy.hero.lead}</p>
          {copy.hero.supportingCopy ? <p>{copy.hero.supportingCopy}</p> : null}
          <Link className="button primary" href={copy.hero.primaryCta.href}>
            {copy.hero.primaryCta.label}
            <span aria-hidden="true">→</span>
          </Link>
        </aside>
      </section>

      <section className="landing-about section-band" aria-labelledby="landing-about-title">
        <div className="split-heading">
          <div>
            <p className="eyebrow dark">{copy.hero.eyebrow}</p>
            <h2 id="landing-about-title">{copy.about.heading}</h2>
          </div>
          <div className="landing-about-copy">
            {copy.about.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-dark-band" aria-label={copy.kind}>
        <article>
          <p className="eyebrow">{copy.audience.heading}</p>
          <ul>
            {copy.audience.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article>
          <p className="eyebrow">{copy.development.heading}</p>
          <ul>
            {copy.development.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section id="programmes-in-this-area" className="landing-programmes" aria-labelledby="landing-programmes-title">
        <div className="split-heading">
          <div>
            <p className="eyebrow dark">{copy.kind}</p>
            <h2 id="landing-programmes-title">{copy.programmes.heading}</h2>
          </div>
          <p>{copy.programmes.intro}</p>
        </div>

        <div className="landing-programme-list">
          {copy.programmes.items.length > 0 ? (
            copy.programmes.items.map((programme, index) => (
              <Link className="landing-programme-row" href={programme.href} key={programme.title}>
                <span className="landing-programme-number">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3>{programme.title}</h3>
                  <p>{programme.description}</p>
                </div>
                <dl>
                  {programme.status ? (
                    <div>
                      <dt>{labels.status}</dt>
                      <dd>{programme.status}</dd>
                    </div>
                  ) : null}
                  {programme.area ? (
                    <div>
                      <dt>{labels.area}</dt>
                      <dd>{programme.area}</dd>
                    </div>
                  ) : null}
                  {programme.facts ? (
                    <div>
                      <dt>{labels.format}</dt>
                      <dd>{programme.facts}</dd>
                    </div>
                  ) : null}
                  {programme.document ? (
                    <div>
                      <dt>{labels.document}</dt>
                      <dd>{programme.document}</dd>
                    </div>
                  ) : null}
                </dl>
                <strong>
                  {programme.cta}
                  <span aria-hidden="true">→</span>
                </strong>
              </Link>
            ))
          ) : (
            <article className="catalogue-empty">
              <h2>{copy.programmes.emptyHeading}</h2>
              <p>{copy.programmes.emptyBody}</p>
            </article>
          )}
        </div>
      </section>

      <section className="landing-closing" aria-labelledby="landing-closing-title">
        <p className="eyebrow">{copy.kind}</p>
        <h2 id="landing-closing-title">{copy.closing.heading}</h2>
        <p>{copy.closing.body}</p>
        <Link className="button primary" href={copy.closing.cta.href}>
          {copy.closing.cta.label}
          <span aria-hidden="true">→</span>
        </Link>
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
