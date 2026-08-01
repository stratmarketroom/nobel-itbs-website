import Image from 'next/image';
import Link from 'next/link';
import type { HomeCopy, Locale } from '@/lib/i18n';
import { localeLinks } from '@/lib/i18n';

type PublicShellProps = {
  copy: HomeCopy;
  locale: Locale;
};

export function PublicShell({ copy, locale }: PublicShellProps) {
  const visibleNav = copy.nav.filter((item) => item.label !== copy.verify.navLabel);

  return (
    <main className="home-page">
      <section className="home-hero" aria-labelledby="home-title">
        <header className="site-header">
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
            <Link className="verify-nav-button" href={copy.verify.link.href}>
              {copy.verify.navLabel}
            </Link>
            <nav className="locale-switcher" aria-label={copy.localeLabel}>
              {localeLinks.map((item) => (
                <Link key={item.locale} href={item.href} aria-current={item.locale === locale ? 'page' : undefined}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <div className="hero-layout">
          <div className="hero-copy">
            <p className="eyebrow">{copy.hero.eyebrow}</p>
            <h1 id="home-title">{copy.hero.title}</h1>
            <p className="hero-lead">{copy.hero.lead}</p>
            <div className="hero-actions">
              <Link className="button primary" href={copy.hero.cta.href}>
                {copy.hero.cta.label}
                <span aria-hidden="true">→</span>
              </Link>
              <p>{copy.hero.supportingText}</p>
            </div>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <Image src="/brand/generated/nobel-hero-3d.png" width={840} height={840} alt="" priority />
          </div>

          <aside className="verify-panel" aria-label={copy.verify.title}>
            <p className="panel-index">Registry utility</p>
            <h2>{copy.verify.title}</h2>
            <p>{copy.verify.body}</p>
            <form className="verify-mini-form" action={copy.verify.link.href}>
              <label htmlFor={`document-number-${locale}`}>{copy.verify.inputLabel}</label>
              <div>
                <input id={`document-number-${locale}`} name="documentNumber" placeholder={copy.verify.placeholder} />
                <button type="submit">{copy.verify.submitLabel}</button>
              </div>
            </form>
            <Link className="text-link" href={copy.verify.link.href}>
              {copy.verify.link.label}
              <span aria-hidden="true">→</span>
            </Link>
          </aside>
        </div>
      </section>

      <section className="areas-section section-band" aria-labelledby="areas-title">
        <div className="editorial-heading">
          <p className="eyebrow dark">{copy.areas.eyebrow}</p>
          <h2 id="areas-title">{copy.areas.title}</h2>
          <p>{copy.areas.intro}</p>
        </div>

        <div className="area-list">
          {copy.areas.items.map((area, index) => (
            <Link className="area-row" href={area.href} key={area.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{area.title}</h3>
              <p>{area.text}</p>
              <strong>{area.featured}</strong>
            </Link>
          ))}
        </div>

        <Link className="section-link" href={copy.areas.cta.href}>
          {copy.areas.cta.label}
          <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section className="featured-section section-band" aria-labelledby="featured-title">
        <div className="split-heading">
          <div>
            <p className="eyebrow dark">{copy.featured.eyebrow}</p>
            <h2 id="featured-title">{copy.featured.title}</h2>
          </div>
          <p>{copy.featured.intro}</p>
        </div>

        <div className="programme-list">
          {copy.featured.items.map((programme, index) => (
            <Link className="programme-row" href={programme.href} key={programme.title}>
              <div className="programme-number">{String(index + 1).padStart(2, '0')}</div>
              <div className="programme-main">
                <div className="programme-meta">
                  <span>{programme.status}</span>
                  <span>{programme.area}</span>
                  <span>{programme.type}</span>
                </div>
                <h3>{programme.title}</h3>
                <p>{programme.description}</p>
              </div>
              <div className="programme-facts">
                <p>{programme.facts}</p>
                <p>{programme.document}</p>
                <strong>
                  {programme.cta}
                  <span aria-hidden="true">→</span>
                </strong>
              </div>
            </Link>
          ))}
        </div>

        <Link className="section-link" href={copy.featured.cta.href}>
          {copy.featured.cta.label}
          <span aria-hidden="true">→</span>
        </Link>
      </section>

      <section className="trust-section" aria-labelledby="trust-title">
        <div className="trust-heading">
          <p className="eyebrow">{copy.trust.eyebrow}</p>
          <h2 id="trust-title">{copy.trust.title}</h2>
          <p>{copy.trust.lead}</p>
        </div>

        <div className="trust-list">
          {copy.trust.items.map((item, index) => (
            <article key={item.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="model-section section-band" aria-labelledby="model-title">
        <div className="split-heading">
          <div>
            <p className="eyebrow dark">{copy.model.eyebrow}</p>
            <h2 id="model-title">{copy.model.title}</h2>
          </div>
        </div>

        <ol className="model-steps">
          {copy.model.steps.map((step) => (
            <li key={step.title}>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="organisation-section" aria-labelledby="organisation-title">
        <div>
          <p className="eyebrow">{copy.organisations.eyebrow}</p>
          <h2 id="organisation-title">{copy.organisations.title}</h2>
          <p>{copy.organisations.body}</p>
          <div className="link-pair">
            <Link className="button primary" href={copy.organisations.primary.href}>
              {copy.organisations.primary.label}
              <span aria-hidden="true">→</span>
            </Link>
            <Link className="button secondary" href={copy.organisations.secondary.href}>
              {copy.organisations.secondary.label}
            </Link>
          </div>
        </div>
      </section>

      <section className="institutional-section section-band" aria-labelledby="institutional-title">
        <div className="institutional-mark" aria-hidden="true">N</div>
        <div>
          <p className="eyebrow dark">{copy.institutional.eyebrow}</p>
          <h2 id="institutional-title">{copy.institutional.title}</h2>
        </div>
        <div>
          <p>{copy.institutional.body}</p>
          <Link className="section-link" href={copy.institutional.cta.href}>
            {copy.institutional.cta.label}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      <section className="final-cta" aria-labelledby="final-title">
        <h2 id="final-title">{copy.finalCta.title}</h2>
        <p>{copy.finalCta.body}</p>
        <Link className="button primary" href={copy.finalCta.cta.href}>
          {copy.finalCta.cta.label}
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
