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
  hero: {
    eyebrow: string;
    title: string;
    accent: string;
    lead: string;
    cta: NavItem;
  };
  verify: {
    navLabel: string;
    title: string;
    lead: string;
    tabCode: string;
    tabQr: string;
    placeholder: string;
    action: string;
    validTitle: string;
    validText: string;
    fields: Array<{ label: string; value: string }>;
  };
  programmes: {
    eyebrow: string;
    title: string;
    allLabel: string;
    items: Array<{
      index: string;
      title: string;
      text: string;
      count: string;
      href: string;
    }>;
  };
  trust: {
    eyebrow: string;
    title: string;
    lead: string;
    items: Array<{ title: string; text: string }>;
  };
  partners: {
    eyebrow: string;
  };
  organisations: {
    eyebrow: string;
    title: string;
    text: string;
    points: string[];
    cta: NavItem;
  };
  badges: {
    eyebrow: string;
    title: string;
    text: string;
    cta: NavItem;
  };
  certificate: {
    title: string;
    text: string;
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
  { label: 'Verify', href: '/verify' },
  { label: 'About Us', href: '/about' },
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

const englishFooterColumns = [
  {
    title: 'Programmes',
    links: [
      { label: 'Business & Management', href: '/programmes/business-management' },
      { label: 'Psychology & Human', href: '/programmes/psychology-human' },
      { label: 'Technology & Innovation', href: '/programmes/technology-innovation' },
      { label: 'All programmes', href: '/programmes' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'Partnerships', href: '/partnerships' },
      { label: 'For Organisations', href: '/for-organisations' },
    ],
  },
  {
    title: 'Verify',
    links: [{ label: 'Verify a Document', href: '/verify' }],
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
      title: 'Education that moves',
      accent: 'you forward',
      lead: 'Practical programmes. Real impact. Verifiable credentials that open doors around the world.',
      cta: { label: 'View programmes', href: '/programmes' },
    },
    verify: {
      navLabel: 'Verify',
      title: 'Verify in seconds.',
      lead: 'Enter the verification code or scan the QR code on your document to check its authenticity.',
      tabCode: 'By Code',
      tabQr: 'By QR Code',
      placeholder: 'Enter verification code',
      action: 'Verify Document',
      validTitle: 'This document is valid',
      validText: 'The document below is genuine and has been issued by Nobel ITBS.',
      fields: [
        { label: 'Document Type', value: 'Certificate' },
        { label: 'Holder', value: 'John Doe' },
        { label: 'Programme', value: 'AI Production' },
        { label: 'Issue Date', value: '12 May 2026' },
        { label: 'Verification Code', value: 'NITBS-C-2026-000123' },
      ],
    },
    programmes: {
      eyebrow: 'Choose your path',
      title: 'Programmes designed for today’s professionals',
      allLabel: 'View all programmes',
      items: [
        {
          index: '01',
          title: 'Business & Management',
          text: 'Develop leadership, strategy, and practical business capability.',
          count: 'AI Production',
          href: '/programmes/business-management',
        },
        {
          index: '02',
          title: 'Psychology & Human',
          text: 'Understand people, development, behaviour, and professional change.',
          count: '3 launch programmes',
          href: '/programmes/psychology-human',
        },
        {
          index: '03',
          title: 'Technology & Innovation',
          text: 'Explore innovation, future industries, and technical business contexts.',
          count: 'Space Business',
          href: '/programmes/technology-innovation',
        },
      ],
    },
    trust: {
      eyebrow: 'Why Nobel ITBS',
      title: 'Built for trust, mobility, and practical growth',
      lead: 'A professional education platform should do more than present courses. It should make progress credible, portable, and easy to verify.',
      items: [
        { title: 'Czech based', text: 'Proudly based in the Czech Republic with a global reach.' },
        { title: 'International programmes', text: 'Relevant professional education designed for a global world.' },
        { title: 'Verifiable credentials', text: 'Instantly verifiable for trust and transparency.' },
        { title: 'Flexible learning', text: 'Study with expert support and practical outcomes.' },
      ],
    },
    partners: {
      eyebrow: 'Our partners',
    },
    organisations: {
      eyebrow: 'For organisations',
      title: 'Education solutions that work for you',
      text: 'Upskill your teams. Strengthen capability. Drive performance.',
      points: ['Tailored programmes', 'Scalable learning', 'Measurable results', 'Recognised credentials'],
      cta: { label: 'Learn more', href: '/for-organisations' },
    },
    badges: {
      eyebrow: 'Digital badges for your achievements',
      title: 'Digital badges for your achievements',
      text: 'Learners receive shareable digital badges and can use them on LinkedIn and other professional platforms.',
      cta: { label: 'See how it works', href: '/verify' },
    },
    certificate: {
      title: 'Ready to advance your career?',
      text: 'Join our international community and take the next step today.',
      cta: { label: 'View programmes', href: '/programmes' },
    },
    footer: {
      text: 'Professional education that empowers you to grow, lead, and make an impact.',
      columns: englishFooterColumns,
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
      title: 'Освіта, що рухає',
      accent: 'вас уперед',
      lead: 'Практичні програми. Реальний вплив. Верифіковані документи, що відкривають нові можливості.',
      cta: { label: 'Переглянути програми', href: '/ua/programmes' },
    },
    verify: {
      navLabel: 'Перевірити',
      title: 'Перевірка за секунди.',
      lead: 'Введіть код верифікації або відскануйте QR-код на документі.',
      tabCode: 'За кодом',
      tabQr: 'За QR-кодом',
      placeholder: 'Введіть код верифікації',
      action: 'Перевірити документ',
      validTitle: 'Цей документ дійсний',
      validText: 'Документ є справжнім і виданий Nobel ITBS.',
      fields: [
        { label: 'Тип документа', value: 'Certificate' },
        { label: 'Власник', value: 'John Doe' },
        { label: 'Програма', value: 'AI Production' },
        { label: 'Дата видачі', value: '12 May 2026' },
        { label: 'Код', value: 'NITBS-C-2026-000123' },
      ],
    },
    programmes: {
      eyebrow: 'Оберіть свій шлях',
      title: 'Програми для сучасних професіоналів',
      allLabel: 'Усі програми',
      items: [
        {
          index: '01',
          title: 'Business & Management',
          text: 'Лідерство, стратегія та практичні бізнес-навички.',
          count: 'AI Production',
          href: '/ua/programmes/business-management',
        },
        {
          index: '02',
          title: 'Psychology & Human',
          text: 'Поведінка, розвиток, психологія та професійні зміни.',
          count: '3 launch programmes',
          href: '/ua/programmes/psychology-human',
        },
        {
          index: '03',
          title: 'Technology & Innovation',
          text: 'Інновації, майбутні індустрії та технологічний бізнес.',
          count: 'Space Business',
          href: '/ua/programmes/technology-innovation',
        },
      ],
    },
    trust: {
      eyebrow: 'Чому Nobel ITBS',
      title: 'Основа для довіри, мобільності та практичного зростання',
      lead: 'Професійна освіта має не лише показувати програми. Вона має робити прогрес зрозумілим, підтвердженим і таким, що легко перевірити.',
      items: [
        { title: 'Czech based', text: 'Компанія в Чехії з міжнародною присутністю.' },
        { title: 'International programmes', text: 'Професійна освіта для глобального світу.' },
        { title: 'Verifiable credentials', text: 'Документи можна швидко перевірити онлайн.' },
        { title: 'Flexible learning', text: 'Навчання з експертною підтримкою і практичним фокусом.' },
      ],
    },
    partners: {
      eyebrow: 'Наші партнери',
    },
    organisations: {
      eyebrow: 'Для організацій',
      title: 'Освітні рішення для ваших команд',
      text: 'Розвивайте команди, посилюйте компетенції та отримуйте вимірювані результати.',
      points: ['Індивідуальні програми', 'Масштабоване навчання', 'Вимірювані результати', 'Визнані документи'],
      cta: { label: 'Дізнатися більше', href: '/ua/for-organisations' },
    },
    badges: {
      eyebrow: 'Digital badges',
      title: 'Цифрові бейджі для ваших досягнень',
      text: 'Слухачі отримують бейджі, якими можна ділитися у професійних профілях.',
      cta: { label: 'Як це працює', href: '/ua/verify' },
    },
    certificate: {
      title: 'Готові рухати кар’єру вперед?',
      text: 'Приєднуйтесь до міжнародної спільноти Nobel ITBS.',
      cta: { label: 'Переглянути програми', href: '/ua/programmes' },
    },
    footer: {
      text: 'Професійна освіта, що допомагає зростати, вести й впливати.',
      columns: englishFooterColumns,
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
      accent: 'vpřed',
      lead: 'Praktické programy. Skutečný dopad. Ověřitelné dokumenty, které otevírají nové možnosti.',
      cta: { label: 'Zobrazit programy', href: '/cz/programmes' },
    },
    verify: {
      navLabel: 'Ověřit',
      title: 'Ověření během sekund.',
      lead: 'Zadejte ověřovací kód nebo naskenujte QR kód na dokumentu.',
      tabCode: 'Podle kódu',
      tabQr: 'Podle QR kódu',
      placeholder: 'Zadejte ověřovací kód',
      action: 'Ověřit dokument',
      validTitle: 'Tento dokument je platný',
      validText: 'Dokument je pravý a byl vydán Nobel ITBS.',
      fields: [
        { label: 'Typ dokumentu', value: 'Certificate' },
        { label: 'Držitel', value: 'John Doe' },
        { label: 'Program', value: 'AI Production' },
        { label: 'Datum vydání', value: '12 May 2026' },
        { label: 'Kód', value: 'NITBS-C-2026-000123' },
      ],
    },
    programmes: {
      eyebrow: 'Vyberte si svou cestu',
      title: 'Programy pro dnešní profesionály',
      allLabel: 'Všechny programy',
      items: [
        {
          index: '01',
          title: 'Business & Management',
          text: 'Leadership, strategie a praktické podnikatelské dovednosti.',
          count: 'AI Production',
          href: '/cz/programmes/business-management',
        },
        {
          index: '02',
          title: 'Psychology & Human',
          text: 'Lidé, rozvoj, psychologie a profesní změna.',
          count: '3 launch programmes',
          href: '/cz/programmes/psychology-human',
        },
        {
          index: '03',
          title: 'Technology & Innovation',
          text: 'Inovace, budoucí odvětví a technologický byznys.',
          count: 'Space Business',
          href: '/cz/programmes/technology-innovation',
        },
      ],
    },
    trust: {
      eyebrow: 'Proč Nobel ITBS',
      title: 'Základ pro důvěru, mobilitu a praktický růst',
      lead: 'Profesní vzdělávání má dělat víc než jen prezentovat programy. Má dělat pokrok důvěryhodným, přenositelným a snadno ověřitelným.',
      items: [
        { title: 'Czech based', text: 'Společnost v České republice s mezinárodním dosahem.' },
        { title: 'International programmes', text: 'Profesní vzdělávání pro globální svět.' },
        { title: 'Verifiable credentials', text: 'Dokumenty lze rychle ověřit online.' },
        { title: 'Flexible learning', text: 'Studium s expertní podporou a praktickými výstupy.' },
      ],
    },
    partners: {
      eyebrow: 'Naši partneři',
    },
    organisations: {
      eyebrow: 'Pro organizace',
      title: 'Vzdělávací řešení pro vaše týmy',
      text: 'Rozvíjejte týmy, posilujte kompetence a dosahujte měřitelných výsledků.',
      points: ['Programy na míru', 'Škálovatelné vzdělávání', 'Měřitelné výsledky', 'Uznávané dokumenty'],
      cta: { label: 'Zjistit více', href: '/cz/for-organisations' },
    },
    badges: {
      eyebrow: 'Digital badges',
      title: 'Digitální odznaky pro vaše úspěchy',
      text: 'Účastníci získávají sdílené digitální odznaky pro profesní profily.',
      cta: { label: 'Jak to funguje', href: '/cz/verify' },
    },
    certificate: {
      title: 'Jste připraveni posunout kariéru?',
      text: 'Připojte se k mezinárodní komunitě Nobel ITBS.',
      cta: { label: 'Zobrazit programy', href: '/cz/programmes' },
    },
    footer: {
      text: 'Profesní vzdělávání, které pomáhá růst, vést a mít dopad.',
      columns: englishFooterColumns,
      contact: ['Nobel ITBS s.r.o.', 'Praha, Czech Republic', 'info@nobel-itbs.eu'],
    },
  },
};
