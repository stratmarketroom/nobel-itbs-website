import Image from 'next/image';
import Link from 'next/link';
import { ProgrammeQuestionBlock } from '@/components/programme-question-block';
import type { Locale, ProgrammeDetailCopy } from '@/lib/i18n';

type ProgrammeDetailProps = {
  copy: ProgrammeDetailCopy;
  locale: Locale;
};

export function ProgrammeDetail({ copy, locale }: ProgrammeDetailProps) {
  const verifyItem = copy.nav.find((item) => item.href.endsWith('/verify') || item.href === '/verify');
  const visibleNav = copy.nav.filter((item) => item.label !== verifyItem?.label);

  return (
    <main className="programme-detail-page">
      <header className="site-header programme-detail-header">
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
            <Link className="verify-nav-button programme-detail-verify" href={verifyItem.href}>
              {verifyItem.label}
            </Link>
          ) : null}
          <nav className="locale-switcher programme-detail-locales" aria-label={copy.localeLabel}>
            {copy.localeLinks.map((item) => (
              <Link key={item.locale} href={item.href} aria-current={item.locale === locale ? 'page' : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <section className="programme-detail-hero" aria-labelledby="programme-title">
        <Link className="back-link" href={copy.backLink.href}>
          ← {copy.backLink.label}
        </Link>
        <div className="programme-detail-hero-grid">
          <div>
            <p className="eyebrow">{copy.hero.eyebrow}</p>
            <h1 id="programme-title">{copy.hero.title}</h1>
            <p className="programme-detail-lead">{copy.hero.lead}</p>
          </div>
          <aside className="programme-apply-panel" aria-label={copy.hero.primaryCta.label}>
            <p>{copy.hero.supportingCopy}</p>
            <Link className="button primary" href={copy.hero.primaryCta.href}>
              {copy.hero.primaryCta.label}
              <span aria-hidden="true">→</span>
            </Link>
          </aside>
        </div>
      </section>

      <section className="programme-facts-band" aria-label="Programme facts">
        {copy.facts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </section>

      <section className="programme-value-section section-band" aria-labelledby="value-title">
        <div className="editorial-heading">
          <p className="eyebrow dark">Programme value</p>
          <h2 id="value-title">{copy.value.heading}</h2>
          <p>{copy.value.body}</p>
        </div>
        <p className="proof-line">{copy.value.proofLine}</p>
      </section>

      <section className="programme-two-column section-band">
        <article>
          <p className="eyebrow dark">Audience</p>
          <h2>{copy.audience.heading}</h2>
          <ul className="editorial-list">
            {copy.audience.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
        <article>
          <p className="eyebrow dark">Outcomes</p>
          <h2>{copy.outcomes.heading}</h2>
          <ul className="editorial-list">
            {copy.outcomes.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="curriculum-section" aria-labelledby="curriculum-title">
        <div className="curriculum-heading">
          <p className="eyebrow">{copy.curriculum.heading}</p>
          <h2 id="curriculum-title">{copy.learning.heading}</h2>
          <p>{copy.learning.body}</p>
          <p>{copy.learning.platforms}</p>
        </div>
        <ol className="curriculum-list">
          {copy.curriculum.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      </section>

      <section className="programme-expert-project section-band">
        <article className="expert-panel">
          <p className="eyebrow dark">{copy.expert.heading}</p>
          <h2>{copy.expert.name}</h2>
          <p>{copy.expert.bio}</p>
        </article>
        <article className="project-panel">
          <p className="eyebrow dark">{copy.finalProject.heading}</p>
          <p>{copy.finalProject.body}</p>
        </article>
      </section>

      <section className="documents-section section-band" aria-labelledby="documents-title">
        <div className="split-heading">
          <div>
            <p className="eyebrow dark">Documents</p>
            <h2 id="documents-title">{copy.documents.heading}</h2>
          </div>
          <p>{copy.documents.intro}</p>
        </div>
        <div className="document-stage-grid">
          {copy.documents.stages.map((stage) => (
            <article key={stage.title}>
              <h3>{stage.title}</h3>
              <p>{stage.body}</p>
              <ul>
                {stage.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        <article className="document-value">
          <h3>{copy.documents.valueTitle}</h3>
          <ul>
            {copy.documents.valuePoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </article>
      </section>

      <section className="faq-section section-band" aria-labelledby="faq-title">
        <div className="split-heading">
          <div>
            <p className="eyebrow dark">FAQ</p>
            <h2 id="faq-title">Questions before applying</h2>
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

      <ProgrammeQuestionBlock locale={locale} programmeTitle={copy.hero.title} programmeHref={copy.hero.primaryCta.href} />

      <section className="programme-closing" aria-labelledby="programme-closing-title">
        <h2 id="programme-closing-title">{copy.closing.heading}</h2>
        <p>{copy.closing.body}</p>
        <Link className="button primary" href={copy.closing.primaryCta.href}>
          {copy.closing.primaryCta.label}
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
