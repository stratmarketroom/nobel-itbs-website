export const locales = ['en', 'ua', 'cz'] as const;
export const prefixedLocales = ['ua', 'cz'] as const;

export type Locale = (typeof locales)[number];
export type PrefixedLocale = (typeof prefixedLocales)[number];

export type NavItem = {
  label: string;
  href: string;
};

type EditorialItem = {
  title: string;
  text: string;
};

type ProgrammeArea = EditorialItem & {
  href: string;
  featured: string;
};

type FeaturedProgramme = {
  title: string;
  href: string;
  status: string;
  area: string;
  type: string;
  description: string;
  facts: string;
  document: string;
  cta: string;
};

export type CatalogueProgramme = FeaturedProgramme;

export type CatalogueCopy = {
  homeHref: string;
  navLabel: string;
  localeLabel: string;
  nav: NavItem[];
  localeLinks: Array<{ locale: Locale; label: string; href: string }>;
  hero: {
    eyebrow: string;
    title: string;
    lead: string;
    intro: string;
  };
  note: string;
  programmes: CatalogueProgramme[];
  empty: {
    heading: string;
    body: string;
    cta: NavItem;
  };
  footer: {
    text: string;
    columns: Array<{ title: string; links: NavItem[] }>;
    contact: string[];
  };
};

export type ProgrammeDetailCopy = {
  homeHref: string;
  navLabel: string;
  localeLabel: string;
  nav: NavItem[];
  localeLinks: Array<{ locale: Locale; label: string; href: string }>;
  backLink: NavItem;
  hero: {
    eyebrow: string;
    title: string;
    lead: string;
    supportingCopy: string;
    primaryCta: NavItem;
  };
  facts: Array<{ label: string; value: string }>;
  value: {
    heading: string;
    body: string;
    proofLine: string;
  };
  audience: {
    heading: string;
    items: string[];
  };
  outcomes: {
    heading: string;
    items: string[];
  };
  curriculum: {
    heading: string;
    items: string[];
  };
  learning: {
    heading: string;
    body: string;
    platforms: string;
  };
  expert: {
    heading: string;
    name: string;
    bio: string;
  };
  finalProject: {
    heading: string;
    body: string;
  };
  documents: {
    heading: string;
    intro: string;
    stages: Array<{
      title: string;
      body: string;
      points: string[];
    }>;
    valueTitle: string;
    valuePoints: string[];
  };
  faq: Array<{ question: string; answer: string }>;
  closing: {
    heading: string;
    body: string;
    primaryCta: NavItem;
  };
  footer: {
    text: string;
    columns: Array<{ title: string; links: NavItem[] }>;
    contact: string[];
  };
};

export type AboutCopy = {
  homeHref: string;
  navLabel: string;
  localeLabel: string;
  nav: NavItem[];
  localeLinks: Array<{ locale: Locale; label: string; href: string }>;
  hero: {
    eyebrow: string;
    title: string;
    lead: string;
    primaryCta: NavItem;
    secondaryCta: NavItem;
  };
  who: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
  };
  purpose: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
  };
  work: {
    eyebrow: string;
    title: string;
    items: EditorialItem[];
  };
  approach: {
    eyebrow: string;
    title: string;
    intro: string;
    items: EditorialItem[];
  };
  foundation: {
    eyebrow: string;
    title: string;
    body: string;
  };
  partnership: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    proofs: EditorialItem[];
    note: string;
  };
  principles: {
    eyebrow: string;
    title: string;
    items: EditorialItem[];
  };
  audiences: {
    eyebrow: string;
    items: EditorialItem[];
  };
  finalCta: {
    title: string;
    body: string;
    primaryCta: NavItem;
    secondaryCta: NavItem;
  };
  footer: {
    text: string;
    columns: Array<{ title: string; links: NavItem[] }>;
    contact: string[];
  };
};

type PartnershipProfile = {
  name: string;
  location?: string;
  role: string;
  url?: string;
  note?: string;
};

export type PartnershipsCopy = {
  homeHref: string;
  navLabel: string;
  localeLabel: string;
  nav: NavItem[];
  localeLinks: Array<{ locale: Locale; label: string; href: string }>;
  hero: {
    eyebrow: string;
    title: string;
    lead: string;
    supportingCopy: string;
    primaryCta: NavItem;
  };
  principles: {
    heading: string;
    items: string[];
  };
  models: {
    heading: string;
    items: EditorialItem[];
  };
  academic: {
    heading: string;
    body: string;
    partner: PartnershipProfile;
  };
  organisations: {
    heading: string;
    intro: string;
    items: PartnershipProfile[];
  };
  experts: {
    heading: string;
    intro: string;
    items: PartnershipProfile[];
  };
  boundaries: {
    heading: string;
    items: string[];
  };
  finalCta: {
    heading: string;
    body: string;
    primaryCta: NavItem;
    fallbackCta: NavItem;
  };
  footer: {
    text: string;
    columns: Array<{ title: string; links: NavItem[] }>;
    contact: string[];
  };
};

export type OrganisationsCopy = {
  homeHref: string;
  navLabel: string;
  localeLabel: string;
  nav: NavItem[];
  localeLinks: Array<{ locale: Locale; label: string; href: string }>;
  hero: {
    eyebrow: string;
    title: string;
    lead: string;
    supportingCopy: string;
    primaryCta: NavItem;
  };
  need: {
    heading: string;
    paragraphs: string[];
  };
  audiences: {
    heading: string;
    items: EditorialItem[];
  };
  services: {
    heading: string;
    items: EditorialItem[];
  };
  receives: {
    heading: string;
    items: string[];
    note: string;
  };
  steps: {
    heading: string;
    items: EditorialItem[];
  };
  trust: {
    heading: string;
    paragraphs: string[];
  };
  faq: Array<{ question: string; answer: string }>;
  finalCta: {
    heading: string;
    body: string;
    primaryCta: NavItem;
    fallbackCta: NavItem;
  };
  footer: {
    text: string;
    columns: Array<{ title: string; links: NavItem[] }>;
    contact: string[];
  };
};

export type VerifyCopy = {
  homeHref: string;
  navLabel: string;
  localeLabel: string;
  nav: NavItem[];
  localeLinks: Array<{ locale: Locale; label: string; href: string }>;
  hero: {
    eyebrow: string;
    title: string;
    lead: string;
    instruction: string;
  };
  form: {
    fieldLabel: string;
    placeholder: string;
    helper: string;
    submit: string;
    submitting: string;
    requiredError: string;
    formatError: string;
  };
  states: {
    resultEyebrow: string;
    heading: string;
    validFieldNote: string;
    notFoundStatus: string;
    systemEyebrow: string;
    systemHeading: string;
    valid: {
      statusLabel: string;
      heading: string;
      body: string;
      fields: string[];
      note: string;
    };
    revoked: {
      statusLabel: string;
      heading: string;
      body: string;
    };
    notFound: {
      heading: string;
      body: string;
      helper: string;
    };
    rateLimit: {
      heading: string;
      body: string;
      button: string;
    };
    temporaryError: {
      heading: string;
      body: string;
      retry: string;
    };
    connectionError: {
      heading: string;
      body: string;
      retry: string;
    };
  };
  privacyRules: {
    heading: string;
    items: string[];
  };
  tokenResult: {
    eyebrow: string;
    heading: string;
    body: string;
    manualCta: NavItem;
  };
  footer: {
    text: string;
    columns: Array<{ title: string; links: NavItem[] }>;
    contact: string[];
  };
};

type LandingProgramme = {
  title: string;
  href: string;
  description: string;
  area?: string;
  status?: string;
  facts?: string;
  document?: string;
  cta: string;
};

export type ProgrammeLandingCopy = {
  homeHref: string;
  navLabel: string;
  localeLabel: string;
  nav: NavItem[];
  localeLinks: Array<{ locale: Locale; label: string; href: string }>;
  kind: string;
  hero: {
    eyebrow: string;
    title: string;
    lead: string;
    supportingCopy?: string;
    primaryCta: NavItem;
  };
  about: {
    heading: string;
    paragraphs: string[];
  };
  audience: {
    heading: string;
    items: string[];
  };
  development: {
    heading: string;
    items: string[];
  };
  programmes: {
    heading: string;
    intro: string;
    emptyHeading: string;
    emptyBody: string;
    items: LandingProgramme[];
  };
  closing: {
    heading: string;
    body: string;
    cta: NavItem;
  };
  footer: {
    text: string;
    columns: Array<{ title: string; links: NavItem[] }>;
    contact: string[];
  };
};

export type HomeCopy = {
  homeHref: string;
  navLabel: string;
  localeLabel: string;
  nav: NavItem[];
  hero: {
    eyebrow: string;
    title: string;
    lead: string;
    supportingText: string;
    cta: NavItem;
  };
  verify: {
    navLabel: string;
    title: string;
    body: string;
    inputLabel: string;
    placeholder: string;
    submitLabel: string;
    link: NavItem;
  };
  areas: {
    eyebrow: string;
    title: string;
    intro: string;
    cta: NavItem;
    items: ProgrammeArea[];
  };
  featured: {
    eyebrow: string;
    title: string;
    intro: string;
    cta: NavItem;
    items: FeaturedProgramme[];
  };
  trust: {
    eyebrow: string;
    title: string;
    lead: string;
    items: EditorialItem[];
  };
  model: {
    eyebrow: string;
    title: string;
    steps: EditorialItem[];
  };
  organisations: {
    eyebrow: string;
    title: string;
    body: string;
    primary: NavItem;
    secondary: NavItem;
  };
  institutional: {
    eyebrow: string;
    title: string;
    body: string;
    cta: NavItem;
  };
  finalCta: {
    title: string;
    body: string;
    cta: NavItem;
  };
  footer: {
    text: string;
    columns: Array<{ title: string; links: NavItem[] }>;
    contact: string[];
  };
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
  { label: 'Verify a Document', href: '/verify' },
  { label: 'About Us', href: '/about' },
];

const ukrainianNav: NavItem[] = [
  { label: 'Програми', href: '/ua/programmes' },
  { label: 'Для організацій', href: '/ua/for-organisations' },
  { label: 'Партнерства', href: '/ua/partnerships' },
  { label: 'Перевірити документ', href: '/ua/verify' },
  { label: 'Про нас', href: '/ua/about' },
];

const czechNav: NavItem[] = [
  { label: 'Programy', href: '/cz/programmes' },
  { label: 'Pro organizace', href: '/cz/for-organisations' },
  { label: 'Partnerství', href: '/cz/partnerships' },
  { label: 'Ověřit dokument', href: '/cz/verify' },
  { label: 'O nás', href: '/cz/about' },
];

const footerColumnsEn = [
  {
    title: 'Programmes',
    links: [
      { label: 'Business & Management', href: '/programmes/business-management' },
      { label: 'Technology & Innovation', href: '/programmes/technology-innovation' },
      { label: 'Psychology & Human', href: '/programmes/psychology-human' },
      { label: 'All programmes', href: '/programmes' },
    ],
  },
  {
    title: 'Nobel ITBS',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Partnerships', href: '/partnerships' },
      { label: 'For Organisations', href: '/for-organisations' },
    ],
  },
  {
    title: 'Registry',
    links: [{ label: 'Verify a Document', href: '/verify' }],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of Use', href: '/terms' },
      { label: 'Refund Policy', href: '/refund-policy' },
      { label: 'Privacy Policy', href: '/privacy' },
    ],
  },
];

const footerColumnsUa = [
  {
    title: 'Програми',
    links: [
      { label: 'Business & Management', href: '/ua/programmes/business-management' },
      { label: 'Technology & Innovation', href: '/ua/programmes/technology-innovation' },
      { label: 'Psychology & Human', href: '/ua/programmes/psychology-human' },
      { label: 'Усі програми', href: '/ua/programmes' },
    ],
  },
  {
    title: 'Nobel ITBS',
    links: [
      { label: 'Про нас', href: '/ua/about' },
      { label: 'Партнерства', href: '/ua/partnerships' },
      { label: 'Для організацій', href: '/ua/for-organisations' },
    ],
  },
  {
    title: 'Реєстр',
    links: [{ label: 'Перевірити документ', href: '/ua/verify' }],
  },
  {
    title: 'Правова інформація',
    links: [
      { label: 'Умови (Публічний договір)', href: '/ua/terms' },
      { label: 'Політика повернення', href: '/ua/refund-policy' },
      { label: 'Політика конфіденційності', href: '/ua/privacy' },
    ],
  },
];

const footerColumnsCz = [
  {
    title: 'Programy',
    links: [
      { label: 'Business & Management', href: '/cz/programmes/business-management' },
      { label: 'Technology & Innovation', href: '/cz/programmes/technology-innovation' },
      { label: 'Psychology & Human', href: '/cz/programmes/psychology-human' },
      { label: 'Všechny programy', href: '/cz/programmes' },
    ],
  },
  {
    title: 'Nobel ITBS',
    links: [
      { label: 'O nás', href: '/cz/about' },
      { label: 'Partnerství', href: '/cz/partnerships' },
      { label: 'Pro organizace', href: '/cz/for-organisations' },
    ],
  },
  {
    title: 'Registr',
    links: [{ label: 'Ověřit dokument', href: '/cz/verify' }],
  },
  {
    title: 'Právní informace',
    links: [
      { label: 'Podmínky používání', href: '/cz/terms' },
      { label: 'Podmínky vrácení peněz', href: '/cz/refund-policy' },
      { label: 'Zásady ochrany osobních údajů', href: '/cz/privacy' },
    ],
  },
];

