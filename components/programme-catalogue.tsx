import Link from 'next/link';
import type { ContentLocale } from '@/lib/content/localization';
import { localizePublicPath } from '@/lib/content/localization';
import { programmeCatalogueCopy } from '@/lib/programmes/catalogue-copy';
import type { ProgrammeCatalogueItem } from '@/lib/programmes/catalogue-types';
import { PublicFooter } from './public-footer';
import { PublicResponsiveHeader } from './public-responsive-header';

type ProgrammeCatalogueProps = {
  locale: ContentLocale;
  programmes: ProgrammeCatalogueItem[];
};

export function ProgrammeCatalogue({ locale, programmes }: ProgrammeCatalogueProps) {
  const copy = programmeCatalogueCopy[locale];
  const programmePath = (slug: string) => localizePublicPath(locale, `/programmes/${slug}`);

  return (
    <div className="catalogue-page">
      <PublicResponsiveHeader
        className="catalogue-header"
        currentSection="/programmes"
        locale={locale}
        localeHrefs={{
          en: localizePublicPath('en', '/programmes'),
          ua: localizePublicPath('ua', '/programmes'),
          cz: localizePublicPath('cz', '/programmes'),
        }}
      />

      <main id="main-content" tabIndex={-1}>
      <section className="catalogue-intro" aria-labelledby="catalogue-title">
        <div className="catalogue-intro-heading">
          <p className="eyebrow">{copy.eyebrow}</p>
          <h1 id="catalogue-title">{copy.title}</h1>
        </div>
        <div className="catalogue-intro-copy">
          <p className="catalogue-lead">{copy.lead}</p>
          <p>{copy.intro}</p>
          <span>{copy.programmeCount(programmes.length)}</span>
        </div>
      </section>

      <section className="catalogue-list" aria-label={copy.title}>
        {programmes.length === 0 ? (
          <div className="catalogue-empty">
            <h2>{copy.empty.title}</h2>
            <p>{copy.empty.body}</p>
            <Link className="button primary" href={localizePublicPath(locale, '/contact')}>
              {copy.empty.cta}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        ) : (
          programmes.map((programme, index) => (
            <article className={`catalogue-card ${programme.featured || index === 0 ? 'catalogue-card-featured' : ''}`} key={programme.slug}>
              <div className="catalogue-card-index" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </div>

              <div className="catalogue-card-main">
                <div className="catalogue-card-status">
                  <span data-status={programme.enrolmentBadge}>{copy.badgeLabels[programme.enrolmentBadge]}</span>
                  {programme.currentRunStartsAt ? <small>{copy.startDate(programme.currentRunStartsAt)}</small> : null}
                </div>

                <div className="catalogue-taxonomy">
                  <Link href={programmePath(programme.area.slug)}>{programme.area.title}</Link>
                  <span aria-hidden="true">/</span>
                  <Link href={programmePath(programme.type.slug)}>{programme.type.title}</Link>
                </div>

                <h2>
                  <Link href={programmePath(programme.slug)}>{programme.title}</Link>
                </h2>
                <p className="catalogue-description">{programme.description}</p>
                <p className="catalogue-facts">{programme.facts}</p>
              </div>

              <div className="catalogue-card-document">
                <span>{copy.documentLabel}</span>
                <p>{programme.documentSummary}</p>
                <Link className="catalogue-card-cta" href={programmePath(programme.slug)}>
                  {copy.viewProgramme}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          ))
        )}
      </section>
      </main>

      <PublicFooter locale={locale} currentHref={localizePublicPath(locale, '/programmes')} />
    </div>
  );
}
