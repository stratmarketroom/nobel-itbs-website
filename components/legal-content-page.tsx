import Link from 'next/link';
import type { StructuredContentPage } from '@/lib/content/pages';
import type { ContentLocale } from '@/lib/content/localization';
import { localizePublicPath } from '@/lib/content/localization';

type LegalBlock = { heading: string; paragraphs: string[] };

export function LegalContentPage({ page, locale }: { page: StructuredContentPage; locale: ContentLocale }) {
  const blocks = Array.isArray(page.sections.blocks) ? page.sections.blocks as LegalBlock[] : [];
  const slug = typeof page.sections.slug === 'string' ? page.sections.slug : '';
  return <main className="legal-page">
    <header className="managed-header">
      <Link className="managed-brand" href={localizePublicPath(locale, '/')}>NOBEL <span>ITBS</span></Link>
      <nav aria-label="Primary navigation"><Link href={localizePublicPath(locale, '/programmes')}>Programmes</Link><Link href={localizePublicPath(locale, '/about')}>About Us</Link><Link href={localizePublicPath(locale, '/verify')}>Verify</Link></nav>
      <nav aria-label="Language"><Link href={`/${slug}`}>EN</Link><Link href={`/ua/${slug}`}>UA</Link><Link href={`/cz/${slug}`}>CZ</Link></nav>
    </header>
    <article className="legal-document">
      <p className="eyebrow">Nobel ITBS s.r.o.</p><h1>{page.h1}</h1>
      {blocks.map((block, index) => <section key={`${block.heading}-${index}`}>
        {block.heading ? <h2>{block.heading}</h2> : null}
        {block.paragraphs.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}
      </section>)}
    </article>
    <footer className="managed-footer">
      <strong>Nobel ITBS s.r.o.</strong><span>Praha, Czech Republic</span><a href="mailto:info@nobel-itbs.eu">info@nobel-itbs.eu</a>
      <Link href={localizePublicPath(locale, '/privacy-policy')}>Privacy Policy</Link>
      <Link href={localizePublicPath(locale, '/terms-of-use')}>Terms of Use</Link>
      <Link href={localizePublicPath(locale, '/refund-policy')}>Refund Policy</Link>
    </footer>
  </main>;
}
