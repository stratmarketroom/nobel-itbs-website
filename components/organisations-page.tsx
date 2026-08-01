import Image from 'next/image';
import Link from 'next/link';
import type { Locale, OrganisationsCopy } from '@/lib/i18n';

type OrganisationsPageProps = {
  copy: OrganisationsCopy;
  locale: Locale;
};

export function OrganisationsPage({ copy, locale }: OrganisationsPageProps) {
  const verifyItem = copy.nav.find((item) => item.href.endsWith('/verify') || item.href === '/verify');
  const visibleNav = copy.nav.filter((item) => item.label !== verifyItem?.label);

  return (
    <main className="organisations-page">
      <section className="organisations-hero" aria-labelledby="organisations-title">
        <header className="site-header organisations-header">
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
              <Link className="verify-nav-button" href={verifyItem.href}>
                {verifyItem.label}
              </Link>
            ) : null}
            <nav className="locale-switcher organisations-locales" aria-label={copy.localeLabel}>
              {copy.localeLinks.map((item) => (
                <Link key={item.locale} href={item.href} aria-current={item.locale === locale ? 'page' : undefined}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <div className="organisations-hero-grid">
          <div>
            <p className="eyebrow">{copy.hero.eyebrow}</p>
            <h1 id="organisations-title">{copy.hero.title}</h1>
          </div>
          <aside className="organisations-hero-panel">
            <p className="organisations-lead">{copy.hero.lead}</p>
            <p>{copy.hero.supportingCopy}</p>
            <Link className="button primary" href={copy.hero.primaryCta.href}>
              {copy.hero.primaryCta.label}
              <span aria-hidden="true">→</span>
            </Link>
          </aside>
        </div>
      </section>

      <section className="organisation-need section-band" aria-labelledby="need-title">
        <div>
          <p className="eyebrow dark">Need</p>
          <h2 id="need-title">{copy.need.heading}</h2>
        </div>
        <div className="about-prose">
          {copy.need.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="organisation-audiences" aria-labelledby="audiences-title">
        <div>
          <p className="eyebrow">{copy.audiences.heading}</p>
          <h2 id="audiences-title">{copy.audiences.heading}</h2>
        </div>
        <div className="organisation-audience-list">
          {copy.audiences.items.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="organisation-services section-band" aria-labelledby="services-title">
        <div className="split-heading">
          <div>
            <p className="eyebrow dark">Services</p>
            <h2 id="services-title">{copy.services.heading}</h2>
          </div>
        </div>
        <div className="organisation-service-list">
          {copy.services.items.map((item, index) => (
            <article key={item.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="organisation-receives" aria-labelledby="receives-title">
        <div>
          <p className="eyebrow">{copy.receives.heading}</p>
          <h2 id="receives-title">{copy.receives.heading}</h2>
          <p>{copy.receives.note}</p>
        </div>
        <ul>
          {copy.receives.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="organisation-steps section-band" aria-labelledby="steps-title">
        <div className="split-heading">
          <div>
            <p className="eyebrow dark">Workflow</p>
            <h2 id="steps-title">{copy.steps.heading}</h2>
          </div>
        </div>
        <ol className="organisation-step-list">
          {copy.steps.items.map((item) => (
            <li key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="organisation-trust" aria-labelledby="trust-title">
        <div>
          <p className="eyebrow">{copy.trust.heading}</p>
          <h2 id="trust-title">{copy.trust.heading}</h2>
        </div>
        <div className="about-prose">
          {copy.trust.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="faq-section section-band" aria-labelledby="org-faq-title">
        <div className="split-heading">
          <div>
            <p className="eyebrow dark">FAQ</p>
            <h2 id="org-faq-title">Questions before cooperation</h2>
          </div>
        </div>
        <div className="faq-list">
          {copy.faq.map((item) => (
            <article key={item.question}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="organisations-final-cta" aria-labelledby="organisations-final-title">
        <div>
          <h2 id="organisations-final-title">{copy.finalCta.heading}</h2>
          <p>{copy.finalCta.body}</p>
        </div>
        <div className="link-pair">
          <Link className="button primary" href={copy.finalCta.primaryCta.href}>
            {copy.finalCta.primaryCta.label}
            <span aria-hidden="true">→</span>
          </Link>
          <Link className="button secondary" href={copy.finalCta.fallbackCta.href}>
            {copy.finalCta.fallbackCta.label}
          </Link>
        </div>
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
