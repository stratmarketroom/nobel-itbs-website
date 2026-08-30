import Link from 'next/link';
import type { ContentLocale } from '@/lib/content/localization';
import { localizePublicPath } from '@/lib/content/localization';
import { programmeCatalogueCopy } from '@/lib/programmes/catalogue-copy';
import type { ProgrammeCatalogueItem } from '@/lib/programmes/catalogue-types';
import type { ProgrammeLandingEntity, ProgrammeNamespaceEntity, ProgrammeSection, TaxonomyLandingEntity } from '@/lib/programmes/landing-types';
import { programmeQuestionCopy } from '@/lib/contact/programme-question';
import { ProgrammeQuestionForm } from './programme-question-form';
import { PublicFooter } from './public-footer';
import { PublicResponsiveHeader } from './public-responsive-header';
import { StructuredContent } from './structured-content';

type ProgrammeLandingProps = {
  entity: ProgrammeNamespaceEntity;
  locale: ContentLocale;
};

const ui = {
  en: { catalogue: 'All programmes', view: 'View programme', facts: 'Programme facts', document: 'Documents and completion', pricing: 'Choose your option', related: 'Related programmes', contact: 'Contact', question: 'Ask a question' },
  ua: { catalogue: 'Усі програми', view: 'Переглянути програму', facts: 'Факти про програму', document: 'Документи та завершення', pricing: 'Оберіть свій варіант', related: 'Пов’язані програми', contact: 'Контакти', question: 'Поставити запитання' },
  cz: { catalogue: 'Všechny programy', view: 'Zobrazit program', facts: 'Informace o programu', document: 'Dokumenty a dokončení', pricing: 'Vyberte si variantu', related: 'Související programy', contact: 'Kontakt', question: 'Položit dotaz' },
} satisfies Record<ContentLocale, Record<string, string>>;

function pagePath(locale: ContentLocale, slug?: string): string {
  return localizePublicPath(locale, slug ? `/programmes/${slug}` : '/programmes');
}

function PublicHeader({ locale, slug }: { locale: ContentLocale; slug: string }) {
  return (
    <PublicResponsiveHeader
      className="landing-header"
      currentSection="/programmes"
      locale={locale}
      localeHrefs={{
        en: pagePath('en', slug),
        ua: pagePath('ua', slug),
        cz: pagePath('cz', slug),
      }}
    />
  );
}

function PrimaryCta({ entity, locale, className = 'button primary' }: { entity: ProgrammeLandingEntity; locale: ContentLocale; className?: string }) {
  const label = entity.primaryCtaLabel || ui[locale].question;
  const href = entity.primaryCtaUrl ?? '#programme-question';
  const external = entity.primaryCtaUrl !== null;
  return (
    <a className={className} href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>
      {label}
      <span aria-hidden="true">→</span>
    </a>
  );
}

function QuestionCta({ locale }: { locale: ContentLocale }) {
  return <a className="button programme-question-link" href="#programme-question">{ui[locale].question}<span aria-hidden="true">↓</span></a>;
}

function sectionValues(section: ProgrammeSection): string[] {
  if (!section.fields) return [];
  return Object.entries(section.fields)
    .filter(([key, value]) => key !== 'asset_status' && typeof value === 'string' && value.trim())
    .map(([, value]) => value as string);
}

function ProgrammeContentSection({ section, id, tone = 'light' }: { section?: ProgrammeSection; id: string; tone?: 'light' | 'soft' | 'dark' }) {
  if (!section || (!section.heading && !section.content && sectionValues(section).length === 0)) return null;
  return (
    <section className={`sales-section sales-section-${tone}`} id={id}>
      <div className="sales-section-heading">
        <span aria-hidden="true">Nobel ITBS</span>
        {section.heading ? <h2>{section.heading}</h2> : null}
      </div>
      <div className="sales-section-body">
        {sectionValues(section).map((value) => <p className="sales-field-value" key={value}>{value}</p>)}
        {section.content ? <StructuredContent className="structured-copy" content={section.content} /> : null}
      </div>
    </section>
  );
}

