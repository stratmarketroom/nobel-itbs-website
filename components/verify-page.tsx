import Image from 'next/image';
import Link from 'next/link';
import type { Locale, VerifyCopy } from '@/lib/i18n';

type VerifyPageProps = {
  copy: VerifyCopy;
  locale: Locale;
};

export function VerifyPage({ copy, locale }: VerifyPageProps) {
  const verifyItem = copy.nav.find((item) => item.href.endsWith('/verify') || item.href === '/verify');
  const visibleNav = copy.nav.filter((item) => item.label !== verifyItem?.label);

  return (
    <main className="verify-page">
      <header className="site-header verify-header">
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
          <nav className="locale-switcher verify-locales" aria-label={copy.localeLabel}>
            {copy.localeLinks.map((item) => (
              <Link key={item.locale} href={item.href} aria-current={item.locale === locale ? 'page' : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <section className="verify-hero" aria-labelledby="verify-title">
        <div>
          <p className="eyebrow dark">{copy.hero.eyebrow}</p>
          <h1 id="verify-title">{copy.hero.title}</h1>
          <p className="verify-lead">{copy.hero.lead}</p>
        </div>
        <form className="verify-form" action="#verification-states" method="get">
          <label htmlFor="document-number">{copy.form.fieldLabel}</label>
          <div>
            <input id="document-number" name="documentNumber" placeholder={copy.form.placeholder} autoComplete="off" />
            <button type="submit">{copy.form.submit}</button>
          </div>
          <p>{copy.form.helper}</p>
        </form>
        <p className="verify-instruction">{copy.hero.instruction}</p>
      </section>

      <section className="verify-state-map" id="verification-states" aria-labelledby="states-title">
        <div className="verify-state-heading">
          <p className="eyebrow dark">{copy.states.resultEyebrow}</p>
          <h2 id="states-title">{copy.states.heading}</h2>
        </div>
        <div className="verify-state-grid">
          <article className="state-card state-valid">
            <span>{copy.states.valid.statusLabel}</span>
            <h3>{copy.states.valid.heading}</h3>
            <p>{copy.states.valid.body}</p>
            <dl>
              {copy.states.valid.fields.map((field) => (
                <div key={field}>
                  <dt>{field}</dt>
                  <dd>{copy.states.validFieldNote}</dd>
                </div>
              ))}
            </dl>
            <p>{copy.states.valid.note}</p>
          </article>
          <article className="state-card state-revoked">
            <span>{copy.states.revoked.statusLabel}</span>
            <h3>{copy.states.revoked.heading}</h3>
            <p>{copy.states.revoked.body}</p>
          </article>
          <article className="state-card">
            <span>{copy.states.notFoundStatus}</span>
            <h3>{copy.states.notFound.heading}</h3>
            <p>{copy.states.notFound.body}</p>
            <p>{copy.states.notFound.helper}</p>
          </article>
        </div>
      </section>

      <section className="verify-system-states section-band" aria-labelledby="system-states-title">
        <div className="split-heading">
          <div>
            <p className="eyebrow dark">{copy.states.systemEyebrow}</p>
            <h2 id="system-states-title">{copy.states.systemHeading}</h2>
          </div>
        </div>
        <div className="verify-system-grid">
          {[copy.states.rateLimit, copy.states.temporaryError, copy.states.connectionError].map((state) => (
            <article key={state.heading}>
              <h3>{state.heading}</h3>
              <p>{state.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="verify-privacy" aria-labelledby="privacy-title">
        <div>
          <p className="eyebrow">{copy.privacyRules.heading}</p>
          <h2 id="privacy-title">{copy.privacyRules.heading}</h2>
        </div>
        <ul>
          {copy.privacyRules.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
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

export function VerifyTokenPage({ copy, locale }: VerifyPageProps) {
  return (
    <main className="verify-page">
      <header className="site-header verify-header">
        <Link className="brand" href={copy.homeHref} aria-label="Nobel ITBS home">
          <Image src="/brand/nobel-logo-full-horizontal-web.svg" width={230} height={54} alt="Nobel ITBS" priority />
        </Link>
        <nav className="locale-switcher verify-locales" aria-label={copy.localeLabel}>
          {copy.localeLinks.map((item) => (
            <Link key={item.locale} href={item.href} aria-current={item.locale === locale ? 'page' : undefined}>
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <section className="verify-token-placeholder" aria-labelledby="token-title">
        <p className="eyebrow dark">{copy.tokenResult.eyebrow}</p>
        <h1 id="token-title">{copy.tokenResult.heading}</h1>
        <p>{copy.tokenResult.body}</p>
        <Link className="button primary" href={copy.tokenResult.manualCta.href}>
          {copy.tokenResult.manualCta.label}
          <span aria-hidden="true">→</span>
        </Link>
      </section>
    </main>
  );
}
