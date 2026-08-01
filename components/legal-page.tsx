import Image from 'next/image';
import Link from 'next/link';
import type { Locale } from '@/lib/i18n';
import type { LegalPageCopy } from '@/lib/legal-content';
import { PrintButton } from './print-button';

type LegalPageProps = {
  copy: LegalPageCopy;
  locale: Locale;
};

export function LegalPage({ copy, locale }: LegalPageProps) {
  return (
    <main className="legal-page">
      <header className="site-header legal-header">
        <Link className="brand" href={copy.homeHref} aria-label="Nobel ITBS home">
          <Image src="/brand/nobel-logo-full-horizontal-web.svg" width={230} height={54} alt="Nobel ITBS" priority />
        </Link>

        <div className="header-actions">
          <nav className="locale-switcher legal-locales" aria-label="Language">
            {copy.localeLinks.map((item) => (
              <Link key={item.locale} href={item.href} aria-current={item.locale === locale ? 'page' : undefined}>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <section className="legal-hero" aria-labelledby="legal-title">
        <div>
          <p className="eyebrow dark">{copy.eyebrow}</p>
          <h1 id="legal-title">{copy.title}</h1>
          <p>{copy.description}</p>
        </div>
        <aside className="legal-meta-panel" aria-label={copy.versionLabel}>
          <span>{copy.versionLabel}</span>
          <p>{copy.effectiveDate}</p>
          <p>{copy.languageNotice}</p>
          <PrintButton label={copy.printLabel} />
        </aside>
      </section>

      <section className="legal-shell">
        <aside className="legal-related" aria-label="Related legal documents">
          <Link href={copy.homeHref}>← {copy.backLabel}</Link>
          {copy.related.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </aside>

        <article className="legal-document">
          {copy.blocks.map((block, index) => {
            if (block.type === 'heading') {
              const Heading = block.level === 2 ? 'h2' : 'h3';
              return <Heading key={`${block.text}-${index}`}>{block.text}</Heading>;
            }

            if (block.type === 'list') {
              return (
                <ul key={`list-${index}`}>
                  {block.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              );
            }

            return <p key={`${block.text}-${index}`}>{block.text}</p>;
          })}
        </article>
      </section>
    </main>
  );
}
