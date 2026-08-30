import Link from 'next/link';
import Image from 'next/image';
import type { Locale, HomeCopy } from '@/lib/i18n';
import { localeLinks } from '@/lib/i18n';
import type { PartnerCard } from '@/lib/partners/types';
import { PublicFooter } from './public-footer';

type PublicShellProps = {
  copy: HomeCopy;
  locale: Locale;
  partners: PartnerCard[];
};

export function PublicShell({ copy, locale, partners }: PublicShellProps) {
  return (
    <main className="home-page">
      <section className="home-above-fold">
        <div className="home-hero" aria-labelledby="home-title">
          <header className="site-header">
            <Link className="brand" href={copy.homeHref} aria-label="Nobel ITBS home">
              <Image src="/brand/nobel-logo-full-horizontal-web.svg" width={230} height={54} alt="Nobel ITBS" priority />
            </Link>

            <nav className="nav" aria-label={copy.navLabel}>
              {copy.nav
                .filter((item) => item.label !== copy.verify.navLabel)
                .map((item) => (
                  <Link key={item.href} href={item.href}>
                    {item.label}
                  </Link>
                ))}
            </nav>

            <div className="header-actions">
              <Link className="verify-nav-button" href={copy.nav.find((item) => item.label === copy.verify.navLabel)?.href ?? '/verify'}>
                {copy.verify.navLabel}
              </Link>
              <nav className="locale-switcher" aria-label={copy.localeLabel}>
                {localeLinks.map((item) => (
                  <Link key={item.locale} href={item.href} aria-current={item.locale === locale ? 'page' : undefined}>
                    {item.label}
                  </Link>
                ))}
              </nav>
              <button className="menu-button" type="button" aria-label="Menu">
                <span />
                <span />
                <span />
              </button>
            </div>
          </header>

          <div className="hero-content">
            <div className="hero-copy">
              <p className="eyebrow">{copy.hero.eyebrow}</p>
              <h1 id="home-title">
                {copy.hero.title}
                <span>{copy.hero.accent}</span>
              </h1>
              <p className="lead">{copy.hero.lead}</p>
              <Link className="button primary" href={copy.hero.cta.href}>
                {copy.hero.cta.label}
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            <aside className="verify-panel" aria-label={copy.verify.title}>
              <div className="verify-form-card">
                <h2>{copy.verify.title}</h2>
                <p>{copy.verify.lead}</p>
                <div className="verify-tabs" role="presentation">
                  <span className="active">{copy.verify.tabCode}</span>
                  <span>{copy.verify.tabQr}</span>
                </div>
                <div className="verify-input" aria-hidden="true">{copy.verify.placeholder}</div>
                <Link className="verify-action" href={copy.nav.find((item) => item.label === copy.verify.navLabel)?.href ?? '/verify'}>
                  {copy.verify.action}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="programmes-section" aria-labelledby="programmes-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow dark">{copy.programmes.eyebrow}</p>
            <h2 id="programmes-title">{copy.programmes.title}</h2>
          </div>
          <Link href="/programmes">
            {copy.programmes.allLabel}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="programme-grid">
          {copy.programmes.items.map((item, index) => (
            <Link className={`programme-card ${index === 0 ? 'featured' : ''}`} href={item.href} key={item.title}>
              <span>{item.index}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <small>{item.count}</small>
              <i aria-hidden="true">→</i>
            </Link>
          ))}
        </div>
        <div className="partners-row" aria-label={copy.partners.eyebrow}>
          <p className="eyebrow dark">{copy.partners.eyebrow}</p>
          <div className="partners-grid">
            {partners.map((partner) => (
              <a
                className={`partner-logo ${partner.type === 'exclusive_academic_partner' ? 'academic' : ''}`}
                href={partner.officialUrl}
                target="_blank"
                rel="noreferrer"
                key={partner.slug}
              >
                <span className={`partner-logo-image partner-logo-image-${partner.slug}`}>
                  <Image src={partner.logoPath} fill sizes="(max-width: 760px) 72vw, 300px" alt={partner.logoAlt} />
                </span>
                <span className="partner-logo-copy">
                  <strong>{partner.name}</strong>
                  <small>{partner.role}</small>
                  {partner.location ? <small>{partner.location}</small> : null}
                </span>
                <i aria-hidden="true">↗</i>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="proof-section" aria-label={copy.trust.eyebrow}>
        <div className="proof-heading">
          <p className="eyebrow dark">{copy.trust.eyebrow}</p>
          <h2>{copy.trust.title}</h2>
          <p>{copy.trust.lead}</p>
        </div>

        <div className="trust-grid">
          {copy.trust.items.map((item, index) => (
            <article className="trust-card" key={item.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="story-grid" aria-label="Nobel ITBS paths">
        <article className="organisation-panel">
          <div>
            <p className="eyebrow">{copy.organisations.eyebrow}</p>
            <h2>{copy.organisations.title}</h2>
            <p>{copy.organisations.text}</p>
            <ul>
              {copy.organisations.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
            <Link className="button primary" href={copy.organisations.cta.href}>
              {copy.organisations.cta.label}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="portrait-orb" aria-hidden="true" />
        </article>

        <article className="badges-panel">
          <p className="eyebrow dark">{copy.badges.eyebrow}</p>
          <h2>{copy.badges.title}</h2>
          <p>{copy.badges.text}</p>
          <div className="badge-preview" aria-hidden="true">
            <span>Nobel ITBS<br />AI Production</span>
            <span>Nobel ITBS<br />Psychology</span>
            <span>Nobel ITBS<br />Space Business</span>
          </div>
          <Link className="button primary" href={copy.badges.cta.href}>
            {copy.badges.cta.label}
            <span aria-hidden="true">→</span>
          </Link>
        </article>
      </section>

      <section className="certificate-cta" aria-labelledby="certificate-title">
        <div>
          <h2 id="certificate-title">{copy.certificate.title}</h2>
          <p>{copy.certificate.text}</p>
          <Link className="button primary" href={copy.certificate.cta.href}>
            {copy.certificate.cta.label}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="certificate-art" aria-hidden="true">
          <div className="certificate-paper">
            <Image src="/brand/nobel-logo-full-horizontal-web.svg" width={168} height={40} alt="" />
            <strong>Certificate</strong>
            <span>John Doe</span>
          </div>
          <div className="phone-card">
            <span>Document is valid</span>
            <b>✓</b>
          </div>
        </div>
      </section>

      <PublicFooter locale={locale} />
    </main>
  );
}
