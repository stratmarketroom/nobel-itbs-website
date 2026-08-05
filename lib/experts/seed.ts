import type { ContentLocale } from '@/lib/content/localization';
import type { ExpertCard } from './types';

type LocalizedExpert = Pick<ExpertCard, 'slug' | 'photoPath'> & {
  translations: Record<ContentLocale, Omit<ExpertCard, 'slug' | 'photoPath'>>;
};

const experts: LocalizedExpert[] = [
  {
    slug: 'nataliia-kholodenko',
    photoPath: '/experts/nataliia-kholodenko.webp',
    translations: {
      en: { name: 'Nataliia Kholodenko', category: 'Psychologist, Candidate of Sciences', role: 'Expert and educational programme author', photoAlt: 'Nataliia Kholodenko' },
      ua: { name: 'Наталія Холоденко', category: 'Психологиня, кандидат наук', role: 'Експертка та авторка освітніх програм', photoAlt: 'Наталія Холоденко' },
      cz: { name: 'Nataliia Kholodenko', category: 'Psycholožka, kandidátka věd', role: 'Expertka a autorka vzdělávacích programů', photoAlt: 'Nataliia Kholodenko' },
    },
  },
  {
    slug: 'dmytro-shevchuk',
    photoPath: '/experts/dmytro-shevchuk.webp',
    translations: {
      en: { name: 'Dmytro Shevchuk', category: 'Practitioner in marketing and educational project production', role: 'AI Production programme expert', photoAlt: 'Dmytro Shevchuk' },
      ua: { name: 'Дмитро Шевчук', category: 'Експерт-практик з маркетингу та продюсування освітніх проєктів', role: 'Експерт програми AI Production', photoAlt: 'Дмитро Шевчук' },
      cz: { name: 'Dmytro Shevchuk', category: 'Praktický odborník na marketing a produkci vzdělávacích projektů', role: 'Expert programu AI Production', photoAlt: 'Dmytro Shevchuk' },
    },
  },
  {
    slug: 'alina-yudina',
    photoPath: '/experts/alina-yudina.webp',
    translations: {
      en: { name: 'Alina Yudina', category: 'Psychologist, Head of Nobel Mental Health, Candidate of Sciences', role: 'General Psychology lecturer', photoAlt: 'Alina Yudina' },
      ua: { name: 'Аліна Юдіна', category: 'Психологиня, керівниця Клініки психічного здоров’я, кандидат наук', role: 'Викладачка програми «Загальна психологія»', photoAlt: 'Аліна Юдіна' },
      cz: { name: 'Alina Yudina', category: 'Psycholožka, vedoucí Nobel Mental Health, kandidátka věd', role: 'Lektorka programu General Psychology', photoAlt: 'Alina Yudina' },
    },
  },
];

export function getSeedExperts(locale: ContentLocale): ExpertCard[] {
  return experts.map(({ translations, ...expert }) => ({ ...expert, ...translations[locale] }));
}
