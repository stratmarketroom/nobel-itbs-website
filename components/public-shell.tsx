import Image from 'next/image';
import Link from 'next/link';
import type { ContentLocale } from '@/lib/content/localization';
import { localizePublicPath } from '@/lib/content/localization';
import type { StructuredContentPage } from '@/lib/content/pages';
import { homeCopy, localeLinks } from '@/lib/i18n';
import { programmeCatalogueCopy } from '@/lib/programmes/catalogue-copy';
import type { ProgrammeCatalogueItem } from '@/lib/programmes/catalogue-types';
import type { PartnerCard } from '@/lib/partners/types';

type ContentCard = {
  title: string;
  body?: string;
  fields?: Record<string, string>;
};

type ContentBlock = {
  key: string;
  title: string;
  body?: string;
  fields?: Record<string, string>;
  cards?: ContentCard[];
};

type PublicShellProps = {
  page: StructuredContentPage;
  locale: ContentLocale;
  programmes: ProgrammeCatalogueItem[];
  partners: PartnerCard[];
};

const chromeCopy: Record<ContentLocale, {
  verifyKicker: string;
  areasCta: string;
  partners: string;
  partnerLead: string;
  contact: string;
  company: string;
  legal: string;
  privacy: string;
  terms: string;
  refunds: string;
  registered: string;
  organisationSecondary: string;
  modelSteps: Array<{ title: string; text: string }>;
}> = {
  en: {
    verifyKicker: 'Verify a document', areasCta: 'View all programmes', partners: 'Our partners',
    partnerLead: 'Academic, education, and programme partners in one professional ecosystem.',
    contact: 'Contact', company: 'Company', legal: 'Legal', privacy: 'Privacy Policy', terms: 'Terms of Use', refunds: 'Refund Policy',
    registered: 'Nobel ITBS s.r.o. · Prague, Czech Republic', organisationSecondary: 'Partnerships',
    modelSteps: [
      { title: 'Choose a programme', text: 'Compare its purpose, content, format, duration, and learning outcome.' },
      { title: 'Complete your learning', text: 'Learn in the format defined by the programme and meet its completion requirements.' },
      { title: 'Receive your document', text: 'The document type and scope are stated on the programme page.' },
      { title: 'Confirm its authenticity', text: 'Registered documents can be verified online by number or QR code.' },
    ],
  },
  ua: {
    verifyKicker: 'Перевірити документ', areasCta: 'Переглянути всі програми', partners: 'Наші партнери',
    partnerLead: 'Академічні, освітні та програмні партнери в одній професійній екосистемі.',
    contact: 'Контакти', company: 'Компанія', legal: 'Правова інформація', privacy: 'Політика конфіденційності', terms: 'Умови використання', refunds: 'Політика повернення коштів',
    registered: 'Nobel ITBS s.r.o. · Прага, Чеська Республіка', organisationSecondary: 'Партнерства',
    modelSteps: [
      { title: 'Обираєте програму', text: 'Порівнюєте мету, зміст, формат, тривалість і результат навчання.' },
      { title: 'Проходите навчання', text: 'Навчаєтеся у визначеному програмою форматі та виконуєте умови завершення.' },
      { title: 'Отримуєте документ', text: 'Вид і обсяг документа зазначаються на сторінці конкретної програми.' },
      { title: 'Підтверджуєте справжність', text: 'Зареєстрований документ можна перевірити онлайн за номером або QR-кодом.' },
    ],
  },
  cz: {
    verifyKicker: 'Ověřit dokument', areasCta: 'Zobrazit všechny programy', partners: 'Naši partneři',
    partnerLead: 'Akademičtí, vzdělávací a programoví partneři v jednom profesním ekosystému.',
    contact: 'Kontakt', company: 'Společnost', legal: 'Právní informace', privacy: 'Zásady ochrany osobních údajů', terms: 'Podmínky použití', refunds: 'Zásady vrácení peněz',
    registered: 'Nobel ITBS s.r.o. · Praha, Česká republika', organisationSecondary: 'Partnerství',
    modelSteps: [
      { title: 'Vyberete si program', text: 'Porovnáte cíl, obsah, formát, délku a výsledek vzdělávání.' },
      { title: 'Absolvujete vzdělávání', text: 'Studujete ve stanoveném formátu a splníte podmínky dokončení.' },
      { title: 'Obdržíte dokument', text: 'Typ a rozsah dokumentu jsou uvedeny na stránce konkrétního programu.' },
      { title: 'Ověříte pravost', text: 'Registrovaný dokument lze ověřit online podle čísla nebo QR kódu.' },
    ],
  },
};