function RelatedProgramme({ programme, locale, index }: { programme: ProgrammeCatalogueItem; locale: ContentLocale; index: number }) {
  const copy = programmeCatalogueCopy[locale];
  return (
    <article className="related-programme">
      <span className="related-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <div>
        <span className="related-status">{copy.badgeLabels[programme.enrolmentBadge]}</span>
        <h3><Link href={pagePath(locale, programme.slug)}>{programme.title}</Link></h3>
        <p>{programme.description}</p>
        <small>{programme.facts}</small>
      </div>
      <Link className="related-link" href={pagePath(locale, programme.slug)}>
        {ui[locale].view}<span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}

function ProgrammePage({ entity, locale }: { entity: ProgrammeLandingEntity; locale: ContentLocale }) {
  const copy = programmeCatalogueCopy[locale];
  const facts = entity.sections.facts;
  const faq = entity.sections.faq;
  const closing = entity.sections.closing_cta;
  const documentSection = entity.sections.assessment_document;
  const optionalKeys = ['expert', 'final_project', 'academic_context', 'official_context', 'partnership_model', 'professional_boundary', 'current_cohort'] as const;

  return (
    <>
      <section className={`sales-hero sales-hero-${entity.slug}`} aria-labelledby="programme-title">
        <div className="landing-breadcrumbs">
          <Link href={pagePath(locale)}>{ui[locale].catalogue}</Link><span>/</span>
          <Link href={pagePath(locale, entity.area.slug)}>{entity.area.title}</Link><span>/</span>
          <Link href={pagePath(locale, entity.type.slug)}>{entity.type.title}</Link>
        </div>
        <div className="sales-hero-layout">
          <div className="sales-hero-copy">
            <p className="eyebrow">{entity.eyebrow}</p>
            <div className="sales-status-row">
              <span>{copy.badgeLabels[entity.enrolmentBadge]}</span>
              {entity.currentRunStartsAt ? <small>{copy.startDate(entity.currentRunStartsAt)}</small> : null}
            </div>
            <h1 id="programme-title">{entity.title}</h1>
            <p className="sales-lead">{entity.summary}</p>
            <p className="sales-supporting">{entity.heroCopy}</p>
            <div className="sales-cta-group">
              <PrimaryCta entity={entity} locale={locale} />
              {entity.primaryCtaUrl ? <QuestionCta locale={locale} /> : null}
            </div>
          </div>
          {facts?.content ? (
            <aside className="sales-facts" aria-label={ui[locale].facts}>
              <span>{ui[locale].facts}</span>
              <StructuredContent content={facts.content} />
            </aside>
          ) : null}
        </div>
      </section>

      <ProgrammeContentSection section={entity.sections.value} id="value" />

      <div className="sales-duo">
        <ProgrammeContentSection section={entity.sections.audience} id="audience" tone="soft" />
        <ProgrammeContentSection section={entity.sections.outcomes} id="outcomes" tone="soft" />
      </div>

      <ProgrammeContentSection section={entity.sections.curriculum} id="curriculum" tone="dark" />
      <ProgrammeContentSection section={entity.sections.learning_experience} id="learning_experience" />

      {optionalKeys.map((key, index) => (
        <ProgrammeContentSection key={key} section={entity.sections[key]} id={key} tone={index % 2 === 0 ? 'soft' : 'light'} />
      ))}

      <ProgrammeContentSection section={documentSection} id="documents" tone="dark" />

      {entity.pricingOptions.length > 0 ? (
        <section className="pricing-section" aria-labelledby="pricing-title">
          <p className="eyebrow dark">{ui[locale].pricing}</p>
          <h2 id="pricing-title">{ui[locale].pricing}</h2>
          <div className={`pricing-grid pricing-grid-${Math.min(entity.pricingOptions.length, 3)}`}>
            {entity.pricingOptions.map((option) => (
              <article key={option.id}>
                <h3>{option.title}</h3>
                <p>{option.description}</p>
                {option.price !== null && option.currencyCode ? (
                  <strong>{new Intl.NumberFormat(locale === 'ua' ? 'uk-UA' : locale === 'cz' ? 'cs-CZ' : 'en-GB', { style: 'currency', currency: option.currencyCode, maximumFractionDigits: 0 }).format(option.price)}</strong>
                ) : null}
                <a href={option.applicationUrl ?? entity.primaryCtaUrl ?? '#programme-question'}>
                  {option.ctaLabel}<span aria-hidden="true">→</span>
                </a>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {faq?.items && faq.items.length > 0 ? (
        <section className="faq-section" aria-labelledby="faq-title">
          <div><p className="eyebrow dark">FAQ</p><h2 id="faq-title">{faq.heading ?? 'FAQ'}</h2></div>
          <div className="faq-list">
            {faq.items.map((item) => (
              <details key={item.question}>
                <summary>{item.question}<span aria-hidden="true">+</span></summary>
                <StructuredContent content={item.answer} />
              </details>
            ))}
          </div>
        </section>
      ) : null}

      <section className="programme-question-section" id="programme-question" aria-labelledby="programme-question-title">
        <div className="programme-question-intro">
          <p className="eyebrow dark">Nobel ITBS</p>
          <h2 id="programme-question-title">{programmeQuestionCopy[locale].title(entity.title)}</h2>
          <p>{programmeQuestionCopy[locale].intro}</p>
        </div>
        <ProgrammeQuestionForm programmeSlug={entity.slug} programmeTitle={entity.title} locale={locale} />
      </section>

      <section className="sales-closing">
        <div>
          <p className="eyebrow">Nobel ITBS</p>
          <h2>{closing?.heading ?? entity.title}</h2>
          {sectionValues(closing ?? {}).map((value) => <p key={value}>{value}</p>)}
          {closing?.content ? <StructuredContent content={closing.content} /> : null}
          <div className="sales-cta-group">
            <PrimaryCta entity={entity} locale={locale} />
            {entity.primaryCtaUrl ? <QuestionCta locale={locale} /> : null}
          </div>
        </div>
      </section>
    </>
  );
}

function TaxonomyPage({ entity, locale }: { entity: TaxonomyLandingEntity; locale: ContentLocale }) {
  return (
    <>
      <section className={`taxonomy-hero taxonomy-hero-${entity.kind}`} aria-labelledby="taxonomy-title">
        <div className="landing-breadcrumbs"><Link href={pagePath(locale)}>{ui[locale].catalogue}</Link><span>/</span><span>{entity.title}</span></div>
        <div className="taxonomy-hero-layout">
          <div><p className="eyebrow">{entity.eyebrow}</p><h1 id="taxonomy-title">{entity.title}</h1></div>
          <div><p className="taxonomy-lead">{entity.lead}</p>{entity.supportingCopy ? <p>{entity.supportingCopy}</p> : null}<a className="button primary" href="#related-programmes">{entity.primaryCtaLabel}<span aria-hidden="true">↓</span></a></div>
        </div>
      </section>

      <section className="taxonomy-intro">
        <span aria-hidden="true">01</span>
        <div><h2>{entity.sections.introHeading}</h2><StructuredContent className="structured-copy" content={entity.sections.introContent} /></div>
      </section>

      <section className="taxonomy-capabilities">
        <div><span aria-hidden="true">02</span><h2>{entity.sections.audienceHeading}</h2><ul>{entity.sections.audienceItems.map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div><span aria-hidden="true">03</span><h2>{entity.sections.outcomesHeading}</h2><ul>{entity.sections.outcomesItems.map((item) => <li key={item}>{item}</li>)}</ul></div>
      </section>

      <section className="related-section" id="related-programmes" aria-labelledby="related-title">
        <div className="related-heading"><p className="eyebrow dark">{ui[locale].related}</p><h2 id="related-title">{entity.sections.listingHeading}</h2><p>{entity.sections.listingIntro}</p></div>
        <div className="related-list">
          {entity.programmes.length > 0
            ? entity.programmes.map((programme, index) => <RelatedProgramme key={programme.slug} programme={programme} locale={locale} index={index} />)
            : <div className="catalogue-empty"><h3>{entity.sections.emptyHeading}</h3><p>{entity.sections.emptyBody}</p></div>}
        </div>
      </section>

      <section className="taxonomy-closing"><div><h2>{entity.sections.closingHeading}</h2><p>{entity.sections.closingCopy}</p><Link className="button primary" href={pagePath(locale)}>{entity.sections.closingLabel}<span aria-hidden="true">→</span></Link></div></section>
    </>
  );
}

export function ProgrammeLanding({ entity, locale }: ProgrammeLandingProps) {
  return (
    <main className="landing-page" lang={entity.renderedLocale === 'ua' ? 'uk' : entity.renderedLocale === 'cz' ? 'cs' : 'en'}>
      <PublicHeader locale={locale} slug={entity.slug} />
      {entity.kind === 'programme' ? <ProgrammePage entity={entity} locale={locale} /> : <TaxonomyPage entity={entity} locale={locale} />}
      <PublicFooter locale={locale} />
    </main>
  );
}
