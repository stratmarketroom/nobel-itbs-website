import type { ContentLocale } from '@/lib/content/localization';

export type PartnershipModel = {
  title: string;
  body: string;
};

export type PartnershipsPageContent = {
  locale: ContentLocale;
  seo: {
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    lead: string;
    supportingCopy: string;
    primaryCta: string;
    fallbackCta: string;
  };
  principles: {
    heading: string;
    items: string[];
  };
  models: {
    heading: string;
    items: PartnershipModel[];
  };
  academic: {
    heading: string;
    body: string;
  };
  partners: {
    heading: string;
    intro: string;
  };
  experts: {
    heading: string;
    intro: string;
  };
  boundaries: {
    heading: string;
    items: string[];
  };
  closing: {
    heading: string;
    copy: string;
  };
};
