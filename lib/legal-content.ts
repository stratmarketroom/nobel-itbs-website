import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Locale } from '@/lib/i18n';

export type LegalSlug = 'terms' | 'refund-policy' | 'privacy';

export type LegalBlock =
  | { type: 'heading'; level: 2 | 3; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] };

export type LegalPageCopy = {
  slug: LegalSlug;
  title: string;
  description: string;
  eyebrow: string;
  effectiveDate: string;
  languageNotice: string;
  versionLabel: string;
  printLabel: string;
  backLabel: string;
  homeHref: string;
  localeLinks: Array<{ locale: Locale; label: string; href: string }>;
  related: Array<{ label: string; href: string }>;
  blocks: LegalBlock[];
};

const legalMeta: Record<
  Locale,
  Record<
    LegalSlug,
    Omit<LegalPageCopy, 'slug' | 'blocks'>
  >
> = {
  en: {
    terms: {
      title: 'Terms of Use',
      description: 'Terms governing the purchase and use of Nobel ITBS online educational programmes.',
      eyebrow: 'Legal document',
      effectiveDate: 'Effective date: 1 March 2026',
      languageNotice: 'The Czech version prevails if language versions conflict.',
      versionLabel: 'Website version for Release 1',
      printLabel: 'Print or save',
      backLabel: 'Back to website',
      homeHref: '/',
      localeLinks: [
        { locale: 'en', label: 'EN', href: '/terms' },
        { locale: 'ua', label: 'UA', href: '/ua/terms' },
        { locale: 'cz', label: 'CZ', href: '/cz/terms' },
      ],
      related: [
        { label: 'Refund Policy', href: '/refund-policy' },
        { label: 'Privacy Policy', href: '/privacy' },
      ],
    },
    'refund-policy': {
      title: 'Refund Policy',
      description: 'Rules for withdrawal, complaints, and refunds for Nobel ITBS online programmes.',
      eyebrow: 'Legal document',
      effectiveDate: 'Effective date: 1 March 2026',
      languageNotice: 'The Terms of Use prevail if documents conflict. The Czech version prevails if language versions conflict.',
      versionLabel: 'Website version for Release 1',
      printLabel: 'Print or save',
      backLabel: 'Back to website',
      homeHref: '/',
      localeLinks: [
        { locale: 'en', label: 'EN', href: '/refund-policy' },
        { locale: 'ua', label: 'UA', href: '/ua/refund-policy' },
        { locale: 'cz', label: 'CZ', href: '/cz/refund-policy' },
      ],
      related: [
        { label: 'Terms of Use', href: '/terms' },
        { label: 'Privacy Policy', href: '/privacy' },
      ],
    },
    privacy: {
      title: 'Privacy Policy',
      description: 'How Nobel ITBS processes and protects personal data.',
      eyebrow: 'Legal document',
      effectiveDate: 'Effective date: 1 March 2026',
      languageNotice: 'The Czech version prevails if language versions conflict.',
      versionLabel: 'Website version for Release 1',
      printLabel: 'Print or save',
      backLabel: 'Back to website',
      homeHref: '/',
      localeLinks: [
        { locale: 'en', label: 'EN', href: '/privacy' },
        { locale: 'ua', label: 'UA', href: '/ua/privacy' },
        { locale: 'cz', label: 'CZ', href: '/cz/privacy' },
      ],
      related: [
        { label: 'Terms of Use', href: '/terms' },
        { label: 'Refund Policy', href: '/refund-policy' },
      ],
    },
  },
  ua: {
    terms: {
      title: 'Умови (Публічний договір)',
      description: 'Умови придбання та використання онлайн-освітніх програм Nobel ITBS.',
      eyebrow: 'Правовий документ',
      effectiveDate: 'Дата набрання чинності: 1 березня 2026 року',
      languageNotice: 'Український переклад потребує погодження чеським юристом. Канонічною є чеська версія.',
      versionLabel: 'Вебверсія для Release 1',
      printLabel: 'Роздрукувати або зберегти',
      backLabel: 'Назад на сайт',
      homeHref: '/ua',
      localeLinks: [
        { locale: 'en', label: 'EN', href: '/terms' },
        { locale: 'ua', label: 'UA', href: '/ua/terms' },
        { locale: 'cz', label: 'CZ', href: '/cz/terms' },
      ],
      related: [
        { label: 'Політика повернення', href: '/ua/refund-policy' },
        { label: 'Політика конфіденційності', href: '/ua/privacy' },
      ],
    },
    'refund-policy': {
      title: 'Політика повернення',
      description: 'Правила відмови, розгляду скарг і повернення коштів за онлайн-програми Nobel ITBS.',
      eyebrow: 'Правовий документ',
      effectiveDate: 'Дата набрання чинності: 1 березня 2026 року',
      languageNotice: 'Український переклад потребує погодження чеським юристом. У разі розбіжностей переважають Умови та чеська версія.',
      versionLabel: 'Вебверсія для Release 1',
      printLabel: 'Роздрукувати або зберегти',
      backLabel: 'Назад на сайт',
      homeHref: '/ua',
      localeLinks: [
        { locale: 'en', label: 'EN', href: '/refund-policy' },
        { locale: 'ua', label: 'UA', href: '/ua/refund-policy' },
        { locale: 'cz', label: 'CZ', href: '/cz/refund-policy' },
      ],
      related: [
        { label: 'Умови (Публічний договір)', href: '/ua/terms' },
        { label: 'Політика конфіденційності', href: '/ua/privacy' },
      ],
    },
    privacy: {
      title: 'Політика конфіденційності',
      description: 'Як Nobel ITBS обробляє та захищає персональні дані.',
      eyebrow: 'Правовий документ',
      effectiveDate: 'Дата набрання чинності: 1 березня 2026 року',
      languageNotice: 'Український переклад потребує погодження чеським юристом. Канонічною є чеська версія.',
      versionLabel: 'Вебверсія для Release 1',
      printLabel: 'Роздрукувати або зберегти',
      backLabel: 'Назад на сайт',
      homeHref: '/ua',
      localeLinks: [
        { locale: 'en', label: 'EN', href: '/privacy' },
        { locale: 'ua', label: 'UA', href: '/ua/privacy' },
        { locale: 'cz', label: 'CZ', href: '/cz/privacy' },
      ],
      related: [
        { label: 'Умови (Публічний договір)', href: '/ua/terms' },
        { label: 'Політика повернення', href: '/ua/refund-policy' },
      ],
    },
  },
  cz: {
    terms: {
      title: 'Podmínky používání',
      description: 'Podmínky nákupu a používání online vzdělávacích programů Nobel ITBS.',
      eyebrow: 'Právní dokument',
      effectiveDate: 'Datum účinnosti: 1. března 2026',
      languageNotice: 'Česká verze má přednost v případě rozporu mezi jazykovými verzemi.',
      versionLabel: 'Webová verze pro Release 1',
      printLabel: 'Vytisknout nebo uložit',
      backLabel: 'Zpět na web',
      homeHref: '/cz',
      localeLinks: [
        { locale: 'en', label: 'EN', href: '/terms' },
        { locale: 'ua', label: 'UA', href: '/ua/terms' },
        { locale: 'cz', label: 'CZ', href: '/cz/terms' },
      ],
      related: [
        { label: 'Podmínky vrácení peněz', href: '/cz/refund-policy' },
        { label: 'Zásady ochrany osobních údajů', href: '/cz/privacy' },
      ],
    },
    'refund-policy': {
      title: 'Podmínky vrácení peněz',
      description: 'Pravidla odstoupení, reklamací a vrácení peněz za online programy Nobel ITBS.',
      eyebrow: 'Právní dokument',
      effectiveDate: 'Datum účinnosti: 1. března 2026',
      languageNotice: 'V případě rozporu mají přednost Podmínky používání. Česká verze má přednost mezi jazykovými verzemi.',
      versionLabel: 'Webová verze pro Release 1',
      printLabel: 'Vytisknout nebo uložit',
      backLabel: 'Zpět na web',
      homeHref: '/cz',
      localeLinks: [
        { locale: 'en', label: 'EN', href: '/refund-policy' },
        { locale: 'ua', label: 'UA', href: '/ua/refund-policy' },
        { locale: 'cz', label: 'CZ', href: '/cz/refund-policy' },
      ],
      related: [
        { label: 'Podmínky používání', href: '/cz/terms' },
        { label: 'Zásady ochrany osobních údajů', href: '/cz/privacy' },
      ],
    },
    privacy: {
      title: 'Zásady ochrany osobních údajů',
      description: 'Jak Nobel ITBS zpracovává a chrání osobní údaje.',
      eyebrow: 'Právní dokument',
      effectiveDate: 'Datum účinnosti: 1. března 2026',
      languageNotice: 'Česká verze má přednost v případě rozporu mezi jazykovými verzemi.',
      versionLabel: 'Webová verze pro Release 1',
      printLabel: 'Vytisknout nebo uložit',
      backLabel: 'Zpět na web',
      homeHref: '/cz',
      localeLinks: [
        { locale: 'en', label: 'EN', href: '/privacy' },
        { locale: 'ua', label: 'UA', href: '/ua/privacy' },
        { locale: 'cz', label: 'CZ', href: '/cz/privacy' },
      ],
      related: [
        { label: 'Podmínky používání', href: '/cz/terms' },
        { label: 'Podmínky vrácení peněz', href: '/cz/refund-policy' },
      ],
    },
  },
};