export const homeCopy: Record<Locale, HomeCopy> = {
  en: {
    homeHref: '/',
    navLabel: 'Primary navigation',
    localeLabel: 'Language',
    nav: englishNav,
    hero: {
      eyebrow: 'Professional education for adults',
      title: 'Education that moves you forward',
      lead: 'Professional programmes for development, career change and new opportunities in business, technology and working with people.',
      supportingText: 'Nobel ITBS combines applied learning, an international context and a clear document system with online verification.',
      cta: { label: 'Explore programmes', href: '/programmes' },
    },
    verify: {
      navLabel: 'Verify a Document',
      title: 'Verify a document',
      body: 'Enter the document number or scan the QR code to check its status.',
      inputLabel: 'Document number',
      placeholder: 'For example, NITBS-C-2026-000123',
      submitLabel: 'Verify',
      link: { label: 'How verification works', href: '/verify' },
    },
    areas: {
      eyebrow: 'Programme areas',
      title: 'Choose your professional pathway',
      intro: 'Each area brings together programmes with a clear professional goal, defined learning format and transparent outcome.',
      cta: { label: 'View all programmes', href: '/programmes' },
      items: [
        {
          title: 'Business & Management',
          text: 'Management, entrepreneurship, AI production and competencies for developing businesses and teams.',
          featured: 'AI Production',
          href: '/programmes/business-management',
        },
        {
          title: 'Technology & Innovation',
          text: 'Technology markets, innovation and emerging industries at the intersection of technology, economics and management.',
          featured: 'Space Business',
          href: '/programmes/technology-innovation',
        },
        {
          title: 'Psychology & Human',
          text: 'Psychology, human development, self-regulation and professional approaches to behaviour and change.',
          featured: 'General Psychology; Child Psychology; Neuroplastic Reconstruction',
          href: '/programmes/psychology-human',
        },
      ],
    },
    featured: {
      eyebrow: 'Nobel ITBS programmes',
      title: 'Learning with a clear purpose',
      intro: 'Five programmes in different formats, from continuously available distance courses to a Mini-MBA and partner professional development programmes.',
      cta: { label: 'Explore all programmes', href: '/programmes' },
      items: [
        {
          title: 'AI Production',
          href: '/programmes/ai-production',
          status: 'Enrolment open',
          area: 'Business & Management',
          type: 'Mini-MBA',
          description: 'Create, launch, and scale expert-led and educational products with product strategy, marketing, sales, management, and AI.',
          facts: '6 months · 360 hours / 12 ECTS · distance learning · Ukrainian',
          document: 'University certificate after 3 months and an international Mini-MBA diploma with Diploma Supplement after completing the full programme.',
          cta: 'View programme',
        },
        {
          title: 'General Psychology',
          href: '/programmes/general-psychology',
          status: 'Ongoing enrolment',
          area: 'Psychology & Human',
          type: 'Professional development course',
          description: 'Build a structured foundation in the psyche, personality, motivation, emotions, and cognitive processes.',
          facts: '90 hours / 3 ECTS · distance learning in Moodle · 1-year access · Ukrainian',
          document: 'Professional development certificate from the University of Alfred Nobel.',
          cta: 'View programme',
        },
        {
          title: 'Child Psychology',
          href: '/programmes/child-psychology',
          status: 'Ongoing enrolment',
          area: 'Psychology & Human',
          type: 'Professional development course',
          description: 'Deepen your understanding of child development, age-related characteristics, and responsible psychological support.',
          facts: '90 hours / 3 ECTS · distance learning in Moodle · 6-month access · Ukrainian',
          document: 'Professional development certificate from the University of Alfred Nobel.',
          cta: 'View programme',
        },
        {
          title: 'Neuroplastic Reconstruction',
          href: '/programmes/neuroplastic-reconstruction',
          status: 'Enrolment open · Current cohort starts on 5 October',
          area: 'Psychology & Human',
          type: 'Professional development course',
          description: 'Explore neuroplasticity, self-regulation, and behavioural patterns in a structured 12-module programme.',
          facts: '3 months · 180 hours / 6 ECTS · blended distance learning · Ukrainian',
          document: 'Documents and professional status depend on the selected pricing tier.',
          cta: 'View programme',
        },
        {
          title: 'Space Business',
          href: '/programmes/space-business',
          status: 'Ongoing enrolment',
          area: 'Technology & Innovation',
          type: 'Certificate programme',
          description: 'Understand the space market, technology, start-ups, economics, law, and models of international cooperation.',
          facts: '90 hours · distance learning in Moodle · Ukrainian and English',
          document: 'Certificate.',
          cta: 'View programme',
        },
      ],
    },
    trust: {
      eyebrow: 'Why Nobel ITBS',
      title: 'Education you can trust',
      lead: 'We build learning as a complete professional pathway, from a clear programme and outcomes to a properly issued document.',
      items: [
        { title: 'Applied professional education', text: 'Programmes focus on competencies that can be used in professional work and further development.' },
        { title: 'Clear structure', text: 'The format, duration, content, learning outcomes and document are described before learning begins.' },
        { title: 'Own and partner programmes', text: 'Nobel ITBS creates its own educational products and provides infrastructure for partner programmes.' },
        { title: 'Verifiable documents', text: 'The status of documents registered with Nobel ITBS can be checked by document number or QR code.' },
      ],
    },
    model: {
      eyebrow: 'From programme to confirmed outcome',
      title: 'Learning, document, verification',
      steps: [
        { title: 'Choose a programme', text: 'Compare its purpose, content, format, duration and learning outcome.' },
        { title: 'Complete your learning', text: 'Learn in the format defined by the programme and meet its completion requirements.' },
        { title: 'Receive your document', text: 'The type and scope of the document depend on the specific programme and are published on its page.' },
        { title: 'Confirm its authenticity', text: 'If the document is registered with Nobel ITBS, its status can be verified online.' },
      ],
    },
    organisations: {
      eyebrow: 'For online schools and experts',
      title: 'Infrastructure for educational programmes and documents',
      body: 'Nobel ITBS helps online schools, experts and authors structure educational programmes and develop a document model. The infrastructure may include preparing documents and supplements, registration and online verification.',
      primary: { label: 'For organisations', href: '/for-organisations' },
      secondary: { label: 'Partnerships', href: '/partnerships' },
    },
    institutional: {
      eyebrow: 'About Nobel ITBS',
      title: 'A European platform for professional education',
      body: 'Nobel ITBS is a European professional education platform for adults and organisations, working across Business & Management, Technology & Innovation and Psychology & Human.',
      cta: { label: 'Learn more about Nobel ITBS', href: '/about' },
    },
    finalCta: {
      title: 'Find a programme for your next step',
      body: 'Explore the programme areas, compare formats and choose the programme that matches your professional goal.',
      cta: { label: 'Explore programmes', href: '/programmes' },
    },
    footer: {
      text: 'A European platform for professional education, structured programmes and verifiable documents.',
      columns: footerColumnsEn,
      contact: ['Nobel ITBS s.r.o.', 'Praha, Czech Republic', 'info@nobel-itbs.eu'],
    },
  },
  ua: {
    homeHref: '/ua',
    navLabel: 'Основна навігація',
    localeLabel: 'Мова',
    nav: ukrainianNav,
    hero: {
      eyebrow: 'Професійна освіта для дорослих',
      title: 'Освіта, що рухає вперед',
      lead: "Професійні програми для розвитку, зміни кар'єри та нових рішень у бізнесі, технологіях і роботі з людьми.",
      supportingText: 'Nobel ITBS поєднує прикладне навчання, міжнародний контекст і зрозумілу систему документів із можливістю онлайн-верифікації.',
      cta: { label: 'Переглянути програми', href: '/ua/programmes' },
    },
    verify: {
      navLabel: 'Перевірити документ',
      title: 'Перевірити документ',
      body: 'Введіть номер документа або відскануйте QR-код, щоб перевірити його статус.',
      inputLabel: 'Номер документа',
      placeholder: 'Наприклад, NITBS-C-2026-000123',
      submitLabel: 'Перевірити',
      link: { label: 'Як працює верифікація', href: '/ua/verify' },
    },
    areas: {
      eyebrow: 'Напрями навчання',
      title: 'Оберіть професійну траєкторію',
      intro: "Кожен напрям об'єднує програми з чіткою професійною метою, визначеним форматом навчання та зрозумілим результатом.",
      cta: { label: 'Усі програми', href: '/ua/programmes' },
      items: [
        {
          title: 'Business & Management',
          text: 'Управління, підприємництво, AI-продюсування та компетентності для розвитку бізнесу й команд.',
          featured: 'AI Production',
          href: '/ua/programmes/business-management',
        },
        {
          title: 'Technology & Innovation',
          text: 'Технологічні ринки, інновації та нові індустрії на перетині технологій, економіки й управління.',
          featured: 'Space Business',
          href: '/ua/programmes/technology-innovation',
        },
        {
          title: 'Psychology & Human',
          text: 'Психологія, розвиток людини, саморегуляція та професійні підходи до роботи з поведінкою і змінами.',
          featured: 'Загальна психологія; Дитяча психологія; Нейропластична реконструкція',
          href: '/ua/programmes/psychology-human',
        },
      ],
    },
    featured: {
      eyebrow: 'Програми Nobel ITBS',
      title: 'Навчання з конкретною метою',
      intro: "П'ять програм різного формату - від постійно доступних дистанційних курсів до Mini-MBA та партнерських програм професійного розвитку.",
      cta: { label: 'Переглянути всі програми', href: '/ua/programmes' },
      items: [
        {
          title: 'AI Production',
          href: '/ua/programmes/ai-production',
          status: 'Відкрито набір',
          area: 'Business & Management',
          type: 'Mini-MBA',
          description: 'Створюйте, запускайте й масштабуйте експертні та освітні продукти за допомогою продуктового мислення, маркетингу, продажів, управління та AI.',
          facts: '6 місяців · 360 годин / 12 ECTS · дистанційне навчання · українська',
          document: 'Сертифікат Університету імені Альфреда Нобеля після 3 місяців і міжнародний диплом Mini-MBA з Diploma Supplement після завершення повної програми.',
          cta: 'Переглянути програму',
        },
        {
          title: 'Загальна психологія',
          href: '/ua/programmes/general-psychology',
          status: 'Поточний набір',
          area: 'Psychology & Human',
          type: 'Програма професійного підвищення кваліфікації',
          description: 'Сформуйте структурну базу знань про психіку, особистість, мотивацію, емоції та когнітивні процеси.',
          facts: '90 годин / 3 ECTS · дистанційне навчання в Moodle · доступ 1 рік · українська',
          document: 'Сертифікат про підвищення кваліфікації від Університету імені Альфреда Нобеля.',
          cta: 'Переглянути програму',
        },
        {
          title: 'Дитяча психологія',
          href: '/ua/programmes/child-psychology',
          status: 'Поточний набір',
          area: 'Psychology & Human',
          type: 'Програма професійного підвищення кваліфікації',
          description: 'Поглибте розуміння розвитку дитини, вікових особливостей і відповідальної психологічної підтримки.',
          facts: '90 годин / 3 ECTS · дистанційне навчання в Moodle · доступ 6 місяців · українська',
          document: 'Сертифікат про підвищення кваліфікації від Університету імені Альфреда Нобеля.',
          cta: 'Переглянути програму',
        },
        {
          title: 'Нейропластична реконструкція',
          href: '/ua/programmes/neuroplastic-reconstruction',
          status: 'Відкрито набір · Старт поточного потоку 5 жовтня',
          area: 'Psychology & Human',
          type: 'Програма професійного підвищення кваліфікації',
          description: 'Досліджуйте нейропластичність, саморегуляцію та поведінкові патерни у структурованій 12-модульній програмі.',
          facts: '3 місяці · 180 годин / 6 ECTS · змішане дистанційне навчання · українська',
          document: 'Документи та професійний статус залежать від обраного тарифу.',
          cta: 'Переглянути програму',
        },
        {
          title: 'Space Business',
          href: '/ua/programmes/space-business',
          status: 'Поточний набір',
          area: 'Technology & Innovation',
          type: 'Certificate programme',
          description: 'Зрозумійте космічний ринок, технології, стартапи, економіку, право та моделі міжнародної співпраці.',
          facts: '90 годин · дистанційне навчання в Moodle · українська та англійська',
          document: 'Сертифікат.',
          cta: 'Переглянути програму',
        },
      ],
    },
    trust: {
      eyebrow: 'Чому Nobel ITBS',
      title: 'Освіта, якій можна довіряти',
      lead: 'Ми будуємо навчання як цілісну професійну траєкторію: від зрозумілої програми та результатів до належно оформленого документа.',
      items: [
        { title: 'Прикладна професійна освіта', text: 'Програми орієнтовані на компетентності, які можна використовувати у професійній діяльності та подальшому розвитку.' },
        { title: 'Зрозуміла структура', text: 'Формат, тривалість, зміст, результати навчання та документ описуються до початку навчання.' },
        { title: 'Власні та партнерські програми', text: 'Nobel ITBS створює власні освітні продукти та надає інфраструктуру для партнерських програм.' },
        { title: 'Верифіковані документи', text: 'Для документів, внесених до реєстру Nobel ITBS, статус можна перевірити за номером або QR-кодом.' },
      ],
    },
    model: {
      eyebrow: 'Від програми до підтвердженого результату',
      title: 'Навчання, документ, верифікація',
      steps: [
        { title: 'Обираєте програму', text: 'Порівнюєте мету, зміст, формат, тривалість і результат навчання.' },
        { title: 'Проходите навчання', text: 'Навчаєтеся у визначеному програмою форматі та виконуєте умови її завершення.' },
        { title: 'Отримуєте документ', text: 'Вид документа та його обсяг залежать від конкретної програми й публікуються на її сторінці.' },
        { title: 'Підтверджуєте справжність', text: 'Якщо документ зареєстрований у Nobel ITBS, його статус можна перевірити онлайн.' },
      ],
    },
    organisations: {
      eyebrow: 'Для онлайн-шкіл та експертів',
      title: 'Інфраструктура для освітніх програм і документів',
      body: 'Nobel ITBS допомагає онлайн-школам, експертам і авторам структурувати освітні програми та вибудовувати модель документів. Інфраструктура може включати підготовку документів і додатків, реєстрацію та онлайн-верифікацію.',
      primary: { label: 'Для організацій', href: '/ua/for-organisations' },
      secondary: { label: 'Партнерства', href: '/ua/partnerships' },
    },
    institutional: {
      eyebrow: 'Про Nobel ITBS',
      title: 'Європейська платформа професійної освіти',
      body: 'Nobel ITBS - європейська платформа професійної освіти для дорослих та організацій, що працює на перетині Business & Management, Technology & Innovation і Psychology & Human.',
      cta: { label: 'Дізнатися більше про Nobel ITBS', href: '/ua/about' },
    },
    finalCta: {
      title: 'Знайдіть програму для свого наступного кроку',
      body: 'Перегляньте напрями, порівняйте формати й оберіть програму, що відповідає вашій професійній меті.',
      cta: { label: 'Переглянути програми', href: '/ua/programmes' },
    },
    footer: {
      text: 'Європейська платформа професійної освіти, структурованих програм і верифікованих документів.',
      columns: footerColumnsUa,
      contact: ['Nobel ITBS s.r.o.', 'Praha, Czech Republic', 'info@nobel-itbs.eu'],
    },
  },
  cz: {
    homeHref: '/cz',
    navLabel: 'Hlavní navigace',
    localeLabel: 'Jazyk',
    nav: czechNav,
    hero: {
      eyebrow: 'Profesní vzdělávání pro dospělé',
      title: 'Vzdělávání, které vás posouvá',
      lead: 'Profesní programy pro rozvoj, změnu kariéry a nové možnosti v byznysu, technologiích a práci s lidmi.',
      supportingText: 'Nobel ITBS propojuje prakticky zaměřené vzdělávání, mezinárodní kontext a srozumitelný systém dokumentů s online ověřováním.',
      cta: { label: 'Prohlédnout programy', href: '/cz/programmes' },
    },
    verify: {
      navLabel: 'Ověřit dokument',
      title: 'Ověřit dokument',
      body: 'Zadejte číslo dokumentu nebo naskenujte QR kód a ověřte jeho stav.',
      inputLabel: 'Číslo dokumentu',
      placeholder: 'Například NITBS-C-2026-000123',
      submitLabel: 'Ověřit',
      link: { label: 'Jak ověřování funguje', href: '/cz/verify' },
    },
    areas: {
      eyebrow: 'Oblasti vzdělávání',
      title: 'Zvolte si profesní cestu',
      intro: 'Každá oblast sdružuje programy s jasným profesním cílem, vymezeným formátem a srozumitelným výsledkem.',
      cta: { label: 'Všechny programy', href: '/cz/programmes' },
      items: [
        {
          title: 'Business & Management',
          text: 'Management, podnikání, AI produkce a kompetence pro rozvoj firem a týmů.',
          featured: 'AI Production',
          href: '/cz/programmes/business-management',
        },
        {
          title: 'Technology & Innovation',
          text: 'Technologické trhy, inovace a nová odvětví na průsečíku technologií, ekonomiky a managementu.',
          featured: 'Space Business',
          href: '/cz/programmes/technology-innovation',
        },
        {
          title: 'Psychology & Human',
          text: 'Psychologie, lidský rozvoj, seberegulace a profesní přístupy k chování a změně.',
          featured: 'General Psychology; Child Psychology; Neuroplastic Reconstruction',
          href: '/cz/programmes/psychology-human',
        },
      ],
    },
    featured: {
      eyebrow: 'Programy Nobel ITBS',
      title: 'Vzdělávání s konkrétním cílem',
      intro: 'Pět programů v různých formátech, od trvale dostupných distančních kurzů až po Mini-MBA a partnerské programy profesního rozvoje.',
      cta: { label: 'Prohlédnout všechny programy', href: '/cz/programmes' },
      items: [
        {
          title: 'AI Production',
          href: '/cz/programmes/ai-production',
          status: 'Otevřený zápis',
          area: 'Business & Management',
          type: 'Mini-MBA',
          description: 'Vytvářejte, spouštějte a škálujte expertní a vzdělávací produkty pomocí produktové strategie, marketingu, prodeje, managementu a AI.',
          facts: '6 měsíců · 360 hodin / 12 ECTS · distanční vzdělávání · ukrajinština',
          document: 'Univerzitní certifikát po 3 měsících a mezinárodní diplom Mini-MBA s Diploma Supplement po absolvování celého programu.',
          cta: 'Zobrazit program',
        },
        {
          title: 'General Psychology',
          href: '/cz/programmes/general-psychology',
          status: 'Průběžný zápis',
          area: 'Psychology & Human',
          type: 'Professional development course',
          description: 'Vybudujte si strukturovaný základ v oblasti psychiky, osobnosti, motivace, emocí a kognitivních procesů.',
          facts: '90 hodin / 3 ECTS · distanční vzdělávání v Moodle · přístup 1 rok · ukrajinština',
          document: 'Certifikát profesního rozvoje od Univerzity Alfreda Nobela.',
          cta: 'Zobrazit program',
        },
        {
          title: 'Child Psychology',
          href: '/cz/programmes/child-psychology',
          status: 'Průběžný zápis',
          area: 'Psychology & Human',
          type: 'Professional development course',
          description: 'Prohlubte porozumění vývoji dítěte, věkovým charakteristikám a odpovědné psychologické podpoře.',
          facts: '90 hodin / 3 ECTS · distanční vzdělávání v Moodle · přístup 6 měsíců · ukrajinština',
          document: 'Certifikát profesního rozvoje od Univerzity Alfreda Nobela.',
          cta: 'Zobrazit program',
        },
        {
          title: 'Neuroplastic Reconstruction',
          href: '/cz/programmes/neuroplastic-reconstruction',
          status: 'Otevřený zápis · Aktuální běh začíná 5. října',
          area: 'Psychology & Human',
          type: 'Professional development course',
          description: 'Prozkoumejte neuroplasticitu, seberegulaci a vzorce chování ve strukturovaném 12modulovém programu.',
          facts: '3 měsíce · 180 hodin / 6 ECTS · kombinované distanční vzdělávání · ukrajinština',
          document: 'Dokumenty a profesní status závisí na zvolené cenové úrovni.',
          cta: 'Zobrazit program',
        },
        {
          title: 'Space Business',
          href: '/cz/programmes/space-business',
          status: 'Průběžný zápis',
          area: 'Technology & Innovation',
          type: 'Certificate programme',
          description: 'Porozumějte vesmírnému trhu, technologiím, start-upům, ekonomice, právu a modelům mezinárodní spolupráce.',
          facts: '90 hodin · distanční vzdělávání v Moodle · ukrajinština a angličtina',
          document: 'Certifikát.',
          cta: 'Zobrazit program',
        },
      ],
    },
    trust: {
      eyebrow: 'Proč Nobel ITBS',
      title: 'Vzdělávání, kterému můžete důvěřovat',
      lead: 'Vzdělávání vytváříme jako ucelenou profesní cestu, od jasného programu a výsledků až po řádně vydaný dokument.',
      items: [
        { title: 'Prakticky zaměřené profesní vzdělávání', text: 'Programy se zaměřují na kompetence využitelné v profesní činnosti a dalším rozvoji.' },
        { title: 'Srozumitelná struktura', text: 'Formát, délka, obsah, výsledky a dokument jsou popsány před zahájením.' },
        { title: 'Vlastní a partnerské programy', text: 'Nobel ITBS vytváří vlastní vzdělávací produkty a poskytuje infrastrukturu partnerským programům.' },
        { title: 'Ověřitelné dokumenty', text: 'Stav dokumentů registrovaných u Nobel ITBS lze ověřit podle čísla nebo QR kódu.' },
      ],
    },
    model: {
      eyebrow: 'Od programu k potvrzenému výsledku',
      title: 'Vzdělávání, dokument, ověření',
      steps: [
        { title: 'Vyberete si program', text: 'Porovnáte cíl, obsah, formát, délku a výsledek vzdělávání.' },
        { title: 'Absolvujete vzdělávání', text: 'Studujete ve stanoveném formátu a splníte podmínky dokončení.' },
        { title: 'Získáte dokument', text: 'Typ a rozsah dokumentu závisí na konkrétním programu a je uveden na jeho stránce.' },
        { title: 'Ověříte pravost', text: 'Je-li dokument registrován u Nobel ITBS, lze jeho stav ověřit online.' },
      ],
    },
    organisations: {
      eyebrow: 'Pro online školy a experty',
      title: 'Infrastruktura pro vzdělávací programy a dokumenty',
      body: 'Nobel ITBS pomáhá online školám, expertům a autorům strukturovat vzdělávací programy a vytvářet model dokumentů. Infrastruktura může zahrnovat přípravu dokumentů a dodatků, registraci a online ověřování.',
      primary: { label: 'Pro organizace', href: '/cz/for-organisations' },
      secondary: { label: 'Partnerství', href: '/cz/partnerships' },
    },
    institutional: {
      eyebrow: 'O Nobel ITBS',
      title: 'Evropská platforma profesního vzdělávání',
      body: 'Nobel ITBS je evropská platforma profesního vzdělávání pro dospělé a organizace působící v oblastech Business & Management, Technology & Innovation a Psychology & Human.',
      cta: { label: 'Více o Nobel ITBS', href: '/cz/about' },
    },
    finalCta: {
      title: 'Najděte program pro svůj další krok',
      body: 'Prohlédněte si oblasti, porovnejte formáty a vyberte program odpovídající vašemu profesnímu cíli.',
      cta: { label: 'Prohlédnout programy', href: '/cz/programmes' },
    },
    footer: {
      text: 'Evropská platforma profesního vzdělávání, strukturovaných programů a ověřitelných dokumentů.',
      columns: footerColumnsCz,
      contact: ['Nobel ITBS s.r.o.', 'Praha, Czech Republic', 'info@nobel-itbs.eu'],
    },
  },
};

export const catalogueCopy: Record<Locale, CatalogueCopy> = {
  en: {
    homeHref: '/',
    navLabel: 'Primary navigation',
    localeLabel: 'Language',
    nav: englishNav,
    localeLinks: [
      { locale: 'en', label: 'EN', href: '/programmes' },
      { locale: 'ua', label: 'UA', href: '/ua/programmes' },
      { locale: 'cz', label: 'CZ', href: '/cz/programmes' },
    ],
    hero: {
      eyebrow: 'Programmes',
      title: 'Professional Programmes',
      lead: 'Choose your learning path based on your professional goal, the competencies you need, and the format that works for you.',
      intro: 'Nobel ITBS presents its own and partner programmes in business, technology, innovation, and psychology. Compare the subject, duration, language of instruction, and document provided by each programme.',
    },
    note: 'Release 1 catalogue shows all published programmes without public filters. Prices are shown only on programme detail pages when configured.',
    programmes: homeCopy.en.featured.items,
    empty: {
      heading: 'Programmes are being prepared for publication',
      body: 'There are currently no programmes available in the catalogue. Ask us a question to learn about upcoming study opportunities.',
      cta: { label: 'Ask a question', href: '/contact' },
    },
    footer: homeCopy.en.footer,
  },
  ua: {
    homeHref: '/ua',
    navLabel: 'Основна навігація',
    localeLabel: 'Мова',
    nav: ukrainianNav,
    localeLinks: [
      { locale: 'en', label: 'EN', href: '/programmes' },
      { locale: 'ua', label: 'UA', href: '/ua/programmes' },
      { locale: 'cz', label: 'CZ', href: '/cz/programmes' },
    ],
    hero: {
      eyebrow: 'Programmes',
      title: 'Професійні програми',
      lead: 'Обирайте навчання відповідно до професійної мети, потрібних компетентностей і формату.',
      intro: 'Nobel ITBS представляє власні та партнерські програми у бізнесі, технологіях, інноваціях і психології. Порівняйте тематику, тривалість, мову навчання та документ, передбачений конкретною програмою.',
    },
    note: 'У Release 1 каталог показує опубліковані програми без видимих публічних фільтрів. Ціни показуються тільки на сторінках програм, якщо вони налаштовані.',
    programmes: homeCopy.ua.featured.items,
    empty: {
      heading: 'Програми готуються до публікації',
      body: 'Зараз у каталозі немає доступних програм. Залиште запитання, щоб дізнатися про наступні можливості навчання.',
      cta: { label: 'Поставити запитання', href: '/ua/contact' },
    },
    footer: homeCopy.ua.footer,
  },
  cz: {
    homeHref: '/cz',
    navLabel: 'Hlavní navigace',
    localeLabel: 'Jazyk',
    nav: czechNav,
    localeLinks: [
      { locale: 'en', label: 'EN', href: '/programmes' },
      { locale: 'ua', label: 'UA', href: '/ua/programmes' },
      { locale: 'cz', label: 'CZ', href: '/cz/programmes' },
    ],
    hero: {
      eyebrow: 'Programy',
      title: 'Profesní vzdělávací programy',
      lead: 'Zvolte si vzdělávací cestu podle svého profesního cíle, potřebných kompetencí a formátu, který vám vyhovuje.',
      intro: 'Nobel ITBS představuje vlastní i partnerské programy v oblasti byznysu, technologií, inovací a psychologie. Porovnejte zaměření, délku, jazyk výuky a dokument vydávaný po dokončení jednotlivých programů.',
    },
    note: 'V Release 1 katalog zobrazuje zveřejněné programy bez viditelných veřejných filtrů. Ceny se zobrazují pouze na detailu programu, pokud jsou nastaveny.',
    programmes: homeCopy.cz.featured.items,
    empty: {
      heading: 'Programy se připravují ke zveřejnění',
      body: 'V katalogu momentálně nejsou dostupné žádné programy. Napište nám a získejte informace o připravovaných možnostech studia.',
      cta: { label: 'Položit dotaz', href: '/cz/contact' },
    },
    footer: homeCopy.cz.footer,
  },
};

