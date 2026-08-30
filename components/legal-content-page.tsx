import type { StructuredContentPage } from '@/lib/content/pages';
import type { ContentLocale } from '@/lib/content/localization';
import { localizePublicPath } from '@/lib/content/localization';
import { PublicFooter } from './public-footer';
import { PublicResponsiveHeader } from './public-responsive-header';

type LegalBlock = { heading: string; paragraphs: string[] };

export function LegalContentPage({ page, locale }: { page: StructuredContentPage; locale: ContentLocale }) {
  const blocks = Array.isArray(page.sections.blocks) ? page.sections.blocks as LegalBlock[] : [];
  const slug = typeof page.sections.slug === 'string' ? page.sections.slug : '';
  const legalPath = slug ? `/${slug}` : '/';
  return <div className="legal-page">
    <PublicResponsiveHeader
      className="managed-public-header legal-public-header"
      locale={locale}
      localeHrefs={{
        en: localizePublicPath('en', legalPath),
        ua: localizePublicPath('ua', legalPath),
        cz: localizePublicPath('cz', legalPath),
      }}
    />
    <main id="main-content" tabIndex={-1}>
    <article className="legal-document">
      <p className="eyebrow">Nobel ITBS s.r.o.</p><h1>{page.h1}</h1>
      {blocks.map((block, index) => <section key={`${block.heading}-${index}`}>
        {block.heading ? <h2>{block.heading}</h2> : null}
        {block.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}
      </section>)}
    </article>
    </main>
    <PublicFooter locale={locale} currentHref={localizePublicPath(locale, legalPath)} />
  </div>;
}