function blocksFor(page: StructuredContentPage): ContentBlock[] {
  return Array.isArray(page.sections.blocks) ? page.sections.blocks as ContentBlock[] : [];
}

function findBlock(blocks: ContentBlock[], key: string): ContentBlock | undefined {
  return blocks.find((block) => block.key === key);
}

function managedValue(value: string | undefined, fallback: string): string {
  const normalized = value?.trim();
  if (!normalized || /^`[^`]+`:$/.test(normalized)) return fallback;
  return normalized;
}

function field(block: ContentBlock | undefined, key: string, fallback: string): string {
  return managedValue(block?.fields?.[key], fallback);
}

function target(value: string | undefined, locale: ContentLocale, fallback: string): string {
  const normalized = value?.replaceAll('`', '').trim();
  if (!normalized || !normalized.startsWith('/')) return localizePublicPath(locale, fallback);
  if (/^\/(ua|cz)(\/|$)/.test(normalized)) return normalized;
  return localizePublicPath(locale, normalized);
}

function heroTitle(title: string, locale: ContentLocale) {
  const accents: Record<ContentLocale, string> = { en: 'that moves', ua: 'що рухає', cz: 'které vás posouvá' };
  const accent = accents[locale];
  const index = title.toLocaleLowerCase().indexOf(accent.toLocaleLowerCase());
  if (index < 0) return <>{title}</>;
  return <>{title.slice(0, index)}<span>{title.slice(index, index + accent.length)}</span>{title.slice(index + accent.length)}</>;
}

function areaCards(
  programmes: ProgrammeCatalogueItem[],
  block: ContentBlock | undefined,
  locale: ContentLocale,
) {
  const shell = homeCopy[locale];
  const contentCards = block?.cards ?? [];
  const areas = new Map<string, { slug: string; title: string; programme: string }>();
  programmes.forEach((programme) => {
    if (!areas.has(programme.area.slug)) areas.set(programme.area.slug, {
      slug: programme.area.slug, title: programme.area.title, programme: programme.title,
    });
  });
  const preferredOrder = ['business-management', 'psychology-human', 'technology-innovation'];
  return [...areas.values()].sort((a, b) => {
    const aIndex = preferredOrder.indexOf(a.slug);
    const bIndex = preferredOrder.indexOf(b.slug);
    return (aIndex < 0 ? Number.MAX_SAFE_INTEGER : aIndex) - (bIndex < 0 ? Number.MAX_SAFE_INTEGER : bIndex);
  }).map((area) => {
    const managedCard = contentCards.find((card) => managedValue(card.fields?.title, card.title) === area.title);
    const staticCard = shell.programmes.items.find((item) => item.href.endsWith(area.slug));
    return {
      ...area,
      description: managedValue(managedCard?.fields?.body || managedCard?.body, staticCard?.text ?? ''),
      featured: managedValue(managedCard?.fields?.featured_programme, area.programme),
    };
  });
}

function trustItems(block: ContentBlock | undefined, locale: ContentLocale) {
  if (block?.cards?.length) {
    return block.cards.map((card) => ({
      title: managedValue(card.fields?.title, card.title),
      text: managedValue(card.fields?.body || card.body, ''),
    })).filter((item) => item.title && item.text);
  }
  const fromFields = [1, 2, 3, 4].map((index) => ({
    title: block?.fields?.[`title_${index}`]?.trim() ?? '',
    text: block?.fields?.[`body_${index}`]?.trim() ?? '',
  })).filter((item) => item.title && item.text);
  return fromFields.length ? fromFields : homeCopy[locale].trust.items;
}

