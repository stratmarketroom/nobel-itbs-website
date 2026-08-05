import type { ContentLocale } from '@/lib/content/localization';
import type { ProgrammeCatalogueItem } from './catalogue-types';

type LocalizedCard = Pick<ProgrammeCatalogueItem, 'title' | 'description' | 'facts' | 'documentSummary'> & {
  areaTitle: string;
  typeTitle: string;
};

type SeedProgramme = Omit<ProgrammeCatalogueItem, 'title' | 'description' | 'facts' | 'documentSummary' | 'area' | 'type'> & {
  areaSlug: string;
  typeSlug: string;
  translations: Record<ContentLocale, LocalizedCard>;
};

const seeds: SeedProgramme[] = [
  {
    slug: 'ai-production',
    areaSlug: 'business-management',
    typeSlug: 'mini-mba',
    format: 'blended_distance',
    instructionLanguageCodes: ['uk'],
    enrolmentBadge: 'open',
    currentRunStartsAt: null,
    featured: false,
    translations: {
      en: { title: 'AI Production', areaTitle: 'Business & Management', typeTitle: 'Mini-MBA', description: 'Create, launch, and scale expert-led and educational products with product strategy, marketing, sales, management, and AI.', facts: '6 months · 360 hours / 12 ECTS · distance learning · Ukrainian', documentSummary: 'University certificate after 3 months and an international Mini-MBA diploma with Diploma Supplement after completing the full programme.' },
      ua: { title: 'AI Production', areaTitle: 'Business & Management', typeTitle: 'Mini-MBA', description: 'Створюйте, запускайте й масштабуйте експертні та освітні продукти за допомогою продуктової стратегії, маркетингу, продажів, управління й AI.', facts: '6 місяців · 360 годин / 12 ECTS · дистанційне навчання · українська', documentSummary: 'Університетський сертифікат після 3 місяців і міжнародний диплом Mini-MBA з Diploma Supplement після завершення програми.' },
      cz: { title: 'AI Production', areaTitle: 'Business & Management', typeTitle: 'Mini-MBA', description: 'Vytvářejte, uvádějte na trh a škálujte expertní a vzdělávací produkty pomocí produktové strategie, marketingu, prodeje, managementu a AI.', facts: '6 měsíců · 360 hodin / 12 ECTS · distanční výuka · ukrajinština', documentSummary: 'Univerzitní certifikát po 3 měsících a mezinárodní diplom Mini-MBA s Diploma Supplement po dokončení celého programu.' },
    },
  },
  {
    slug: 'general-psychology',
    areaSlug: 'psychology-human',
    typeSlug: 'professional-development-course',
    format: 'distance',
    instructionLanguageCodes: ['uk'],
    enrolmentBadge: 'ongoing',
    currentRunStartsAt: null,
    featured: false,
    translations: {
      en: { title: 'General Psychology', areaTitle: 'Psychology & Human', typeTitle: 'Professional development course', description: 'Build a structured foundation in the psyche, personality, motivation, emotions, and cognitive processes.', facts: '90 hours / 3 ECTS · distance learning in Moodle · 1-year access · Ukrainian', documentSummary: 'Professional development certificate from the University of Alfred Nobel.' },
      ua: { title: 'Загальна психологія', areaTitle: 'Psychology & Human', typeTitle: 'Програма професійного підвищення кваліфікації', description: 'Сформуйте системну основу знань про психіку, особистість, мотивацію, емоції та пізнавальні процеси.', facts: '90 годин / 3 ECTS · дистанційно в Moodle · доступ на 1 рік · українська', documentSummary: 'Сертифікат про підвищення кваліфікації від Університету імені Альфреда Нобеля.' },
      cz: { title: 'Obecná psychologie', areaTitle: 'Psychology & Human', typeTitle: 'Kurz profesního rozvoje', description: 'Vybudujte si strukturovaný základ v oblasti psychiky, osobnosti, motivace, emocí a kognitivních procesů.', facts: '90 hodin / 3 ECTS · distanční výuka v Moodle · přístup na 1 rok · ukrajinština', documentSummary: 'Certifikát profesního rozvoje od Univerzity Alfreda Nobela.' },
    },
  },
  {
    slug: 'child-psychology',
    areaSlug: 'psychology-human',
    typeSlug: 'professional-development-course',
    format: 'distance',
    instructionLanguageCodes: ['uk'],
    enrolmentBadge: 'ongoing',
    currentRunStartsAt: null,
    featured: false,
    translations: {
      en: { title: 'Child Psychology', areaTitle: 'Psychology & Human', typeTitle: 'Professional development course', description: 'Deepen your understanding of child development, age-related characteristics, and responsible psychological support.', facts: '90 hours / 3 ECTS · distance learning in Moodle · 6-month access · Ukrainian', documentSummary: 'Professional development certificate from the University of Alfred Nobel.' },
      ua: { title: 'Дитяча психологія', areaTitle: 'Psychology & Human', typeTitle: 'Програма професійного підвищення кваліфікації', description: 'Поглибте розуміння психологічного розвитку дитини, вікових особливостей і відповідального психологічного супроводу.', facts: '90 годин / 3 ECTS · дистанційно в Moodle · доступ на 6 місяців · українська', documentSummary: 'Сертифікат про підвищення кваліфікації від Університету імені Альфреда Нобеля.' },
      cz: { title: 'Dětská psychologie', areaTitle: 'Psychology & Human', typeTitle: 'Kurz profesního rozvoje', description: 'Prohlubte své porozumění vývoji dítěte, věkovým specifikům a odpovědné psychologické podpoře.', facts: '90 hodin / 3 ECTS · distanční výuka v Moodle · přístup na 6 měsíců · ukrajinština', documentSummary: 'Certifikát profesního rozvoje od Univerzity Alfreda Nobela.' },
    },
  },
  {
    slug: 'neuroplastic-reconstruction',
    areaSlug: 'psychology-human',
    typeSlug: 'professional-development-course',
    format: 'blended_distance',
    instructionLanguageCodes: ['uk'],
    enrolmentBadge: 'open',
    currentRunStartsAt: '2026-10-05',
    featured: false,
    translations: {
      en: { title: 'Neuroplastic Reconstruction', areaTitle: 'Psychology & Human', typeTitle: 'Professional development course', description: 'Explore neuroplasticity, self-regulation, and behavioural patterns in a structured 12-module programme.', facts: '3 months · 180 hours / 6 ECTS · blended distance learning · Ukrainian', documentSummary: 'Documents and professional status depend on the selected pricing tier.' },
      ua: { title: 'Нейропластична реконструкція', areaTitle: 'Psychology & Human', typeTitle: 'Програма професійного підвищення кваліфікації', description: 'Досліджуйте нейропластичність, саморегуляцію та поведінкові патерни у структурованій 12-модульній програмі.', facts: '3 місяці · 180 годин / 6 ECTS · змішане дистанційне навчання · українська', documentSummary: 'Документи та професійний статус залежать від обраного тарифу.' },
      cz: { title: 'Neuroplastická rekonstrukce', areaTitle: 'Psychology & Human', typeTitle: 'Kurz profesního rozvoje', description: 'Prozkoumejte neuroplasticitu, seberegulaci a behaviorální vzorce ve strukturovaném programu o 12 modulech.', facts: '3 měsíce · 180 hodin / 6 ECTS · kombinovaná distanční výuka · ukrajinština', documentSummary: 'Dokumenty a profesní status závisí na zvolené cenové variantě.' },
    },
  },
  {
    slug: 'space-business',
    areaSlug: 'technology-innovation',
    typeSlug: 'certificate-programme',
    format: 'distance',
    instructionLanguageCodes: ['uk', 'en'],
    enrolmentBadge: 'ongoing',
    currentRunStartsAt: null,
    featured: false,
    translations: {
      en: { title: 'Space Business', areaTitle: 'Technology & Innovation', typeTitle: 'Certificate programme', description: 'Understand the space market, technology, start-ups, economics, law, and models of international cooperation.', facts: '90 hours · distance learning in Moodle · Ukrainian and English', documentSummary: 'Certificate issued by the University of Alfred Nobel; hours are not stated on the certificate.' },
      ua: { title: 'Космічний бізнес', areaTitle: 'Technology & Innovation', typeTitle: 'Сертифікатна програма', description: 'Зрозумійте космічний ринок, технології, стартапи, економіку, право та моделі міжнародної співпраці.', facts: '90 годин · дистанційно в Moodle · українська та англійська', documentSummary: 'Сертифікат Університету імені Альфреда Нобеля; години на сертифікаті не зазначаються.' },
      cz: { title: 'Vesmírný byznys', areaTitle: 'Technology & Innovation', typeTitle: 'Certifikátový program', description: 'Porozumějte vesmírnému trhu, technologiím, start-upům, ekonomice, právu a modelům mezinárodní spolupráce.', facts: '90 hodin · distanční výuka v Moodle · ukrajinština a angličtina', documentSummary: 'Certifikát Univerzity Alfreda Nobela; počet hodin se na certifikátu neuvádí.' },
    },
  },
];

export function getSeedProgrammeCatalogue(locale: ContentLocale): ProgrammeCatalogueItem[] {
  return seeds.map(({ translations, areaSlug, typeSlug, ...programme }) => {
    const translation = translations[locale];

    return {
      ...programme,
      title: translation.title,
      description: translation.description,
      facts: translation.facts,
      documentSummary: translation.documentSummary,
      area: { slug: areaSlug, title: translation.areaTitle },
      type: { slug: typeSlug, title: translation.typeTitle },
    };
  });
}
