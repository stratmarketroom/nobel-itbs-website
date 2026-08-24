import programmeContent from './generated-programme-content.json';
import taxonomyContent from './generated-taxonomy-content.json';
import type { ContentLocale } from '@/lib/content/localization';
import type { ProgrammeCatalogueItem } from './catalogue-types';
import type { ProgrammeLandingEntity, ProgrammeNamespaceEntity, ProgrammeSection, TaxonomyLandingEntity } from './landing-types';

type GeneratedProgramme = {
  slug: string;
  areaId: string;
  typeId: string;
  format: 'distance' | 'blended_distance';
  applicationProvider: 'leeloo' | 'partner_site';
  applicationUrl: string | null;
};

type GeneratedProgrammeTranslation = {
  slug: string;
  languageCode: ContentLocale;
  title: string;
  summary: string;
  heroCopy: string;
  sections: Record<string, ProgrammeSection | string>;
  seoTitle: string;
  seoDescription: string;
  ogTitle: string;
  ogDescription: string;
};

type GeneratedTaxonomyTranslation = {
  languageCode: ContentLocale;
  title: string;
  eyebrow: string;
  lead: string;
  supportingCopy: string;
  primaryCtaLabel: string;
  introHeading: string;
  introContent: string;
  audienceHeading: string;
  audienceItems: string[];
  outcomesHeading: string;
  outcomesItems: string[];
  listingHeading: string;
  listingIntro: string;
  emptyHeading: string;
  emptyBody: string;
  closingHeading: string;
  closingCopy: string;
  closingLabel: string;
  seoTitle: string;
  seoDescription: string;
  ogTitle: string;
  ogDescription: string;
};

type GeneratedTaxonomy = {
  kind: 'area' | 'type';
  id: string;
  slug: string;
  sortOrder: number;
  translations: GeneratedTaxonomyTranslation[];
};

const programmes = programmeContent.programmes as GeneratedProgramme[];
const programmeTranslations = programmeContent.translations as unknown as GeneratedProgrammeTranslation[];
const taxonomies = taxonomyContent.entities as unknown as GeneratedTaxonomy[];

const taxonomyIdToSlug = new Map(taxonomies.map((entity) => [entity.id, entity.slug]));

function programmeEntity(slug: string, locale: ContentLocale, catalogue: ProgrammeCatalogueItem[]): ProgrammeLandingEntity | null {
  const programme = programmes.find((item) => item.slug === slug);
  const translation = programmeTranslations.find((item) => item.slug === slug && item.languageCode === locale)
    ?? programmeTranslations.find((item) => item.slug === slug && item.languageCode === 'en');
  const card = catalogue.find((item) => item.slug === slug);
  if (!programme || !translation || !card) return null;

  const { eyebrow, primary_cta_label: primaryCtaLabel, ...sectionValues } = translation.sections;
  return {
    kind: 'programme',
    slug,
    renderedLocale: translation.languageCode,
    publishedLocales: ['en', 'ua', 'cz'],
    title: translation.title,
    summary: translation.summary,
    heroCopy: translation.heroCopy,
    eyebrow: typeof eyebrow === 'string' ? eyebrow : `${card.type.title} | ${card.area.title}`,
    primaryCtaLabel: typeof primaryCtaLabel === 'string' ? primaryCtaLabel : '',
    primaryCtaUrl: programme.applicationUrl,
    area: card.area,
    type: card.type,
    format: programme.format,
    instructionLanguageCodes: card.instructionLanguageCodes,
    enrolmentBadge: card.enrolmentBadge,
    currentRunStartsAt: card.currentRunStartsAt,
    sections: sectionValues as Record<string, ProgrammeSection>,
    pricingOptions: [],
    seo: {
      title: translation.seoTitle,
      description: translation.seoDescription,
      ogTitle: translation.ogTitle,
      ogDescription: translation.ogDescription,
    },
  };
}

function taxonomyEntity(slug: string, locale: ContentLocale, catalogue: ProgrammeCatalogueItem[]): TaxonomyLandingEntity | null {
  const entity = taxonomies.find((item) => item.slug === slug);
  const translation = entity?.translations.find((item) => item.languageCode === locale)
    ?? entity?.translations.find((item) => item.languageCode === 'en');
  if (!entity || !translation) return null;

  return {
    kind: entity.kind,
    slug,
    renderedLocale: translation.languageCode,
    publishedLocales: entity.translations.map((item) => item.languageCode),
    title: translation.title,
    eyebrow: translation.eyebrow,
    lead: translation.lead,
    supportingCopy: translation.supportingCopy,
    primaryCtaLabel: translation.primaryCtaLabel,
    sections: {
      introHeading: translation.introHeading,
      introContent: translation.introContent,
      audienceHeading: translation.audienceHeading,
      audienceItems: translation.audienceItems,
      outcomesHeading: translation.outcomesHeading,
      outcomesItems: translation.outcomesItems,
      listingHeading: translation.listingHeading,
      listingIntro: translation.listingIntro,
      emptyHeading: translation.emptyHeading,
      emptyBody: translation.emptyBody,
      closingHeading: translation.closingHeading,
      closingCopy: translation.closingCopy,
      closingLabel: translation.closingLabel,
    },
    programmes: catalogue.filter((programme) => (
      entity.kind === 'area' ? programme.area.slug === slug : programme.type.slug === slug
    )),
    seo: {
      title: translation.seoTitle,
      description: translation.seoDescription,
      ogTitle: translation.ogTitle,
      ogDescription: translation.ogDescription,
    },
  };
}

export function getSeedProgrammeNamespaceEntity(slug: string, locale: ContentLocale, catalogue: ProgrammeCatalogueItem[]): ProgrammeNamespaceEntity | null {
  return programmeEntity(slug, locale, catalogue) ?? taxonomyEntity(slug, locale, catalogue);
}

export const reservedProgrammeNamespaceSlugs = [
  ...programmes.map((programme) => programme.slug),
  ...taxonomies.map((taxonomy) => taxonomy.slug),
];

export function getProgrammeTaxonomySlugs(programmeSlug: string): { areaSlug: string | null; typeSlug: string | null } {
  const programme = programmes.find((item) => item.slug === programmeSlug);
  return {
    areaSlug: programme ? (taxonomyIdToSlug.get(programme.areaId) ?? null) : null,
    typeSlug: programme ? (taxonomyIdToSlug.get(programme.typeId) ?? null) : null,
  };
}
