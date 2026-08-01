import Image from 'next/image';
import Link from 'next/link';
import type { Locale, PartnershipsCopy } from '@/lib/i18n';

type PartnershipsPageProps = {
  copy: PartnershipsCopy;
  locale: Locale;
};

export function PartnershipsPage({ copy, locale }: PartnershipsPageProps) {
  const verifyItem = copy.nav.find((item) => item.href.endsWith('/verify') || item.href === '/verify');
  const visibleNav = copy.nav.filter((item) => item.label !== verifyItem?.label);

  return (
    <main className="partnerships-page">
      <section className="partnerships-hero" aria-labelledby="partnerships-title">
        <header className="site-header partnerships-header">
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
            <nav className="locale-switcher partnerships-locales" aria-label={copy.localeLabel}>
              {copy.localeLinks.map((item) => (
                <Link key={item.locale} href={item.href} aria-current={item.locale === locale ? 'page' : undefined}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <div className="partnerships-hero-grid">
          <div>
            <p className="eyebrow">{copy.hero.eyebrow}</p>
            <h1 id="partnerships-title">{copy.hero.title}</h1>
          </div>
          <aside className="partnerships-hero-panel">
            <p className="partnerships-lead">{copy.hero.lead}</p>
            <p>{copy.hero.supportingCopy}</p>
            <Link className="button primary" href={copy.hero.primaryCta.href}>
              {copy.hero.primaryCta.label}
              <span aria-hidden="true">→</span>
            </Link>
          </aside>
        </div>
      </section>

      <section className="partnership-principles" aria-labelledby="principles-title">
        <h2 id="principles-title">{copy.principles.heading}</h2>
        <ol>
          {copy.principles.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <section className="partnership-models section-band" aria-labelledby="models-title">
        <div className="split-heading">
          <div>
            <p className="eyebrow dark">Models</p>
            <h2 id="models-title">{copy.models.heading}</h2>
          </div>
        </div>
        <div className="partnership-model-list">
          {copy.models.items.map((item, index) => (
            <article key={item.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="academic-partnership" aria-labelledby="academic-title">
        <div>
          <p className="eyebrow">{copy.academic.heading}</p>
          <h2 id="academic-title">{copy.academic.partner.name}</h2>
          <p>{copy.academic.body}</p>
        </div>
        <article className="partner-feature">
          <span>{copy.academic.partner.location}</span>
          <h3>{copy.academic.partner.role}</h3>
          {copy.academic.partner.note ? <p>{copy.academic.partner.note}</p> : null}
          {copy.academic.partner.url ? (
            <Link className="section-link" href={copy.academic.partner.url}>
              Official website <span aria-hidden="true">→</span>
            </Link>
          ) : null}
        </article>
      </section>

      <section className="partner-directory section-band" aria-labelledby="organisations-title">
        <div className="split-heading">
          <div>
            <p className="eyebrow dark">Directory</p>
            <h2 id="organisations-title">{copy.organisations.heading}</h2>
          </div>
          <p>{copy.organisations.intro}</p>
        </div>
        <div className="partner-row-list">
          {copy.organisations.items.map((item, index) => (
            <article key={item.name} className="partner-row">
              <span className="partner-index">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h3>{item.name}</h3>
                {item.location ? <p>{item.location}</p> : null}
              </div>
              <div>
                <p>{item.role}</p>
                {item.url ? (
                  <Link href={item.url}>
                    Website <span aria-hidden="true">→</span>
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="experts-section section-band" aria-labelledby="experts-title">
        <div className="split-heading">
          <div>
            <p className="eyebrow dark">Experts</p>
            <h2 id="experts-title">{copy.experts.heading}</h2>
          </div>
          <p>{copy.experts.intro}</p>
        </div>
        <div className="expert-row-list">
          {copy.experts.items.map((item) => (
            <article key={item.name}>
              <div className="expert-initials" aria-hidden="true">
                {item.name
                  .split(' ')
                  .map((part) => part[0])
                  .slice(0, 2)
                  .join('')}
              </div>
              <div>
                <h3>{item.name}</h3>
                <p>{item.role}</p>
              </div>
              {item.note ? <p>{item.note}</p> : null}
            </article>
          ))}
        </div>
      </section>

      <section className="partnership-boundaries" aria-labelledby="boundaries-title">
        <div>
          <p className="eyebrow">{copy.boundaries.heading}</p>
          <h2 id="boundaries-title">{copy.boundaries.heading}</h2>
        </div>
        <ul>
          {copy.boundaries.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="partnerships-final-cta" aria-labelledby="partnerships-final-title">
        <div>
          <h2 id="partnerships-final-title">{copy.finalCta.heading}</h2>
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