export const aboutCopy: Record<Locale, AboutCopy> = {
  en: {
    homeHref: '/',
    navLabel: 'Primary navigation',
    localeLabel: 'Language',
    nav: englishNav,
    localeLinks: [
      { locale: 'en', label: 'EN', href: '/about' },
      { locale: 'ua', label: 'UA', href: '/ua/about' },
      { locale: 'cz', label: 'CZ', href: '/cz/about' },
    ],
    hero: {
      eyebrow: 'About Nobel ITBS',
      title: 'Professional education for a changing world',
      lead:
        'Nobel ITBS is a European professional education platform for adults and organisations. We create professional programmes and help partners transform educational expertise into a structured product with properly issued documents.',
      primaryCta: { label: 'Explore programmes', href: '/programmes' },
      secondaryCta: { label: 'For organisations', href: '/for-organisations' },
    },
    who: {
      eyebrow: 'Who we are',
      title: 'A European platform for professional education',
      paragraphs: [
        'Nobel ITBS works at the intersection of professional education, partnership and technology infrastructure. We bring together programmes in three areas: Business & Management, Technology & Innovation and Psychology & Human.',
        'We do not position Nobel ITBS as a university. Our role is to create and organise professional learning, collaborate with academic and industry partners, and provide a clear system for documents and their verification.',
      ],
    },
    purpose: {
      eyebrow: 'Our purpose',
      title: 'Making professional development clear and verifiable',
      paragraphs: [
        'Before learning begins, adult learners need to understand what they will learn, how they will learn, how long it will take and what outcome they will receive. Organisations and education experts need infrastructure that helps turn content into a coherent programme and properly document its outcomes.',
        'Nobel ITBS brings these needs together in one system, from programme presentation to a document that can be verified.',
      ],
    },
    work: {
      eyebrow: 'How Nobel ITBS works',
      title: 'Two connected areas of work',
      items: [
        {
          title: 'Professional programmes',
          text:
            'We create and co-develop programmes for adults who want to deepen their competencies, change their professional pathway or prepare for a new role. Each programme has a defined purpose, audience, content, format, learning outcomes and document.',
        },
        {
          title: 'Infrastructure for partner programmes',
          text:
            'We help experts and organisations structure an educational product and confirm learning outcomes. Depending on the programme model, this may include preparing documents and supplements, registration and public document-status verification.',
        },
      ],
    },
    approach: {
      eyebrow: 'Our approach',
      title: 'Not an isolated course, but a professional pathway',
      intro:
        'We assess a programme not by the amount of information it contains, but by how clearly it guides the learner towards a defined outcome.',
      items: [
        { title: 'Professional relevance', text: 'Content should reflect real professional tasks and the context of its specific audience.' },
        { title: 'Clear structure', text: 'The purpose, modules, format, duration, assessment and completion requirements should be defined in advance.' },
        { title: 'Transparency', text: 'We distinguish between programme type, learning delivery and the document issued upon completion.' },
        {
          title: 'Verifiability',
          text: 'Documents registered with Nobel ITBS can have their status verified by number or QR code without public access to the private PDF.',
        },
      ],
    },
    foundation: {
      eyebrow: 'Our foundation',
      title: 'A Czech company working in an international context',
      body:
        'Nobel ITBS s.r.o. operates as a Czech legal entity in the European professional education environment. This shapes our approach to transparency, responsibility, partnerships and document management.',
    },
    partnership: {
      eyebrow: 'Exclusive academic partnership',
      title: 'Our connection with the University of Alfred Nobel',
      paragraphs: [
        "The University of Alfred Nobel is the exclusive academic partner of Nobel ITBS. The partnership connects a European professional education platform with the University's academic expertise and long-standing experience.",
        'For specific programmes, the University provides the academic foundation and issues professional development documents in accordance with the approved programme terms. The document type and the role of each party are always stated on the relevant programme page.',
      ],
      proofs: [
        { title: 'Over 30 years of educational experience', text: 'The University of Alfred Nobel has been developing education in Ukraine for over 30 years.' },
        { title: 'EIT Deep Tech Talent Initiative', text: 'The University became the first Ukrainian university to participate in the EIT Deep Tech Talent Initiative.' },
        { title: 'Space Business', text: "The University's Space Business programme was accepted within the EIT Deep Tech Talent Initiative." },
      ],
      note: 'These are attributed University facts. They are not presented as direct Nobel ITBS accreditations or achievements.',
    },
    principles: {
      eyebrow: 'Our principles',
      title: 'How we make educational decisions',
      items: [
        { title: 'Practical value', text: 'Learning should help people act with greater confidence in their professional context.' },
        { title: 'Lifelong learning', text: 'Professional development does not end with a single diploma or programme.' },
        {
          title: 'Openness to partnership',
          text: 'Strong educational products emerge at the intersection of academic, industry and entrepreneurial expertise.',
        },
        {
          title: 'Responsible wording',
          text: "We clearly explain the programme status, each party's role and the document type without overstating academic claims.",
        },
      ],
    },
    audiences: {
      eyebrow: 'Who we work with',
      items: [
        {
          title: 'Adult learners',
          text: 'People who want to develop their competencies, move into a new professional role or systematise their existing experience.',
        },
        {
          title: 'Organisations',
          text: 'Online schools and educational projects that need infrastructure for programmes, documents, registration and verification.',
        },
        {
          title: 'Authors and education partners',
          text: 'Experts and authors who want to structure a programme and confirm learning outcomes with properly issued documents.',
        },
      ],
    },
    finalCta: {
      title: 'Choose how you want to work with Nobel ITBS',
      body: 'Explore professional programmes or discover how we work with organisations and education partners.',
      primaryCta: { label: 'Explore programmes', href: '/programmes' },
      secondaryCta: { label: 'For organisations', href: '/for-organisations' },
    },
    footer: homeCopy.en.footer,
  },
  ua: {
    homeHref: '/ua',
    navLabel: 'Основна навігація',
    localeLabel: 'Мова',
    nav: ukrainianNav,
    localeLinks: [
      { locale: 'en', label: 'EN', href: '/about' },
      { locale: 'ua', label: 'UA', href: '/ua/about' },
      { locale: 'cz', label: 'CZ', href: '/cz/about' },
    ],
    hero: {
      eyebrow: 'Про Nobel ITBS',
      title: 'Професійна освіта для світу, що змінюється',
      lead:
        'Nobel ITBS - європейська платформа професійної освіти для дорослих та організацій. Ми створюємо професійні програми й допомагаємо партнерам перетворювати освітню експертизу на структурований продукт із належно оформленими документами.',
      primaryCta: { label: 'Переглянути програми', href: '/ua/programmes' },
      secondaryCta: { label: 'Для організацій', href: '/ua/for-organisations' },
    },
    who: {
      eyebrow: 'Хто ми',
      title: 'Європейська платформа професійної освіти',
      paragraphs: [
        "Nobel ITBS працює на перетині професійної освіти, партнерства та технологічної інфраструктури. Ми об'єднуємо програми у трьох напрямах: Business & Management, Technology & Innovation і Psychology & Human.",
        'Ми не позиціонуємо Nobel ITBS як університет. Наша роль - створювати й організовувати професійне навчання, співпрацювати з академічними та галузевими партнерами, а також забезпечувати зрозумілу систему документів і їх верифікації.',
      ],
    },
    purpose: {
      eyebrow: 'Наша мета',
      title: 'Зробити професійний розвиток зрозумілим і підтверджуваним',
      paragraphs: [
        'Дорослим слухачам важливо ще до початку навчання розуміти, чого вони навчаться, у якому форматі, скільки це триватиме і який результат вони отримають. Організаціям та освітнім експертам потрібна інфраструктура, яка допомагає перетворити зміст на послідовну програму й належно оформити її результати.',
        'Nobel ITBS поєднує ці потреби в одній системі - від презентації програми до документа, який можна перевірити.',
      ],
    },
    work: {
      eyebrow: 'Як працює Nobel ITBS',
      title: "Два взаємопов'язані напрями",
      items: [
        {
          title: 'Професійні програми',
          text:
            'Ми створюємо та спільно розробляємо програми для дорослих, які хочуть поглибити компетентності, змінити професійну траєкторію або підготуватися до нової ролі. Кожна програма має визначені мету, аудиторію, зміст, формат, результати навчання та документ.',
        },
        {
          title: 'Інфраструктура для партнерських програм',
          text:
            'Ми допомагаємо експертам та організаціям структурувати освітній продукт і підтвердити результати навчання. Залежно від моделі програми це може включати підготовку документів і додатків, реєстрацію та публічну перевірку статусу документа.',
        },
      ],
    },
    approach: {
      eyebrow: 'Наш підхід',
      title: 'Не окремий курс, а професійна траєкторія',
      intro: 'Ми оцінюємо програму не за кількістю інформації, а за тим, наскільки зрозуміло вона веде слухача до визначеного результату.',
      items: [
        { title: 'Професійна релевантність', text: 'Зміст має відповідати реальним професійним завданням і контексту конкретної аудиторії.' },
        { title: 'Чітка структура', text: 'Мета, модулі, формат, тривалість, оцінювання та умови завершення мають бути визначені заздалегідь.' },
        { title: 'Прозорість', text: 'Ми розділяємо тип програми, організацію навчання та документ, який видається після завершення.' },
        {
          title: 'Верифікованість',
          text: 'Для документів, зареєстрованих у Nobel ITBS, передбачена перевірка статусу за номером або QR-кодом без відкритого доступу до приватного PDF.',
        },
      ],
    },
    foundation: {
      eyebrow: 'Наша основа',
      title: 'Компанія в Чехії, робота в міжнародному контексті',
      body:
        'Nobel ITBS s.r.o. працює як чеська юридична особа у європейському середовищі професійної освіти. Це визначає наш підхід до прозорості, відповідальності, партнерств і роботи з документами.',
    },
    partnership: {
      eyebrow: 'Ексклюзивне академічне партнерство',
      title: "Зв'язок з Університетом імені Альфреда Нобеля",
      paragraphs: [
        "Університет імені Альфреда Нобеля є ексклюзивним академічним партнером Nobel ITBS. Партнерство поєднує європейську платформу професійної освіти з академічною експертизою та багаторічним досвідом Університету.",
        'У межах окремих програм Університет забезпечує академічну основу та видає документи про підвищення кваліфікації відповідно до затверджених умов програми. Тип документа й роль кожної сторони завжди зазначаються на сторінці конкретної програми.',
      ],
      proofs: [
        { title: 'Понад 30 років освітнього досвіду', text: 'Університет імені Альфреда Нобеля розвиває освіту в Україні понад 30 років.' },
        { title: 'EIT Deep Tech Talent Initiative', text: 'Університет став першим українським університетом - учасником EIT Deep Tech Talent Initiative.' },
        { title: 'Space Business', text: 'Програма Університету Space Business була акцептована в межах EIT Deep Tech Talent Initiative.' },
      ],
      note: 'Ці факти належать до Університету. Вони не подаються як прямі акредитації або досягнення Nobel ITBS.',
    },
    principles: {
      eyebrow: 'Наші принципи',
      title: 'Як ми приймаємо освітні рішення',
      items: [
        { title: 'Практична цінність', text: 'Навчання має допомагати людині діяти впевненіше у професійному контексті.' },
        { title: 'Навчання впродовж життя', text: 'Професійний розвиток не завершується одним дипломом або однією програмою.' },
        {
          title: 'Відкритість до партнерства',
          text: 'Сильні освітні продукти виникають на перетині академічної, галузевої та підприємницької експертизи.',
        },
        {
          title: 'Відповідальність у формулюваннях',
          text: 'Ми чітко пояснюємо статус програми, роль кожної сторони та вид документа без перебільшених академічних обіцянок.',
        },
      ],
    },
    audiences: {
      eyebrow: 'Для кого ми працюємо',
      items: [
        {
          title: 'Для дорослих слухачів',
          text: 'Для тих, хто хоче розвинути компетентності, перейти до нової професійної ролі або систематизувати наявний досвід.',
        },
        {
          title: 'Для організацій',
          text: 'Для онлайн-шкіл та освітніх проєктів, яким потрібна інфраструктура програми, документів, реєстрації та верифікації.',
        },
        {
          title: 'Для авторів і освітніх партнерів',
          text: 'Для експертів і авторів, які хочуть структурувати програму та підтвердити результати навчання належно оформленими документами.',
        },
      ],
    },
    finalCta: {
      title: 'Оберіть свій формат співпраці з Nobel ITBS',
      body: 'Перегляньте професійні програми або дізнайтеся, як ми працюємо з організаціями та освітніми партнерами.',
      primaryCta: { label: 'Переглянути програми', href: '/ua/programmes' },
      secondaryCta: { label: 'Для організацій', href: '/ua/for-organisations' },
    },
    footer: homeCopy.ua.footer,
  },
  cz: {
    homeHref: '/cz',
    navLabel: 'Hlavní navigace',
    localeLabel: 'Jazyk',
    nav: czechNav,
    localeLinks: [
      { locale: 'en', label: 'EN', href: '/about' },
      { locale: 'ua', label: 'UA', href: '/ua/about' },
      { locale: 'cz', label: 'CZ', href: '/cz/about' },
    ],
    hero: {
      eyebrow: 'O Nobel ITBS',
      title: 'Profesní vzdělávání pro měnící se svět',
      lead:
        'Nobel ITBS je evropská platforma profesního vzdělávání pro dospělé a organizace. Vytváříme profesní programy a pomáháme partnerům proměňovat vzdělávací expertizu ve strukturovaný produkt s řádně vydanými dokumenty.',
      primaryCta: { label: 'Prohlédnout programy', href: '/cz/programmes' },
      secondaryCta: { label: 'Pro organizace', href: '/cz/for-organisations' },
    },
    who: {
      eyebrow: 'Kdo jsme',
      title: 'Evropská platforma profesního vzdělávání',
      paragraphs: [
        'Nobel ITBS působí na průsečíku profesního vzdělávání, partnerství a technologické infrastruktury. Sdružujeme programy v oblastech Business & Management, Technology & Innovation a Psychology & Human.',
        'Nobel ITBS není prezentována jako univerzita. Naší rolí je vytvářet a organizovat profesní vzdělávání, spolupracovat s akademickými a oborovými partnery a zajišťovat srozumitelný systém dokumentů a jejich ověřování.',
      ],
    },
    purpose: {
      eyebrow: 'Náš účel',
      title: 'Zpřehlednit a umožnit ověření profesního rozvoje',
      paragraphs: [
        'Dospělí účastníci potřebují před zahájením vědět, co se naučí, v jakém formátu, jak dlouho bude vzdělávání trvat a jaký výsledek získají. Organizace a experti potřebují infrastrukturu, která promění obsah v ucelený program a řádně doloží jeho výsledky.',
        'Nobel ITBS propojuje tyto potřeby od prezentace programu až po ověřitelný dokument.',
      ],
    },
    work: {
      eyebrow: 'Jak Nobel ITBS funguje',
      title: 'Dvě propojené oblasti činnosti',
      items: [
        {
          title: 'Profesní programy',
          text:
            'Vytváříme a společně vyvíjíme programy pro dospělé, kteří chtějí prohloubit kompetence, změnit profesní cestu nebo se připravit na novou roli. Každý program má vymezený cíl, publikum, obsah, formát, výsledky a dokument.',
        },
        {
          title: 'Infrastruktura partnerských programů',
          text:
            'Pomáháme expertům a organizacím strukturovat vzdělávací produkt a potvrzovat výsledky. Podle modelu může zahrnovat dokumenty a dodatky, registraci a veřejné ověření stavu dokumentu.',
        },
      ],
    },
    approach: {
      eyebrow: 'Náš přístup',
      title: 'Ne izolovaný kurz, ale profesní cesta',
      intro: 'Program neposuzujeme podle množství informací, ale podle toho, jak jasně vede účastníka k vymezenému výsledku.',
      items: [
        { title: 'Profesní relevance', text: 'Obsah má odpovídat reálným profesním úkolům a kontextu publika.' },
        { title: 'Jasná struktura', text: 'Cíl, moduly, formát, délka, hodnocení a podmínky dokončení jsou určeny předem.' },
        { title: 'Transparentnost', text: 'Rozlišujeme typ programu, organizaci výuky a dokument vydaný po dokončení.' },
        {
          title: 'Ověřitelnost',
          text: 'Stav dokumentů registrovaných u Nobel ITBS lze ověřit číslem nebo QR kódem bez veřejného přístupu k soukromému PDF.',
        },
      ],
    },
    foundation: {
      eyebrow: 'Náš základ',
      title: 'Česká společnost v mezinárodním kontextu',
      body:
        'Nobel ITBS s.r.o. působí jako česká právnická osoba v evropském prostředí profesního vzdělávání. To formuje náš přístup k transparentnosti, odpovědnosti, partnerstvím a práci s dokumenty.',
    },
    partnership: {
      eyebrow: 'Exkluzivní akademické partnerství',
      title: 'Propojení s Univerzitou Alfreda Nobela',
      paragraphs: [
        'Univerzita Alfreda Nobela je exkluzivním akademickým partnerem Nobel ITBS. Partnerství propojuje evropskou platformu profesního vzdělávání s akademickou expertizou a dlouholetými zkušenostmi Univerzity.',
        'U konkrétních programů Univerzita poskytuje akademický základ a vydává dokumenty profesního rozvoje podle schválených podmínek. Typ dokumentu a role stran jsou vždy uvedeny na stránce programu.',
      ],
      proofs: [
        { title: 'Více než 30 let zkušeností ve vzdělávání', text: 'Univerzita Alfreda Nobela rozvíjí vzdělávání na Ukrajině více než 30 let.' },
        { title: 'EIT Deep Tech Talent Initiative', text: 'Univerzita se stala první ukrajinskou univerzitou zapojenou do EIT Deep Tech Talent Initiative.' },
        { title: 'Space Business', text: 'Program Space Business Univerzity byl přijat v rámci EIT Deep Tech Talent Initiative.' },
      ],
      note: 'Tyto údaje jsou připisovány Univerzitě. Nejsou prezentovány jako přímé akreditace nebo úspěchy Nobel ITBS.',
    },
    principles: {
      eyebrow: 'Naše principy',
      title: 'Jak přijímáme vzdělávací rozhodnutí',
      items: [
        { title: 'Praktická hodnota', text: 'Vzdělávání má člověku pomáhat jednat jistěji v profesním kontextu.' },
        { title: 'Celoživotní vzdělávání', text: 'Profesní rozvoj nekončí jedním diplomem ani jedním programem.' },
        {
          title: 'Otevřenost partnerství',
          text: 'Silné vzdělávací produkty vznikají na průsečíku akademické, oborové a podnikatelské expertizy.',
        },
        {
          title: 'Odpovědnost ve formulacích',
          text: 'Jasně vysvětlujeme status programu, roli každé strany a typ dokumentu bez přehnaných akademických slibů.',
        },
      ],
    },
    audiences: {
      eyebrow: 'Pro koho pracujeme',
      items: [
        {
          title: 'Dospělí účastníci',
          text: 'Lidé rozvíjející kompetence, přecházející do nové profesní role nebo systematizující zkušenosti.',
        },
        {
          title: 'Organizace',
          text: 'Online školy a vzdělávací projekty potřebující infrastrukturu programů, dokumentů, registrace a ověřování.',
        },
        {
          title: 'Autoři a vzdělávací partneři',
          text: 'Experti a autoři, kteří chtějí strukturovat program a potvrdit výsledky řádně vydanými dokumenty.',
        },
      ],
    },
    finalCta: {
      title: 'Zvolte si způsob spolupráce s Nobel ITBS',
      body: 'Prohlédněte si profesní programy nebo zjistěte, jak pracujeme s organizacemi a vzdělávacími partnery.',
      primaryCta: { label: 'Prohlédnout programy', href: '/cz/programmes' },
      secondaryCta: { label: 'Pro organizace', href: '/cz/for-organisations' },
    },
    footer: homeCopy.cz.footer,
  },
};

export const partnershipsCopy: Record<Locale, PartnershipsCopy> = {
  en: {
    homeHref: '/',
    navLabel: 'Primary navigation',
    localeLabel: 'Language',
    nav: englishNav,
    localeLinks: [
      { locale: 'en', label: 'EN', href: '/partnerships' },
      { locale: 'ua', label: 'UA', href: '/ua/partnerships' },
      { locale: 'cz', label: 'CZ', href: '/cz/partnerships' },
    ],
    hero: {
      eyebrow: 'Partnerships',
      title: 'Partnerships that strengthen professional education',
      lead: 'We collaborate with organisations and experts who create meaningful programmes and take responsibility for learning outcomes.',
      supportingCopy:
        'A partnership may include programme development or presentation, expert participation, education infrastructure, documents, registration and verification. Roles and responsibilities are defined separately for each project.',
      primaryCta: { label: 'Propose a partnership', href: '/contact?topic=partnership' },
    },
    principles: {
      heading: 'Partnership principles',
      items: [
        'clear roles and responsibilities for all parties',
        'transparent authorship and appropriate expert presentation',
        'verified content and accurate public claims',
        'defined learning outcomes and completion requirements',
        'a separate document model for each programme',
        'respect for intellectual property, learner data and professional boundaries',
      ],
    },
    models: {
      heading: 'Partnership models',
      items: [
        {
          title: 'Programme partnership',
          text: 'For organisations, online schools and methodology owners who want to jointly structure, present or deliver a professional programme.',
        },
        {
          title: 'Expert partnership',
          text: 'For practitioners, lecturers and authors who contribute to content development, teaching, assessment or professional expertise.',
        },
        {
          title: 'Infrastructure partnership',
          text: 'For educational projects that need a document and supplement model, registration and online verification of learning outcomes.',
        },
        {
          title: 'Distribution and promotion partnership',
          text:
            'For organisations with an agreed role in presenting or distributing specific programmes. Communications must accurately identify the programme owner, provider and participants.',
        },
      ],
    },
    academic: {
      heading: 'Exclusive academic partnership',
      body:
        "Alfred Nobel University is the exclusive academic partner of Nobel ITBS. The University's participation and the type of university document are determined separately for each programme and do not automatically extend to all partner projects.",
      partner: {
        name: 'Alfred Nobel University',
        location: 'Dnipro, Ukraine',
        role: 'Exclusive academic partner of Nobel ITBS',
        url: 'https://duan.edu.ua',
        note: 'The purple SVG and PNG logo variants have been received and approved for Release 1.',
      },
    },
    organisations: {
      heading: 'Partner organisations',
      intro: 'These are organisations whose role in specific programmes or projects has been approved for publication.',
      items: [
        { name: 'Riga Nordic University', location: 'Riga, Latvia', role: 'Partner organisation', url: 'https://rnu.lv/en/' },
        { name: 'Nataliia Kholodenko Psychology Centre', role: 'Partner organisation', url: 'https://school.kholodenko.net/' },
        { name: 'e-launch Online School', role: 'Partner organisation', url: 'https://e-launch.net/' },
        {
          name: 'Nobel Mental Health',
          role: 'Partner organisation',
          url: 'https://duan.edu.ua/pro-nas/departamenty-ta-strukturni-pidrozdily/klinika-psyhichnogo-zdorov-ja/',
        },
      ],
    },
    experts: {
      heading: 'Experts and programme authors',
      intro: 'Meet the professionals who create content, teach or provide professional expertise within specific programmes.',
      items: [
        { name: 'Nataliia Kholodenko', role: 'Psychologist, Candidate of Sciences', note: 'Expert and educational programme author' },
        { name: 'Dmytro Shevchuk', role: 'Practitioner in marketing and educational project production', note: 'AI Production programme expert' },
        { name: 'Alina Yudina', role: 'Psychologist, Head of Nobel Mental Health, Candidate of Sciences', note: 'General Psychology lecturer. Photograph pending.' },
      ],
    },
    boundaries: {
      heading: 'Partnership boundaries',
      items: [
        'partner and expert pages are not created in Release 1',
        'a logo is not proof of accreditation or universal endorsement',
        'partner participation is stated only for the relevant programme or project',
        'partners never appear in public credential verification data',
        'cooperation does not automatically create an academic partnership or a right to issue university documents',
      ],
    },
    finalCta: {
      heading: 'Have a programme, expertise or partnership idea?',
      body: 'Tell us about your role, project and expected cooperation model. We will consider how it may fit the direction of Nobel ITBS.',
      primaryCta: { label: 'Propose a partnership', href: '/contact?topic=partnership' },
      fallbackCta: { label: 'Contact us', href: '/contact' },
    },
    footer: homeCopy.en.footer,
  },
  ua: {
    homeHref: '/ua',
    navLabel: 'Основна навігація',
    localeLabel: 'Мова',
    nav: ukrainianNav,
    localeLinks: [
      { locale: 'en', label: 'EN', href: '/partnerships' },
      { locale: 'ua', label: 'UA', href: '/ua/partnerships' },
      { locale: 'cz', label: 'CZ', href: '/cz/partnerships' },
    ],
    hero: {
      eyebrow: 'Partnerships',
      title: 'Партнерства, що підсилюють професійну освіту',
      lead: 'Ми співпрацюємо з організаціями та експертами, які створюють змістовні програми й відповідально ставляться до результатів навчання.',
      supportingCopy:
        'Партнерство може охоплювати розробку або представлення програми, експертну участь, освітню інфраструктуру, документи, реєстрацію та верифікацію. Ролі й відповідальність визначаються окремо для кожного проєкту.',
      primaryCta: { label: 'Запропонувати партнерство', href: '/ua/contact?topic=partnership' },
    },
    principles: {
      heading: 'Принципи партнерства',
      items: [
        'чіткі ролі та відповідальність сторін',
        'прозоре авторство й належне представлення експертів',
        'перевірений зміст і коректні публічні твердження',
        'визначені результати навчання й умови завершення',
        'окрема модель документів для кожної програми',
        'повага до авторських прав, даних слухачів і професійних меж',
      ],
    },
    models: {
      heading: 'Моделі партнерства',
      items: [
        {
          title: 'Партнерство у програмі',
          text: 'Для організацій, онлайн-шкіл і власників методик, які хочуть спільно структурувати, представити або реалізувати професійну програму.',
        },
        {
          title: 'Експертне партнерство',
          text: 'Для практиків, викладачів і авторів, які долучаються до розробки змісту, викладання, оцінювання або професійної експертизи.',
        },
        {
          title: 'Інфраструктурне партнерство',
          text: 'Для освітніх проєктів, яким потрібна модель документів і додатків, реєстрація та онлайн-верифікація результатів навчання.',
        },
        {
          title: 'Партнерство з дистрибуції та просування',
          text:
            'Для організацій із погодженою роллю у представленні або поширенні конкретних програм. Комунікація має точно відображати власника, провайдера та учасників програми.',
        },
      ],
    },
    academic: {
      heading: 'Ексклюзивне академічне партнерство',
      body:
        'Університет імені Альфреда Нобеля є ексклюзивним академічним партнером Nobel ITBS. Участь університету й тип університетського документа визначаються окремо для кожної програми та не поширюються автоматично на всі партнерські проєкти.',
      partner: {
        name: 'Університет імені Альфреда Нобеля',
        location: 'м. Дніпро, Україна',
        role: 'Ексклюзивний академічний партнер Nobel ITBS',
        url: 'https://duan.edu.ua',
        note: 'Отримано й затверджено для Release 1 фіолетовий логотип у SVG та PNG.',
      },
    },
    organisations: {
      heading: 'Організації-партнери',
      intro: 'Представляємо організації, роль яких у конкретних програмах або проєктах погоджена для публікації.',
      items: [
        { name: 'Рижський нордичний університет', location: 'м. Рига, Латвія', role: 'Організація-партнер', url: 'https://rnu.lv/en/' },
        { name: 'Центр Психології Наталії Холоденко', role: 'Організація-партнер', url: 'https://school.kholodenko.net/' },
        { name: 'Онлайн-школа e-launch', role: 'Організація-партнер', url: 'https://e-launch.net/' },
        {
          name: 'Клініка психічного здоров’я',
          role: 'Організація-партнер',
          url: 'https://duan.edu.ua/pro-nas/departamenty-ta-strukturni-pidrozdily/klinika-psyhichnogo-zdorov-ja/',
        },
      ],
    },
    experts: {
      heading: 'Експерти та автори програм',
      intro: 'Знайомтеся з фахівцями, які створюють зміст, викладають або надають професійну експертизу в межах конкретних програм.',
      items: [
        { name: 'Наталія Холоденко', role: 'Психологиня, кандидат наук', note: 'Експертка та авторка освітніх програм' },
        { name: 'Дмитро Шевчук', role: 'Експерт-практик з маркетингу та продюсування освітніх проєктів', note: 'Експерт програми AI Production' },
        { name: 'Аліна Юдіна', role: 'Психологиня, керівниця Клініки психічного здоров’я, кандидат наук', note: 'Викладачка програми «Загальна психологія». Фото буде додано після отримання.' },
      ],
    },
    boundaries: {
      heading: 'Межі партнерства',
      items: [
        'окремі сторінки партнерів та експертів не створюються в Release 1',
        'логотип не є доказом акредитації або універсального схвалення',
        'участь партнера зазначається лише для відповідної програми або проєкту',
        'партнери ніколи не відображаються у публічних даних перевірки документа',
        'співпраця автоматично не створює академічного партнерства або права видавати університетські документи',
      ],
    },
    finalCta: {
      heading: 'Маєте програму, експертизу або партнерську ідею?',
      body: 'Розкажіть про свою роль, проєкт і очікувану модель співпраці. Ми розглянемо, як вона може відповідати напряму Nobel ITBS.',
      primaryCta: { label: 'Запропонувати партнерство', href: '/ua/contact?topic=partnership' },
      fallbackCta: { label: 'Написати нам', href: '/ua/contact' },
    },
    footer: homeCopy.ua.footer,
  },
  cz: {
    homeHref: '/cz',
    navLabel: 'Hlavní navigace',
    localeLabel: 'Jazyk',
    nav: czechNav,
    localeLinks: [
      { locale: 'en', label: 'EN', href: '/partnerships' },
      { locale: 'ua', label: 'UA', href: '/ua/partnerships' },
      { locale: 'cz', label: 'CZ', href: '/cz/partnerships' },
    ],
    hero: {
      eyebrow: 'Partnerships',
      title: 'Partnerství, která posilují profesní vzdělávání',
      lead: 'Spolupracujeme s organizacemi a experty, kteří vytvářejí smysluplné programy a odpovědně přistupují k výsledkům vzdělávání.',
      supportingCopy:
        'Partnerství může zahrnovat vývoj nebo prezentaci programu, účast expertů, vzdělávací infrastrukturu, dokumenty, registraci a ověřování. Role a odpovědnost se určují samostatně pro každý projekt.',
      primaryCta: { label: 'Navrhnout partnerství', href: '/cz/contact?topic=partnership' },
    },
    principles: {
      heading: 'Principy partnerství',
      items: [
        'jasné role a odpovědnost stran',
        'transparentní autorství a náležité představení expertů',
        'ověřený obsah a přesná veřejná tvrzení',
        'vymezené výsledky a podmínky dokončení',
        'samostatný model dokumentů pro každý program',
        'respekt k autorským právům, údajům účastníků a profesním hranicím',
      ],
    },
    models: {
      heading: 'Modely partnerství',
      items: [
        {
          title: 'Programové partnerství',
          text: 'Pro organizace, online školy a vlastníky metodik, kteří chtějí společně strukturovat, představit nebo realizovat profesní program.',
        },
        { title: 'Expertní partnerství', text: 'Pro praktiky, lektory a autory zapojené do tvorby obsahu, výuky, hodnocení nebo odborné expertizy.' },
        { title: 'Infrastrukturní partnerství', text: 'Pro vzdělávací projekty potřebující model dokumentů a dodatků, registraci a online ověřování výsledků.' },
        {
          title: 'Distribuční a propagační partnerství',
          text: 'Pro organizace s dohodnutou rolí při prezentaci nebo distribuci konkrétních programů. Komunikace musí přesně uvádět vlastníka, poskytovatele a účastníky.',
        },
      ],
    },
    academic: {
      heading: 'Exkluzivní akademické partnerství',
      body:
        'Alfred Nobel University je exkluzivním akademickým partnerem Nobel ITBS. Účast univerzity a typ univerzitního dokumentu se určují zvlášť pro každý program a automaticky se nevztahují na všechny partnerské projekty.',
      partner: {
        name: 'Alfred Nobel University',
        location: 'Dnipro, Ukrajina',
        role: 'Exkluzivní akademický partner Nobel ITBS',
        url: 'https://duan.edu.ua',
        note: 'Fialové logo ve formátech SVG a PNG bylo dodáno a schváleno pro Release 1.',
      },
    },
    organisations: {
      heading: 'Partnerské organizace',
      intro: 'Představujeme organizace, jejichž role v konkrétních programech nebo projektech byla schválena ke zveřejnění.',
      items: [
        { name: 'Riga Nordic University', location: 'Riga, Lotyšsko', role: 'Partnerská organizace', url: 'https://rnu.lv/en/' },
        { name: 'Nataliia Kholodenko Psychology Centre', role: 'Partnerská organizace', url: 'https://school.kholodenko.net/' },
        { name: 'e-launch Online School', role: 'Partnerská organizace', url: 'https://e-launch.net/' },
        {
          name: 'Nobel Mental Health',
          role: 'Partnerská organizace',
          url: 'https://duan.edu.ua/pro-nas/departamenty-ta-strukturni-pidrozdily/klinika-psyhichnogo-zdorov-ja/',
        },
      ],
    },
    experts: {
      heading: 'Experti a autoři programů',
      intro: 'Seznamte se s odborníky, kteří vytvářejí obsah, vyučují nebo poskytují profesní expertizu v konkrétních programech.',
      items: [
        { name: 'Nataliia Kholodenko', role: 'Psycholožka, kandidátka věd', note: 'Expertka a autorka vzdělávacích programů' },
        { name: 'Dmytro Shevchuk', role: 'Praktický odborník na marketing a produkci vzdělávacích projektů', note: 'Expert programu AI Production' },
        { name: 'Alina Yudina', role: 'Psycholožka, vedoucí Nobel Mental Health, kandidátka věd', note: 'Lektorka programu General Psychology. Fotografie bude doplněna po dodání.' },
      ],
    },
    boundaries: {
      heading: 'Hranice partnerství',
      items: [
        'samostatné stránky partnerů a expertů nejsou součástí Release 1',
        'logo není důkazem akreditace ani univerzální podpory',
        'účast partnera se uvádí pouze u relevantního programu nebo projektu',
        'partneři se nikdy nezobrazují ve veřejných údajích ověřování dokumentu',
        'spolupráce automaticky nevytváří akademické partnerství ani právo vydávat univerzitní dokumenty',
      ],
    },
    finalCta: {
      heading: 'Máte program, expertizu nebo partnerský nápad?',
      body: 'Popište svou roli, projekt a očekávaný model spolupráce. Posoudíme, jak může odpovídat směru Nobel ITBS.',
      primaryCta: { label: 'Navrhnout partnerství', href: '/cz/contact?topic=partnership' },
      fallbackCta: { label: 'Napsat nám', href: '/cz/contact' },
    },
    footer: homeCopy.cz.footer,
  },
};