function parseLegalText(source: string): LegalBlock[] {
  const lines = source
    .replace(/\u2028/g, '\n')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const blocks: LegalBlock[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      blocks.push({ type: 'list', items: listItems });
      listItems = [];
    }
  };

  for (const line of lines) {
    if (line.startsWith('# ')) {
      flushList();
      blocks.push({ type: 'heading', level: 2, text: line.replace(/^#\s+/, '') });
      continue;
    }

    if (line.startsWith('## ')) {
      flushList();
      blocks.push({ type: 'heading', level: 2, text: line.replace(/^##\s+/, '') });
      continue;
    }

    if (line.startsWith('### ')) {
      flushList();
      blocks.push({ type: 'heading', level: 3, text: line.replace(/^###\s+/, '') });
      continue;
    }

    if (/^[-•]\s+/.test(line)) {
      listItems.push(line.replace(/^[-•]\s+/, ''));
      continue;
    }

    if (/^\d+\.\s+\D/.test(line) && !/^\d+\.\d+/.test(line)) {
      flushList();
      blocks.push({ type: 'heading', level: 2, text: line });
      continue;
    }

    flushList();
    blocks.push({ type: 'paragraph', text: line });
  }

  flushList();
  return blocks;
}

export function getLegalPageCopy(locale: Locale, slug: LegalSlug): LegalPageCopy {
  const meta = legalMeta[locale][slug];
  const extension = locale === 'ua' ? 'md' : 'txt';
  const raw = readFileSync(join(process.cwd(), 'content', 'legal', locale, `${slug}.${extension}`), 'utf8');

  return {
    slug,
    ...meta,
    blocks: parseLegalText(raw),
  };
}

export function isLegalSlug(value: string): value is LegalSlug {
  return value === 'terms' || value === 'refund-policy' || value === 'privacy';
}
