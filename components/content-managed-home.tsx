import Image from 'next/image';
import Link from 'next/link';
import type { ContentLocale } from '@/lib/content/localization';
import { localizePublicPath } from '@/lib/content/localization';
import type { StructuredContentPage } from '@/lib/content/pages';
import { programmeCatalogueCopy } from '@/lib/programmes/catalogue-copy';
import type { ProgrammeCatalogueItem } from '@/lib/programmes/catalogue-types';
import { HomeVerificationCard, type HomeVerificationCopy } from './home-verification-card';

type ContentCard = {
  title?: string;
  body?: string;
  fields?: Record<string, string>;
};

type ContentBlock = {
  key?: string;
  title?: string;
  body?: string;
  fields?: Record<string, string>;
  cards?: ContentCard[];
};

type HomeUiCopy = {
  navLabel: string;
  localeLabel: string;
  menuLabel: string;
  verifyLabel: string;
  nav: Array<{ label: string; path: string }>;
  areasCta: string;
  programmesCta: string;
  programmeCta: string;
  organisationsLabel: string;
  partnershipsLabel: string;
  aboutLabel: string;
  footer: {
    navigation: string;
    legal: string;
    contact: string;
    privacy: string;
    terms: string;
    refunds: string;
  };
  verification: Pick<HomeVerificationCopy, 'numberTab' | 'qrTab' | 'qrInstruction' | 'tabsLabel'>;
};

const uiCopy: Record<ContentLocale, HomeUiCopy> = {
  en: {
    navLabel: 'Primary navigation', localeLabel: 'Language', menuLabel: 'Menu', verifyLabel: 'Verify',
    nav: [
      { label: 'Programmes', path: '/programmes' },
      { label: 'For Organisations', path: '/for-organisations' },
      { label: 'Partnerships', path: '/partnerships' },
      { label: 'About Us', path: '/about' },
    ],
    areasCta: 'View all programmes', programmesCta: 'Explore all programmes', programmeCta: 'View programme',
    organisationsLabel: 'For organisations', partnershipsLabel: 'Partnerships', aboutLabel: 'Learn more about Nobel ITBS',
    footer: { navigation: 'Navigation', legal: 'Legal', contact: 'Contact', privacy: 'Privacy Policy', terms: 'Terms of Use', refunds: 'Refund Policy' },
    verification: {
      numberTab: 'Document number', qrTab: 'QR code', tabsLabel: 'Verification method',
      qrInstruction: 'Scan the QR code on the document with your phone camera to open its verification page.',
    },
  },
  ua: {
    navLabel: 'Основна навігація', localeLabel: 'Мова', menuLabel: 'Меню', verifyLabel: 'Перевірити',
    nav: [
      { label: 'Програми', path: '/programmes' },
      { label: 'Для організацій', path: '/for-organisations' },
      { label: 'Партнерства', path: '/partnerships' },
      { label: 'Про нас', path: '/about' },
    ],
    areasCta: 'Усі програми', programmesCta: 'Переглянути всі програми', programmeCta: 'Переглянути програму',
    organisationsLabel: 'Для організацій', partnershipsLabel: 'Партнерства', aboutLabel: 'Дізнатися більше про Nobel ITBS',
    footer: { navigation: 'Навігація', legal: 'Правова інформація', contact: 'Контакти', privacy: 'Політика конфіденційності', terms: 'Умови використання', refunds: 'Політика повернення коштів' },
    verification: {
      numberTab: 'Номер документа', qrTab: 'QR-код', tabsLabel: 'Спосіб перевірки',
      qrInstruction: 'Відскануйте QR-код на документі камерою телефона, щоб відкрити сторінку перевірки.',
    },
  },
  cz: {
    navLabel: 'Hlavní navigace', localeLabel: 'Jazyk', menuLabel: 'Menu', verifyLabel: 'Ověřit',
    nav: [
      { label: 'Programy', path: '/programmes' },
      { label: 'Pro organizace', path: '/for-organisations' },
      { label: 'Partnerství', path: '/partnerships' },
      { label: 'O nás', path: '/about' },
    ],
    areasCta: 'Všechny programy', programmesCta: 'Prohlédnout všechny programy', programmeCta: 'Zobrazit program',
    organisationsLabel: 'Pro organizace', partnershipsLabel: 'Partnerství', aboutLabel: 'Více o Nobel ITBS',
    footer: { navigation: 'Navigace', legal: 'Právní informace', contact: 'Kontakt', privacy: 'Zásady ochrany osobních údajů', terms: 'Podmínky použití', refunds: 'Zásady vrácení peněz' },
    verification: {
      numberTab: 'Číslo dokumentu', qrTab: 'QR kód', tabsLabel: 'Způsob ověření',
      qrInstruction: 'Naskenujte QR kód na dokumentu fotoaparátem telefonu a otevřete ověřovací stránku.',
    },
  },
};