export const organisationsCopy: Record<Locale, OrganisationsCopy> = {
  en: {
    homeHref: '/',
    navLabel: 'Primary navigation',
    localeLabel: 'Language',
    nav: englishNav,
    localeLinks: [
      { locale: 'en', label: 'EN', href: '/for-organisations' },
      { locale: 'ua', label: 'UA', href: '/ua/for-organisations' },
      { locale: 'cz', label: 'CZ', href: '/cz/for-organisations' },
    ],
    hero: {
      eyebrow: 'B2B Infrastructure',
      title: 'Education infrastructure for online schools and experts',
      lead: 'You create the content and learning experience. We help build the programme structure and a document system people can trust.',
      supportingCopy:
        'Nobel ITBS works as a provider and infrastructure partner for original and partner educational programmes. We help formalise the programme, define the document and supplement model, and organise registration and online verification.',
      primaryCta: { label: 'Discuss your project', href: '/contact?topic=organisation' },
    },
    need: {
      heading: 'The business need',
      paragraphs: [
        'Strong content is not enough if a programme lacks clearly defined goals, scope, learning outcomes, completion requirements and a transparent document model. A learner, employer or partner needs to understand what was learned, to what extent, and how the issued document can be verified.',
        "Nobel ITBS helps bring these elements together into a coherent infrastructure without interfering with the partner's methodology or original expertise.",
      ],
    },
    audiences: {
      heading: 'Who we work with',
      items: [
        { title: 'Online schools', text: 'Schools that already teach learners and want to structure their programmes, standardise documents, and add registration and online verification.' },
        { title: 'Experts and programme authors', text: 'Experts who have a methodology, original course or professional programme and need a clear educational and document model.' },
        { title: 'Educational projects', text: 'Centres, communities and other educational initiatives launching partner programmes that need dedicated infrastructure for learning outcomes.' },
      ],
    },
    services: {
      heading: 'Infrastructure services',
      items: [
        { title: 'Programme structuring', text: "We help describe the programme's purpose, audience, modules, learning scope, outcomes, assessment and completion requirements." },
        { title: 'Document model', text: 'We develop an aligned document model for the specific programme: the document title, the information it confirms, the supplement structure and its connection to learning outcomes.' },
        { title: 'Document preparation and supplements', text: 'We prepare the structure of certificates, diplomas or other agreed documents and supplements in accordance with the approved programme model.' },
        { title: 'Registration and verification', text: 'We organise document registration and verification of a valid document by number or QR code, without public access to the private PDF.' },
        { title: 'Partnership workflow', text: 'We define the roles of the author, programme owner, provider and academic partner, where one participates in the specific model.' },
      ],
    },
    receives: {
      heading: 'What the client receives',
      items: [
        'a structured educational programme description',
        'a defined outcomes and assessment model',
        'an agreed document and supplement system',
        'rules for preparing data used to issue documents',
        'registration of issued documents',
        'online validity verification by document number or QR code',
        'a clear allocation of roles and responsibilities between the parties',
      ],
      note: "The exact service scope depends on the programme's readiness, document type and chosen cooperation model.",
    },
    steps: {
      heading: 'How cooperation works',
      items: [
        { title: 'We get to know the project', text: 'We review the programme, audience, format, current learning model and intended outcome.' },
        { title: 'We design the infrastructure', text: 'We determine what needs to be structured, which documents are appropriate and how their preparation, registration and verification will work.' },
        { title: 'We agree the model', text: 'We document the scope of work, party roles, data requirements and rules for using the documents.' },
        { title: 'We support implementation', text: 'We work with the agreed programme and document infrastructure in accordance with the selected cooperation format.' },
      ],
    },
    trust: {
      heading: 'Trust and boundaries',
      paragraphs: [
        'Nobel ITBS operates through the Czech company Nobel ITBS s.r.o. and has an exclusive academic partnership with the University of Alfred Nobel.',
        'University participation, document type and the possibility of issuing that document are determined separately for each programme. Contacting Nobel ITBS does not guarantee programme approval, a university document, ECTS or any particular status.',
      ],
    },
    faq: [
      { question: 'Does my programme need to be fully developed?', answer: 'No. You can approach us with a finished programme, an original methodology or a structure that still needs further development.' },
      { question: 'Do I have to transfer intellectual property rights to Nobel ITBS?', answer: 'The rights and material-use model is agreed separately. Infrastructure cooperation does not itself mean an automatic transfer of intellectual property rights.' },
      { question: 'Can every programme receive a university certificate?', answer: 'No. The document format and issuer depend on the content, scope, outcomes, assessment and agreed model of the specific programme.' },
      { question: 'Can we use only registration and verification?', answer: 'The service scope is determined after reviewing the programme and its existing document system.' },
    ],
    finalCta: {
      heading: 'Let us build the infrastructure for your educational programme',
      body: 'Tell us about the project, current learning format and documents you plan to issue. After an initial review, we will recommend the next step.',
      primaryCta: { label: 'Discuss your project', href: '/contact?topic=organisation' },
      fallbackCta: { label: 'Contact us', href: '/contact' },
    },
    footer: homeCopy.en.footer,
  },
  ua: {
    homeHref: '/ua',
    navLabel: 'Основна навігація',
    localeLabel: 'Мова',
    nav: ukrainianNav,
    localeLinks: [
      { locale: 'en', label: 'EN', href: '/for-organisations' },
      { locale: 'ua', label: 'UA', href: '/ua/for-organisations' },
      { locale: 'cz', label: 'CZ', href: '/cz/for-organisations' },
    ],
    hero: {
      eyebrow: 'B2B Infrastructure',
      title: 'Освітня інфраструктура для онлайн-шкіл та експертів',
      lead: 'Ви створюєте зміст і навчальний досвід. Ми допомагаємо вибудувати структуру програми та систему документів, яким можна довіряти.',
      supportingCopy:
        'Nobel ITBS працює як провайдер та інфраструктурний партнер для авторських і партнерських освітніх програм. Ми допомагаємо оформити програму, визначити модель документів і додатків, організувати реєстрацію та онлайн-верифікацію.',
      primaryCta: { label: 'Обговорити проєкт', href: '/ua/contact?topic=organisation' },
    },
    need: {
      heading: 'Бізнес-потреба',
      paragraphs: [
        'Сильного контенту недостатньо, якщо програма не має чітко визначених цілей, обсягу, результатів навчання, правил завершення та зрозумілої моделі документів. Для слухача, роботодавця чи партнера важливо бачити, що саме було опановано, у якому обсязі та як можна перевірити виданий документ.',
        'Nobel ITBS допомагає зібрати ці елементи в цілісну інфраструктуру без втручання у методику або авторську експертизу партнера.',
      ],
    },
    audiences: {
      heading: 'З ким ми працюємо',
      items: [
        { title: 'Онлайн-школи', text: 'Для шкіл, які вже навчають слухачів і хочуть структурувати програми, уніфікувати документи та додати реєстрацію й онлайн-верифікацію.' },
        { title: 'Експерти та автори програм', text: 'Для експертів, які мають методику, авторський курс або професійну програму й потребують зрозумілої освітньої та документальної моделі.' },
        { title: 'Освітні проєкти', text: 'Для центрів, спільнот та інших освітніх ініціатив, які запускають партнерські програми й потребують окремої інфраструктури для результатів навчання.' },
      ],
    },
    services: {
      heading: 'Інфраструктурні послуги',
      items: [
        { title: 'Структурування програми', text: 'Допомагаємо описати мету, аудиторію, модулі, навчальний обсяг, результати, оцінювання та умови завершення програми.' },
        { title: 'Модель документів', text: 'Формуємо узгоджену модель документів для конкретної програми: назву документа, дані, які він підтверджує, структуру додатка та зв’язок із результатами навчання.' },
        { title: 'Документи та додатки', text: 'Готуємо структуру сертифікатів, дипломів або інших погоджених документів і додатків відповідно до затвердженої моделі програми.' },
        { title: 'Реєстрація та верифікація', text: 'Організовуємо реєстрацію документів і можливість перевірки дійсного документа за номером або QR-кодом без публічного доступу до приватного PDF.' },
        { title: 'Партнерський workflow', text: 'Фіксуємо ролі автора, власника програми, провайдера та академічного партнера, якщо він бере участь у конкретній моделі.' },
      ],
    },
    receives: {
      heading: 'Що отримує клієнт',
      items: [
        'структурований опис освітньої програми',
        'визначену модель результатів та оцінювання',
        'погоджену систему документів і додатків',
        'правила підготовки даних для видачі документів',
        'реєстрацію виданих документів',
        'онлайн-перевірку дійсності за номером або QR-кодом',
        'зрозумілий розподіл ролей і відповідальності між сторонами',
      ],
      note: 'Конкретний склад послуг залежить від готовності програми, типу документа та обраної моделі співпраці.',
    },
    steps: {
      heading: 'Як працює співпраця',
      items: [
        { title: 'Знайомимося з проєктом', text: 'Вивчаємо програму, аудиторію, формат, поточну модель навчання та очікуваний результат.' },
        { title: 'Проєктуємо інфраструктуру', text: 'Визначаємо, що потрібно структурувати, які документи доречні та як буде організовано їх підготовку, реєстрацію й перевірку.' },
        { title: 'Погоджуємо модель', text: 'Фіксуємо обсяг робіт, ролі сторін, вимоги до даних і правила використання документів.' },
        { title: 'Підтримуємо реалізацію', text: 'Працюємо з погодженою програмою та документальною інфраструктурою відповідно до обраного формату співпраці.' },
      ],
    },
    trust: {
      heading: 'Довіра та межі',
      paragraphs: [
        'Nobel ITBS працює через чеську компанію Nobel ITBS s.r.o. та має ексклюзивне академічне партнерство з Університетом імені Альфреда Нобеля.',
        'Участь університету, тип документа та можливість його видачі визначаються для кожної програми окремо. Звернення до Nobel ITBS не гарантує автоматичного схвалення програми, університетського документа, ECTS або певного статусу.',
      ],
    },
    faq: [
      { question: 'Чи потрібно мати повністю готову програму?', answer: 'Ні. Можна звернутися як із готовою програмою, так і з авторською методикою або структурою, яку ще потрібно доопрацювати.' },
      { question: 'Чи обов’язково передавати авторські права Nobel ITBS?', answer: 'Модель прав і використання матеріалів погоджується окремо. Інфраструктурна співпраця сама по собі не означає автоматичної передачі авторських прав.' },
      { question: 'Чи кожна програма може отримати університетський сертифікат?', answer: 'Ні. Формат і емітент документа залежать від змісту, обсягу, результатів, оцінювання та погодженої моделі конкретної програми.' },
      { question: 'Чи можна підключити лише реєстрацію та верифікацію?', answer: 'Склад послуг визначається після ознайомлення з програмою та наявною системою документів.' },
    ],
    finalCta: {
      heading: 'Побудуймо інфраструктуру для вашої освітньої програми',
      body: 'Розкажіть про проєкт, поточний формат навчання та документи, які ви плануєте видавати. Ми запропонуємо наступний крок після первинного аналізу.',
      primaryCta: { label: 'Обговорити проєкт', href: '/ua/contact?topic=organisation' },
      fallbackCta: { label: 'Написати нам', href: '/ua/contact' },
    },
    footer: homeCopy.ua.footer,
  },
  cz: {
    homeHref: '/cz',
    navLabel: 'Hlavní navigace',
    localeLabel: 'Jazyk',
    nav: czechNav,
    localeLinks: [
      { locale: 'en', label: 'EN', href: '/for-organisations' },
      { locale: 'ua', label: 'UA', href: '/ua/for-organisations' },
      { locale: 'cz', label: 'CZ', href: '/cz/for-organisations' },
    ],
    hero: {
      eyebrow: 'B2B Infrastructure',
      title: 'Vzdělávací infrastruktura pro online školy a experty',
      lead: 'Vy vytváříte obsah a vzdělávací zkušenost. My pomáháme vybudovat strukturu programu a důvěryhodný systém dokumentů.',
      supportingCopy:
        'Nobel ITBS působí jako poskytovatel a infrastrukturní partner autorských a partnerských programů. Pomáháme formalizovat program, určit model dokumentů a dodatků a zajistit registraci a online ověřování.',
      primaryCta: { label: 'Projednat projekt', href: '/cz/contact?topic=organisation' },
    },
    need: {
      heading: 'Obchodní potřeba',
      paragraphs: [
        'Silný obsah nestačí bez jasných cílů, rozsahu, výsledků, podmínek dokončení a srozumitelného modelu dokumentů. Účastník, zaměstnavatel i partner musí vědět, co bylo absolvováno, v jakém rozsahu a jak dokument ověřit.',
        'Nobel ITBS propojuje tyto prvky bez zásahu do metodiky nebo autorské expertizy partnera.',
      ],
    },
    audiences: {
      heading: 'S kým pracujeme',
      items: [
        { title: 'Online školy', text: 'Pro školy, které již vzdělávají a chtějí strukturovat programy, sjednotit dokumenty a přidat registraci a ověřování.' },
        { title: 'Experti a autoři programů', text: 'Pro experty s metodikou, autorským kurzem nebo profesním programem, kteří potřebují jasný vzdělávací a dokumentový model.' },
        { title: 'Vzdělávací projekty', text: 'Pro centra, komunity a iniciativy spouštějící partnerské programy a potřebující infrastrukturu výsledků vzdělávání.' },
      ],
    },
    services: {
      heading: 'Infrastrukturní služby',
      items: [
        { title: 'Strukturování programu', text: 'Popis cíle, publika, modulů, rozsahu, výsledků, hodnocení a podmínek dokončení.' },
        { title: 'Dokumentový model', text: 'Název dokumentu, potvrzované údaje, struktura dodatku a vazba na výsledky.' },
        { title: 'Dokumenty a dodatky', text: 'Struktura certifikátů, diplomů a dalších dohodnutých dokumentů a dodatků.' },
        { title: 'Registrace a ověřování', text: 'Registrace a ověření platného dokumentu číslem nebo QR kódem bez veřejného PDF.' },
        { title: 'Partnerský workflow', text: 'Vymezení rolí autora, vlastníka programu, poskytovatele a případného akademického partnera.' },
      ],
    },
    receives: {
      heading: 'Co klient získá',
      items: [
        'strukturovaný popis programu',
        'model výsledků a hodnocení',
        'dohodnutý systém dokumentů a dodatků',
        'pravidla přípravy dat',
        'registraci vydaných dokumentů',
        'online ověření číslem nebo QR kódem',
        'jasné rozdělení rolí a odpovědnosti',
      ],
      note: 'Rozsah závisí na připravenosti programu, typu dokumentu a modelu spolupráce.',
    },
    steps: {
      heading: 'Jak spolupráce funguje',
      items: [
        { title: 'Poznáme váš projekt', text: 'Posoudíme program, publikum, formát, současný model a očekávaný výsledek.' },
        { title: 'Navrhneme infrastrukturu', text: 'Určíme, co strukturovat, jaké dokumenty jsou vhodné a jak proběhne jejich příprava, registrace a ověření.' },
        { title: 'Dohodneme model', text: 'Stanovíme rozsah, role, požadavky na data a pravidla použití dokumentů.' },
        { title: 'Podpoříme realizaci', text: 'Pracujeme podle dohodnutého programu, infrastruktury a formátu spolupráce.' },
      ],
    },
    trust: {
      heading: 'Důvěra a hranice',
      paragraphs: [
        'Nobel ITBS působí prostřednictvím české společnosti Nobel ITBS s.r.o. a má exkluzivní akademické partnerství s Univerzitou Alfreda Nobela.',
        'Účast univerzity, typ dokumentu a možnost vydání se určují zvlášť pro každý program. Kontakt nezaručuje schválení, univerzitní dokument, ECTS ani určitý status.',
      ],
    },
    faq: [
      { question: 'Musí být program hotový?', answer: 'Ne. Lze přijít s hotovým programem, metodikou i strukturou k dopracování.' },
      { question: 'Musím převést autorská práva?', answer: 'Model práv se sjednává samostatně; infrastrukturní spolupráce automatický převod neznamená.' },
      { question: 'Může každý program získat univerzitní certifikát?', answer: 'Ne. Záleží na obsahu, rozsahu, výsledcích, hodnocení a dohodnutém modelu.' },
      { question: 'Lze využít jen registraci a ověřování?', answer: 'Rozsah služeb se určí po posouzení programu a stávajícího systému dokumentů.' },
    ],
    finalCta: {
      heading: 'Vybudujme infrastrukturu pro váš vzdělávací program',
      body: 'Popište projekt, současný formát a plánované dokumenty. Po úvodním posouzení navrhneme další krok.',
      primaryCta: { label: 'Projednat projekt', href: '/cz/contact?topic=organisation' },
      fallbackCta: { label: 'Napsat nám', href: '/cz/contact' },
    },
    footer: homeCopy.cz.footer,
  },
};

