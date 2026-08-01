import type { Locale } from '@/lib/i18n';

export type SystemSlug = 'rate-limit' | 'temporary-error' | 'access-denied';

export type SystemPageCopy = {
  seoTitle: string;
  eyebrow: string;
  heading: string;
  body: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
};

export const notFoundCopy: Record<Locale, SystemPageCopy> = {
  en: {
    seoTitle: 'Page Not Found',
    eyebrow: '404',
    heading: 'Page not found',
    body: 'The page may have moved, changed its address, or no longer be available.',
    primaryCta: { label: 'View programmes', href: '/programmes' },
    secondaryCta: { label: 'Return home', href: '/' },
  },
  ua: {
    seoTitle: 'Сторінку не знайдено',
    eyebrow: '404',
    heading: 'Сторінку не знайдено',
    body: 'Можливо, сторінку переміщено, її адресу змінено або вона більше недоступна.',
    primaryCta: { label: 'Переглянути програми', href: '/ua/programmes' },
    secondaryCta: { label: 'На головну', href: '/ua' },
  },
  cz: {
    seoTitle: 'Stránka nenalezena',
    eyebrow: '404',
    heading: 'Stránka nebyla nalezena',
    body: 'Stránka mohla být přesunuta, změnila adresu nebo již není dostupná.',
    primaryCta: { label: 'Zobrazit programy', href: '/cz/programmes' },
    secondaryCta: { label: 'Zpět na hlavní stránku', href: '/cz' },
  },
};

export const systemCopy: Record<Locale, Record<SystemSlug, SystemPageCopy>> = {
  en: {
    'rate-limit': {
      seoTitle: 'Please Wait',
      eyebrow: 'System notice',
      heading: 'Too many requests',
      body: 'We have temporarily limited new requests. Wait a moment and try again.',
      primaryCta: { label: 'Try again later', href: '/' },
    },
    'temporary-error': {
      seoTitle: 'Service Temporarily Unavailable',
      eyebrow: 'System notice',
      heading: 'Something went wrong',
      body: 'The service is temporarily unavailable. Please try again later.',
      primaryCta: { label: 'Try again', href: '/' },
      secondaryCta: { label: 'Return home', href: '/' },
    },
    'access-denied': {
      seoTitle: 'Access Denied',
      eyebrow: 'Admin',
      heading: 'You do not have access to this section',
      body: 'Your account does not have the required role or security level.',
      primaryCta: { label: 'Go to admin home', href: '/admin/users' },
      secondaryCta: { label: 'Sign out', href: '/admin/login' },
    },
  },
  ua: {
    'rate-limit': {
      seoTitle: 'Зачекайте',
      eyebrow: 'Системне повідомлення',
      heading: 'Забагато запитів',
      body: 'Ми тимчасово обмежили нові запити. Зачекайте трохи та спробуйте знову.',
      primaryCta: { label: 'Спробувати пізніше', href: '/ua' },
    },
    'temporary-error': {
      seoTitle: 'Сервіс тимчасово недоступний',
      eyebrow: 'Системне повідомлення',
      heading: 'Сталася помилка',
      body: 'Сервіс тимчасово недоступний. Спробуйте ще раз пізніше.',
      primaryCta: { label: 'Повторити', href: '/ua' },
      secondaryCta: { label: 'На головну', href: '/ua' },
    },
    'access-denied': {
      seoTitle: 'Доступ заборонено',
      eyebrow: 'Адмінпанель',
      heading: 'У вас немає доступу до цього розділу',
      body: 'Ваш обліковий запис не має потрібної ролі або рівня безпеки.',
      primaryCta: { label: 'До головної адмінпанелі', href: '/admin/users' },
      secondaryCta: { label: 'Вийти', href: '/admin/login' },
    },
  },
  cz: {
    'rate-limit': {
      seoTitle: 'Počkejte prosím',
      eyebrow: 'Systémové oznámení',
      heading: 'Příliš mnoho požadavků',
      body: 'Nové požadavky jsme dočasně omezili. Chvíli počkejte a zkuste to znovu.',
      primaryCta: { label: 'Zkusit později', href: '/cz' },
    },
    'temporary-error': {
      seoTitle: 'Služba je dočasně nedostupná',
      eyebrow: 'Systémové oznámení',
      heading: 'Něco se nepodařilo',
      body: 'Služba je dočasně nedostupná. Zkuste to prosím později.',
      primaryCta: { label: 'Zkusit znovu', href: '/cz' },
      secondaryCta: { label: 'Zpět na hlavní stránku', href: '/cz' },
    },
    'access-denied': {
      seoTitle: 'Přístup odepřen',
      eyebrow: 'Administrace',
      heading: 'Do této části nemáte přístup',
      body: 'Váš účet nemá požadovanou roli nebo úroveň zabezpečení.',
      primaryCta: { label: 'Přejít na hlavní stránku administrace', href: '/admin/users' },
      secondaryCta: { label: 'Odhlásit se', href: '/admin/login' },
    },
  },
};

export function isSystemSlug(value: string): value is SystemSlug {
  return value === 'rate-limit' || value === 'temporary-error' || value === 'access-denied';
}
