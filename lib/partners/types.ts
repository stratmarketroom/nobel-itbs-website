import type { ContentLocale } from '@/lib/content/localization';

export type PartnerType = 'exclusive_academic_partner' | 'partner_organisation';

export type PartnerCard = {
  slug: string;
  type: PartnerType;
  name: string;
  role: string;
  location: string | null;
  officialUrl: string;
  logoPath: string;
  logoAlt: string;
};

export type PublicPartnersResponse = {
  locale: ContentLocale;
  items: PartnerCard[];
};