export const verifyCopy: Record<Locale, VerifyCopy> = {
  en: {
    homeHref: '/',
    navLabel: 'Primary navigation',
    localeLabel: 'Language',
    nav: englishNav,
    localeLinks: [
      { locale: 'en', label: 'EN', href: '/verify' },
      { locale: 'ua', label: 'UA', href: '/ua/verify' },
      { locale: 'cz', label: 'CZ', href: '/cz/verify' },
    ],
    hero: {
      eyebrow: 'Document Verification',
      title: 'Verify a document',
      lead: 'Enter the document number to check its status in the Nobel ITBS registry.',
      instruction:
        'Use the number exactly as it appears on the document. If the document has a QR code, scan it with your phone camera to open the verification page without entering the number manually.',
    },
    form: {
      fieldLabel: 'Document number',
      placeholder: 'For example, NITBS-C-2026-000123',
      helper: 'Verification is available only with the complete document number.',
      submit: 'Verify',
      submitting: 'Verifying…',
      requiredError: 'Enter the document number.',
      formatError: 'Check the document number and try again.',
    },
    states: {
      resultEyebrow: 'Result states',
      heading: 'Verification result behaviour',
      validFieldNote: 'Shown only for valid documents',
      notFoundStatus: 'Not found',
      systemEyebrow: 'System states',
      systemHeading: 'When verification cannot continue',
      valid: {
        statusLabel: 'Valid',
        heading: 'Document verified',
        body: 'The document was found in the Nobel ITBS registry and has valid status.',
        fields: ['Document number', 'Document holder', 'Programme', 'Document type', 'Issue date'],
        note: "This page confirms the document's status at the time of verification.",
      },
      revoked: {
        statusLabel: 'Revoked',
        heading: 'Document revoked',
        body: 'This document has Revoked status. Document details are not displayed.',
      },
      notFound: {
        heading: 'Document not found',
        body: 'No document was found for this code or number.',
        helper: 'Check that the number is correct. If it has been entered correctly, contact the organisation that provided the document.',
      },
      rateLimit: {
        heading: 'Too many verification attempts',
        body: 'We have temporarily limited new requests. Wait a moment and try again.',
        button: 'Try again later',
      },
      temporaryError: {
        heading: 'Verification could not be completed',
        body: 'The verification service is temporarily unavailable. Please try again later.',
        retry: 'Try again',
      },
      connectionError: {
        heading: 'Cannot connect to the verification service',
        body: 'Check your internet connection and submit the request again.',
        retry: 'Try again',
      },
    },
    privacyRules: {
      heading: 'Privacy rules',
      items: [
        'manual verification uses document number only',
        'search by name, surname, email, phone, learner ID or partner is not supported',
        'valid is the only state that shows document details',
        'revoked shows status only',
        'pending and voided behave as not found publicly',
        'PDF, partner information, internal IDs, notes, history and storage paths are never shown publicly',
      ],
    },
    tokenResult: {
      eyebrow: 'QR verification',
      heading: 'Verification result',
      body: 'A QR code opens a separate noindex result page using a secure token. The public result follows the same privacy rules as manual verification.',
      manualCta: { label: 'Verify by document number', href: '/verify' },
    },
    footer: homeCopy.en.footer,
  },
  ua: {
    homeHref: '/ua',
    navLabel: 'Основна навігація',
    localeLabel: 'Мова',
    nav: ukrainianNav,
    localeLinks: [
      { locale: 'en', label: 'EN', href: '/verify' },
      { locale: 'ua', label: 'UA', href: '/ua/verify' },
      { locale: 'cz', label: 'CZ', href: '/cz/verify' },
    ],
    hero: {
      eyebrow: 'Document Verification',
      title: 'Перевірка документа',
      lead: 'Введіть номер документа, щоб перевірити його статус у реєстрі Nobel ITBS.',
      instruction:
        'Використовуйте номер у тому форматі, у якому він зазначений на документі. Якщо на документі є QR-код, відскануйте його камерою телефона, щоб відкрити сторінку перевірки без ручного введення.',
    },
    form: {
      fieldLabel: 'Номер документа',
      placeholder: 'Наприклад, NITBS-C-2026-000123',
      helper: 'Перевірка доступна лише за повним номером документа.',
      submit: 'Перевірити',
      submitting: 'Перевіряємо…',
      requiredError: 'Введіть номер документа.',
      formatError: 'Перевірте номер документа та спробуйте ще раз.',
    },
    states: {
      resultEyebrow: 'Стани результату',
      heading: 'Як працює результат перевірки',
      validFieldNote: 'Показується тільки для дійсних документів',
      notFoundStatus: 'Не знайдено',
      systemEyebrow: 'Системні стани',
      systemHeading: 'Коли перевірку неможливо продовжити',
      valid: {
        statusLabel: 'Дійсний',
        heading: 'Документ підтверджено',
        body: 'Документ знайдено в реєстрі Nobel ITBS і він має дійсний статус.',
        fields: ['Номер документа', 'Власник документа', 'Програма', 'Тип документа', 'Дата видачі'],
        note: 'Сторінка підтверджує статус документа на момент перевірки.',
      },
      revoked: {
        statusLabel: 'Відкликаний',
        heading: 'Документ відкликано',
        body: 'Цей документ має статус «Відкликаний». Деталі документа не відображаються.',
      },
      notFound: {
        heading: 'Документ не знайдено',
        body: 'За цим кодом/номером документ не знайдено.',
        helper: 'Перевірте правильність номера. Якщо номер введено правильно, зверніться до організації, яка надала документ.',
      },
      rateLimit: {
        heading: 'Забагато спроб перевірки',
        body: 'Ми тимчасово обмежили нові запити. Зачекайте трохи та спробуйте ще раз.',
        button: 'Спробувати пізніше',
      },
      temporaryError: {
        heading: 'Не вдалося виконати перевірку',
        body: 'Сервіс перевірки тимчасово недоступний. Спробуйте ще раз пізніше.',
        retry: 'Повторити',
      },
      connectionError: {
        heading: 'Немає зв’язку із сервісом перевірки',
        body: 'Перевірте інтернет-з’єднання та повторіть запит.',
        retry: 'Повторити',
      },
    },
    privacyRules: {
      heading: 'Правила приватності',
      items: [
        'ручна перевірка використовує тільки номер документа',
        'пошук за ім’ям, прізвищем, email, телефоном, ID слухача або партнером не підтримується',
        'лише дійсний статус показує деталі документа',
        'відкликаний статус показує тільки статус',
        'pending і voided публічно поводяться як not found',
        'PDF, інформація про партнерів, внутрішні ID, нотатки, історія й storage paths ніколи не показуються публічно',
      ],
    },
    tokenResult: {
      eyebrow: 'QR verification',
      heading: 'Результат перевірки',
      body: 'QR-код відкриває окрему noindex сторінку результату через захищений токен. Публічний результат працює за тими самими правилами приватності, що й ручна перевірка.',
      manualCta: { label: 'Перевірити за номером документа', href: '/ua/verify' },
    },
    footer: homeCopy.ua.footer,
  },
  cz: {
    homeHref: '/cz',
    navLabel: 'Hlavní navigace',
    localeLabel: 'Jazyk',
    nav: czechNav,
    localeLinks: [
      { locale: 'en', label: 'EN', href: '/verify' },
      { locale: 'ua', label: 'UA', href: '/ua/verify' },
      { locale: 'cz', label: 'CZ', href: '/cz/verify' },
    ],
    hero: {
      eyebrow: 'Document Verification',
      title: 'Ověření dokumentu',
      lead: 'Zadejte číslo dokumentu a ověřte jeho stav v registru Nobel ITBS.',
      instruction:
        'Použijte číslo přesně ve formátu uvedeném na dokumentu. Pokud obsahuje QR kód, naskenujte jej fotoaparátem telefonu a otevřete ověřovací stránku bez ručního zadávání.',
    },
    form: {
      fieldLabel: 'Číslo dokumentu',
      placeholder: 'Například NITBS-C-2026-000123',
      helper: 'Ověření je dostupné pouze podle celého čísla dokumentu.',
      submit: 'Ověřit',
      submitting: 'Ověřujeme…',
      requiredError: 'Zadejte číslo dokumentu.',
      formatError: 'Zkontrolujte číslo dokumentu a zkuste to znovu.',
    },
    states: {
      resultEyebrow: 'Stavy výsledku',
      heading: 'Jak funguje výsledek ověření',
      validFieldNote: 'Zobrazuje se pouze u platných dokumentů',
      notFoundStatus: 'Nenalezeno',
      systemEyebrow: 'Systémové stavy',
      systemHeading: 'Kdy ověření nemůže pokračovat',
      valid: {
        statusLabel: 'Platný',
        heading: 'Dokument ověřen',
        body: 'Dokument byl nalezen v registru Nobel ITBS a má platný stav.',
        fields: ['Číslo dokumentu', 'Držitel dokumentu', 'Program', 'Typ dokumentu', 'Datum vydání'],
        note: 'Stránka potvrzuje stav dokumentu v okamžiku ověření.',
      },
      revoked: {
        statusLabel: 'Odvolaný',
        heading: 'Dokument byl odvolán',
        body: 'Tento dokument má stav „Odvolaný“. Podrobnosti dokumentu se nezobrazují.',
      },
      notFound: {
        heading: 'Dokument nenalezen',
        body: 'Pro tento kód nebo číslo nebyl nalezen žádný dokument.',
        helper: 'Zkontrolujte správnost čísla. Pokud je správné, kontaktujte organizaci, která dokument poskytla.',
      },
      rateLimit: {
        heading: 'Příliš mnoho pokusů o ověření',
        body: 'Nové požadavky jsme dočasně omezili. Chvíli počkejte a zkuste to znovu.',
        button: 'Zkusit později',
      },
      temporaryError: {
        heading: 'Ověření se nepodařilo dokončit',
        body: 'Ověřovací služba je dočasně nedostupná. Zkuste to později.',
        retry: 'Zkusit znovu',
      },
      connectionError: {
        heading: 'Nelze se spojit s ověřovací službou',
        body: 'Zkontrolujte připojení k internetu a požadavek opakujte.',
        retry: 'Zkusit znovu',
      },
    },
    privacyRules: {
      heading: 'Pravidla ochrany údajů',
      items: [
        'ruční ověření používá pouze číslo dokumentu',
        'hledání podle jména, příjmení, e-mailu, telefonu, ID účastníka ani partnera není podporováno',
        'pouze platný stav zobrazuje podrobnosti dokumentu',
        'odvolaný stav zobrazuje pouze stav',
        'pending a voided se veřejně chovají jako nenalezené',
        'PDF, partneři, interní ID, poznámky, historie ani úložiště se veřejně nikdy nezobrazují',
      ],
    },
    tokenResult: {
      eyebrow: 'QR verification',
      heading: 'Výsledek ověření',
      body: 'QR kód otevře samostatnou noindex stránku výsledku pomocí zabezpečeného tokenu. Veřejný výsledek používá stejná pravidla ochrany údajů jako ruční ověření.',
      manualCta: { label: 'Ověřit podle čísla dokumentu', href: '/cz/verify' },
    },
    footer: homeCopy.cz.footer,
  },
};

