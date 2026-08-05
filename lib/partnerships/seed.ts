import type { ContentLocale } from '@/lib/content/localization';
import type { PartnershipsPageContent } from './types';

const partnershipCopy: Record<ContentLocale, Omit<PartnershipsPageContent, 'locale'>> = {
  en: {
    seo: {
      title: 'Nobel ITBS Partnerships | Education and Expertise',
      description: 'Nobel ITBS partnership models for educational organisations, online schools, experts and authors of professional programmes.',
      ogTitle: 'Nobel ITBS Partnerships',
      ogDescription: 'Bringing together educational expertise, original programmes and infrastructure to create clear professional outcomes.',
    },
    hero: {
      eyebrow: 'Partnerships',
      title: 'Partnerships that strengthen professional education',
      lead: 'We collaborate with organisations and experts who create meaningful programmes and take responsibility for learning outcomes.',
      supportingCopy: 'A partnership may include programme development or presentation, expert participation, education infrastructure, documents, registration and verification. Roles and responsibilities are defined separately for each project.',
      primaryCta: 'Propose a partnership',
      fallbackCta: 'Contact us',
    },
    principles: {
      heading: 'What responsible partnership means',
      items: [
        'Clear roles and responsibilities for all parties',
        'Transparent authorship and appropriate expert presentation',
        'Verified content and accurate public claims',
        'Defined learning outcomes and completion requirements',
        'A separate document model for each programme',
        'Respect for intellectual property, learner data and professional boundaries',
      ],
    },
    models: {
      heading: 'Partnership models',
      items: [
        { title: 'Programme Partnership', body: 'For organisations, online schools and methodology owners who want to jointly structure, present or deliver a professional programme.' },
        { title: 'Expert Partnership', body: 'For practitioners, lecturers and authors who contribute to content development, teaching, assessment or professional expertise.' },
        { title: 'Infrastructure Partnership', body: 'For educational projects that need a document and supplement model, registration and online verification of learning outcomes.' },
        { title: 'Distribution And Promotion Partnership', body: 'For organisations with an agreed role in presenting or distributing specific programmes. Communications must accurately identify the programme owner, provider and participants.' },
      ],
    },
    academic: {
      heading: 'Exclusive academic partnership',
      body: "Alfred Nobel University is the exclusive academic partner of Nobel ITBS. The University's participation and the type of university document are determined separately for each programme and do not automatically extend to all partner projects.",
    },
    partners: {
      heading: 'Partner organisations',
      intro: 'These are organisations whose role in specific programmes or projects has been approved for publication.',
    },
    experts: {
      heading: 'Experts and programme authors',
      intro: 'Meet the professionals who create content, teach or provide professional expertise within specific programmes.',
    },
    boundaries: {
      heading: 'Clear partnership boundaries',
      items: [
        'Partner and expert pages are not created in Release 1',
        'A logo is not proof of accreditation or universal endorsement',
        'Partner participation is stated only for the relevant programme or project',
        'Partners never appear in public credential verification data',
        'Cooperation does not automatically create an academic partnership or a right to issue university documents',
      ],
    },
    closing: {
      heading: 'Have a programme, expertise or partnership idea?',
      copy: 'Tell us about your role, project and expected cooperation model. We will consider how it may fit the direction of Nobel ITBS.',
    },
  },
  ua: {
    seo: {
      title: 'Партнерства Nobel ITBS | Освіта та експертиза',
      description: 'Моделі партнерства Nobel ITBS для освітніх організацій, онлайн-шкіл, експертів і авторів професійних програм.',
      ogTitle: 'Партнерства Nobel ITBS',
      ogDescription: 'Об’єднуємо освітню експертизу, авторські програми та інфраструктуру для створення зрозумілих професійних результатів.',
    },
    hero: {
      eyebrow: 'Partnerships',
      title: 'Партнерства, що підсилюють професійну освіту',
      lead: 'Ми співпрацюємо з організаціями та експертами, які створюють змістовні програми й відповідально ставляться до результатів навчання.',
      supportingCopy: 'Партнерство може охоплювати розробку або представлення програми, експертну участь, освітню інфраструктуру, документи, реєстрацію та верифікацію. Ролі й відповідальність визначаються окремо для кожного проєкту.',
      primaryCta: 'Запропонувати партнерство',
      fallbackCta: 'Написати нам',
    },
    principles: {
      heading: 'Що означає відповідальне партнерство',
      items: ['Чіткі ролі та відповідальність сторін', 'Прозоре авторство й належне представлення експертів', 'Перевірений зміст і коректні публічні твердження', 'Визначені результати навчання й умови завершення', 'Окрема модель документів для кожної програми', 'Повага до авторських прав, даних слухачів і професійних меж'],
    },
    models: {
      heading: 'Моделі партнерства',
      items: [
        { title: 'Програмне партнерство', body: 'Для організацій, онлайн-шкіл і власників методик, які хочуть спільно структурувати, представити або реалізувати професійну програму.' },
        { title: 'Експертне партнерство', body: 'Для практиків, викладачів і авторів, які долучаються до розробки змісту, викладання, оцінювання або професійної експертизи.' },
        { title: 'Інфраструктурне партнерство', body: 'Для освітніх проєктів, яким потрібна модель документів і додатків, реєстрація та онлайн-верифікація результатів навчання.' },
        { title: 'Партнерство з дистрибуції та просування', body: 'Для організацій із погодженою роллю у представленні або поширенні конкретних програм. Комунікація має точно відображати власника, провайдера та учасників програми.' },
      ],
    },
    academic: { heading: 'Ексклюзивне академічне партнерство', body: 'Університет імені Альфреда Нобеля є ексклюзивним академічним партнером Nobel ITBS. Участь університету й тип університетського документа визначаються окремо для кожної програми та не поширюються автоматично на всі партнерські проєкти.' },
    partners: { heading: 'Організації-партнери', intro: 'Представляємо організації, роль яких у конкретних програмах або проєктах погоджена для публікації.' },
    experts: { heading: 'Експерти та автори програм', intro: 'Знайомтеся з фахівцями, які створюють зміст, викладають або надають професійну експертизу в межах конкретних програм.' },
    boundaries: { heading: 'Чіткі межі партнерства', items: ['Окремі сторінки партнерів і експертів не створюються у Release 1', 'Логотип не є доказом акредитації або універсальної підтримки', 'Участь партнера вказується лише для відповідної програми або проєкту', 'Партнери ніколи не відображаються у публічних даних верифікації документів', 'Співпраця не створює автоматично академічного партнерства або права видавати університетські документи'] },
    closing: { heading: 'Маєте програму, експертизу або партнерську ідею?', copy: 'Розкажіть про свою роль, проєкт і очікувану модель співпраці. Ми розглянемо, як вона може відповідати напряму Nobel ITBS.' },
  },
  cz: {
    seo: {
      title: 'Partnerství Nobel ITBS | Vzdělávání a expertiza',
      description: 'Modely partnerství Nobel ITBS pro vzdělávací organizace, online školy, experty a autory profesních programů.',
      ogTitle: 'Partnerství Nobel ITBS',
      ogDescription: 'Propojujeme vzdělávací expertizu, autorské programy a infrastrukturu pro vytváření srozumitelných profesních výsledků.',
    },
    hero: {
      eyebrow: 'Partnerships',
      title: 'Partnerství, která posilují profesní vzdělávání',
      lead: 'Spolupracujeme s organizacemi a experty, kteří vytvářejí smysluplné programy a odpovědně přistupují k výsledkům vzdělávání.',
      supportingCopy: 'Partnerství může zahrnovat vývoj nebo prezentaci programu, účast expertů, vzdělávací infrastrukturu, dokumenty, registraci a ověřování. Role a odpovědnost se určují samostatně pro každý projekt.',
      primaryCta: 'Navrhnout partnerství',
      fallbackCta: 'Napsat nám',
    },
    principles: {
      heading: 'Co znamená odpovědné partnerství',
      items: ['Jasné role a odpovědnost stran', 'Transparentní autorství a náležité představení expertů', 'Ověřený obsah a přesná veřejná tvrzení', 'Vymezené výsledky a podmínky dokončení', 'Samostatný model dokumentů pro každý program', 'Respekt k autorským právům, údajům účastníků a profesním hranicím'],
    },
    models: {
      heading: 'Modely partnerství',
      items: [
        { title: 'Programové partnerství', body: 'Pro organizace, online školy a vlastníky metodik, kteří chtějí společně strukturovat, představit nebo realizovat profesní program.' },
        { title: 'Expertní partnerství', body: 'Pro praktiky, lektory a autory zapojené do tvorby obsahu, výuky, hodnocení nebo odborné expertizy.' },
        { title: 'Infrastrukturní partnerství', body: 'Pro vzdělávací projekty potřebující model dokumentů a dodatků, registraci a online ověřování výsledků.' },
        { title: 'Partnerství pro distribuci a propagaci', body: 'Pro organizace s dohodnutou rolí při prezentaci nebo distribuci konkrétních programů. Komunikace musí přesně uvádět vlastníka, poskytovatele a účastníky.' },
      ],
    },
    academic: { heading: 'Exkluzivní akademické partnerství', body: 'Alfred Nobel University je exkluzivním akademickým partnerem Nobel ITBS. Účast univerzity a typ univerzitního dokumentu se určují zvlášť pro každý program a automaticky se nevztahují na všechny partnerské projekty.' },
    partners: { heading: 'Partnerské organizace', intro: 'Představujeme organizace, jejichž role v konkrétních programech nebo projektech byla schválena ke zveřejnění.' },
    experts: { heading: 'Experti a autoři programů', intro: 'Seznamte se s odborníky, kteří vytvářejí obsah, vyučují nebo poskytují profesní expertizu v konkrétních programech.' },
    boundaries: { heading: 'Jasné hranice partnerství', items: ['Samostatné stránky partnerů a expertů nejsou součástí Release 1', 'Logo není důkazem akreditace ani univerzální podpory', 'Účast partnera se uvádí pouze u relevantního programu nebo projektu', 'Partneři se nikdy nezobrazují ve veřejných údajích ověřování dokumentu', 'Spolupráce automaticky nevytváří akademické partnerství ani právo vydávat univerzitní dokumenty'] },
    closing: { heading: 'Máte program, expertizu nebo partnerský nápad?', copy: 'Popište svou roli, projekt a očekávaný model spolupráce. Posoudíme, jak může odpovídat směru Nobel ITBS.' },
  },
};

export function getSeedPartnershipsPage(locale: ContentLocale): PartnershipsPageContent {
  return { locale, ...partnershipCopy[locale] };
}
