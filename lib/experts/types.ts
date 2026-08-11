import type { ContentLocale } from '@/lib/content/localization';

export type ExpertCard = {
  slug: string;
  name: string;
  category: string;
  role: string;
  photoPath: string | null;
  photoAlt: string | null;
};

export type PublicExpertsResponse = {
  locale: ContentLocale;
  items: ExpertCard[];
};