export const programmeLandingCopy: Record<Locale, Record<string, ProgrammeLandingCopy>> = {
  en: {
    'business-management': {
      homeHref: '/',
      navLabel: 'Primary navigation',
      localeLabel: 'Language',
      nav: englishNav,
      localeLinks: [
        { locale: 'en', label: 'EN', href: '/programmes/business-management' },
        { locale: 'ua', label: 'UA', href: '/ua/programmes/business-management' },
        { locale: 'cz', label: 'CZ', href: '/cz/programmes/business-management' },
      ],
      kind: 'Programme Area',
      hero: {
        eyebrow: 'Programme Area',
        title: 'Business & Management',
        lead: 'Strong businesses begin with decisions that can be explained and put into practice.',
        supportingCopy:
          'This area brings together programmes in management, entrepreneurship, product development, and business systems. The learning helps participants work with goals, resources, processes, teams, and change in a modern professional environment.',
        primaryCta: { label: 'View programmes', href: '#programmes-in-this-area' },
      },
      about: {
        heading: 'About the area',
        paragraphs: [
          'Business & Management focuses on turning ideas into structured products and manageable processes. Participants consider business as a connected system in which strategy, finance, marketing, sales, people, and operations need to work together.',
          "Programmes in this area combine professional concepts with applied tasks, decision analysis, and work on participants' own projects.",
        ],
      },
      audience: {
        heading: 'Who this area is for',
        items: [
          'entrepreneurs and project founders',
          'managers and team leaders',
          'experts creating or scaling their own products',
          'specialists moving into management responsibility',
          'professionals who need to structure their business knowledge',
        ],
      },
      development: {
        heading: 'What you develop',
        items: [
          'strategic and systems thinking',
          'the ability to assess business decisions and their consequences',
          'understanding of products, markets, and customer value',
          'skills for working with processes, finance, marketing, and sales',
          'approaches to managing teams, change, and project development',
        ],
      },
      programmes: {
        heading: 'Programmes in this area',
        intro: 'Choose a programme based on your professional goal, preferred format, and intended learning outcome.',
        emptyHeading: 'New programmes in this area are being prepared for publication',
        emptyBody: 'Return to the catalogue later to see new published programmes.',
        items: [
          {
            title: 'AI Production',
            href: '/programmes/ai-production',
            description: 'A six-month Mini-MBA programme on creating, launching, and scaling expert-led and educational products through marketing, sales, management, and AI.',
            status: 'Enrolment open',
            facts: '360 hours / 12 ECTS · 6 months · Ukrainian',
            cta: 'View programme',
          },
        ],
      },
      closing: {
        heading: 'Find a programme for your next professional step',
        body: 'Explore Business & Management programmes and choose the format that matches your goals.',
        cta: { label: 'View programmes', href: '#programmes-in-this-area' },
      },
      footer: homeCopy.en.footer,
    },
    'technology-innovation': {
      homeHref: '/',
      navLabel: 'Primary navigation',
      localeLabel: 'Language',
      nav: englishNav,
      localeLinks: [
        { locale: 'en', label: 'EN', href: '/programmes/technology-innovation' },
        { locale: 'ua', label: 'UA', href: '/ua/programmes/technology-innovation' },
        { locale: 'cz', label: 'CZ', href: '/cz/programmes/technology-innovation' },
      ],
      kind: 'Programme Area',
      hero: {
        eyebrow: 'Programme Area',
        title: 'Technology & Innovation',
        lead: 'Technology creates value when we understand how to apply it.',
        supportingCopy:
          'This area brings together programmes in emerging technologies, innovative markets, and new industries. Participants study not only individual tools but also the logic of technological decisions, business models, and professional opportunities.',
        primaryCta: { label: 'View programmes', href: '#programmes-in-this-area' },
      },
      about: {
        heading: 'About the area',
        paragraphs: [
          'Technology & Innovation helps participants navigate an environment in which technology is rapidly changing markets, professions, and product development. Programmes connect technological context with business, economics, management, and international cooperation.',
          'The purpose is to provide a foundation for analysing emerging technologies, asking the right questions, and making decisions with an understanding of their opportunities, limitations, and practical context.',
        ],
      },
      audience: {
        heading: 'Who this area is for',
        items: [
          'specialists in technology and digital fields',
          'managers and entrepreneurs working with technology products',
          'professionals from other fields who need to understand modern technologies',
          'team members developing or implementing innovative solutions',
          'people planning professional development in emerging industries',
        ],
      },
      development: {
        heading: 'What you develop',
        items: [
          'understanding of technological and innovation decision-making',
          'the ability to assess emerging markets and opportunities',
          'decision-making skills informed by technological context',
          'understanding of the relationship between technology, economics, and business models',
          'readiness to work with interdisciplinary products and teams',
        ],
      },
      programmes: {
        heading: 'Programmes in this area',
        intro: 'Explore technologies and industries through programmes that connect professional context, applied knowledge, and current market processes.',
        emptyHeading: 'New programmes in this area are being prepared for publication',
        emptyBody: 'Return to the catalogue later to see new published programmes.',
        items: [
          {
            title: 'Space Business',
            href: '/programmes/space-business',
            description: 'A distance certificate programme covering the space market, technology, start-ups, economics, law, and international cooperation.',
            status: 'Ongoing enrolment',
            cta: 'View programme',
          },
        ],
      },
      closing: {
        heading: 'Explore the opportunities of emerging industries',
        body: 'View Technology & Innovation programmes and find a direction for your next stage of professional development.',
        cta: { label: 'View programmes', href: '#programmes-in-this-area' },
      },
      footer: homeCopy.en.footer,
    },
    'psychology-human': {
      homeHref: '/',
      navLabel: 'Primary navigation',
      localeLabel: 'Language',
      nav: englishNav,
      localeLinks: [
        { locale: 'en', label: 'EN', href: '/programmes/psychology-human' },
        { locale: 'ua', label: 'UA', href: '/ua/programmes/psychology-human' },
        { locale: 'cz', label: 'CZ', href: '/cz/programmes/psychology-human' },
      ],
      kind: 'Programme Area',
      hero: {
        eyebrow: 'Programme Area',
        title: 'Psychology & Human',
        lead: 'Understanding people helps us act with greater care, professionalism, and responsibility.',
        supportingCopy:
          'This area brings together programmes about the psyche, behaviour, development, emotional states, and self-regulation. The learning can help build a structured foundation, deepen professional knowledge, or explore a specific approach within a clearly defined educational programme.',
        primaryCta: { label: 'View programmes', href: '#programmes-in-this-area' },
      },
      about: {
        heading: 'About the area',
        paragraphs: [
          'Psychology & Human considers people from different perspectives, from basic mental processes and age-related development to behavioural patterns, inner states, and the capacity for self-regulation.',
          'Each programme has its own audience, content, learning volume, and professional boundaries. Completing an individual programme is not equivalent to qualifying as a psychologist, psychotherapist, or medical professional.',
        ],
      },
      audience: {
        heading: 'Who this area is for',
        items: [
          'people beginning a structured introduction to psychology',
          'psychologists and professionals in helping roles who wish to deepen their knowledge',
          'educators and specialists working with children and families',
          'managers, consultants, and professionals whose work involves people',
          'participants interested in self-regulation and behavioural patterns',
        ],
      },
      development: {
        heading: 'What you develop',
        items: [
          'a structured understanding of the psyche and behaviour',
          'knowledge of psychological development across different life stages',
          'sensitivity to emotional states and behavioural responses',
          'understanding of self-regulation and neuroplasticity',
          'the ability to recognise professional boundaries and apply knowledge responsibly',
        ],
      },
      programmes: {
        heading: 'Programmes in this area',
        intro: 'Choose a programme by topic, learning volume, format, and the outcome that matches your needs.',
        emptyHeading: 'New programmes in this area are being prepared for publication',
        emptyBody: 'Return to the catalogue later to see new published programmes.',
        items: [
          { title: 'General Psychology', href: '/programmes/general-psychology', description: 'A distance professional development course that builds a structured foundation in the psyche, personality, motivation, emotions, and cognitive processes.', cta: 'View programme' },
          { title: 'Child Psychology', href: '/programmes/child-psychology', description: 'A distance professional development course on child development, age-related characteristics, and responsible psychological support.', cta: 'View programme' },
          { title: 'Neuroplastic Reconstruction', href: '/programmes/neuroplastic-reconstruction', description: 'A professional development course in neuroplasticity, self-regulation, behavioural patterns, and the Neuroplastic Reconstruction method.', cta: 'View programme' },
        ],
      },
      closing: {
        heading: 'Choose a programme for a deeper understanding of people',
        body: 'Compare Psychology & Human programmes by content, format, and learning outcomes.',
        cta: { label: 'View programmes', href: '#programmes-in-this-area' },
      },
      footer: homeCopy.en.footer,
    },
    'certificate-programme': {
      homeHref: '/',
      navLabel: 'Primary navigation',
      localeLabel: 'Language',
      nav: englishNav,
      localeLinks: [
        { locale: 'en', label: 'EN', href: '/programmes/certificate-programme' },
        { locale: 'ua', label: 'UA', href: '/ua/programmes/certificate-programme' },
        { locale: 'cz', label: 'CZ', href: '/cz/programmes/certificate-programme' },
      ],
      kind: 'Programme Type',
      hero: {
        eyebrow: 'Programme Type',
        title: 'Certificate Programmes',
        lead: 'Structured learning with defined content, outcomes, and a document awarded after the programme requirements have been met.',
        primaryCta: { label: 'View programmes', href: '#programmes-in-this-area' },
      },
      about: {
        heading: 'What is a Certificate programme',
        paragraphs: [
          'A Certificate programme is a professional education programme with a defined subject, learning volume, format, and learning outcomes. After successful completion, the participant receives the certificate specified by the individual programme.',
          'The Programme Type does not automatically define the number of ECTS credits, qualification level, issuer, or international status of the document. These characteristics are stated separately on each programme page.',
        ],
      },
      audience: {
        heading: 'Who this format is for',
        items: [
          'specialists who want to study a focused professional subject',
          'participants who value a defined learning volume',
          'professionals who need a document confirming programme completion',
          'people choosing a shorter, focused format instead of a long academic programme',
        ],
      },
      development: {
        heading: 'What to compare',
        items: [
          'subject and learning outcomes',
          'duration, hours, and ECTS where applicable',
          'format and language of instruction',
          'assessment and completion requirements',
          'name, type, and issuer of the certificate',
          'document verification, where provided by the programme',
        ],
      },
      programmes: {
        heading: 'Certificate programmes',
        intro: 'Compare the available programmes by subject, format, learning volume, and completion document.',
        emptyHeading: 'Programmes of this type are being prepared',
        emptyBody: 'There are currently no published certificate programmes. Explore other learning formats or return to the catalogue later.',
        items: [
          { title: 'Space Business', href: '/programmes/space-business', description: 'A distance programme about the space market, technology, start-ups, economics, law, and international cooperation. 90 hours, taught in Ukrainian and English.', area: 'Technology & Innovation', status: 'Ongoing enrolment', document: 'Certificate', cta: 'View programme' },
        ],
      },
      closing: {
        heading: 'Choose a certificate programme based on your professional goal',
        body: 'Compare the content, format, and document provided by each programme.',
        cta: { label: 'View programmes', href: '#programmes-in-this-area' },
      },
      footer: homeCopy.en.footer,
    },
    'mini-mba': {
      homeHref: '/',
      navLabel: 'Primary navigation',
      localeLabel: 'Language',
      nav: englishNav,
      localeLinks: [
        { locale: 'en', label: 'EN', href: '/programmes/mini-mba' },
        { locale: 'ua', label: 'UA', href: '/ua/programmes/mini-mba' },
        { locale: 'cz', label: 'CZ', href: '/cz/programmes/mini-mba' },
      ],
      kind: 'Programme Type',
      hero: {
        eyebrow: 'Programme Type',
        title: 'Mini-MBA',
        lead: 'A concentrated professional format for developing business and management competencies as a connected system.',
        primaryCta: { label: 'View programmes', href: '#programmes-in-this-area' },
      },
      about: {
        heading: 'What is a Mini-MBA',
        paragraphs: [
          'A Mini-MBA is a professional programme that brings together key areas of business and management in a more compact format. Depending on the programme, it may cover strategy, product, marketing, sales, finance, operations, people, and leadership.',
          'A Mini-MBA is not an academic degree and does not replace a full MBA programme. Duration, learning volume, assessment, documents, and any possible recognition of learning are defined by the individual programme.',
        ],
      },
      audience: {
        heading: 'Who this format is for',
        items: ['entrepreneurs and project owners', 'managers and team leaders', 'experts creating or scaling their own product', 'specialists moving into a business or management role', 'professionals who need to structure practical experience'],
      },
      development: {
        heading: 'What the format develops',
        items: ['a systems view of business and its connected functions', 'the ability to make reasoned management decisions', 'understanding of products, markets, and customer value', 'skills for working with finance, processes, and teams', "application of learning outcomes in the participant's own project"],
      },
      programmes: {
        heading: 'Mini-MBA programmes',
        intro: 'Compare available programmes by specialisation, learning volume, applied outcome, and completion documents.',
        emptyHeading: 'Programmes of this type are being prepared',
        emptyBody: 'There are currently no published Mini-MBA programmes. Explore other learning formats or return to the catalogue later.',
        items: [
          { title: 'AI Production', href: '/programmes/ai-production', description: 'A six-month Mini-MBA programme on creating, launching, and scaling expert-led and educational products through marketing, sales, management, and AI.', area: 'Business & Management', status: 'Enrolment open', facts: '360 hours / 12 ECTS · 6 months · Ukrainian', document: 'University certificate after 3 months and an international Mini-MBA diploma with Diploma Supplement after the full programme.', cta: 'View programme' },
        ],
      },
      closing: {
        heading: 'Turn your experience into structured management decisions',
        body: 'Choose a Mini-MBA programme that matches your business challenges and professional direction.',
        cta: { label: 'View programmes', href: '#programmes-in-this-area' },
      },
      footer: homeCopy.en.footer,
    },
    'professional-development-course': {
      homeHref: '/',
      navLabel: 'Primary navigation',
      localeLabel: 'Language',
      nav: englishNav,
      localeLinks: [
        { locale: 'en', label: 'EN', href: '/programmes/professional-development-course' },
        { locale: 'ua', label: 'UA', href: '/ua/programmes/professional-development-course' },
        { locale: 'cz', label: 'CZ', href: '/cz/programmes/professional-development-course' },
      ],
      kind: 'Programme Type',
      hero: {
        eyebrow: 'Programme Type',
        title: 'Professional Development Courses',
        lead: 'Deepen your professional knowledge through structured programmes with a defined learning volume, content, and outcomes.',
        primaryCta: { label: 'View programmes', href: '#programmes-in-this-area' },
      },
      about: {
        heading: 'What is a Professional development course',
        paragraphs: [
          'A Professional development course helps participants update, expand, or structure knowledge in a specific professional field. Each programme has its own subject, audience, learning volume, format, assessment, and completion requirements.',
          'Completing an individual programme does not automatically confer a new profession, academic degree, or the right to regulated, medical, or psychotherapeutic practice. Professional opportunities and limits on applying the learning depend on the programme content and the rules of the relevant country or profession.',
        ],
      },
      audience: {
        heading: 'Who this format is for',
        items: ['specialists deepening knowledge in their field', 'professionals who need to structure practical experience', 'participants preparing for further professional or academic learning', 'specialists from related fields who need a structured subject foundation', 'people choosing a programme with a defined learning volume and outcomes'],
      },
      development: {
        heading: 'What to compare',
        items: ['intended audience and entry requirements', 'learning outcomes and boundaries of competence', 'duration, hours, and ECTS', 'format, language, and mode of study', 'assessment and completion requirements', 'the document, its issuer, and any supplement provided'],
      },
      programmes: {
        heading: 'Professional development courses',
        intro: 'Compare the subject, learning volume, format, and completion document to choose the right professional direction.',
        emptyHeading: 'Programmes of this type are being prepared',
        emptyBody: 'There are currently no published professional development courses. Explore other formats or return to the catalogue later.',
        items: [
          { title: 'General Psychology', href: '/programmes/general-psychology', description: 'A distance programme that builds a structured foundation in the psyche, personality, motivation, emotions, and cognitive processes.', area: 'Psychology & Human', status: 'Ongoing enrolment', facts: '90 hours / 3 ECTS · Moodle · 1-year access · Ukrainian', document: 'Professional development certificate from the University of Alfred Nobel.', cta: 'View programme' },
          { title: 'Child Psychology', href: '/programmes/child-psychology', description: 'A distance programme on child development, age-related characteristics, and responsible psychological support.', area: 'Psychology & Human', status: 'Ongoing enrolment', facts: '90 hours / 3 ECTS · Moodle · 6-month access · Ukrainian', document: 'Professional development certificate from the University of Alfred Nobel.', cta: 'View programme' },
          { title: 'Neuroplastic Reconstruction', href: '/programmes/neuroplastic-reconstruction', description: 'A programme in neuroplasticity, self-regulation, behavioural patterns, and the Neuroplastic Reconstruction method.', area: 'Psychology & Human', status: 'Enrolment open · starts 5 October', facts: '3 months · 180 hours / 6 ECTS · Ukrainian', document: 'Documents and professional status depend on the selected pricing tier.', cta: 'View programme' },
        ],
      },
      closing: {
        heading: 'Choose a programme for your next stage of professional development',
        body: 'Compare programme content, learning volume, and format to find the one that matches your goals.',
        cta: { label: 'View programmes', href: '#programmes-in-this-area' },
      },
      footer: homeCopy.en.footer,
    },
  },
  ua: {
    'business-management': {
      homeHref: '/ua',
      navLabel: 'Основна навігація',
      localeLabel: 'Мова',
      nav: ukrainianNav,
      localeLinks: [
        { locale: 'en', label: 'EN', href: '/programmes/business-management' },
        { locale: 'ua', label: 'UA', href: '/ua/programmes/business-management' },
        { locale: 'cz', label: 'CZ', href: '/cz/programmes/business-management' },
      ],
      kind: 'Programme Area',
      hero: {
        eyebrow: 'Programme Area',
        title: 'Business & Management',
        lead: 'Сильний бізнес починається з рішень, які можна обґрунтувати й реалізувати.',
        supportingCopy:
          'Напрям об’єднує програми про управління, підприємництво, створення продуктів і розвиток бізнес-систем. Навчання допомагає працювати з цілями, ресурсами, процесами, командами та змінами у сучасному професійному середовищі.',
        primaryCta: { label: 'Переглянути програми', href: '#programmes-in-this-area' },
      },
      about: {
        heading: 'Про напрям',
        paragraphs: [
          'Business & Management зосереджується на тому, як перетворювати ідеї на структуровані продукти й керовані процеси. Учасники розглядають бізнес не як набір окремих інструментів, а як систему, у якій стратегія, фінанси, маркетинг, продажі, команда й операційні рішення мають працювати узгоджено.',
          'Програми напряму поєднують професійні концепції з прикладними завданнями, аналізом рішень і роботою над власними проєктами.',
        ],
      },
      audience: {
        heading: 'Для кого цей напрям',
        items: [
          'підприємці та засновники проєктів',
          'менеджери й керівники команд',
          'експерти, які створюють або масштабують власні продукти',
          'фахівці, які переходять до управлінської відповідальності',
          'професіонали, яким потрібно систематизувати бізнес-знання',
        ],
      },
      development: {
        heading: 'Що ви розвиваєте',
        items: [
          'стратегічне й системне мислення',
          'здатність оцінювати бізнес-рішення та їхні наслідки',
          'розуміння логіки продукту, ринку й цінності для клієнта',
          'навички роботи з процесами, фінансами, маркетингом і продажами',
          'підходи до управління командами, змінами та розвитком проєктів',
        ],
      },
      programmes: {
        heading: 'Програми напряму',
        intro: 'Оберіть програму відповідно до професійної мети, бажаного формату та результату навчання.',
        emptyHeading: 'Нові програми напряму готуються до публікації',
        emptyBody: 'Поверніться до каталогу пізніше, щоб побачити нові опубліковані програми.',
        items: [
          {
            title: 'AI Production',
            href: '/ua/programmes/ai-production',
            description:
              'Шестимісячна Mini-MBA програма про створення, запуск і масштабування експертних та освітніх продуктів із використанням маркетингу, продажів, управління й AI.',
            status: 'Набір відкрито',
            facts: '360 годин / 12 ECTS · 6 місяців · українська',
            cta: 'Переглянути програму',
          },
        ],
      },
      closing: {
        heading: 'Знайдіть програму для наступного професійного кроку',
        body: 'Перегляньте доступні програми Business & Management та оберіть формат, який відповідає вашим цілям.',
        cta: { label: 'Переглянути програми', href: '#programmes-in-this-area' },
      },
      footer: homeCopy.ua.footer,
    },
    'technology-innovation': {
      homeHref: '/ua',
      navLabel: 'Основна навігація',
      localeLabel: 'Мова',
      nav: ukrainianNav,
      localeLinks: [
        { locale: 'en', label: 'EN', href: '/programmes/technology-innovation' },
        { locale: 'ua', label: 'UA', href: '/ua/programmes/technology-innovation' },
        { locale: 'cz', label: 'CZ', href: '/cz/programmes/technology-innovation' },
      ],
      kind: 'Programme Area',
      hero: {
        eyebrow: 'Programme Area',
        title: 'Technology & Innovation',
        lead: 'Технології створюють цінність тоді, коли ми розуміємо, як їх застосувати.',
        supportingCopy:
          'Напрям об’єднує програми про нові технології, інноваційні ринки та індустрії, що формуються. Учасники вивчають не лише окремі інструменти, а й логіку технологічних рішень, бізнес-моделей і професійних можливостей.',
        primaryCta: { label: 'Переглянути програми', href: '#programmes-in-this-area' },
      },
      about: {
        heading: 'Про напрям',
        paragraphs: [
          'Technology & Innovation допомагає орієнтуватися у середовищі, де технології швидко змінюють ринки, професії та способи створення продуктів. Програми напряму поєднують технологічний контекст із бізнесом, економікою, управлінням і міжнародною співпрацею.',
          'Мета напряму — дати достатню основу, щоб аналізувати нові технології, ставити правильні запитання та приймати рішення з урахуванням їхніх можливостей, обмежень і практичного контексту.',
        ],
      },
      audience: {
        heading: 'Для кого цей напрям',
        items: [
          'фахівці у технологічних і цифрових сферах',
          'менеджери та підприємці, які працюють із технологічними продуктами',
          'професіонали з інших галузей, яким потрібно розуміти сучасні технології',
          'учасники команд, що розробляють або впроваджують інноваційні рішення',
          'ті, хто планує професійний розвиток у нових індустріях',
        ],
      },
      development: {
        heading: 'Що ви розвиваєте',
        items: [
          'розуміння логіки технологічних та інноваційних рішень',
          'здатність оцінювати нові ринки й можливості',
          'навички прийняття рішень із технологічним контекстом',
          'розуміння взаємозв’язку технологій, економіки та бізнес-моделей',
          'готовність працювати з міждисциплінарними продуктами й командами',
        ],
      },
      programmes: {
        heading: 'Програми напряму',
        intro:
          'Досліджуйте технології та індустрії через програми, що поєднують професійний контекст, прикладні знання й актуальні ринкові процеси.',
        emptyHeading: 'Нові програми напряму готуються до публікації',
        emptyBody: 'Поверніться до каталогу пізніше, щоб побачити нові опубліковані програми.',
        items: [
          {
            title: 'Space Business',
            href: '/ua/programmes/space-business',
            description:
              'Дистанційна сертифікатна програма про космічний ринок, технології, стартапи, економіку, право та міжнародну співпрацю.',
            status: 'Постійний набір',
            cta: 'Переглянути програму',
          },
        ],
      },
      closing: {
        heading: 'Досліджуйте можливості нових індустрій',
        body: 'Перегляньте програми Technology & Innovation і знайдіть напрям для наступного професійного розвитку.',
        cta: { label: 'Переглянути програми', href: '#programmes-in-this-area' },
      },
      footer: homeCopy.ua.footer,
    },
    'psychology-human': {
      homeHref: '/ua',
      navLabel: 'Основна навігація',
      localeLabel: 'Мова',
      nav: ukrainianNav,
      localeLinks: [
        { locale: 'en', label: 'EN', href: '/programmes/psychology-human' },
        { locale: 'ua', label: 'UA', href: '/ua/programmes/psychology-human' },
        { locale: 'cz', label: 'CZ', href: '/cz/programmes/psychology-human' },
      ],
      kind: 'Programme Area',
      hero: {
        eyebrow: 'Programme Area',
        title: 'Psychology & Human',
        lead: 'Розуміння людини допомагає діяти уважніше, професійніше й відповідальніше.',
        supportingCopy:
          'Напрям об’єднує програми про психіку, поведінку, розвиток, емоційні стани та саморегуляцію. Навчання допомагає сформувати системну основу, поглибити професійні знання або дослідити окремі підходи в межах чітко визначеної освітньої програми.',
        primaryCta: { label: 'Переглянути програми', href: '#programmes-in-this-area' },
      },
      about: {
        heading: 'Про напрям',
        paragraphs: [
          'Psychology & Human розглядає людину в різних вимірах: від базових психічних процесів і вікового розвитку до поведінкових патернів, внутрішніх станів і здатності до саморегуляції.',
          'Кожна програма має власну аудиторію, зміст, навчальний обсяг і професійні межі. Сторінка напряму не прирівнює завершення окремої програми до отримання професії психолога, психотерапевта або медичного фахівця.',
        ],
      },
      audience: {
        heading: 'Для кого цей напрям',
        items: [
          'ті, хто починає системне знайомство з психологією',
          'психологи та фахівці допоміжних професій, які поглиблюють знання',
          'освітяни й спеціалісти, які працюють із дітьми та родинами',
          'менеджери, консультанти й фахівці, чия робота передбачає взаємодію з людьми',
          'учасники, зацікавлені у саморегуляції та розумінні поведінкових патернів',
        ],
      },
      development: {
        heading: 'Що ви розвиваєте',
        items: [
          'системне розуміння психіки й поведінки',
          'знання про психологічний розвиток у різні вікові періоди',
          'уважність до емоційних станів і поведінкових реакцій',
          'розуміння механізмів саморегуляції та нейропластичності',
          'здатність бачити межі компетентності й відповідально застосовувати знання',
        ],
      },
      programmes: {
        heading: 'Програми напряму',
        intro: 'Оберіть програму за тематикою, навчальним обсягом, форматом і результатом, який відповідає вашому запиту.',
        emptyHeading: 'Нові програми напряму готуються до публікації',
        emptyBody: 'Поверніться до каталогу пізніше, щоб побачити нові опубліковані програми.',
        items: [
          {
            title: 'General Psychology',
            href: '/ua/programmes/general-psychology',
            description:
              'Дистанційна програма професійного підвищення кваліфікації, що формує системну основу знань про психіку, особистість, мотивацію, емоції та пізнавальні процеси.',
            cta: 'Переглянути програму',
          },
          {
            title: 'Child Psychology',
            href: '/ua/programmes/child-psychology',
            description:
              'Дистанційна програма професійного підвищення кваліфікації про психологічний розвиток дитини, вікові особливості та відповідальний психологічний супровід.',
            cta: 'Переглянути програму',
          },
          {
            title: 'Neuroplastic Reconstruction',
            href: '/ua/programmes/neuroplastic-reconstruction',
            description:
              'Програма професійного підвищення кваліфікації з нейропластичності, саморегуляції, поведінкових патернів і методу нейропластичної реконструкції.',
            cta: 'Переглянути програму',
          },
        ],
      },
      closing: {
        heading: 'Оберіть програму для глибшого розуміння людини',
        body: 'Порівняйте програми Psychology & Human за змістом, форматом і результатами навчання.',
        cta: { label: 'Переглянути програми', href: '#programmes-in-this-area' },
      },
      footer: homeCopy.ua.footer,
    },
    'certificate-programme': {
      homeHref: '/ua',
      navLabel: 'Основна навігація',
      localeLabel: 'Мова',
      nav: ukrainianNav,
      localeLinks: [
        { locale: 'en', label: 'EN', href: '/programmes/certificate-programme' },
        { locale: 'ua', label: 'UA', href: '/ua/programmes/certificate-programme' },
        { locale: 'cz', label: 'CZ', href: '/cz/programmes/certificate-programme' },
      ],
      kind: 'Programme Type',
      hero: {
        eyebrow: 'Programme Type',
        title: 'Сертифікатні програми',
        lead: 'Структуроване навчання з визначеним змістом, результатами та документом після виконання умов програми.',
        primaryCta: { label: 'Переглянути програми', href: '#programmes-in-this-area' },
      },
      about: {
        heading: 'Що таке Certificate programme',
        paragraphs: [
          'Certificate programme — це професійна освітня програма з визначеною тематикою, навчальним обсягом, форматом і результатами навчання. Після успішного завершення учасник отримує сертифікат, передбачений умовами конкретної програми.',
          'Тип програми не визначає автоматично кількість ECTS, рівень кваліфікації, емітента або міжнародний статус документа. Ці характеристики зазначаються окремо на сторінці кожної програми.',
        ],
      },
      audience: {
        heading: 'Для кого цей формат',
        items: [
          'фахівці, які хочуть опанувати окрему професійну тему',
          'учасники, яким важливий визначений навчальний обсяг',
          'професіонали, які потребують документа про завершення програми',
          'ті, хто обирає коротший і сфокусований формат замість тривалої академічної програми',
        ],
      },
      development: {
        heading: 'Що порівнювати',
        items: [
          'тематику й результати навчання',
          'тривалість, години та ECTS, якщо вони передбачені',
          'формат і мову навчання',
          'оцінювання та умови завершення',
          'назву, тип і емітента сертифіката',
          'можливість перевірки документа, якщо вона передбачена програмою',
        ],
      },
      programmes: {
        heading: 'Сертифікатні програми',
        intro: 'Перегляньте доступні програми та порівняйте їхню тематику, формат, обсяг і документ після завершення.',
        emptyHeading: 'Програми цього типу готуються до публікації',
        emptyBody: 'Наразі немає опублікованих сертифікатних програм. Перегляньте інші формати навчання або поверніться до каталогу пізніше.',
        items: [
          {
            title: 'Space Business',
            href: '/ua/programmes/space-business',
            description:
              'Дистанційна програма про космічний ринок, технології, стартапи, економіку, право та міжнародну співпрацю. 90 годин, навчання українською й англійською.',
            area: 'Technology & Innovation',
            status: 'Постійний набір',
            document: 'Сертифікат',
            cta: 'Переглянути програму',
          },
        ],
      },
      closing: {
        heading: 'Оберіть сертифікатну програму за професійною метою',
        body: 'Порівняйте зміст, формат і документ кожної програми перед вибором.',
        cta: { label: 'Переглянути програми', href: '#programmes-in-this-area' },
      },
      footer: homeCopy.ua.footer,
    },
    'mini-mba': {
      homeHref: '/ua',
      navLabel: 'Основна навігація',
      localeLabel: 'Мова',
      nav: ukrainianNav,
      localeLinks: [
        { locale: 'en', label: 'EN', href: '/programmes/mini-mba' },
        { locale: 'ua', label: 'UA', href: '/ua/programmes/mini-mba' },
        { locale: 'cz', label: 'CZ', href: '/cz/programmes/mini-mba' },
      ],
      kind: 'Programme Type',
      hero: {
        eyebrow: 'Programme Type',
        title: 'Mini-MBA',
        lead: 'Концентрований професійний формат для системного розвитку бізнес- та управлінських компетентностей.',
        primaryCta: { label: 'Переглянути програми', href: '#programmes-in-this-area' },
      },
      about: {
        heading: 'Що таке Mini-MBA',
        paragraphs: [
          'Mini-MBA — це професійна програма, що в компактнішому форматі об’єднує ключові теми бізнесу й управління. Залежно від конкретної програми вона може охоплювати стратегію, продукт, маркетинг, продажі, фінанси, операційні процеси, команду та лідерство.',
          'Mini-MBA не є академічним ступенем і не замінює повну MBA-програму. Тривалість, навчальний обсяг, оцінювання, документи та можливість подальшого зарахування результатів визначаються умовами конкретної програми.',
        ],
      },
      audience: {
        heading: 'Для кого цей формат',
        items: [
          'підприємці та власники проєктів',
          'менеджери й керівники команд',
          'експерти, які створюють або масштабують власний продукт',
          'фахівці, які переходять до бізнес- чи управлінської ролі',
          'професіонали, яким потрібно систематизувати практичний досвід',
        ],
      },
      development: {
        heading: 'Що розвиває формат',
        items: [
          'системне бачення бізнесу та взаємозв’язку його функцій',
          'здатність обґрунтовувати управлінські рішення',
          'розуміння продукту, ринку та цінності для клієнта',
          'навички роботи з фінансами, процесами й командами',
          'застосування навчальних результатів у власному проєкті',
        ],
      },
      programmes: {
        heading: 'Програми Mini-MBA',
        intro: 'Перегляньте доступні програми та зверніть увагу на їхню спеціалізацію, обсяг, практичний результат і документи.',
        emptyHeading: 'Програми цього типу готуються до публікації',
        emptyBody: 'Наразі немає опублікованих Mini-MBA програм. Перегляньте інші формати навчання або поверніться до каталогу пізніше.',
        items: [
          {
            title: 'AI Production',
            href: '/ua/programmes/ai-production',
            description:
              'Шестимісячна Mini-MBA програма про створення, запуск і масштабування експертних та освітніх продуктів із використанням маркетингу, продажів, управління й AI.',
            area: 'Business & Management',
            status: 'Набір відкрито',
            facts: '360 годин / 12 ECTS · 6 місяців · українська',
            document: 'Університетський сертифікат після 3 місяців і міжнародний диплом Mini-MBA з Diploma Supplement після завершення програми.',
            cta: 'Переглянути програму',
          },
        ],
      },
      closing: {
        heading: 'Перетворюйте досвід на системні управлінські рішення',
        body: 'Оберіть Mini-MBA програму відповідно до бізнес-завдань і професійної траєкторії.',
        cta: { label: 'Переглянути програми', href: '#programmes-in-this-area' },
      },
      footer: homeCopy.ua.footer,
    },
    'professional-development-course': {
      homeHref: '/ua',
      navLabel: 'Основна навігація',
      localeLabel: 'Мова',
      nav: ukrainianNav,
      localeLinks: [
        { locale: 'en', label: 'EN', href: '/programmes/professional-development-course' },
        { locale: 'ua', label: 'UA', href: '/ua/programmes/professional-development-course' },
        { locale: 'cz', label: 'CZ', href: '/cz/programmes/professional-development-course' },
      ],
      kind: 'Programme Type',
      hero: {
        eyebrow: 'Programme Type',
        title: 'Програми професійного підвищення кваліфікації',
        lead: 'Поглиблюйте професійні знання у структурованих програмах із визначеним обсягом, змістом і результатами навчання.',
        primaryCta: { label: 'Переглянути програми', href: '#programmes-in-this-area' },
      },
      about: {
        heading: 'Що таке програма професійного підвищення кваліфікації',
        paragraphs: [
          'Програма професійного підвищення кваліфікації допомагає оновити, розширити або систематизувати знання в конкретній професійній сфері. Кожна програма має власну тематику, аудиторію, навчальний обсяг, формат, оцінювання та умови завершення.',
          'Завершення окремої програми не означає автоматичного здобуття нової професії, академічного ступеня або права на регульовану, медичну чи психотерапевтичну практику. Професійні можливості й межі застосування результатів визначаються змістом програми та правилами відповідної країни або професії.',
        ],
      },
      audience: {
        heading: 'Для кого цей формат',
        items: [
          'фахівці, які поглиблюють знання у своїй сфері',
          'професіонали, яким потрібно систематизувати практичний досвід',
          'учасники, які готуються до подальшого професійного або академічного навчання',
          'спеціалісти суміжних сфер, яким потрібна структурована предметна основа',
          'ті, хто обирає програму з визначеним навчальним обсягом і результатами',
        ],
      },
      development: {
        heading: 'Що порівнювати',
        items: [
          'для кого вона розроблена й які має вступні вимоги',
          'навчальні результати та межі компетентності',
          'тривалість, години та ECTS',
          'формат, мову й режим навчання',
          'оцінювання та умови завершення',
          'документ, його емітента й додаток, якщо він передбачений',
        ],
      },
      programmes: {
        heading: 'Програми професійного підвищення кваліфікації',
        intro: 'Порівняйте тематику, навчальний обсяг, формат і документ кожної програми, щоб обрати відповідну професійну траєкторію.',
        emptyHeading: 'Програми цього типу готуються до публікації',
        emptyBody: 'Наразі немає опублікованих програм професійного підвищення кваліфікації. Перегляньте інші формати або поверніться до каталогу пізніше.',
        items: [
          {
            title: 'General Psychology',
            href: '/ua/programmes/general-psychology',
            description:
              'Дистанційна програма, що формує системну основу знань про психіку, особистість, мотивацію, емоції та пізнавальні процеси.',
            area: 'Psychology & Human',
            status: 'Постійний набір',
            facts: '90 годин / 3 ECTS · Moodle · доступ на 1 рік · українська',
            document: 'Сертифікат про підвищення кваліфікації від Університету імені Альфреда Нобеля.',
            cta: 'Переглянути програму',
          },
          {
            title: 'Child Psychology',
            href: '/ua/programmes/child-psychology',
            description:
              'Дистанційна програма про психологічний розвиток дитини, вікові особливості та відповідальний психологічний супровід.',
            area: 'Psychology & Human',
            status: 'Постійний набір',
            facts: '90 годин / 3 ECTS · Moodle · доступ на 6 місяців · українська',
            document: 'Сертифікат про підвищення кваліфікації від Університету імені Альфреда Нобеля.',
            cta: 'Переглянути програму',
          },
          {
            title: 'Neuroplastic Reconstruction',
            href: '/ua/programmes/neuroplastic-reconstruction',
            description:
              'Програма з нейропластичності, саморегуляції, поведінкових патернів і методу нейропластичної реконструкції.',
            area: 'Psychology & Human',
            status: 'Набір відкрито · старт 5 жовтня',
            facts: '3 місяці · 180 годин / 6 ECTS · українська',
            document: 'Документи та професійний статус залежать від обраного тарифу.',
            cta: 'Переглянути програму',
          },
        ],
      },
      closing: {
        heading: 'Оберіть програму для подальшого професійного розвитку',
        body: 'Порівняйте зміст, обсяг і формат програм та оберіть ту, що відповідає вашим цілям.',
        cta: { label: 'Переглянути програми', href: '#programmes-in-this-area' },
      },
      footer: homeCopy.ua.footer,
    },
  },
  cz: {
    'business-management': {
      homeHref: '/cz',
      navLabel: 'Hlavní navigace',
      localeLabel: 'Jazyk',
      nav: czechNav,
      localeLinks: [
        { locale: 'en', label: 'EN', href: '/programmes/business-management' },
        { locale: 'ua', label: 'UA', href: '/ua/programmes/business-management' },
        { locale: 'cz', label: 'CZ', href: '/cz/programmes/business-management' },
      ],
      kind: 'Programme Area',
      hero: {
        eyebrow: 'Programme Area',
        title: 'Business & Management',
        lead: 'Silné firmy začínají rozhodnutími, která lze vysvětlit a uvést do praxe.',
        supportingCopy:
          'Tato oblast sdružuje programy zaměřené na management, podnikání, vývoj produktů a podnikové systémy. Výuka pomáhá účastníkům pracovat s cíli, zdroji, procesy, týmy a změnami v moderním profesním prostředí.',
        primaryCta: { label: 'Zobrazit programy', href: '#programmes-in-this-area' },
      },
      about: {
        heading: 'O oblasti',
        paragraphs: [
          'Business & Management se zaměřuje na přeměnu nápadů ve strukturované produkty a řiditelné procesy. Účastníci vnímají firmu jako propojený systém, v němž musí společně fungovat strategie, finance, marketing, prodej, lidé a provoz.',
          'Programy v této oblasti propojují profesní koncepty s aplikovanými úkoly, analýzou rozhodnutí a prací na vlastních projektech účastníků.',
        ],
      },
      audience: {
        heading: 'Pro koho je tato oblast',
        items: [
          'podnikatele a zakladatele projektů',
          'manažery a vedoucí týmů',
          'experty, kteří vytvářejí nebo škálují vlastní produkty',
          'specialisty přecházející do manažerské odpovědnosti',
          'profesionály, kteří potřebují systematizovat své znalosti byznysu',
        ],
      },
      development: {
        heading: 'Co rozvíjíte',
        items: [
          'strategické a systémové myšlení',
          'schopnost posuzovat podniková rozhodnutí a jejich důsledky',
          'porozumění produktům, trhům a hodnotě pro zákazníka',
          'dovednosti pro práci s procesy, financemi, marketingem a prodejem',
          'přístupy k řízení týmů, změn a rozvoje projektů',
        ],
      },
      programmes: {
        heading: 'Programy v této oblasti',
        intro: 'Vyberte si program podle profesního cíle, preferovaného formátu a očekávaného výsledku vzdělávání.',
        emptyHeading: 'Nové programy v této oblasti se připravují ke zveřejnění',
        emptyBody: 'Vraťte se do katalogu později a podívejte se na nové zveřejněné programy.',
        items: [
          {
            title: 'AI Production',
            href: '/cz/programmes/ai-production',
            description:
              'Šestiměsíční program Mini-MBA zaměřený na vytváření, uvádění na trh a škálování expertních a vzdělávacích produktů prostřednictvím marketingu, prodeje, managementu a AI.',
            status: 'Přihlášky otevřeny',
            facts: '360 hodin / 12 ECTS · 6 měsíců · ukrajinština',
            cta: 'Zobrazit program',
          },
        ],
      },
      closing: {
        heading: 'Najděte program pro svůj další profesní krok',
        body: 'Prohlédněte si programy Business & Management a vyberte si formát, který odpovídá vašim cílům.',
        cta: { label: 'Zobrazit programy', href: '#programmes-in-this-area' },
      },
      footer: homeCopy.cz.footer,
    },
    'technology-innovation': {
      homeHref: '/cz',
      navLabel: 'Hlavní navigace',
      localeLabel: 'Jazyk',
      nav: czechNav,
      localeLinks: [
        { locale: 'en', label: 'EN', href: '/programmes/technology-innovation' },
        { locale: 'ua', label: 'UA', href: '/ua/programmes/technology-innovation' },
        { locale: 'cz', label: 'CZ', href: '/cz/programmes/technology-innovation' },
      ],
      kind: 'Programme Area',
      hero: {
        eyebrow: 'Programme Area',
        title: 'Technology & Innovation',
        lead: 'Technologie vytváří hodnotu, když rozumíme tomu, jak ji využít.',
        supportingCopy:
          'Tato oblast sdružuje programy zaměřené na nové technologie, inovativní trhy a vznikající odvětví. Účastníci nestudují pouze jednotlivé nástroje, ale také logiku technologických rozhodnutí, obchodních modelů a profesních příležitostí.',
        primaryCta: { label: 'Zobrazit programy', href: '#programmes-in-this-area' },
      },
      about: {
        heading: 'O oblasti',
        paragraphs: [
          'Technology & Innovation pomáhá účastníkům orientovat se v prostředí, kde technologie rychle mění trhy, profese a vývoj produktů. Programy propojují technologický kontext s byznysem, ekonomikou, managementem a mezinárodní spoluprací.',
          'Cílem je vytvořit základ pro analýzu nových technologií, kladení správných otázek a rozhodování s porozuměním jejich možnostem, omezením a praktickému kontextu.',
        ],
      },
      audience: {
        heading: 'Pro koho je tato oblast',
        items: [
          'specialisty v technologických a digitálních oborech',
          'manažery a podnikatele pracující s technologickými produkty',
          'profesionály z jiných oborů, kteří potřebují rozumět moderním technologiím',
          'členy týmů vyvíjejících nebo zavádějících inovativní řešení',
          'osoby plánující profesní rozvoj v nových odvětvích',
        ],
      },
      development: {
        heading: 'Co rozvíjíte',
        items: [
          'porozumění technologickému a inovačnímu rozhodování',
          'schopnost posuzovat nové trhy a příležitosti',
          'rozhodovací dovednosti založené na technologickém kontextu',
          'porozumění vztahu mezi technologiemi, ekonomikou a obchodními modely',
          'připravenost pracovat s mezioborovými produkty a týmy',
        ],
      },
      programmes: {
        heading: 'Programy v této oblasti',
        intro: 'Poznávejte technologie a odvětví prostřednictvím programů, které propojují profesní kontext, aplikované znalosti a aktuální tržní procesy.',
        emptyHeading: 'Nové programy v této oblasti se připravují ke zveřejnění',
        emptyBody: 'Vraťte se do katalogu později a podívejte se na nové zveřejněné programy.',
        items: [
          {
            title: 'Space Business',
            href: '/cz/programmes/space-business',
            description:
              'Distanční certifikátový program o vesmírném trhu, technologiích, start-upech, ekonomice, právu a mezinárodní spolupráci.',
            status: 'Průběžný zápis',
            cta: 'Zobrazit program',
          },
        ],
      },
      closing: {
        heading: 'Prozkoumejte příležitosti nových odvětví',
        body: 'Prohlédněte si programy Technology & Innovation a najděte směr pro svou další etapu profesního rozvoje.',
        cta: { label: 'Zobrazit programy', href: '#programmes-in-this-area' },
      },
      footer: homeCopy.cz.footer,
    },
    'psychology-human': {
      homeHref: '/cz',
      navLabel: 'Hlavní navigace',
      localeLabel: 'Jazyk',
      nav: czechNav,
      localeLinks: [
        { locale: 'en', label: 'EN', href: '/programmes/psychology-human' },
        { locale: 'ua', label: 'UA', href: '/ua/programmes/psychology-human' },
        { locale: 'cz', label: 'CZ', href: '/cz/programmes/psychology-human' },
      ],
      kind: 'Programme Area',
      hero: {
        eyebrow: 'Programme Area',
        title: 'Psychology & Human',
        lead: 'Porozumění lidem nám pomáhá jednat ohleduplněji, profesionálněji a odpovědněji.',
        supportingCopy:
          'Tato oblast sdružuje programy o psychice, chování, vývoji, emočních stavech a seberegulaci. Vzdělávání může pomoci vybudovat strukturovaný základ, prohloubit profesní znalosti nebo poznat konkrétní přístup v rámci jasně vymezeného vzdělávacího programu.',
        primaryCta: { label: 'Zobrazit programy', href: '#programmes-in-this-area' },
      },
      about: {
        heading: 'O oblasti',
        paragraphs: [
          'Psychology & Human nahlíží na člověka z různých perspektiv, od základních psychických procesů a vývoje v jednotlivých věkových obdobích až po behaviorální vzorce, vnitřní stavy a schopnost seberegulace.',
          'Každý program má vlastní cílovou skupinu, obsah, rozsah vzdělávání a profesní hranice. Dokončení jednotlivého programu není rovnocenné získání kvalifikace psychologa, psychoterapeuta nebo zdravotnického pracovníka.',
        ],
      },
      audience: {
        heading: 'Pro koho je tato oblast',
        items: [
          'osoby, které začínají se strukturovaným úvodem do psychologie',
          'psychology a profesionály v pomáhajících profesích, kteří si chtějí prohloubit znalosti',
          'pedagogy a specialisty pracující s dětmi a rodinami',
          'manažery, konzultanty a profesionály, jejichž práce zahrnuje práci s lidmi',
          'účastníky se zájmem o seberegulaci a behaviorální vzorce',
        ],
      },
      development: {
        heading: 'Co rozvíjíte',
        items: [
          'strukturované porozumění psychice a chování',
          'znalosti psychologického vývoje v různých etapách života',
          'citlivost k emočním stavům a behaviorálním reakcím',
          'porozumění seberegulaci a neuroplasticitě',
          'schopnost rozpoznat profesní hranice a odpovědně uplatňovat znalosti',
        ],
      },
      programmes: {
        heading: 'Programy v této oblasti',
        intro: 'Vyberte si program podle tématu, rozsahu, formátu a výsledku, který odpovídá vašim potřebám.',
        emptyHeading: 'Nové programy v této oblasti se připravují ke zveřejnění',
        emptyBody: 'Vraťte se do katalogu později a podívejte se na nové zveřejněné programy.',
        items: [
          { title: 'General Psychology', href: '/cz/programmes/general-psychology', description: 'Distanční kurz profesního rozvoje, který vytváří strukturovaný základ v oblasti psychiky, osobnosti, motivace, emocí a kognitivních procesů.', cta: 'Zobrazit program' },
          { title: 'Child Psychology', href: '/cz/programmes/child-psychology', description: 'Distanční kurz profesního rozvoje o vývoji dítěte, věkových specifikách a odpovědné psychologické podpoře.', cta: 'Zobrazit program' },
          { title: 'Neuroplastic Reconstruction', href: '/cz/programmes/neuroplastic-reconstruction', description: 'Kurz profesního rozvoje v oblasti neuroplasticity, seberegulace, behaviorálních vzorců a metody Neuroplastic Reconstruction.', cta: 'Zobrazit program' },
        ],
      },
      closing: {
        heading: 'Vyberte si program pro hlubší porozumění člověku',
        body: 'Porovnejte programy Psychology & Human podle obsahu, formátu a výsledků vzdělávání.',
        cta: { label: 'Zobrazit programy', href: '#programmes-in-this-area' },
      },
      footer: homeCopy.cz.footer,
    },
    'certificate-programme': {
      homeHref: '/cz',
      navLabel: 'Hlavní navigace',
      localeLabel: 'Jazyk',
      nav: czechNav,
      localeLinks: [
        { locale: 'en', label: 'EN', href: '/programmes/certificate-programme' },
        { locale: 'ua', label: 'UA', href: '/ua/programmes/certificate-programme' },
        { locale: 'cz', label: 'CZ', href: '/cz/programmes/certificate-programme' },
      ],
      kind: 'Programme Type',
      hero: {
        eyebrow: 'Programme Type',
        title: 'Certifikátové programy',
        lead: 'Strukturované vzdělávání s vymezeným obsahem, výsledky a dokumentem vydaným po splnění požadavků programu.',
        primaryCta: { label: 'Zobrazit programy', href: '#programmes-in-this-area' },
      },
      about: {
        heading: 'Co je certifikátový program',
        paragraphs: [
          'Certifikátový program je program profesního vzdělávání s vymezeným tématem, rozsahem, formátem a výsledky vzdělávání. Po úspěšném dokončení obdrží účastník certifikát uvedený u konkrétního programu.',
          'Programme Type automaticky neurčuje počet kreditů ECTS, úroveň kvalifikace, vydavatele ani mezinárodní status dokumentu. Tyto vlastnosti jsou uvedeny samostatně na stránce každého programu.',
        ],
      },
      audience: {
        heading: 'Pro koho je tento formát',
        items: [
          'specialisty, kteří chtějí studovat konkrétní profesní téma',
          'účastníky, pro něž je důležitý jasně vymezený rozsah vzdělávání',
          'profesionály, kteří potřebují dokument potvrzující dokončení programu',
          'osoby, které místo dlouhého akademického programu volí kratší zaměřený formát',
        ],
      },
      development: {
        heading: 'Co porovnat',
        items: [
          'téma a výsledky vzdělávání',
          'délku, počet hodin a případné ECTS',
          'formát a jazyk výuky',
          'hodnocení a podmínky dokončení',
          'název, typ a vydavatele certifikátu',
          'ověření dokumentu, pokud je v programu dostupné',
        ],
      },
      programmes: {
        heading: 'Certifikátové programy',
        intro: 'Porovnejte dostupné programy podle tématu, formátu, rozsahu a dokumentu po dokončení.',
        emptyHeading: 'Programy tohoto typu se připravují',
        emptyBody: 'Momentálně nejsou zveřejněny žádné certifikátové programy. Prohlédněte si jiné formáty nebo se do katalogu vraťte později.',
        items: [
          {
            title: 'Space Business',
            href: '/cz/programmes/space-business',
            description:
              'Distanční program o vesmírném trhu, technologiích, start-upech, ekonomice, právu a mezinárodní spolupráci. 90 hodin, výuka v ukrajinštině a angličtině.',
            area: 'Technology & Innovation',
            status: 'Průběžný zápis',
            document: 'Certifikát',
            cta: 'Zobrazit program',
          },
        ],
      },
      closing: {
        heading: 'Vyberte si certifikátový program podle svého profesního cíle',
        body: 'Porovnejte obsah, formát a dokument vydávaný u jednotlivých programů.',
        cta: { label: 'Zobrazit programy', href: '#programmes-in-this-area' },
      },
      footer: homeCopy.cz.footer,
    },
    'mini-mba': {
      homeHref: '/cz',
      navLabel: 'Hlavní navigace',
      localeLabel: 'Jazyk',
      nav: czechNav,
      localeLinks: [
        { locale: 'en', label: 'EN', href: '/programmes/mini-mba' },
        { locale: 'ua', label: 'UA', href: '/ua/programmes/mini-mba' },
        { locale: 'cz', label: 'CZ', href: '/cz/programmes/mini-mba' },
      ],
      kind: 'Programme Type',
      hero: {
        eyebrow: 'Programme Type',
        title: 'Mini-MBA',
        lead: 'Koncentrovaný profesní formát pro rozvoj obchodních a manažerských kompetencí jako propojeného systému.',
        primaryCta: { label: 'Zobrazit programy', href: '#programmes-in-this-area' },
      },
      about: {
        heading: 'Co je Mini-MBA',
        paragraphs: [
          'Mini-MBA je profesní program, který v kompaktnějším formátu propojuje klíčové oblasti byznysu a managementu. Podle konkrétního programu může zahrnovat strategii, produkt, marketing, prodej, finance, provoz, práci s lidmi a vedení.',
          'Mini-MBA není akademický titul a nenahrazuje plný program MBA. Délku, rozsah, hodnocení, dokumenty a případné uznání vzdělávání určuje konkrétní program.',
        ],
      },
      audience: {
        heading: 'Pro koho je tento formát',
        items: [
          'podnikatele a vlastníky projektů',
          'manažery a vedoucí týmů',
          'experty, kteří vytvářejí nebo škálují vlastní produkt',
          'specialisty přecházející do obchodní nebo manažerské role',
          'profesionály, kteří potřebují systematizovat praktické zkušenosti',
        ],
      },
      development: {
        heading: 'Co formát rozvíjí',
        items: [
          'systémový pohled na byznys a jeho propojené funkce',
          'schopnost přijímat odůvodněná manažerská rozhodnutí',
          'porozumění produktům, trhům a hodnotě pro zákazníka',
          'dovednosti pro práci s financemi, procesy a týmy',
          'využití výsledků vzdělávání ve vlastním projektu účastníka',
        ],
      },
      programmes: {
        heading: 'Programy Mini-MBA',
        intro: 'Porovnejte programy podle specializace, rozsahu, praktického výsledku a dokumentů po dokončení.',
        emptyHeading: 'Programy tohoto typu se připravují',
        emptyBody: 'Momentálně nejsou zveřejněny žádné programy Mini-MBA. Prohlédněte si jiné formáty nebo se do katalogu vraťte později.',
        items: [
          {
            title: 'AI Production',
            href: '/cz/programmes/ai-production',
            description:
              'Šestiměsíční program Mini-MBA o vytváření, uvádění na trh a škálování expertních a vzdělávacích produktů prostřednictvím marketingu, prodeje, managementu a AI.',
            area: 'Business & Management',
            status: 'Přihlášky otevřeny',
            facts: '360 hodin / 12 ECTS · 6 měsíců · ukrajinština',
            document: 'Univerzitní certifikát po 3 měsících a mezinárodní diplom Mini-MBA s Diploma Supplement po dokončení celého programu.',
            cta: 'Zobrazit program',
          },
        ],
      },
      closing: {
        heading: 'Proměňte zkušenosti ve strukturovaná manažerská rozhodnutí',
        body: 'Vyberte si program Mini-MBA odpovídající vašim obchodním výzvám a profesnímu směru.',
        cta: { label: 'Zobrazit programy', href: '#programmes-in-this-area' },
      },
      footer: homeCopy.cz.footer,
    },
    'professional-development-course': {
      homeHref: '/cz',
      navLabel: 'Hlavní navigace',
      localeLabel: 'Jazyk',
      nav: czechNav,
      localeLinks: [
        { locale: 'en', label: 'EN', href: '/programmes/professional-development-course' },
        { locale: 'ua', label: 'UA', href: '/ua/programmes/professional-development-course' },
        { locale: 'cz', label: 'CZ', href: '/cz/programmes/professional-development-course' },
      ],
      kind: 'Programme Type',
      hero: {
        eyebrow: 'Programme Type',
        title: 'Kurzy profesního rozvoje',
        lead: 'Prohlubujte své profesní znalosti ve strukturovaných programech s vymezeným rozsahem, obsahem a výsledky vzdělávání.',
        primaryCta: { label: 'Zobrazit programy', href: '#programmes-in-this-area' },
      },
      about: {
        heading: 'Co je kurz profesního rozvoje',
        paragraphs: [
          'Kurz profesního rozvoje pomáhá účastníkům aktualizovat, rozšířit nebo systematizovat znalosti v konkrétním profesním oboru. Každý program má vlastní téma, cílovou skupinu, rozsah, formát, hodnocení a podmínky dokončení.',
          'Dokončení jednotlivého programu automaticky nepřiznává novou profesi, akademický titul ani oprávnění k regulované, zdravotnické nebo psychoterapeutické praxi. Profesní možnosti a hranice využití znalostí závisí na obsahu programu a pravidlech příslušné země či profese.',
        ],
      },
      audience: {
        heading: 'Pro koho je tento formát',
        items: [
          'specialisty prohlubující znalosti ve svém oboru',
          'profesionály, kteří potřebují systematizovat praktické zkušenosti',
          'účastníky připravující se na další profesní nebo akademické vzdělávání',
          'specialisty z příbuzných oborů, kteří potřebují strukturovaný základ',
          'osoby volící program s vymezeným rozsahem a výsledky',
        ],
      },
      development: {
        heading: 'Co porovnat',
        items: [
          'cílovou skupinu a vstupní požadavky',
          'výsledky vzdělávání a hranice kompetencí',
          'délku, počet hodin a ECTS',
          'formát, jazyk a způsob studia',
          'hodnocení a podmínky dokončení',
          'dokument, jeho vydavatele a případný dodatek',
        ],
      },
      programmes: {
        heading: 'Kurzy profesního rozvoje',
        intro: 'Porovnejte téma, rozsah, formát a dokument po dokončení a vyberte si správný profesní směr.',
        emptyHeading: 'Programy tohoto typu se připravují',
        emptyBody: 'Momentálně nejsou zveřejněny žádné kurzy profesního rozvoje. Prohlédněte si jiné formáty nebo se do katalogu vraťte později.',
        items: [
          {
            title: 'General Psychology',
            href: '/cz/programmes/general-psychology',
            description: 'Distanční program vytvářející strukturovaný základ v oblasti psychiky, osobnosti, motivace, emocí a kognitivních procesů.',
            area: 'Psychology & Human',
            status: 'Průběžný zápis',
            facts: '90 hodin / 3 ECTS · Moodle · přístup na 1 rok · ukrajinština',
            document: 'Certifikát profesního rozvoje od Univerzity Alfreda Nobela.',
            cta: 'Zobrazit program',
          },
          {
            title: 'Child Psychology',
            href: '/cz/programmes/child-psychology',
            description: 'Distanční program o vývoji dítěte, věkových specifikách a odpovědné psychologické podpoře.',
            area: 'Psychology & Human',
            status: 'Průběžný zápis',
            facts: '90 hodin / 3 ECTS · Moodle · přístup na 6 měsíců · ukrajinština',
            document: 'Certifikát profesního rozvoje od Univerzity Alfreda Nobela.',
            cta: 'Zobrazit program',
          },
          {
            title: 'Neuroplastic Reconstruction',
            href: '/cz/programmes/neuroplastic-reconstruction',
            description: 'Program v oblasti neuroplasticity, seberegulace, behaviorálních vzorců a metody Neuroplastic Reconstruction.',
            area: 'Psychology & Human',
            status: 'Přihlášky otevřeny · začátek 5. října',
            facts: '3 měsíce · 180 hodin / 6 ECTS · ukrajinština',
            document: 'Dokumenty a profesní status závisí na zvolené cenové variantě.',
            cta: 'Zobrazit program',
          },
        ],
      },
      closing: {
        heading: 'Vyberte si program pro další etapu profesního rozvoje',
        body: 'Porovnejte obsah, rozsah a formát programů a najděte ten, který odpovídá vašim cílům.',
        cta: { label: 'Zobrazit programy', href: '#programmes-in-this-area' },
      },
      footer: homeCopy.cz.footer,
    },
  },
};

