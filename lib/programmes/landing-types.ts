import type { ContentLocale } from '@/lib/content/localization';
import type { EnrolmentBadge, ProgrammeCatalogueItem } from './catalogue-types';

export type SeoMetadata = {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
};

export type ProgrammeSection = {
  heading?: string;
  content?: string;
  fields?: Record<string, unknown>;
  items?: Array<{ question: string; answer: string }>;
};

export type ProgrammePricingOption = {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  price: number | null;
  currencyCode: string | null;
  applicationUrl: string | null;
};

export type ProgrammeLandingEntity = {
  kind: 'programme';
  slug: string;
  renderedLocale: ContentLocale;
  title: string;
  summary: string;
  heroCopy: string;
  eyebrow: string;
  primaryCtaLabel: string;
  primaryCtaUrl: string | null;
  area: { slug: string; title: string };
  type: { slug: string; title: string };
  format: 'distance' | 'blended_distance';
  instructionLanguageCodes: string[];
  enrolmentBadge: EnrolmentBadge;
  currentRunStartsAt: string | null;
  sections: Record<string, ProgrammeSection>;
  pricingOptions: ProgrammePricingOption[];
  seo: SeoMetadata;
};

export type TaxonomyLandingSections = {
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
};

export type TaxonomyLandingEntity = {
  kind: 'area' | 'type';
  slug: string;
  renderedLocale: ContentLocale;
  title: string;
  eyebrow: string;
  lead: string;
  supportingCopy: string;
  primaryCtaLabel: string;
  sections: TaxonomyLandingSections;
  programmes: ProgrammeCatalogueItem[];
  seo: SeoMetadata;
};

export type ProgrammeNamespaceEntity = ProgrammeLandingEntity | TaxonomyLandingEntity;
