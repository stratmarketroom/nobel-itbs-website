import Image from 'next/image';
import Link from 'next/link';
import type { AboutCopy, Locale } from '@/lib/i18n';

type AboutPageProps = {
  copy: AboutCopy;
  locale: Locale;
};

export function AboutPage({ copy, locale }: AboutPageProps) {
  const verifyItem = copy.nav.find((item) => item.href.endsWith('/verify') || item.href === '/verify');
  const visibleNav = copy.nav.filter((item) => item.label !== verifyItem?.label);

  return (
    <main className="about-page">
      <section className="about-hero" aria-labelledby="about-title">
        <header className="site-header about-header">
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
            <nav className="locale-switcher about-locales" aria-label={copy.localeLabel}>
              {copy.localeLinks.map((item) => (
                <Link key={item.locale} href={item.href} aria-current={item.locale === locale ? 'page' : undefined}>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <div className="about-hero-grid">
          <div className="about-hero-copy">
            <p className="eyebrow">{copy.hero.eyebrow}</p>
            <h1 id="about-title">{copy.hero.title}</h1>
          </div>
          <div className="about-hero-aside">
            <p>{copy.hero.lead}</p>
            <div className="link-pair">
              <Link className="button primary" href={copy.hero.primaryCta.href}>
                {copy.hero.primaryCta.label}
                <span aria-hidden="true">→</span>
              </Link>
              <Link className="button secondary" href={copy.hero.secondaryCta.href}>
                {copy.hero.secondaryCta.label}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="about-statement section-band" aria-labelledby="who-title">
        <div>
          <p className="eyebrow dark">{copy.who.eyebrow}</p>
          <h2 id="who-title">{copy.who.title}</h2>
        </div>
        <div className="about-prose">
          {copy.who.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="about-purpose" aria-labelledby="purpose-title">
        <div>
          <p className="eyebrow">{copy.purpose.eyebrow}</p>
          <h2 id="purpose-title">{copy.purpose.title}</h2>
        </div>
        <div className="about-prose">
          {copy.purpose.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>

      <section className="about-work section-band" aria-labelledby="work-title">
        <div className="split-heading">
          <div>
            <p className="eyebrow dark">{copy.work.eyebrow}</p>
            <h2 id="work-title">{copy.work.title}</h2>
          </div>
        </div>
        <div className="about-work-grid">
          {copy.work.items.map((item, index) => (
            <article key={item.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-approach" aria-labelledby="approach-title">
        <div className="about-approach-heading">
          <p className="eyebrow">{copy.approach.eyebrow}</p>
          <h2 id="approach-title">{copy.approach.title}</h2>
          <p>{copy.approach.intro}</p>
        </div>
        <ol className="about-approach-list">
          {copy.approach.items.map((item) => (
            <li key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="about-foundation section-band" aria-labelledby="foundation-title">
        <div className="foundation-mark" aria-hidden="true">
          CZ
        </div>
        <div>
          <p className="eyebrow dark">{copy.foundation.eyebrow}</p>
          <h2 id="foundation-title">{copy.foundation.title}</h2>
        </div>
        <p>{copy.foundation.body}</p>
      </section>

      <section className="about-partnership" aria-labelledby="partnership-title">
        <div className="about-partnership-copy">
          <p className="eyebrow">{copy.partnership.eyebrow}</p>
          <h2 id="partnership-title">{copy.partnership.title}</h2>
          {copy.partnership.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <div className="about-proof-list">
          {copy.partnership.proofs.map((proof, index) => (
            <article key={proof.title}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <h3>{proof.title}</h3>
              <p>{proof.text}</p>
            </article>
          ))}
          <p className="about-proof-note">{copy.partnership.note}</p>
        </div>
      </section>

      <section className="about-principles section-band" aria-labelledby="principles-title">
        <div className="split-heading">
          <div>
            <p className="eyebrow dark">{copy.principles.eyebrow}</p>
            <h2 id="principles-title">{copy.principles.title}</h2>
          </div>
        </div>
        <div className="principle-grid">
          {copy.principles.items.map((item) => (
            <article key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-audiences section-band" aria-label={copy.audiences.eyebrow}>
        <p className="eyebrow dark">{copy.audiences.eyebrow}</p>
        <div className="audience-list">
          {copy.audiences.items.map((item) => (
            <article key={item.title}>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="about-final-cta" aria-labelledby="about-final-title">
        <div>
          <h2 id="about-final-title">{copy.finalCta.title}</h2>
          <p>{copy.finalCta.body}</p>
        </div>
        <div className="link-pair">
          <Link className="button primary" href={copy.finalCta.primaryCta.href}>
            {copy.finalCta.primaryCta.label}
            <span aria-hidden="true">→</span>
          </Link>
          <Link className="button secondary" href={copy.finalCta.secondaryCta.href}>
            {copy.finalCta.secondaryCta.label}
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