const localeLabels: Record<ContentLocale, string> = { en: 'EN', ua: 'UA', cz: 'CZ' };

function clean(value: string | undefined): string {
  return (value ?? '').trim().replace(/^`|`$/g, '').trim();
}

function blocksFrom(page: StructuredContentPage): ContentBlock[] {
  return Array.isArray(page.sections.blocks) ? page.sections.blocks as ContentBlock[] : [];
}

function blockByKey(blocks: ContentBlock[], key: string): ContentBlock | undefined {
  return blocks.find((block) => block.key === key);
}

function field(block: ContentBlock | undefined, key: string, fallback = ''): string {
  return clean(block?.fields?.[key]) || fallback;
}

function targetFor(locale: ContentLocale, target: string | undefined, fallback: string): string {
  let path = clean(target) || fallback;
  path = path.replace(/^\/(ua|cz)(?=\/|$)/, '') || '/';
  return localizePublicPath(locale, path);
}

function splitTitle(title: string, locale: ContentLocale): string[] {
  const marker = { en: 'moves', ua: 'рухає', cz: 'vás' }[locale];
  const index = title.toLocaleLowerCase().indexOf(marker.toLocaleLowerCase());
  if (index > 0) return [title.slice(0, index).trim(), title.slice(index).trim()];
  const words = title.split(/\s+/);
  if (words.length < 4) return [title];
  const midpoint = Math.ceil(words.length / 2);
  return [words.slice(0, midpoint).join(' '), words.slice(midpoint).join(' ')];
}

function cardTitle(card: ContentCard): string {
  return clean(card.fields?.title) || clean(card.title);
}

function cardBody(card: ContentCard): string {
  return clean(card.fields?.body) || clean(card.body);
}

function trustItems(block: ContentBlock | undefined): Array<{ title: string; body: string }> {
  const cards = (block?.cards ?? []).map((card) => ({ title: cardTitle(card), body: cardBody(card) })).filter((item) => item.title && item.body);
  const fields = block?.fields ?? {};
  const flat = Array.from({ length: 8 }, (_, index) => ({
    title: clean(fields[`title_${index + 1}`]),
    body: clean(fields[`body_${index + 1}`]),
  })).filter((item) => item.title && item.body);
  return [...cards, ...flat.filter((item) => !cards.some((card) => card.title === item.title))];
}

function modelSteps(block: ContentBlock | undefined): Array<{ title: string; body: string }> {
  const fields = block?.fields ?? {};
  return Array.from({ length: 8 }, (_, index) => ({
    title: clean(fields[`step_${index + 1}_title`]),
    body: clean(fields[`step_${index + 1}_body`]),
  })).filter((item) => item.title && item.body);
}

function featuredProgrammes(programmes: ProgrammeCatalogueItem[]): ProgrammeCatalogueItem[] {
  return [...programmes].sort((a, b) => Number(b.featured) - Number(a.featured)).slice(0, 5);
}

