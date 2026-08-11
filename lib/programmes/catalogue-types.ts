import type { ContentLocale } from '@/lib/content/localization';

export type EnrolmentBadge = 'open' | 'ongoing' | 'coming_soon' | 'inactive';

export type ProgrammeCatalogueItem = {
  slug: string;
  title: string;
  description: string;
  facts: string;
  documentSummary: string;
  area: {
    slug: string;
    title: string;
  };
  type: {
    slug: string;
    title: string;
  };
  format: 'distance' | 'blended_distance';
  instructionLanguageCodes: string[];
  enrolmentBadge: EnrolmentBadge;
  currentRunStartsAt: string | null;
  featured: boolean;
};

export type ProgrammeCatalogueResponse = {
  locale: ContentLocale;
  items: ProgrammeCatalogueItem[];
};
