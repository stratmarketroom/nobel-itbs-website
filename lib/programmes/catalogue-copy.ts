import type { ContentLocale } from '@/lib/content/localization';
import type { EnrolmentBadge } from './catalogue-types';

export type ProgrammeCatalogueCopy = {
  seo: {
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
  };
  eyebrow: string;
  title: string;
  lead: string;
  intro: string;
  navLabel: string;
  localeLabel: string;
  programmeCount: (count: number) => string;
  badgeLabels: Record<EnrolmentBadge, string>;
  startDate: (isoDate: string) => string;
  documentLabel: string;
  viewProgramme: string;
  empty: {
    title: string;
    body: string;
    cta: string;
  };
};

function formatDate(locale: string, isoDate: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${isoDate}T00:00:00Z`));
}

export const programmeCatalogueCopy: Record<ContentLocale, ProgrammeCatalogueCopy> = {
  en: {
    seo: {
      title: 'Professional Programmes | Nobel ITBS',
      description: 'Explore Nobel ITBS professional programmes in business, technology, and psychology, including distance courses, certificate programmes, and Mini-MBA study.',
      ogTitle: 'Nobel ITBS Professional Programmes',
      ogDescription: 'Find a programme to develop your competencies, pursue a new professional direction, or structure your existing experience.',
    },
    eyebrow: 'Programmes',
    title: 'Professional Programmes',
    lead: 'Choose your learning path based on your professional goal, the competencies you need, and the format that works for you.',
    intro: 'Nobel ITBS presents its own and partner programmes in business, technology, innovation, and psychology. Compare the subject, duration, language of instruction, and document provided by each programme.',
    navLabel: 'Primary navigation',
    localeLabel: 'Language',
    programmeCount: (count) => `${count} published programmes`,
    badgeLabels: {
      open: 'Enrolment open',
      ongoing: 'Ongoing enrolment',
      coming_soon: 'Coming soon',
      inactive: 'Enrolment closed',
    },
    startDate: (date) => `Current cohort starts on ${formatDate('en-GB', date)}`,
    documentLabel: 'Document',
    viewProgramme: 'View programme',
    empty: {
      title: 'Programmes are being prepared for publication',
      body: 'There are currently no programmes available in the catalogue. Ask us a question to learn about upcoming study opportunities.',
      cta: 'Ask a question',
    },
  },
  ua: {
    seo: {
      title: 'Професійні програми | Nobel ITBS',
      description: 'Обирайте професійні програми Nobel ITBS у бізнесі, технологіях та психології: дистанційні курси, сертифікатні програми й Mini-MBA.',
      ogTitle: 'Професійні програми Nobel ITBS',
      ogDescription: 'Знайдіть програму для розвитку компетентностей, нового професійного напряму або систематизації досвіду.',
    },
    eyebrow: 'Програми',
    title: 'Професійні програми',
    lead: 'Обирайте навчання відповідно до професійної мети, потрібних компетентностей і формату.',
    intro: 'Nobel ITBS представляє власні та партнерські програми у бізнесі, технологіях, інноваціях і психології. Порівняйте тематику, тривалість, мову навчання та документ, передбачений конкретною програмою.',
    navLabel: 'Головна навігація',
    localeLabel: 'Мова',
    programmeCount: (count) => `${count} опублікованих програм`,
    badgeLabels: {
      open: 'Набір відкрито',
      ongoing: 'Постійний набір',
      coming_soon: 'Незабаром',
      inactive: 'Набір завершено',
    },
    startDate: (date) => `Старт поточного набору — ${formatDate('uk-UA', date).replace(' р.', ' року')}`,
    documentLabel: 'Документ',
    viewProgramme: 'Переглянути програму',
    empty: {
      title: 'Програми готуються до публікації',
      body: 'Зараз у каталозі немає доступних програм. Залиште запитання, щоб дізнатися про наступні можливості навчання.',
      cta: 'Поставити запитання',
    },
  },
  cz: {
    seo: {
      title: 'Profesní vzdělávací programy | Nobel ITBS',
      description: 'Prohlédněte si profesní programy Nobel ITBS v oblasti byznysu, technologií a psychologie, včetně distančních kurzů, certifikátových programů a studia Mini-MBA.',
      ogTitle: 'Profesní programy Nobel ITBS',
      ogDescription: 'Najděte program pro rozvoj kompetencí, nový profesní směr nebo systematizaci dosavadních zkušeností.',
    },
    eyebrow: 'Programy',
    title: 'Profesní vzdělávací programy',
    lead: 'Zvolte si vzdělávací cestu podle svého profesního cíle, potřebných kompetencí a formátu, který vám vyhovuje.',
    intro: 'Nobel ITBS představuje vlastní i partnerské programy v oblasti byznysu, technologií, inovací a psychologie. Porovnejte zaměření, délku, jazyk výuky a dokument vydávaný po dokončení jednotlivých programů.',
    navLabel: 'Hlavní navigace',
    localeLabel: 'Jazyk',
    programmeCount: (count) => `${count} zveřejněných programů`,
    badgeLabels: {
      open: 'Přihlášky otevřeny',
      ongoing: 'Průběžný zápis',
      coming_soon: 'Již brzy',
      inactive: 'Přihlášky uzavřeny',
    },
    startDate: (date) => `Aktuální běh začíná ${formatDate('cs-CZ', date)}`,
    documentLabel: 'Dokument',
    viewProgramme: 'Zobrazit program',
    empty: {
      title: 'Programy se připravují ke zveřejnění',
      body: 'V katalogu momentálně nejsou dostupné žádné programy. Napište nám a získejte informace o připravovaných možnostech studia.',
      cta: 'Položit dotaz',
    },
  },
};
