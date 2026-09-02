import Link from 'next/link';
import type { StructuredContentPage } from '@/lib/content/pages';
import type { ContentLocale } from '@/lib/content/localization';
import { localizePublicPath } from '@/lib/content/localization';
import type { PartnerCard } from '@/lib/partners/types';
import type { ExpertCard } from '@/lib/experts/types';
import { ExpertCards } from './expert-cards';
import { PublicFooter } from './public-footer';
import { PartnerLogoImage } from './partner-logo-image';
import { PublicResponsiveHeader, type PublicNavSection } from './public-responsive-header';
import { PublicEnquiryForm } from './public-enquiry-form';

type ContentBlock = {
  key: string;
  title: string;
  body?: string;
  items?: string[];
  fields?: Record<string, string>;
  cards?: Array<{ title: string; body?: string; items?: string[]; fields?: Record<string, string> }>;
};

function textValues(fields: Record<string, string> = {}): string[] {
  const hidden = new Set(['h1', 'h2', 'heading', 'title', 'eyebrow', 'primary_cta', 'primary_cta_target', 'secondary_cta', 'secondary_cta_target', 'cta', 'cta_target', 'section_cta', 'fallback_cta', 'official_url', 'asset_status', 'publication_status']);
  return Object.entries(fields)
    .filter(([key, value]) => {
      if (!value || hidden.has(key) || key.endsWith('_title')) return false;
      if (key.endsWith('_body') && fields[`${key.slice(0, -5)}_title`]) return false;
      return true;
    })
    .map(([, value]) => value);
}

function pairedValues(fields: Record<string, string> = {}) {
  return Object.entries(fields).flatMap(([key, title]) => {
    if (!key.endsWith('_title') || !title) return [];
    const pairKey = key.slice(0, -6);
    const body = fields[`${pairKey}_body`];
    return body ? [{ key: pairKey, title, body }] : [];
  });
}

