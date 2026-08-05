import Image from 'next/image';
import Link from 'next/link';
import type { ContentLocale } from '@/lib/content/localization';
import { localizePublicPath } from '@/lib/content/localization';
import type { ExpertCard } from '@/lib/experts/types';
import { homeCopy } from '@/lib/i18n';
import type { PartnerCard } from '@/lib/partners/types';
import type { PartnershipsPageContent } from '@/lib/partnerships/types';
import { ExpertCards } from './expert-cards';

type PartnershipsPageProps = {
  content: PartnershipsPageContent;
  partners: PartnerCard[];
  experts: ExpertCard[];
};

const localeLabels: Record<ContentLocale, string> = { en: 'EN', ua: 'UA', cz: 'CZ' };
const contactLabels: Record<ContentLocale, string> = { en: 'Contact', ua: 'Контакти', cz: 'Kontakt' };

function PageHeader({ locale }: { locale: ContentLocale }) {
  const shell = homeCopy[locale];
  return (
    <header className="site-header partnerships-header">
      <Link className="brand" href={shell.homeHref} aria-label="Nobel ITBS home">
        <Image src="/brand/nobel-logo-full-horizontal-web.svg" width={230} height={54} alt="Nobel ITBS" priority />
      </Link>
      <nav className="nav" aria-label={shell.navLabel}>
        {shell.nav.map((item) => (
          <Link key={item.href} href={item.href} aria-current={item.href.endsWith('/partnerships') ? 'page' : undefined}>{item.label}</Link>
        ))}
      </nav>
      <nav className="locale-switcher" aria-label={shell.localeLabel}>
        {(['en', 'ua', 'cz'] as const).map((itemLocale) => (
          <Link key={itemLocale} href={localizePublicPath(itemLocale, '/partnerships')} aria-current={itemLocale === locale ? 'page' : undefined}>
            {localeLabels[itemLocale]}
          </Link>
        ))}
      </nav>
    </header>
  );
}

function PageFooter({ locale }: { locale: ContentLocale }) {
  const shell = homeCopy[locale];
  return (
    <footer className="site-footer partnerships-footer">
      <div className="footer-brand">
        <Image src="/brand/nobel-logo-full-horizontal-web.svg" width={180} height={42} alt="Nobel ITBS" />
        <p>{shell.footer.text}</p>
      </div>
      {shell.footer.columns.map((column) => (
        <nav key={column.title} aria-label={column.title}>
          <h2>{column.title}</h2>
          {column.links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
        </nav>
      ))}
      <address>
        <h2>{contactLabels[locale]}</h2>
        {shell.footer.contact.map((line) => <span key={line}>{line}</span>)}
      </address>
    </footer>
  );
}

function PartnerLogo({ partner }: { partner: PartnerCard }) {
  return (
    <span className={`partnership-logo partnership-logo-${partner.slug}`}>
      <Image src={partner.logoPath} fill sizes="(max-width: 760px) 72vw, 320px" alt={partner.logoAlt} />
    </span>
  );
}

export function PartnershipsPage({ content, partners, experts }: PartnershipsPageProps) {
  const academicPartner = partners.find((partner) => partner.type === 'exclusive_academic_partner');
  const partnerOrganisations = partners.filter((partner) => partner.type === 'partner_organisation');
  const contactHref = `mailto:info@nobel-itbs.eu?subject=${encodeURIComponent(content.hero.primaryCta)}`;

  return (
    <main className="partnerships-page">
      <section className="partnerships-hero" aria-labelledby="partnerships-title">
        <PageHeader locale={content.locale} />
        <div className="partnerships-hero-layout">
          <div>
            <p className="eyebrow">{content.hero.eyebrow}</p>
            <h1 id="partnerships-title">{content.hero.title}</h1>
          </div>
          <div className="partnerships-hero-copy">
            <p className="partnerships-lead">{content.hero.lead}</p>
            <p>{content.hero.supportingCopy}</p>
            <a className="button primary" href={contactHref}>{content.hero.primaryCta}<span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <span className="partnerships-hero-mark" aria-hidden="true">P</span>
      </section>

      <section className="partnership-principles" aria-labelledby="principles-title">
        <div className="partnership-section-heading">
          <p className="eyebrow dark">Nobel ITBS</p>
          <h2 id="principles-title">{content.principles.heading}</h2>
        </div>
        <ol>
          {content.principles.items.map((item, index) => (
            <li key={item}><span>{String(index + 1).padStart(2, '0')}</span><p>{item}</p></li>
          ))}
        </ol>
      </section>

      <section className="partnership-models" aria-labelledby="models-title">
        <div className="partnership-section-heading">
          <p className="eyebrow">Nobel ITBS</p>
          <h2 id="models-title">{content.models.heading}</h2>
        </div>
        <div className="partnership-model-list">
          {content.models.items.map((model, index) => (
            <article key={model.title}>
              <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <h3>{model.title}</h3>
              <p>{model.body}</p>
            </article>
          ))}
        </div>
      </section>

      {academicPartner ? (
        <section className="academic-partnership" aria-labelledby="academic-title">
          <div className="academic-partnership-copy">
            <p className="eyebrow">Nobel ITBS × Alfred Nobel University</p>
            <h2 id="academic-title">{content.academic.heading}</h2>
            <p>{content.academic.body}</p>
          </div>
          <a href={academicPartner.officialUrl} target="_blank" rel="noreferrer" className="academic-partner-card">
            <PartnerLogo partner={academicPartner} />
            <span>
              <strong>{academicPartner.name}</strong>
              <small>{academicPartner.role}</small>
              {academicPartner.location ? <small>{academicPartner.location}</small> : null}
            </span>
            <i aria-hidden="true">↗</i>
          </a>
        </section>
      ) : null}

      <section className="partner-organisations" aria-labelledby="partner-organisations-title">
        <div className="partnership-section-heading">
          <p className="eyebrow dark">Nobel ITBS</p>
          <h2 id="partner-organisations-title">{content.partners.heading}</h2>
          <p>{content.partners.intro}</p>
        </div>
        <div className="partnership-organisations-grid">
          {partnerOrganisations.map((partner, index) => (
            <a href={partner.officialUrl} target="_blank" rel="noreferrer" key={partner.slug}>
              <span className="partnership-organisation-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
              <PartnerLogo partner={partner} />
              <span className="partnership-organisation-copy">
                <strong>{partner.name}</strong>
                <small>{partner.role}</small>
                {partner.location ? <small>{partner.location}</small> : null}
              </span>
              <i aria-hidden="true">↗</i>
            </a>
          ))}
        </div>
      </section>

      <section className="partnership-experts" aria-labelledby="experts-title">
        <div className="partnership-section-heading">
          <p className="eyebrow dark">Nobel ITBS</p>
          <h2 id="experts-title">{content.experts.heading}</h2>
          <p>{content.experts.intro}</p>
        </div>
        <ExpertCards experts={experts} />
      </section>

      <section className="partnership-boundaries" aria-labelledby="boundaries-title">
        <div>
          <p className="eyebrow">Trust by clarity</p>
          <h2 id="boundaries-title">{content.boundaries.heading}</h2>
        </div>
        <ul>{content.boundaries.items.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="partnership-closing" aria-labelledby="partnership-closing-title">
        <p className="eyebrow">Nobel ITBS</p>
        <h2 id="partnership-closing-title">{content.closing.heading}</h2>
        <p>{content.closing.copy}</p>
        <a className="button primary" href={contactHref}>{content.hero.fallbackCta}<span aria-hidden="true">↗</span></a>
      </section>

      <PageFooter locale={content.locale} />
    </main>
  );
}