export function ContentManagedHome({ page, locale, programmes }: {
  page: StructuredContentPage;
  locale: ContentLocale;
  programmes: ProgrammeCatalogueItem[];
}) {
  const blocks = blocksFrom(page);
  const hero = blockByKey(blocks, 'hero') ?? blocks[0];
  const verification = blockByKey(blocks, 'verification_utility');
  const areas = blockByKey(blocks, 'programme_areas');
  const featured = blockByKey(blocks, 'featured_programmes');
  const trust = blockByKey(blocks, 'why_nobel_itbs');
  const model = blockByKey(blocks, 'how_the_model_works');
  const organisations = blockByKey(blocks, 'for_organisations');
  const institutional = blockByKey(blocks, 'institutional_bridge');
  const finalCta = blockByKey(blocks, 'final_cta');
  const ui = uiCopy[locale];
  const catalogueCopy = programmeCatalogueCopy[locale];
  const programmePath = (slug: string) => localizePublicPath(locale, `/programmes/${slug}`);
  const verifyHref = targetFor(locale, verification?.fields?.link_target, '/verify');
  const heroLines = splitTitle(page.h1, locale);
  const homeHref = localizePublicPath(locale, '/');
  const featuredItems = featuredProgrammes(programmes);
  const organisationHref = localizePublicPath(locale, '/for-organisations');
  const partnershipsHref = localizePublicPath(locale, '/partnerships');
  const areasCards = areas?.cards ?? [];
  const trustCards = trustItems(trust);
  const steps = modelSteps(model);
  const verificationCopy: HomeVerificationCopy = {
    title: field(verification, 'title', ui.verifyLabel),
    inputLabel: field(verification, 'input_label', ui.verification.numberTab),
    placeholder: field(verification, 'input_placeholder', 'NITBS-C-2026-000123'),
    submitLabel: field(verification, 'submit_label', ui.verifyLabel),
    linkLabel: field(verification, 'link_label', ui.verifyLabel),
    ...ui.verification,
  };

  return (
    <main className="content-home">
      <section className="content-home-hero" aria-labelledby="home-title">
        <header className="content-home-header">
          <Link className="content-home-brand" href={homeHref} aria-label="Nobel ITBS home">
            <Image src="/brand/nobel-logo-full-horizontal-web.svg" width={230} height={54} alt="Nobel ITBS" priority />
          </Link>
          <nav className="content-home-nav" aria-label={ui.navLabel}>
            {ui.nav.map((item) => <Link key={item.path} href={localizePublicPath(locale, item.path)}>{item.label}</Link>)}
          </nav>
          <div className="content-home-header-actions">
            <Link className="content-home-verify-nav" href={verifyHref}>{ui.verifyLabel}</Link>
            <nav className="content-home-locales" aria-label={ui.localeLabel}>
              {(['en', 'ua', 'cz'] as const).map((itemLocale) => (
                <Link key={itemLocale} href={localizePublicPath(itemLocale, '/')} aria-current={itemLocale === locale ? 'page' : undefined}>{localeLabels[itemLocale]}</Link>
              ))}
            </nav>
          </div>
          <details className="content-home-mobile-menu">
            <summary aria-label={ui.menuLabel}><span aria-hidden="true" /><span aria-hidden="true" /><span aria-hidden="true" /></summary>
            <div className="content-home-mobile-panel">
              <nav aria-label={ui.navLabel}>{ui.nav.map((item) => <Link key={item.path} href={localizePublicPath(locale, item.path)}>{item.label}</Link>)}</nav>
              <Link className="content-home-mobile-verify" href={verifyHref}>{ui.verifyLabel}</Link>
              <nav className="content-home-mobile-locales" aria-label={ui.localeLabel}>
                {(['en', 'ua', 'cz'] as const).map((itemLocale) => <Link key={itemLocale} href={localizePublicPath(itemLocale, '/')} aria-current={itemLocale === locale ? 'page' : undefined}>{localeLabels[itemLocale]}</Link>)}
              </nav>
            </div>
          </details>
        </header>

        <div className="content-home-hero-layout">
          <div className="content-home-hero-copy">
            <p className="content-home-eyebrow">{field(hero, 'eyebrow')}</p>
            <h1 id="home-title" aria-label={page.h1}>{heroLines.map((line) => <span key={line} aria-hidden="true">{line}</span>)}</h1>
            {field(hero, 'lead') ? <p className="content-home-lead">{field(hero, 'lead')}</p> : null}
            <div className="content-home-hero-actions">
              <Link className="content-home-button primary" href={targetFor(locale, hero?.fields?.primary_cta_target, '/programmes')}>
                {field(hero, 'primary_cta', ui.programmesCta)}<span aria-hidden="true">→</span>
              </Link>
              {field(hero, 'supporting_text') ? <p>{field(hero, 'supporting_text')}</p> : null}
            </div>
          </div>
          <HomeVerificationCard copy={verificationCopy} locale={locale} verifyHref={verifyHref} />
        </div>
      </section>

      {areas ? <section className="content-home-section content-home-areas" aria-labelledby="areas-title">
        <div className="content-home-editorial-heading">
          <div><p className="content-home-eyebrow dark">{field(areas, 'eyebrow')}</p><h2 id="areas-title">{field(areas, 'h2', areas.title)}</h2></div>
          {field(areas, 'intro') ? <p>{field(areas, 'intro')}</p> : null}
        </div>
        <div className="content-home-area-list">
          {areasCards.map((card, index) => {
            const title = cardTitle(card);
            const matchingProgramme = programmes.find((programme) => programme.area.title === title);
            const href = matchingProgramme ? programmePath(matchingProgramme.area.slug) : localizePublicPath(locale, '/programmes');
            const featuredProgramme = clean(card.fields?.featured_programme) || clean(card.fields?.featured_programmes);
            return <Link className="content-home-area-row" href={href} key={`${title}-${index}`}>
              <span>{String(index + 1).padStart(2, '0')}</span><h3>{title}</h3><p>{cardBody(card)}</p>{featuredProgramme ? <strong>{featuredProgramme}</strong> : null}
            </Link>;
          })}
        </div>
        <Link className="content-home-section-link" href={localizePublicPath(locale, '/programmes')}>{field(areas, 'section_cta', ui.areasCta)}<span aria-hidden="true">→</span></Link>
      </section> : null}

      {featured ? <section className="content-home-section content-home-featured" aria-labelledby="featured-title">
        <div className="content-home-split-heading">
          <div><p className="content-home-eyebrow dark">{field(featured, 'eyebrow')}</p><h2 id="featured-title">{field(featured, 'h2', featured.title)}</h2></div>
          {field(featured, 'intro') ? <p>{field(featured, 'intro')}</p> : null}
        </div>
        <div className="content-home-programme-list">
          {featuredItems.map((programme, index) => <Link className="content-home-programme-row" href={programmePath(programme.slug)} key={programme.slug}>
            <span className="content-home-programme-number">{String(index + 1).padStart(2, '0')}</span>
            <div className="content-home-programme-main">
              <div className="content-home-programme-meta"><span>{catalogueCopy.badgeLabels[programme.enrolmentBadge]}</span><span>{programme.area.title}</span><span>{programme.type.title}</span></div>
              <h3>{programme.title}</h3><p>{programme.description}</p>
            </div>
            <div className="content-home-programme-facts"><p>{programme.facts}</p><p>{programme.documentSummary}</p><strong>{catalogueCopy.viewProgramme || ui.programmeCta}<span aria-hidden="true">→</span></strong></div>
          </Link>)}
        </div>
        <Link className="content-home-section-link" href={localizePublicPath(locale, '/programmes')}>{field(featured, 'section_cta', ui.programmesCta)}<span aria-hidden="true">→</span></Link>
      </section> : null}

      {trust ? <section className="content-home-trust" aria-labelledby="trust-title">
        <div className="content-home-trust-heading"><p className="content-home-eyebrow">{field(trust, 'eyebrow')}</p><h2 id="trust-title">{field(trust, 'h2', trust.title)}</h2>{field(trust, 'lead') ? <p>{field(trust, 'lead')}</p> : null}</div>
        <div className="content-home-trust-list">{trustCards.map((item, index) => <article key={`${item.title}-${index}`}><span>{String(index + 1).padStart(2, '0')}</span><h3>{item.title}</h3><p>{item.body}</p></article>)}</div>
      </section> : null}

      {model ? <section className="content-home-section content-home-model" aria-labelledby="model-title">
        <div className="content-home-split-heading"><div><p className="content-home-eyebrow dark">{field(model, 'eyebrow')}</p><h2 id="model-title">{field(model, 'h2', model.title)}</h2></div></div>
        <ol className="content-home-model-steps">{steps.map((step) => <li key={step.title}><h3>{step.title}</h3><p>{step.body}</p></li>)}</ol>
      </section> : null}

      {organisations ? <section className="content-home-organisations" aria-labelledby="organisations-title"><div>
        <p className="content-home-eyebrow">{field(organisations, 'eyebrow')}</p><h2 id="organisations-title">{field(organisations, 'h2', organisations.title)}</h2><p>{field(organisations, 'body')}</p>
        <div className="content-home-link-pair"><Link className="content-home-button primary" href={organisationHref}>{field(organisations, 'primary_cta', ui.organisationsLabel)}<span aria-hidden="true">→</span></Link><Link className="content-home-button secondary" href={partnershipsHref}>{field(organisations, 'secondary_link', ui.partnershipsLabel)}</Link></div>
      </div></section> : null}

      {institutional ? <section className="content-home-section content-home-institutional" aria-labelledby="institutional-title">
        <div className="content-home-institutional-mark" aria-hidden="true">N</div><div><p className="content-home-eyebrow dark">{field(institutional, 'eyebrow')}</p><h2 id="institutional-title">{field(institutional, 'h2', institutional.title)}</h2></div><div><p>{field(institutional, 'body')}</p><Link className="content-home-section-link" href={targetFor(locale, institutional.fields?.cta_target, '/about')}>{field(institutional, 'cta', ui.aboutLabel)}<span aria-hidden="true">→</span></Link></div>
      </section> : null}

      {finalCta ? <section className="content-home-final" aria-labelledby="final-title"><div><h2 id="final-title">{field(finalCta, 'h2', finalCta.title)}</h2><p>{field(finalCta, 'body')}</p></div><Link className="content-home-button primary" href={localizePublicPath(locale, '/programmes')}>{field(finalCta, 'cta', ui.programmesCta)}<span aria-hidden="true">→</span></Link></section> : null}

      <footer className="content-home-footer">
        <div className="content-home-footer-brand"><Image src="/brand/nobel-logo-full-horizontal-web.svg" width={180} height={42} alt="Nobel ITBS" /><p>Nobel ITBS s.r.o.</p></div>
        <nav aria-label={ui.footer.navigation}><h2>{ui.footer.navigation}</h2>{ui.nav.map((item) => <Link key={item.path} href={localizePublicPath(locale, item.path)}>{item.label}</Link>)}<Link href={verifyHref}>{ui.verifyLabel}</Link></nav>
        <nav aria-label={ui.footer.legal}><h2>{ui.footer.legal}</h2><Link href={localizePublicPath(locale, '/privacy-policy')}>{ui.footer.privacy}</Link><Link href={localizePublicPath(locale, '/terms-of-use')}>{ui.footer.terms}</Link><Link href={localizePublicPath(locale, '/refund-policy')}>{ui.footer.refunds}</Link></nav>
        <address><h2>{ui.footer.contact}</h2><span>Praha, Czech Republic</span><a href="mailto:info@nobel-itbs.eu">info@nobel-itbs.eu</a></address>
      </footer>
    </main>
  );
}