export function PublicShell({ page, locale, programmes, partners }: PublicShellProps) {
  const blocks = blocksFor(page);
  const shell = homeCopy[locale];
  const catalogue = programmeCatalogueCopy[locale];
  const chrome = chromeCopy[locale];
  const hero = findBlock(blocks, 'hero');
  const verification = findBlock(blocks, 'verification_utility');
  const areas = findBlock(blocks, 'programme_areas');
  const featured = findBlock(blocks, 'featured_programmes');
  const trust = findBlock(blocks, 'why_nobel_itbs');
  const model = findBlock(blocks, 'how_the_model_works');
  const organisations = findBlock(blocks, 'for_organisations');
  const institutional = findBlock(blocks, 'institutional_bridge');
  const finalCta = findBlock(blocks, 'final_cta');
  const verifyHref = localizePublicPath(locale, '/verify');
  const programmesHref = localizePublicPath(locale, '/programmes');
  const areasList = areaCards(programmes, areas, locale);
  const trustList = trustItems(trust, locale);
  const modelSteps = chrome.modelSteps.map((fallback, index) => ({
    title: field(model, `step_${index + 1}_title`, fallback.title),
    text: field(model, `step_${index + 1}_body`, fallback.text),
  }));
  const footerColumns = [
    {
      title: catalogue.eyebrow,
      links: [
        ...areasList.map((area) => ({ label: area.title, href: localizePublicPath(locale, `/programmes/${area.slug}`) })),
        { label: chrome.areasCta, href: programmesHref },
      ],
    },
    {
      title: chrome.company,
      links: shell.nav.filter((item) => item.href !== programmesHref && item.label !== shell.verify.navLabel),
    },
    {
      title: shell.verify.navLabel,
      links: [{ label: chrome.verifyKicker, href: verifyHref }],
    },
  ];

  return (
    <main className="home-v2">
      <section className="home-v2-first" aria-labelledby="home-title">
        <div className="home-v2-stage">
          <header className="home-v2-header">
            <Link className="home-v2-brand" href={shell.homeHref} aria-label="Nobel ITBS home">
              <Image src="/brand/nobel-logo-full-horizontal-web.svg" width={230} height={54} alt="Nobel ITBS" priority />
            </Link>
            <nav className="home-v2-nav" aria-label={shell.navLabel}>
              {shell.nav.filter((item) => item.label !== shell.verify.navLabel).map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
            </nav>
            <div className="home-v2-actions">
              <Link className="home-v2-verify-link" href={verifyHref}>{shell.verify.navLabel}</Link>
              <nav className="home-v2-locales" aria-label={shell.localeLabel}>
                {localeLinks.map((item) => <Link key={item.locale} href={item.href} aria-current={item.locale === locale ? 'page' : undefined}>{item.label}</Link>)}
              </nav>
            </div>
          </header>

          <div className="home-v2-hero">
            <div className="home-v2-hero-copy">
              <p className="home-v2-eyebrow">{field(hero, 'eyebrow', shell.hero.eyebrow)}</p>
              <h1 id="home-title">{heroTitle(page.h1, locale)}</h1>
              <p className="home-v2-lead">{field(hero, 'lead', shell.hero.lead)}</p>
              <p className="home-v2-support">{field(hero, 'supporting_text', shell.footer.text)}</p>
              <Link className="home-v2-primary" href={target(hero?.fields?.primary_cta_target, locale, '/programmes')}>
                {field(hero, 'primary_cta', shell.hero.cta.label)}<span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="home-v2-hero-art" aria-hidden="true">
              <Image src="/brand/generated/nobel-hero-3d.png" width={840} height={840} alt="" priority />
            </div>
          </div>
        </div>

        <aside className="home-v2-verify" aria-label={field(verification, 'title', chrome.verifyKicker)}>
          <div className="home-v2-verify-mark" aria-hidden="true"><span>✓</span></div>
          <p className="home-v2-verify-kicker">{chrome.verifyKicker}</p>
          <h2>{field(verification, 'title', shell.verify.title)}</h2>
          <p>{field(verification, 'body', shell.verify.lead)}</p>
          <div className="home-v2-verify-tabs" aria-hidden="true"><span>{shell.verify.tabCode}</span><span>{shell.verify.tabQr}</span></div>
          <div className="home-v2-verify-input" aria-hidden="true">{field(verification, 'input_placeholder', shell.verify.placeholder)}</div>
          <Link className="home-v2-verify-button" href={verifyHref}>{field(verification, 'submit_label', shell.verify.action)}<span aria-hidden="true">→</span></Link>
          <Link className="home-v2-text-link" href={verifyHref}>{field(verification, 'link_label', shell.verify.action)}<span aria-hidden="true">↗</span></Link>
        </aside>
      </section>

      <section className="home-v2-section home-v2-areas" aria-labelledby="areas-title">
        <div className="home-v2-section-heading">
          <div><p className="home-v2-eyebrow dark">{field(areas, 'eyebrow', shell.programmes.eyebrow)}</p><h2 id="areas-title">{field(areas, 'h2', shell.programmes.title)}</h2></div>
          <p>{field(areas, 'intro', catalogue.intro)}</p>
        </div>
        <div className="home-v2-area-grid">
          {areasList.map((area, index) => (
            <Link className="home-v2-area-card" href={localizePublicPath(locale, `/programmes/${area.slug}`)} key={area.slug}>
              <span>{String(index + 1).padStart(2, '0')}</span><h3>{area.title}</h3><p>{area.description}</p><strong>{area.featured}</strong><i aria-hidden="true">→</i>
            </Link>
          ))}
        </div>
        <Link className="home-v2-section-link" href={programmesHref}>{chrome.areasCta}<span aria-hidden="true">→</span></Link>
      </section>

      <section className="home-v2-featured" aria-labelledby="featured-title">
        <div className="home-v2-featured-heading">
          <div><p className="home-v2-eyebrow">{field(featured, 'eyebrow', catalogue.eyebrow)}</p><h2 id="featured-title">{field(featured, 'h2', catalogue.title)}</h2></div>
          <p>{field(featured, 'intro', catalogue.intro)}</p>
        </div>
        <div className="home-v2-programme-list">
          {programmes.slice(0, 5).map((programme, index) => (
            <Link href={localizePublicPath(locale, `/programmes/${programme.slug}`)} key={programme.slug}>
              <span className="home-v2-programme-number">{String(index + 1).padStart(2, '0')}</span>
              <div><div className="home-v2-programme-meta"><span>{catalogue.badgeLabels[programme.enrolmentBadge]}</span><span>{programme.area.title}</span><span>{programme.type.title}</span></div><h3>{programme.title}</h3><p>{programme.description}</p></div>
              <div className="home-v2-programme-facts"><p>{programme.facts}</p><p>{programme.documentSummary}</p><strong>{catalogue.viewProgramme}<span aria-hidden="true">→</span></strong></div>
            </Link>
          ))}
        </div>
        <Link className="home-v2-section-link light" href={programmesHref}>{field(featured, 'section_cta', chrome.areasCta)}<span aria-hidden="true">→</span></Link>
      </section>

      <section className="home-v2-section home-v2-trust" aria-labelledby="trust-title">
        <div className="home-v2-trust-heading"><p className="home-v2-eyebrow dark">{field(trust, 'eyebrow', shell.trust.eyebrow)}</p><h2 id="trust-title">{field(trust, 'h2', shell.trust.title)}</h2><p>{field(trust, 'lead', shell.trust.lead)}</p></div>
        <div className="home-v2-trust-grid">{trustList.map((item, index) => <article key={item.title}><span>{String(index + 1).padStart(2, '0')}</span><h3>{item.title}</h3><p>{item.text}</p></article>)}</div>
      </section>

      {partners.length ? <section className="home-v2-partners" aria-labelledby="partners-title">
        <div><p className="home-v2-eyebrow dark">{chrome.partners}</p><h2 id="partners-title">{chrome.partnerLead}</h2></div>
        <div className="home-v2-partner-grid">{partners.map((partner) => <a href={partner.officialUrl} target="_blank" rel="noreferrer" key={partner.slug}><span><Image src={partner.logoPath} fill sizes="(max-width: 760px) 80vw, 220px" alt={partner.logoAlt} /></span><strong>{partner.name}</strong><small>{partner.role}</small><i aria-hidden="true">↗</i></a>)}</div>
      </section> : null}

      <section className="home-v2-model" aria-labelledby="model-title">
        <div><p className="home-v2-eyebrow">{field(model, 'eyebrow', shell.trust.eyebrow)}</p><h2 id="model-title">{field(model, 'h2', shell.trust.title)}</h2></div>
        <ol>{modelSteps.map((step, index) => <li key={step.title}><span>{String(index + 1).padStart(2, '0')}</span><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol>
      </section>

      <section className="home-v2-story">
        <article className="home-v2-organisations"><div><p className="home-v2-eyebrow">{field(organisations, 'eyebrow', shell.organisations.eyebrow)}</p><h2>{field(organisations, 'h2', shell.organisations.title)}</h2><p>{field(organisations, 'body', shell.organisations.text)}</p><div className="home-v2-link-pair"><Link className="home-v2-primary" href={localizePublicPath(locale, '/for-organisations')}>{field(organisations, 'primary_cta', shell.organisations.cta.label)}<span aria-hidden="true">→</span></Link><Link href={localizePublicPath(locale, '/partnerships')}>{managedValue(organisations?.fields?.secondary_link, chrome.organisationSecondary)}</Link></div></div><div className="home-v2-orb" aria-hidden="true">N</div></article>
        <article className="home-v2-institutional"><div className="home-v2-institutional-mark" aria-hidden="true">N</div><div><p className="home-v2-eyebrow dark">{field(institutional, 'eyebrow', 'Nobel ITBS')}</p><h2>{field(institutional, 'h2', shell.footer.text)}</h2><p>{field(institutional, 'body', shell.footer.text)}</p><Link className="home-v2-section-link" href={target(institutional?.fields?.cta_target, locale, '/about')}>{field(institutional, 'cta', shell.nav.at(-1)?.label ?? 'About')}<span aria-hidden="true">→</span></Link></div></article>
      </section>

      <section className="home-v2-final" aria-labelledby="final-title"><div><h2 id="final-title">{field(finalCta, 'h2', shell.certificate.title)}</h2><p>{field(finalCta, 'body', shell.certificate.text)}</p><Link className="home-v2-primary" href={programmesHref}>{field(finalCta, 'cta', shell.certificate.cta.label)}<span aria-hidden="true">→</span></Link></div><div className="home-v2-certificate" aria-hidden="true"><div><Image src="/brand/nobel-logo-full-horizontal-web.svg" width={154} height={36} alt="" /><strong>Certificate</strong><span>Professional Development</span></div><div><span>Document is valid</span><b>✓</b></div></div></section>

      <footer className="home-v2-footer">
        <div className="home-v2-footer-brand"><Image src="/brand/nobel-logo-full-horizontal-web.svg" width={180} height={42} alt="Nobel ITBS" /><p>{shell.footer.text}</p></div>
        {footerColumns.map((column) => <nav key={column.title} aria-label={column.title}><h2>{column.title}</h2>{column.links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}</nav>)}
        <nav aria-label={chrome.legal}><h2>{chrome.legal}</h2><Link href={localizePublicPath(locale, '/privacy-policy')}>{chrome.privacy}</Link><Link href={localizePublicPath(locale, '/terms-of-use')}>{chrome.terms}</Link><Link href={localizePublicPath(locale, '/refund-policy')}>{chrome.refunds}</Link></nav>
        <address><h2>{chrome.contact}</h2><span>{chrome.registered}</span><a href="mailto:info@nobel-itbs.eu">info@nobel-itbs.eu</a></address>
      </footer>
    </main>
  );
}
