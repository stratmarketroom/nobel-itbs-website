export const locales = ['en', 'ua', 'cz'] as const;
export const prefixedLocales = ['ua', 'cz'] as const;

export type Locale = (typeof locales)[number];
export type PrefixedLocale = (typeof prefixedLocales)[number];

type NavItem = {
  label: string;
  href: string;
};

export type HomeCopy = {
  homeHref: string;
  navLabel: string;
  localeLabel: string;
  nav: NavItem[];
  eyebrow: string;
  title: string;
  lead: string;
  primary: NavItem;
  secondary: NavItem;
  panelLabel: string;
  panelTitle: string;
  signals: Array<{
    icon: string;
    title: string;
    text: string;
  }>;
  foundationLabel: string;
  foundation: Array<{
    kicker: string;
    title: string;
    text: string;
  }>;
};

export const localeLinks: Array<{ locale: Locale; label: string; href: string }> = [
  { locale: 'en', label: 'EN', href: '/' },
  { locale: 'ua', label: 'UA', href: '/ua' },
  { locale: 'cz', label: 'CZ', href: '/cz' },
];

export function isPrefixedLocale(locale: string): locale is PrefixedLocale {
  return prefixedLocales.includes(locale as PrefixedLocale);
}

const englishNav: NavItem[] = [
  { label: 'Programmes', href: '/programmes' },
  { label: 'For Organisations', href: '/for-organisations' },
  { label: 'Partnerships', href: '/partnerships' },
  { label: 'Verify', href: '/verify' },
  { label: 'About', href: '/about' },
];

const ukrainianNav: NavItem[] = [
  { label: 'Програми', href: '/ua/programmes' },
  { label: 'Для організацій', href: '/ua/for-organisations' },
  { label: 'Партнерства', href: '/ua/partnerships' },
  { label: 'Перевірити', href: '/ua/verify' },
  { label: 'Про нас', href: '/ua/about' },
];

const czechNav: NavItem[] = [
  { label: 'Programy', href: '/cz/programmes' },
  { label: 'Pro organizace', href: '/cz/for-organisations' },
  { label: 'Partnerství', href: '/cz/partnerships' },
  { label: 'Ověřit', href: '/cz/verify' },
  { label: 'O nás', href: '/cz/about' },
];

export const homeCopy: Record<Locale, HomeCopy> = {
  en: {
    homeHref: '/',
    navLabel: 'Primary navigation',
    localeLabel: 'Language',
    nav: englishNav,
    eyebrow: 'International Business School',
    title: 'Nobel ITBS',
    lead:
      'A premium multilingual foundation for programmes, partnerships, and trusted credential verification.',
    primary: { label: 'Explore programmes', href: '/programmes' },
    secondary: { label: 'Verify a document', href: '/verify' },
    panelLabel: 'Platform foundation signals',
    panelTitle: 'Release 1 foundation',
    signals: [
      {
        icon: '01',
        title: 'Multilingual from day one',
        text: 'English stays at root, Ukrainian uses /ua, Czech uses /cz.',
      },
      {
        icon: '02',
        title: 'Trust-first verification',
        text: 'The public registry is prepared for document number and QR token checks only.',
      },
      {
        icon: '03',
        title: 'Admin security baseline',
        text: 'Roles, Owner governance, audit, and MFA checks are designed into the database layer.',
      },
    ],
    foundationLabel: 'Frontend foundation',
    foundation: [
      {
        kicker: 'Shell',
        title: 'Public structure',
        text: 'Navigation follows Release 1 scope and intentionally excludes News.',
      },
      {
        kicker: 'Design',
        title: 'Premium restraint',
        text: 'Dark hero, light content, strong contrast, and practical responsive rules.',
      },
      {
        kicker: 'Scope',
        title: 'Ready, not overbuilt',
        text: 'No feature data models are invented in the frontend scaffold.',
      },
    ],
  },
  ua: {
    homeHref: '/ua',
    navLabel: 'Основна навігація',
    localeLabel: 'Мова',
    nav: ukrainianNav,
    eyebrow: 'Міжнародна бізнес-школа',
    title: 'Nobel ITBS',
    lead:
      'Преміальна багатомовна основа для програм, партнерств і надійної перевірки документів.',
    primary: { label: 'Переглянути програми', href: '/ua/programmes' },
    secondary: { label: 'Перевірити документ', href: '/ua/verify' },
    panelLabel: 'Сигнали фундаменту платформи',
    panelTitle: 'Фундамент Release 1',
    signals: [
      {
        icon: '01',
        title: 'Багатомовність з першого дня',
        text: 'Англійська працює без prefix, українська використовує /ua, чеська використовує /cz.',
      },
      {
        icon: '02',
        title: 'Перевірка з фокусом на довіру',
        text: 'Публічний реєстр готується тільки для номера документа та QR token.',
      },
      {
        icon: '03',
        title: 'Безпечна admin-основа',
        text: 'Ролі, Owner governance, audit і MFA checks закладені на рівні бази даних.',
      },
    ],
    foundationLabel: 'Frontend foundation',
    foundation: [
      {
        kicker: 'Shell',
        title: 'Публічна структура',
        text: 'Навігація відповідає Release 1 scope і свідомо не містить News.',
      },
      {
        kicker: 'Design',
        title: 'Преміальна стриманість',
        text: 'Темний hero, світлий контент, високий контраст і практична responsive-основа.',
      },
      {
        kicker: 'Scope',
        title: 'Готово, але без зайвого',
        text: 'Frontend scaffold не вигадує feature data models.',
      },
    ],
  },
  cz: {
    homeHref: '/cz',
    navLabel: 'Hlavní navigace',
    localeLabel: 'Jazyk',
    nav: czechNav,
    eyebrow: 'Mezinárodní obchodní škola',
    title: 'Nobel ITBS',
    lead:
      'Prémiový vícejazyčný základ pro programy, partnerství a důvěryhodné ověřování dokumentů.',
    primary: { label: 'Zobrazit programy', href: '/cz/programmes' },
    secondary: { label: 'Ověřit dokument', href: '/cz/verify' },
    panelLabel: 'Základní signály platformy',
    panelTitle: 'Základ Release 1',
    signals: [
      {
        icon: '01',
        title: 'Vícejazyčnost od začátku',
        text: 'Angličtina běží bez prefixu, ukrajinština používá /ua, čeština používá /cz.',
      },
      {
        icon: '02',
        title: 'Ověřování postavené na důvěře',
        text: 'Veřejný registr je připraven pouze pro číslo dokumentu a QR token.',
      },
      {
        icon: '03',
        title: 'Bezpečný admin základ',
        text: 'Role, Owner governance, audit a MFA kontroly jsou navrženy na databázové vrstvě.',
      },
    ],
    foundationLabel: 'Frontend foundation',
    foundation: [
      {
        kicker: 'Shell',
        title: 'Veřejná struktura',
        text: 'Navigace odpovídá Release 1 scope a záměrně neobsahuje News.',
      },
      {
        kicker: 'Design',
        title: 'Prémiová zdrženlivost',
        text: 'Tmavý hero, světlý obsah, silný kontrast a praktický responsive základ.',
      },
      {
        kicker: 'Scope',
        title: 'Připravené, ne přestavěné',
        text: 'Frontend scaffold si nevymýšlí feature data models.',
      },
    ],
  },
};
