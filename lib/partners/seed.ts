import type { ContentLocale } from '@/lib/content/localization';
import type { PartnerCard } from './types';

type LocalizedPartner = Omit<PartnerCard, 'name' | 'role' | 'location' | 'logoAlt'> & {
  translations: Record<ContentLocale, Pick<PartnerCard, 'name' | 'role' | 'location' | 'logoAlt'>>;
};

const partners: LocalizedPartner[] = [
  {
    slug: 'alfred-nobel-university',
    type: 'exclusive_academic_partner',
    officialUrl: 'https://duan.edu.ua',
    logoPath: '/partners/alfred-nobel-university.webp',
    translations: {
      en: { name: 'Alfred Nobel University', role: 'Exclusive academic partner of Nobel ITBS', location: 'Dnipro, Ukraine', logoAlt: 'Alfred Nobel University logo' },
      ua: { name: 'Університет імені Альфреда Нобеля', role: 'Ексклюзивний академічний партнер Nobel ITBS', location: 'м. Дніпро, Україна', logoAlt: 'Логотип Університету імені Альфреда Нобеля' },
      cz: { name: 'Alfred Nobel University', role: 'Exkluzivní akademický partner Nobel ITBS', location: 'Dnipro, Ukrajina', logoAlt: 'Logo Alfred Nobel University' },
    },
  },
  {
    slug: 'riga-nordic-university',
    type: 'partner_organisation',
    officialUrl: 'https://rnu.lv/en/',
    logoPath: '/partners/riga-nordic-university.webp',
    translations: {
      en: { name: 'Riga Nordic University', role: 'Partner organisation', location: 'Riga, Latvia', logoAlt: 'Riga Nordic University logo' },
      ua: { name: 'Рижський нордичний університет', role: 'Організація-партнер', location: 'м. Рига, Латвія', logoAlt: 'Логотип Рижського нордичного університету' },
      cz: { name: 'Riga Nordic University', role: 'Partnerská organizace', location: 'Riga, Lotyšsko', logoAlt: 'Logo Riga Nordic University' },
    },
  },
  {
    slug: 'nataliia-kholodenko-psychology-centre',
    type: 'partner_organisation',
    officialUrl: 'https://school.kholodenko.net/',
    logoPath: '/partners/nataliia-kholodenko-psychology-centre.webp',
    translations: {
      en: { name: 'Nataliia Kholodenko Psychology Centre', role: 'Partner organisation', location: null, logoAlt: 'Nataliia Kholodenko Psychology Centre logo' },
      ua: { name: 'Центр Психології Наталії Холоденко', role: 'Організація-партнер', location: null, logoAlt: 'Логотип Центру Психології Наталії Холоденко' },
      cz: { name: 'Nataliia Kholodenko Psychology Centre', role: 'Partnerská organizace', location: null, logoAlt: 'Logo Nataliia Kholodenko Psychology Centre' },
    },
  },
  {
    slug: 'e-launch-online-school',
    type: 'partner_organisation',
    officialUrl: 'https://e-launch.net/',
    logoPath: '/partners/e-launch-online-school.webp',
    translations: {
      en: { name: 'e-launch Online School', role: 'Partner organisation', location: null, logoAlt: 'e-launch Online School logo' },
      ua: { name: 'Онлайн-школа e-launch', role: 'Організація-партнер', location: null, logoAlt: 'Логотип онлайн-школи e-launch' },
      cz: { name: 'e-launch Online School', role: 'Partnerská organizace', location: null, logoAlt: 'Logo e-launch Online School' },
    },
  },
  {
    slug: 'nobel-mental-health',
    type: 'partner_organisation',
    officialUrl: 'https://duan.edu.ua/pro-nas/departamenty-ta-strukturni-pidrozdily/klinika-psyhichnogo-zdorov-ja/',
    logoPath: '/partners/nobel-mental-health.webp',
    translations: {
      en: { name: 'Nobel Mental Health', role: 'Partner organisation', location: null, logoAlt: 'Nobel Mental Health logo' },
      ua: { name: 'Клініка психічного здоров’я', role: 'Організація-партнер', location: null, logoAlt: 'Логотип Клініки психічного здоров’я' },
      cz: { name: 'Nobel Mental Health', role: 'Partnerská organizace', location: null, logoAlt: 'Logo Nobel Mental Health' },
    },
  },
];

export function getSeedPartners(locale: ContentLocale): PartnerCard[] {
  return partners.map(({ translations, ...partner }) => ({ ...partner, ...translations[locale] }));
}