function ManagedList({ items }: { items?: string[] }) {
  if (!items?.length) return null;
  return <ul className="managed-list">{items.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul>;
}

function PairedContent({ fields }: { fields?: Record<string, string> }) {
  const pairs = pairedValues(fields);
  if (!pairs.length) return null;
  if (pairs.every((pair) => /^step_\d+$/.test(pair.key))) {
    return (
      <ol className="managed-process-list">
        {pairs.map((pair) => <li key={pair.key}><h3>{pair.title}</h3><p>{pair.body}</p></li>)}
      </ol>
    );
  }
  return (
    <dl className="managed-detail-list">
      {pairs.map((pair) => <div key={pair.key}><dt>{pair.title}</dt><dd>{pair.body}</dd></div>)}
    </dl>
  );
}

function headingFor(block: ContentBlock): string {
  return block.fields?.h2 || block.fields?.heading || block.fields?.title || block.title;
}

function localizedTarget(target: string | undefined, locale: ContentLocale, fallback: string): string {
  if (!target?.startsWith('/')) return localizePublicPath(locale, fallback);
  return localizePublicPath(locale, target);
}

const managedPageSections: Record<string, PublicNavSection> = {
  about: '/about',
  for_organisations: '/for-organisations',
  partnerships: '/partnerships',
};

const partnerSectionCopy: Record<ContentLocale, { eyebrow: string; title: string }> = {
  en: { eyebrow: 'Partners', title: 'Partner organisations' },
  ua: { eyebrow: 'Партнери', title: 'Організації-партнери' },
  cz: { eyebrow: 'Partneři', title: 'Partnerské organizace' },
};

export function ManagedContentPage({ page, locale, partners = [], experts = [], primaryHrefOverride }: {
  page: StructuredContentPage;
  locale: ContentLocale;
  partners?: PartnerCard[];
  experts?: ExpertCard[];
  primaryHrefOverride?: string | null;
}) {
  const blocks = Array.isArray(page.sections.blocks) ? page.sections.blocks as ContentBlock[] : [];
  const hero = blocks[0];
  const heroFields = hero?.fields ?? {};
  const primaryLabel = heroFields.primary_cta || (locale === 'ua' ? 'Переглянути програми' : locale === 'cz' ? 'Prohlédnout programy' : 'Explore programmes');
  const primaryTarget = primaryHrefOverride
    || (page.pageKey === 'for_organisations' || page.pageKey === 'partnerships'
      ? '#contact'
      : localizedTarget(heroFields.primary_cta_target, locale, '/programmes'));
  const enquiryType = page.pageKey === 'about' ? 'general'
    : page.pageKey === 'partnerships' ? 'partner_enquiry'
      : page.pageKey === 'for_organisations' ? 'organisation_enquiry' : null;
  const currentSection = managedPageSections[page.pageKey];
  const currentPath = currentSection ?? '/';

  return (
    <div className="managed-page">
      <PublicResponsiveHeader
        className="managed-public-header"
        currentSection={currentSection}
        locale={locale}
        localeHrefs={{
          en: localizePublicPath('en', currentPath),
          ua: localizePublicPath('ua', currentPath),
          cz: localizePublicPath('cz', currentPath),
        }}
      />

      <main id="main-content" tabIndex={-1}>
      <section className="managed-hero">
        <p className="eyebrow">{heroFields.eyebrow || hero?.title}</p>
        <h1>{page.h1}</h1>
        {heroFields.lead ? <p className="managed-lead">{heroFields.lead}</p> : null}
        {heroFields.supporting_text || heroFields.supporting_copy ? <p>{heroFields.supporting_text || heroFields.supporting_copy}</p> : null}
        <Link className="button primary" href={primaryTarget}>{primaryLabel}<span aria-hidden="true">→</span></Link>
      </section>

      {blocks.slice(1).map((block, index) => (
        <section className="managed-section" key={`${block.key}-${index}`}>
          {block.fields?.eyebrow ? <p className="eyebrow">{block.fields.eyebrow}</p> : null}
          <h2>{headingFor(block)}</h2>
          {textValues(block.fields).map((value, valueIndex) => <p key={valueIndex}>{value}</p>)}
          <ManagedList items={block.items} />
          {block.body ? <p>{block.body}</p> : null}
          <PairedContent fields={block.fields} />
          {block.cards?.length ? (
            <div className="managed-card-grid">
              {block.cards.map((card, cardIndex) => (
                <article key={`${card.title}-${cardIndex}`}>
                  <h3>{card.fields?.title || card.title}</h3>
                  {textValues(card.fields).map((value, valueIndex) => <p key={valueIndex}>{value}</p>)}
                  <ManagedList items={card.items} />
                  {card.body ? <p>{card.body}</p> : null}
                  <PairedContent fields={card.fields} />
                </article>
              ))}
            </div>
          ) : null}
        </section>
      ))}

      {page.pageKey === 'partnerships' && partners.length ? (
        <section className="managed-section">
          <p className="eyebrow">{partnerSectionCopy[locale].eyebrow}</p>
          <h2>{partnerSectionCopy[locale].title}</h2>
          <div className="managed-card-grid">
            {partners.map((partner) => (
              <a className="managed-partner-card" href={partner.officialUrl} key={partner.slug} rel="noreferrer" target="_blank">
                <PartnerLogoImage
                  className="managed-partner-logo"
                  partner={partner}
                  sizes="(max-width: 700px) calc(100vw - 5.5rem), (max-width: 1100px) 22rem, 20rem"
                />
                <h3>{partner.name}</h3><p>{partner.role}</p>{partner.location ? <p>{partner.location}</p> : null}
              </a>
            ))}
          </div>
        </section>
      ) : null}
      {page.pageKey === 'partnerships' && experts.length ? (
        <div className="managed-experts-section">
          <ExpertCards experts={experts} />
        </div>
      ) : null}
      {enquiryType ? <PublicEnquiryForm locale={locale} type={enquiryType} /> : null}
      </main>

      <PublicFooter locale={locale} currentHref={localizePublicPath(locale, currentPath)} />
    </div>
  );
}
