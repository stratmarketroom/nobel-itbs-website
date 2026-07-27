import Link from 'next/link';
import type { Locale, HomeCopy } from '@/lib/i18n';
import { localeLinks } from '@/lib/i18n';

type PublicShellProps = {
  copy: HomeCopy;
  locale: Locale;
};

export function PublicShell({ copy, locale }: PublicShellProps) {
  return (
    <main className="site-shell">
      <header className="site-header">
        <Link className="brand" href={copy.homeHref} aria-label="Nobel ITBS home">
          <span className="brand-mark" aria-hidden="true">
            N
          </span>
          <span>Nobel ITBS</span>
        </Link>

        <nav className="nav" aria-label={copy.navLabel}>
          {copy.nav.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <nav className="locale-switcher" aria-label={copy.localeLabel}>
          {localeLinks.map((item) => (
            <Link key={item.locale} href={item.href} aria-current={item.locale === locale ? 'page' : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <section className="hero" aria-labelledby="home-title">
        <div className="hero-copy">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 id="home-title">{copy.title}</h1>
          <p className="lead">{copy.lead}</p>
          <div className="hero-actions">
            <Link className="button primary" href={copy.primary.href}>
              {copy.primary.label}
            </Link>
            <Link className="button secondary" href={copy.secondary.href}>
              {copy.secondary.label}
            </Link>
          </div>
        </div>

        <aside className="trust-panel" aria-label={copy.panelLabel}>
          <div className="panel-header">{copy.panelTitle}</div>
          <div className="panel-body">
            {copy.signals.map((signal) => (
              <div className="signal" key={signal.title}>
                <span className="signal-icon" aria-hidden="true">
                  {signal.icon}
                </span>
                <p>
                  <strong>{signal.title}</strong>
                  <span>{signal.text}</span>
                </p>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="foundation-band" aria-label={copy.foundationLabel}>
        <div className="foundation-grid">
          {copy.foundation.map((item) => (
            <article className="foundation-item" key={item.title}>
              <span>{item.kicker}</span>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