export const programmeDetails: Record<Locale, Record<string, ProgrammeDetailCopy>> = {
  en: {
    'ai-production': {
      homeHref: '/',
      navLabel: 'Primary navigation',
      localeLabel: 'Language',
      nav: englishNav,
      localeLinks: [
        { locale: 'en', label: 'EN', href: '/programmes/ai-production' },
        { locale: 'ua', label: 'UA', href: '/ua/programmes/ai-production' },
        { locale: 'cz', label: 'CZ', href: '/cz/programmes/ai-production' },
      ],
      backLink: { label: 'All programmes', href: '/programmes' },
      hero: {
        eyebrow: 'Mini-MBA | Business & Management',
        title: 'AI Production',
        lead: 'Turn expertise into a strong product and a launch into a manageable business system.',
        supportingCopy:
          'The programme combines product strategy, marketing, sales, financial planning, team management and the practical use of AI. Throughout your learning, you progressively build your own system for launching an expert-led or educational product.',
        primaryCta: { label: 'Ask a question', href: '/contact?programme=ai-production' },
      },
      facts: [
        { label: 'Total scope', value: '360 hours, 12 ECTS' },
        { label: 'Type', value: 'Mini-MBA' },
        { label: 'Duration', value: '6 months' },
        { label: 'Format', value: 'Blended distance learning' },
        { label: 'Language of instruction', value: 'Ukrainian' },
        { label: 'Completion', value: 'Applied project and its presentation' },
        { label: 'After 3 months', value: 'University certificate, 180 hours / 6 ECTS' },
        { label: 'After 6 months', value: 'International Mini-MBA diploma with Diploma Supplement' },
      ],
      value: {
        heading: 'From idea to systematic launch',
        body:
          'AI Production helps you see a launch as an end-to-end process. Instead of working with isolated advertising tools, you develop the complete product logic: market research, positioning, offer, programme, communication, sales, financial model, operational preparation and scaling.',
        proofLine: 'The outcome is a practical portfolio of materials that can be adapted to a real expert-led project.',
      },
      audience: {
        heading: 'Who this programme is for',
        items: [
          'producers of online courses and expert-led projects',
          'marketers, social media specialists, content creators and sales professionals',
          'entrepreneurs and business owners creating educational or consulting products',
          'experts planning to bring their knowledge to market systematically',
          'leaders of online schools and educational products',
          'HR, L&D and education managers',
          'consultants and leaders of small teams',
          'professionals moving into digital production',
        ],
      },
      outcomes: {
        heading: 'After completing the programme, you will be able to',
        items: [
          'analyse a niche, audience, competitors and the potential of an expert-led product',
          'develop positioning, a value proposition, an offer and pricing logic',
          'design the product structure, content system and customer journey',
          'build audience-nurturing communication, sales funnels, organic and paid promotion',
          'calculate budgets, break-even points and key launch metrics',
          'use AI for analysis, content, presentations, materials and automation',
          'organise the work of platforms, facilitators, contractors and teams',
          'evaluate launch results, risks and scaling opportunities',
        ],
      },
      curriculum: {
        heading: 'Programme curriculum',
        items: [
          'Strategic methodology for launching an expert-led project',
          'Partnership models, working with experts and commercial arrangements',
          'Product strategy, value proposition and business model',
          'Professional communication and developing an expert blog',
          'Communication strategy for audience nurturing and sales',
          'Sales funnels, financial model and operational infrastructure',
          'Organic promotion and commercial validation',
          'AI tools, automation and no-code prototyping',
          'Advertising campaigns, sales analytics and mini-products',
          'Scaling, leadership and team management',
          'Preparing and presenting the final project',
        ],
      },
      learning: {
        heading: 'Learning built around practice',
        body:
          'The format combines online meetings, video materials, practical assignments, independent work and consultation support. Each module adds a new component to your launch portfolio.',
        platforms: 'The programme may use Moodle, Zoom, Google Meet and other digital learning tools.',
      },
      expert: {
        heading: 'Programme expert',
        name: 'Dmytro Shevchuk',
        bio: 'Practitioner in marketing and educational project production.',
      },
      finalProject: {
        heading: 'Final project',
        body:
          'You prepare a comprehensive launch strategy for an expert-led product: niche and audience analysis, offer, product structure, financial model, communication strategy, sales funnel, AI tools, operational plan, risk map and scaling plan.',
      },
      documents: {
        heading: 'Two learning stages, two documents',
        intro:
          'AI Production combines academic confirmation of learning outcomes with an international Mini-MBA format. The complete pathway takes 6 months and has a total scope of 360 hours, equivalent to 12 ECTS.',
        stages: [
          {
            title: 'After 3 months: university certificate',
            body:
              'You receive a professional development certificate from the University of Alfred Nobel. This document certifies completion of a university-level academic programme and helps confirm professional development to an employer or client.',
            points: [
              'official university document',
              '180 hours of learning, equivalent to 6 ECTS',
              'learning under an educational programme approved by the Academic Council',
              'confirmation of the scope and learning outcomes',
            ],
          },
          {
            title: 'After 6 months: international Mini-MBA diploma',
            body:
              'After completing the full programme, you receive an international Nobel ITBS diploma with a Diploma Supplement.',
            points: [
              'Diploma: Mini-MBA | Professional Development',
              'Diploma Supplement describing the scope of learning and developed competencies',
              'a stated competence level aligned with EQF Level 7',
              'possible credit of hours and learning outcomes toward a full MBA, subject to admissions and academic-recognition rules',
            ],
          },
        ],
        valueTitle: 'The value of combining two documents',
        valuePoints: [
          'academic confirmation of participation, scope and learning outcomes',
          'an internationally understandable presentation of competencies in a Mini-MBA format',
          'the ability to confirm professional development to an employer or client',
          'stronger grounds for moving into expert and management roles',
          'a stronger basis for demonstrating professional value and service pricing',
        ],
      },
      faq: [
        {
          question: 'Do I need production experience?',
          answer:
            'Some experience in marketing, sales, education, consulting, content creation or entrepreneurship will be useful. The programme is also suitable for experts planning to create their first structured product.',
        },
        {
          question: 'Do I need programming skills?',
          answer: 'No. The technical component focuses on the applied use of AI, digital platforms and no-code tools.',
        },
        {
          question: 'Will I create my own product during the programme?',
          answer: 'Yes. The practical assignments build a launch portfolio, and the final project brings it together into a complete strategy.',
        },
        {
          question: 'What is the language of instruction?',
          answer: 'The programme is taught in Ukrainian. The English and Czech website versions present the same Ukrainian-language programme.',
        },
        {
          question: 'What document will I receive?',
          answer:
            'After the first 3 months, you receive a professional development certificate from the University of Alfred Nobel confirming 180 hours / 6 ECTS. After completing the full six-month programme, you receive an international Mini-MBA | Professional Development diploma from Nobel ITBS with a Diploma Supplement.',
        },
      ],
      closing: {
        heading: 'Have an expert idea that is ready to become a product?',
        body: 'Tell us what you are working on and ask about the format and participation in the programme.',
        primaryCta: { label: 'Ask a question', href: '/contact?programme=ai-production' },
      },
      footer: homeCopy.en.footer,
    },
  },
  ua: {
    'ai-production': {
      homeHref: '/ua',
      navLabel: 'Основна навігація',
      localeLabel: 'Мова',
      nav: ukrainianNav,
      localeLinks: [
        { locale: 'en', label: 'EN', href: '/programmes/ai-production' },
        { locale: 'ua', label: 'UA', href: '/ua/programmes/ai-production' },
        { locale: 'cz', label: 'CZ', href: '/cz/programmes/ai-production' },
      ],
      backLink: { label: 'Усі програми', href: '/ua/programmes' },
      hero: {
        eyebrow: 'Mini-MBA | Business & Management',
        title: 'AI Production',
        lead: 'Перетворюйте експертність на сильний продукт, а запуск на керовану бізнес-систему.',
        supportingCopy:
          'Програма поєднує продуктову стратегію, маркетинг, продажі, фінансове планування, управління командою та практичне використання AI. Під час навчання ви послідовно створюєте власну систему запуску експертного або освітнього продукту.',
        primaryCta: { label: 'Поставити запитання', href: '/ua/contact?programme=ai-production' },
      },
      facts: [
        { label: 'Загальний обсяг', value: '360 годин, 12 ECTS' },
        { label: 'Тип', value: 'Mini-MBA' },
        { label: 'Тривалість', value: '6 місяців' },
        { label: 'Формат', value: 'Змішане дистанційне навчання' },
        { label: 'Мова навчання', value: 'Українська' },
        { label: 'Підсумок', value: 'Прикладний проєкт і його захист' },
        { label: 'Після 3 місяців', value: 'Університетський сертифікат, 180 годин / 6 ECTS' },
        { label: 'Після 6 місяців', value: 'Міжнародний диплом Mini-MBA з Diploma Supplement' },
      ],
      value: {
        heading: 'Від ідеї до системного запуску',
        body:
          'AI Production допомагає побачити запуск як цілісний процес. Ви працюєте не з окремими рекламними інструментами, а з повною логікою продукту: дослідження ринку, позиціонування, офер, програма, комунікація, продажі, фінансова модель, операційна підготовка та масштабування.',
        proofLine: 'Результатом стає практичний портфель матеріалів, який можна адаптувати до реального експертного проєкту.',
      },
      audience: {
        heading: 'Для кого ця програма',
        items: [
          'продюсери онлайн-курсів та експертних проєктів',
          'маркетологи, SMM-фахівці, контент-мейкери та спеціалісти з продажів',
          'підприємці й власники бізнесу, які створюють освітні або консультаційні продукти',
          'експерти, які планують системно вивести власні знання на ринок',
          'керівники онлайн-шкіл та освітніх продуктів',
          'HR, L&D та освітні менеджери',
          'консультанти й керівники невеликих команд',
          'фахівці, які переходять у сферу цифрового продюсування',
        ],
      },
      outcomes: {
        heading: 'Після програми ви зможете',
        items: [
          'аналізувати нішу, аудиторію, конкурентів і потенціал експертного продукту',
          'формувати позиціонування, ціннісну пропозицію, офер і тарифну логіку',
          'проєктувати структуру продукту, контентну систему та шлях клієнта',
          'будувати прогрів, воронку продажів, органічне й рекламне просування',
          'розраховувати бюджет, точку беззбитковості та ключові показники запуску',
          'використовувати AI для аналізу, контенту, презентацій, матеріалів і автоматизації',
          'організовувати роботу платформ, кураторів, підрядників і команди',
          'оцінювати результати запуску, ризики та можливості масштабування',
        ],
      },
      curriculum: {
        heading: 'Програма навчання',
        items: [
          'Стратегічна методологія запуску експертного проєкту',
          'Партнерська модель, робота з експертом і комерційні домовленості',
          'Продуктова стратегія, ціннісна пропозиція та бізнес-модель',
          'Професійна комунікація і розвиток експертного блогу',
          'Комунікаційна стратегія прогріву та продажів',
          'Воронки продажів, фінансова модель та операційна інфраструктура',
          'Органічне просування і комерційна валідація',
          'AI-інструменти, автоматизація та no-code прототипування',
          'Рекламні кампанії, аналітика продажів і міні-продукти',
          'Масштабування, лідерство та управління командою',
          'Підготовка і захист підсумкового проєкту',
        ],
      },
      learning: {
        heading: 'Навчання, побудоване навколо практики',
        body:
          'Формат поєднує онлайн-зустрічі, відеоматеріали, практичні завдання, самостійну роботу та консультаційний супровід. Кожен модуль додає новий елемент до вашого портфеля запуску.',
        platforms: 'У програмі можуть використовуватися Moodle, Zoom, Google Meet та інші цифрові інструменти навчання.',
      },
      expert: {
        heading: 'Експерт програми',
        name: 'Дмитро Шевчук',
        bio: 'Експерт-практик з маркетингу та продюсування освітніх проєктів.',
      },
      finalProject: {
        heading: 'Підсумковий проєкт',
        body:
          'Ви готуєте комплексну стратегію запуску експертного продукту: аналіз ніші й аудиторії, офер, структуру продукту, фінансову модель, комунікаційну стратегію, воронку продажів, AI-інструменти, операційний план, карту ризиків і план масштабування.',
      },
      documents: {
        heading: 'Два етапи навчання, два документи',
        intro:
          'AI Production поєднує академічне підтвердження результатів навчання та міжнародний формат Mini-MBA. Повна траєкторія триває 6 місяців і має загальний обсяг 360 годин, або 12 ECTS.',
        stages: [
          {
            title: 'Після 3 місяців: університетський сертифікат',
            body:
              'Ви отримуєте сертифікат про підвищення кваліфікації від Університету імені Альфреда Нобеля. Цей документ засвідчує проходження академічної програми університетського рівня та дає змогу підтвердити кваліфікацію перед роботодавцем або клієнтом.',
            points: [
              'офіційний документ університету',
              '180 годин навчання, або 6 ECTS',
              'навчання за освітньою програмою, затвердженою Вченою радою',
              'підтвердження обсягу та результатів навчання',
            ],
          },
          {
            title: 'Після 6 місяців: міжнародний диплом Mini-MBA',
            body: 'Після завершення повної програми ви отримуєте міжнародний диплом Nobel ITBS із Diploma Supplement.',
            points: [
              'Diploma: Mini-MBA | Professional Development',
              'Diploma Supplement з описом обсягу навчання та сформованих компетентностей',
              'заявлений рівень компетентностей, що відповідає EQF Level 7',
              'можливість зарахування годин і результатів навчання в повну MBA-програму за умови виконання правил вступу та академічного визнання',
            ],
          },
        ],
        valueTitle: 'Що дає поєднання двох документів',
        valuePoints: [
          'академічне підтвердження факту, обсягу та результатів навчання',
          'міжнародно зрозуміле представлення компетентностей у форматі Mini-MBA',
          'можливість підтвердити кваліфікацію перед роботодавцем або клієнтом',
          'аргументи для переходу до експертних і управлінських ролей',
          'сильніша основа для обґрунтування професійної цінності та вартості послуг',
        ],
      },
      faq: [
        {
          question: 'Чи потрібен досвід у продюсуванні?',
          answer:
            'Базовий досвід у маркетингу, продажах, освіті, консалтингу, створенні контенту або підприємництві буде корисним. Програма також підходить експертам, які планують створити свій перший структурований продукт.',
        },
        {
          question: 'Чи потрібно вміти програмувати?',
          answer: 'Ні. Технічний блок зосереджений на прикладному використанні AI, цифрових платформ і no-code інструментів.',
        },
        {
          question: 'Чи створюватиму я власний продукт під час навчання?',
          answer: "Так. Практичні завдання формують портфель запуску, а підсумкова робота об'єднує його в цілісну стратегію.",
        },
        {
          question: 'Якою мовою проходить навчання?',
          answer: 'Навчання проходить українською мовою. Англійська та чеська версії сайту презентують ту саму україномовну програму.',
        },
        {
          question: 'Який документ я отримаю?',
          answer:
            'Після перших 3 місяців ви отримуєте сертифікат про підвищення кваліфікації від Університету імені Альфреда Нобеля за 180 годин / 6 ECTS. Після завершення повної шестимісячної програми ви отримуєте міжнародний диплом Mini-MBA | Professional Development від Nobel ITBS із Diploma Supplement.',
        },
      ],
      closing: {
        heading: 'Маєте експертну ідею, яку час перетворити на продукт?',
        body: 'Розкажіть, над чим ви працюєте, і поставте запитання про формат та участь у програмі.',
        primaryCta: { label: 'Поставити запитання', href: '/ua/contact?programme=ai-production' },
      },
      footer: homeCopy.ua.footer,
    },
  },
  cz: {
    'ai-production': {
      homeHref: '/cz',
      navLabel: 'Hlavní navigace',
      localeLabel: 'Jazyk',
      nav: czechNav,
      localeLinks: [
        { locale: 'en', label: 'EN', href: '/programmes/ai-production' },
        { locale: 'ua', label: 'UA', href: '/ua/programmes/ai-production' },
        { locale: 'cz', label: 'CZ', href: '/cz/programmes/ai-production' },
      ],
      backLink: { label: 'Všechny programy', href: '/cz/programmes' },
      hero: {
        eyebrow: 'Mini-MBA | Business & Management',
        title: 'AI Production',
        lead: 'Proměňte odbornost v silný produkt a uvedení na trh v řiditelný obchodní systém.',
        supportingCopy:
          'Program propojuje produktovou strategii, marketing, prodej, finanční plánování, řízení týmu a praktické využití AI. Během studia postupně vytváříte vlastní systém pro uvedení expertního nebo vzdělávacího produktu na trh.',
        primaryCta: { label: 'Položit dotaz', href: '/cz/contact?programme=ai-production' },
      },
      facts: [
        { label: 'Celkový rozsah', value: '360 hodin, 12 ECTS' },
        { label: 'Typ', value: 'Mini-MBA' },
        { label: 'Délka', value: '6 měsíců' },
        { label: 'Formát', value: 'Kombinovaná distanční výuka' },
        { label: 'Jazyk výuky', value: 'Ukrajinština' },
        { label: 'Dokončení', value: 'Praktický projekt a jeho obhajoba' },
        { label: 'Po 3 měsících', value: 'Univerzitní certifikát, 180 hodin / 6 ECTS' },
        { label: 'Po 6 měsících', value: 'Mezinárodní diplom Mini-MBA s Diploma Supplement' },
      ],
      value: {
        heading: 'Od nápadu k systematickému uvedení na trh',
        body:
          'AI Production pomáhá vnímat launch jako ucelený proces: průzkum trhu, positioning, nabídku, program, komunikaci, prodej, finanční model, provozní přípravu a škálování.',
        proofLine: 'Výsledkem je praktické portfolio materiálů využitelné pro skutečný expertní projekt.',
      },
      audience: {
        heading: 'Pro koho je program určen',
        items: [
          'producentům online kurzů a expertních projektů',
          'marketérům, specialistům na sociální sítě, tvůrcům obsahu a prodejcům',
          'podnikatelům vytvářejícím vzdělávací nebo poradenské produkty',
          'expertům plánujícím systematicky uvést své znalosti na trh',
          'vedoucím online škol a vzdělávacích produktů',
          'HR, L&D a vzdělávacím manažerům',
          'konzultantům a vedoucím menších týmů',
          'specialistům přecházejícím do digitální produkce',
        ],
      },
      outcomes: {
        heading: 'Po dokončení programu budete umět',
        items: [
          'analyzovat niku, publikum, konkurenci a potenciál produktu',
          'vytvořit positioning, hodnotovou nabídku, offer a cenovou logiku',
          'navrhnout produkt, obsahový systém a zákaznickou cestu',
          'budovat komunikační rozehřátí publika, prodejní funnel a propagaci',
          'počítat rozpočet, bod zvratu a klíčové metriky',
          'používat AI pro analýzu, obsah, prezentace a automatizaci',
          'organizovat platformy, tutory, dodavatele a tým',
          'hodnotit výsledky, rizika a možnosti škálování',
        ],
      },
      curriculum: {
        heading: 'Studijní program',
        items: [
          'Strategická metodologie uvedení expertního projektu na trh',
          'Partnerský model, práce s expertem a obchodní dohody',
          'Produktová strategie, hodnotová nabídka a obchodní model',
          'Profesní komunikace a rozvoj expertního blogu',
          'Komunikační strategie pro publikum a prodej',
          'Prodejní funnely, finanční model a provozní infrastruktura',
          'Organická propagace a komerční validace',
          'AI nástroje, automatizace a no-code prototypování',
          'Reklamní kampaně, analytika prodeje a mini-produkty',
          'Škálování, leadership a řízení týmu',
          'Příprava a obhajoba závěrečného projektu',
        ],
      },
      learning: {
        heading: 'Výuka postavená na praxi',
        body:
          'Formát kombinuje online setkání, videomateriály, praktické úkoly, samostatnou práci a konzultační podporu. Každý modul doplňuje další část portfolia pro uvedení produktu na trh.',
        platforms: 'Program může využívat Moodle, Zoom, Google Meet a další digitální nástroje.',
      },
      expert: {
        heading: 'Expert programu',
        name: 'Dmytro Shevchuk',
        bio: 'Praktický odborník na marketing a produkci vzdělávacích projektů.',
      },
      finalProject: {
        heading: 'Závěrečný projekt',
        body:
          'Připravíte komplexní strategii uvedení expertního produktu na trh: analýzu niky a publika, nabídku, strukturu produktu, finanční model, komunikaci, prodejní funnel, AI nástroje, provozní plán, mapu rizik a plán škálování.',
      },
      documents: {
        heading: 'Dvě etapy studia, dva dokumenty',
        intro: 'Úplná cesta trvá 6 měsíců a má rozsah 360 hodin / 12 ECTS.',
        stages: [
          {
            title: 'Po 3 měsících: univerzitní certifikát',
            body:
              'Získáte certifikát profesního rozvoje od Univerzity Alfreda Nobela: oficiální univerzitní dokument, studium podle programu schváleného akademickou radou a potvrzení rozsahu a výsledků vzdělávání.',
            points: ['oficiální univerzitní dokument', '180 hodin / 6 ECTS', 'potvrzení rozsahu a výsledků vzdělávání'],
          },
          {
            title: 'Po 6 měsících: mezinárodní diplom Mini-MBA',
            body: 'Získáte Nobel ITBS Diploma: Mini-MBA | Professional Development, Diploma Supplement a deklarovanou úroveň kompetencí odpovídající EQF Level 7.',
            points: [
              'Diploma: Mini-MBA | Professional Development',
              'Diploma Supplement',
              'kompetence odpovídající EQF Level 7',
              'možnost uznání hodin a výsledků v plném MBA za podmínek přijetí a akademického uznání',
            ],
          },
        ],
        valueTitle: 'Hodnota kombinace dokumentů',
        valuePoints: [
          'akademické potvrzení účasti, rozsahu a výsledků',
          'mezinárodně srozumitelná prezentace kompetencí Mini-MBA',
          'doložení profesního rozvoje zaměstnavateli nebo klientovi',
          'silnější základ pro expertní a manažerské role a profesní positioning',
        ],
      },
      faq: [
        {
          question: 'Potřebuji zkušenosti s produkcí?',
          answer:
            'Základní zkušenost s marketingem, prodejem, vzděláváním, poradenstvím, obsahem nebo podnikáním je užitečná, program je však vhodný i pro experty tvořící první strukturovaný produkt.',
        },
        { question: 'Potřebuji umět programovat?', answer: 'Ne. Technická část se soustředí na praktické využití AI, digitálních platforem a no-code nástrojů.' },
        {
          question: 'Budu během studia vytvářet vlastní produkt?',
          answer: 'Ano. Praktické úkoly vytvářejí portfolio a závěrečný projekt je propojí do ucelené strategie.',
        },
        {
          question: 'V jakém jazyce probíhá výuka?',
          answer: 'V ukrajinštině. Anglická a česká verze webu představují stejný ukrajinsky vyučovaný program.',
        },
        {
          question: 'Jaké dokumenty získám?',
          answer:
            'Po 3 měsících certifikát Univerzity Alfreda Nobela na 180 hodin / 6 ECTS; po 6 měsících mezinárodní diplom Mini-MBA | Professional Development od Nobel ITBS s Diploma Supplement.',
        },
      ],
      closing: {
        heading: 'Máte expertní nápad, který je čas proměnit v produkt?',
        body: 'Řekněte nám, na čem pracujete, a zeptejte se na formát a účast.',
        primaryCta: { label: 'Položit dotaz', href: '/cz/contact?programme=ai-production' },
      },
      footer: homeCopy.cz.footer,
    },
  },
};
