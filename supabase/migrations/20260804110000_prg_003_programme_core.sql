-- PRG-003: Programme Core
-- Five approved launch programmes and complete EN/UA/CZ structured sales content.
-- Generated from approved programme master copy with owner decisions dated 2026-08-04.

create type public.programme_publication_status as enum (
  'draft',
  'published',
  'archived'
);

create type public.programme_format as enum (
  'distance',
  'blended_distance'
);

create type public.programme_application_provider as enum (
  'leeloo',
  'partner_site'
);

comment on type public.programme_publication_status is
  'Publication lifecycle for programme sales pages.';
comment on type public.programme_format is
  'Approved Release 1 delivery formats used by launch programmes.';
comment on type public.programme_application_provider is
  'External application destination managed by Nobel ITBS or a programme partner.';

create table public.programmes (
  id uuid primary key default extensions.gen_random_uuid(),
  area_id uuid not null references public.programme_areas(id) on delete restrict,
  type_id uuid not null references public.programme_types(id) on delete restrict,
  slug text not null unique,
  publication_status public.programme_publication_status not null default 'draft',
  format public.programme_format not null,
  application_provider public.programme_application_provider not null,
  application_url text null,
  enrolment_badge_override text null,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint programmes_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint programmes_application_url_http check (
    application_url is null
    or application_url ~ '^https://'
  )
);

comment on table public.programmes is
  'Stable programme identity, classification, delivery format, and publication state.';
comment on column public.programmes.application_provider is
  'The approved external destination type: Leeloo or a partner-owned website.';
comment on column public.programmes.application_url is
  'Optional external application URL; when null, the public page uses the programme question fallback.';

create table public.programme_translations (
  programme_id uuid not null references public.programmes(id) on delete cascade,
  language_code text not null references public.languages(code) on delete restrict,
  translation_status public.translation_status not null default 'missing',
  title text null,
  summary text null,
  hero_copy text null,
  sections jsonb not null default '{}'::jsonb,
  seo_title text null,
  seo_description text null,
  og_title text null,
  og_description text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (programme_id, language_code),
  constraint programme_translations_sections_object check (
    jsonb_typeof(sections) = 'object'
  ),
  constraint programme_translations_published_complete check (
    translation_status <> 'published'
    or (
      title is not null and btrim(title) <> ''
      and summary is not null and btrim(summary) <> ''
      and hero_copy is not null and btrim(hero_copy) <> ''
      and sections ?& array[
        'eyebrow',
        'primary_cta_label',
        'facts',
        'value',
        'audience',
        'outcomes',
        'curriculum',
        'learning_experience',
        'assessment_document',
        'faq',
        'closing_cta'
      ]
      and seo_title is not null and btrim(seo_title) <> ''
      and seo_description is not null and btrim(seo_description) <> ''
      and og_title is not null and btrim(og_title) <> ''
      and og_description is not null and btrim(og_description) <> ''
    )
  )
);

comment on table public.programme_translations is
  'Localized sales-page copy stored as fixed semantic sections, not arbitrary page-builder blocks.';
comment on column public.programme_translations.sections is
  'Fixed semantic programme sections; pricing and run state are intentionally managed by later modules.';

create index programme_translations_language_status_idx
  on public.programme_translations (language_code, translation_status);
create index programmes_area_publication_idx
  on public.programmes (area_id, publication_status);
create index programmes_type_publication_idx
  on public.programmes (type_id, publication_status);

create trigger programmes_set_updated_at
before update on public.programmes
for each row
execute function internal.set_updated_at();

create trigger programme_translations_set_updated_at
before update on public.programme_translations
for each row
execute function internal.set_updated_at();

insert into public.programmes (
  id,
  area_id,
  type_id,
  slug,
  publication_status,
  format,
  application_provider,
  application_url,
  enrolment_badge_override,
  featured
)
values
  ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000202', 'ai-production', 'published', 'blended_distance', 'partner_site', null, null, false),
  ('00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000203', 'general-psychology', 'published', 'distance', 'leeloo', null, null, false),
  ('00000000-0000-4000-8000-000000000303', '00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000203', 'child-psychology', 'published', 'distance', 'leeloo', null, null, false),
  ('00000000-0000-4000-8000-000000000304', '00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000203', 'neuroplastic-reconstruction', 'published', 'blended_distance', 'partner_site', 'https://school.kholodenko.net/', null, false),
  ('00000000-0000-4000-8000-000000000305', '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000201', 'space-business', 'published', 'distance', 'leeloo', null, null, false);

insert into public.programme_translations (
  programme_id,
  language_code,
  translation_status,
  title,
  summary,
  hero_copy,
  sections,
  seo_title,
  seo_description,
  og_title,
  og_description
)
values
  (
    '00000000-0000-4000-8000-000000000301', 'en', 'published',
    'AI Production',
    'Turn expertise into a strong product and a launch into a manageable business system.',
    'The programme combines product strategy, marketing, sales, financial planning, team management and the practical use of AI. Throughout your learning, you progressively build your own system for launching an expert-led or educational product.',
    $json${
  "eyebrow": "Mini-MBA | Business & Management",
  "primary_cta_label": "Ask a question",
  "facts": {
    "content": "- Total scope: 360 hours, 12 ECTS\n- Type: Mini-MBA\n- Duration: 6 months\n- Format: blended distance learning\n- Language of instruction: Ukrainian\n- Completion: applied project and its presentation\n- After 3 months: university certificate, 180 hours / 6 ECTS\n- After 6 months: international Mini-MBA diploma with Diploma Supplement"
  },
  "value": {
    "heading": "From idea to systematic launch",
    "fields": {
      "body": "AI Production helps you see a launch as an end-to-end process. Instead of working with isolated advertising tools, you develop the complete product logic: market research, positioning, offer, programme, communication, sales, financial model, operational preparation and scaling.",
      "proof_line": "The outcome is a practical portfolio of materials that can be adapted to a real expert-led project."
    }
  },
  "audience": {
    "heading": "Who this programme is for",
    "content": "- producers of online courses and expert-led projects;\n- marketers, social media specialists, content creators and sales professionals;\n- entrepreneurs and business owners creating educational or consulting products;\n- experts planning to bring their knowledge to market systematically;\n- leaders of online schools and educational products;\n- HR, L&D and education managers;\n- consultants and leaders of small teams;\n- professionals moving into digital production."
  },
  "outcomes": {
    "heading": "After completing the programme, you will be able to",
    "content": "- analyse a niche, audience, competitors and the potential of an expert-led product;\n- develop positioning, a value proposition, an offer and pricing logic;\n- design the product structure, content system and customer journey;\n- build audience-nurturing communication, sales funnels, organic and paid promotion;\n- calculate budgets, break-even points and key launch metrics;\n- use AI for analysis, content, presentations, materials and automation;\n- organise the work of platforms, facilitators, contractors and teams;\n- evaluate launch results, risks and scaling opportunities."
  },
  "curriculum": {
    "heading": "Programme curriculum",
    "content": "1. Strategic methodology for launching an expert-led project\n2. Partnership models, working with experts and commercial arrangements\n3. Product strategy, value proposition and business model\n4. Professional communication and developing an expert blog\n5. Communication strategy for audience nurturing and sales\n6. Sales funnels, financial model and operational infrastructure\n7. Organic promotion and commercial validation\n8. AI tools, automation and no-code prototyping\n9. Advertising campaigns, sales analytics and mini-products\n10. Scaling, leadership and team management\n11. Preparing and presenting the final project"
  },
  "learning_experience": {
    "heading": "Learning built around practice",
    "fields": {
      "body": "The format combines online meetings, video materials, practical assignments, independent work and consultation support. Each module adds a new component to your launch portfolio.",
      "platforms": "The programme may use Moodle, Zoom, Google Meet and other digital learning tools."
    }
  },
  "expert": {
    "heading": "Programme expert",
    "fields": {
      "name": "Dmytro Shevchuk",
      "bio": "Practitioner in marketing and educational project production.",
      "asset_status": "Portrait photograph received."
    }
  },
  "final_project": {
    "heading": "Final project",
    "fields": {
      "body": "You prepare a comprehensive launch strategy for an expert-led product: niche and audience analysis, offer, product structure, financial model, communication strategy, sales funnel, AI tools, operational plan, risk map and scaling plan."
    }
  },
  "assessment_document": {
    "heading": "Two learning stages, two documents",
    "fields": {
      "intro": "AI Production combines academic confirmation of learning outcomes with an international Mini-MBA format. The complete pathway takes 6 months and has a total scope of 360 hours, equivalent to 12 ECTS."
    },
    "content": "### After 3 months: university certificate\n\nYou receive a professional development certificate from the University of Alfred Nobel:\n\n- an official university document;\n- 180 hours of learning, equivalent to 6 ECTS;\n- learning under an educational programme approved by the Academic Council;\n- confirmation of the scope and learning outcomes.\n\nThis document certifies the completion of a university-level academic programme and enables you to confirm your professional development to an employer or client.\n\n### After 6 months: international Mini-MBA diploma\n\nAfter completing the full programme, you receive an international Nobel ITBS diploma:\n\n- `Diploma: Mini-MBA | Professional Development`;\n- a Diploma Supplement describing the scope of learning and developed competencies;\n- a stated competence level aligned with EQF Level 7;\n- the possibility of having hours and learning outcomes credited towards a full MBA programme, subject to admissions and academic-recognition rules.\n\nThe international document format makes the learning content easier for employers and the European business community to understand and strengthens the graduate's professional positioning.\n\n### The value of combining two documents\n\n- academic confirmation of participation, scope and learning outcomes;\n- an internationally understandable presentation of competencies in a Mini-MBA format;\n- the ability to confirm professional development to an employer or client;\n- stronger grounds for moving into expert and management roles;\n- a stronger basis for demonstrating professional value and service pricing."
  },
  "faq": {
    "items": [
      {
        "question": "Do I need production experience?",
        "answer": "Some experience in marketing, sales, education, consulting, content creation or entrepreneurship will be useful. The programme is also suitable for experts planning to create their first structured product."
      },
      {
        "question": "Do I need programming skills?",
        "answer": "No. The technical component focuses on the applied use of AI, digital platforms and no-code tools."
      },
      {
        "question": "Will I create my own product during the programme?",
        "answer": "Yes. The practical assignments build a launch portfolio, and the final project brings it together into a complete strategy."
      },
      {
        "question": "What is the language of instruction?",
        "answer": "The programme is taught in Ukrainian. The English and Czech website versions present the same Ukrainian-language programme."
      },
      {
        "question": "What document will I receive?",
        "answer": "After the first 3 months, you receive a professional development certificate from the University of Alfred Nobel confirming 180 hours / 6 ECTS. After completing the full six-month programme, you receive an international `Mini-MBA | Professional Development` diploma from Nobel ITBS with a Diploma Supplement. The complete programme has a total scope of 360 hours / 12 ECTS."
      }
    ]
  },
  "closing_cta": {
    "heading": "Have an expert idea that is ready to become a product?",
    "fields": {
      "body": "Tell us what you are working on and ask about the format and participation in the programme.",
      "primary_cta": "Ask a question"
    }
  }
}$json$::jsonb,
    'AI Production, Mini-MBA | Nobel ITBS',
    'A six-month Mini-MBA programme on creating, launching and scaling expert products with marketing, sales and AI. 360 hours, 12 ECTS.',
    'AI Production — A Mini-MBA for Expert Product Launches',
    'Build a system for creating, launching and scaling a product through marketing, sales, management and AI.'
  ),
  (
    '00000000-0000-4000-8000-000000000301', 'ua', 'published',
    'AI Production',
    'Перетворюйте експертність на сильний продукт, а запуск на керовану бізнес-систему.',
    'Програма поєднує продуктову стратегію, маркетинг, продажі, фінансове планування, управління командою та практичне використання AI. Під час навчання ви послідовно створюєте власну систему запуску експертного або освітнього продукту.',
    $json${
  "eyebrow": "Mini-MBA | Business & Management",
  "primary_cta_label": "Поставити запитання",
  "facts": {
    "content": "- Загальний обсяг: 360 годин, 12 ECTS\n- Тип: Mini-MBA\n- Тривалість: 6 місяців\n- Формат: змішане дистанційне навчання\n- Мова навчання: українська\n- Підсумок: прикладний проєкт і його захист\n- Після 3 місяців: університетський сертифікат, 180 годин / 6 ECTS\n- Після 6 місяців: міжнародний диплом Mini-MBA з Diploma Supplement"
  },
  "value": {
    "heading": "Від ідеї до системного запуску",
    "fields": {
      "body": "AI Production допомагає побачити запуск як цілісний процес. Ви працюєте не з окремими рекламними інструментами, а з повною логікою продукту: дослідження ринку, позиціонування, офер, програма, комунікація, продажі, фінансова модель, операційна підготовка та масштабування.",
      "proof_line": "Результатом стає практичний портфель матеріалів, який можна адаптувати до реального експертного проєкту."
    }
  },
  "audience": {
    "heading": "Для кого ця програма",
    "content": "- продюсери онлайн-курсів та експертних проєктів;\n- маркетологи, SMM-фахівці, контент-мейкери та спеціалісти з продажів;\n- підприємці й власники бізнесу, які створюють освітні або консультаційні продукти;\n- експерти, які планують системно вивести власні знання на ринок;\n- керівники онлайн-шкіл та освітніх продуктів;\n- HR, L&D та освітні менеджери;\n- консультанти й керівники невеликих команд;\n- фахівці, які переходять у сферу цифрового продюсування."
  },
  "outcomes": {
    "heading": "Після програми ви зможете",
    "content": "- аналізувати нішу, аудиторію, конкурентів і потенціал експертного продукту;\n- формувати позиціонування, ціннісну пропозицію, офер і тарифну логіку;\n- проєктувати структуру продукту, контентну систему та шлях клієнта;\n- будувати прогрів, воронку продажів, органічне й рекламне просування;\n- розраховувати бюджет, точку беззбитковості та ключові показники запуску;\n- використовувати AI для аналізу, контенту, презентацій, матеріалів і автоматизації;\n- організовувати роботу платформ, кураторів, підрядників і команди;\n- оцінювати результати запуску, ризики та можливості масштабування."
  },
  "curriculum": {
    "heading": "Програма навчання",
    "content": "1. Стратегічна методологія запуску експертного проєкту\n2. Партнерська модель, робота з експертом і комерційні домовленості\n3. Продуктова стратегія, ціннісна пропозиція та бізнес-модель\n4. Професійна комунікація і розвиток експертного блогу\n5. Комунікаційна стратегія прогріву та продажів\n6. Воронки продажів, фінансова модель та операційна інфраструктура\n7. Органічне просування і комерційна валідація\n8. AI-інструменти, автоматизація та no-code прототипування\n9. Рекламні кампанії, аналітика продажів і міні-продукти\n10. Масштабування, лідерство та управління командою\n11. Підготовка і захист підсумкового проєкту"
  },
  "learning_experience": {
    "heading": "Навчання, побудоване навколо практики",
    "fields": {
      "body": "Формат поєднує онлайн-зустрічі, відеоматеріали, практичні завдання, самостійну роботу та консультаційний супровід. Кожен модуль додає новий елемент до вашого портфеля запуску.",
      "platforms": "У програмі можуть використовуватися Moodle, Zoom, Google Meet та інші цифрові інструменти навчання."
    }
  },
  "expert": {
    "heading": "Експерт програми",
    "fields": {
      "name": "Дмитро Шевчук",
      "bio": "Експерт-практик з маркетингу та продюсування освітніх проєктів.",
      "asset_status": "Портретне фото отримано."
    }
  },
  "final_project": {
    "heading": "Підсумковий проєкт",
    "fields": {
      "body": "Ви готуєте комплексну стратегію запуску експертного продукту: аналіз ніші й аудиторії, офер, структуру продукту, фінансову модель, комунікаційну стратегію, воронку продажів, AI-інструменти, операційний план, карту ризиків і план масштабування."
    }
  },
  "assessment_document": {
    "heading": "Два етапи навчання, два документи",
    "fields": {
      "intro": "AI Production поєднує академічне підтвердження результатів навчання та міжнародний формат Mini-MBA. Повна траєкторія триває 6 місяців і має загальний обсяг 360 годин, або 12 ECTS."
    },
    "content": "### Після 3 місяців: університетський сертифікат\n\nВи отримуєте сертифікат про підвищення кваліфікації від Університету імені Альфреда Нобеля:\n\n- офіційний документ університету;\n- 180 годин навчання, або 6 ECTS;\n- навчання за освітньою програмою, затвердженою Вченою радою;\n- підтвердження обсягу та результатів навчання.\n\nЦей документ засвідчує проходження академічної програми університетського рівня та дає змогу підтвердити кваліфікацію перед роботодавцем або клієнтом.\n\n### Після 6 місяців: міжнародний диплом Mini-MBA\n\nПісля завершення повної програми ви отримуєте міжнародний диплом Nobel ITBS:\n\n- `Diploma: Mini-MBA | Professional Development`;\n- Diploma Supplement з описом обсягу навчання та сформованих компетентностей;\n- заявлений рівень компетентностей, що відповідає EQF Level 7;\n- можливість зарахування годин і результатів навчання в повну MBA-програму за умови виконання правил вступу та академічного визнання.\n\nМіжнародний формат документа робить зміст навчання зрозумілішим для роботодавців і бізнес-середовища в Європі та підсилює професійне позиціонування випускника.\n\n### Що дає поєднання двох документів\n\n- академічне підтвердження факту, обсягу та результатів навчання;\n- міжнародно зрозуміле представлення компетентностей у форматі Mini-MBA;\n- можливість підтвердити кваліфікацію перед роботодавцем або клієнтом;\n- аргументи для переходу до експертних і управлінських ролей;\n- сильніша основа для обґрунтування професійної цінності та вартості послуг."
  },
  "faq": {
    "items": [
      {
        "question": "Чи потрібен досвід у продюсуванні?",
        "answer": "Базовий досвід у маркетингу, продажах, освіті, консалтингу, створенні контенту або підприємництві буде корисним. Програма також підходить експертам, які планують створити свій перший структурований продукт."
      },
      {
        "question": "Чи потрібно вміти програмувати?",
        "answer": "Ні. Технічний блок зосереджений на прикладному використанні AI, цифрових платформ і no-code інструментів."
      },
      {
        "question": "Чи створюватиму я власний продукт під час навчання?",
        "answer": "Так. Практичні завдання формують портфель запуску, а підсумкова робота об'єднує його в цілісну стратегію."
      },
      {
        "question": "Якою мовою проходить навчання?",
        "answer": "Навчання проходить українською мовою. Англійська та чеська версії сайту презентують ту саму україномовну програму."
      },
      {
        "question": "Який документ я отримаю?",
        "answer": "Після перших 3 місяців ви отримуєте сертифікат про підвищення кваліфікації від Університету імені Альфреда Нобеля за 180 годин / 6 ECTS. Після завершення повної шестимісячної програми ви отримуєте міжнародний диплом `Mini-MBA | Professional Development` від Nobel ITBS із Diploma Supplement. Загальний обсяг повної програми становить 360 годин / 12 ECTS."
      }
    ]
  },
  "closing_cta": {
    "heading": "Маєте експертну ідею, яку час перетворити на продукт?",
    "fields": {
      "body": "Розкажіть, над чим ви працюєте, і поставте запитання про формат та участь у програмі.",
      "primary_cta": "Поставити запитання"
    }
  }
}$json$::jsonb,
    'AI Production, Mini-MBA | Nobel ITBS',
    'Шестимісячна програма Mini-MBA про створення, запуск і масштабування експертних продуктів із маркетингом, продажами та AI. 360 годин, 12 ECTS.',
    'AI Production — Mini-MBA для запуску експертних продуктів',
    'Побудуйте систему створення, запуску й масштабування продукту з маркетингом, продажами, управлінням та AI.'
  ),
  (
    '00000000-0000-4000-8000-000000000301', 'cz', 'published',
    'AI Production',
    'Proměňte odbornost v silný produkt a uvedení na trh v řiditelný obchodní systém.',
    'Program propojuje produktovou strategii, marketing, prodej, finanční plánování, řízení týmu a praktické využití AI. Během studia postupně vytváříte vlastní systém pro uvedení expertního nebo vzdělávacího produktu na trh.',
    $json${
  "eyebrow": "Mini-MBA | Business & Management",
  "primary_cta_label": "Položit dotaz",
  "facts": {
    "content": "- Celkový rozsah: 360 hodin, 12 ECTS\n- Typ: Mini-MBA\n- Délka: 6 měsíců\n- Formát: kombinovaná distanční výuka\n- Jazyk výuky: ukrajinština\n- Dokončení: praktický projekt a jeho obhajoba\n- Po 3 měsících: univerzitní certifikát, 180 hodin / 6 ECTS\n- Po 6 měsících: mezinárodní diplom Mini-MBA s Diploma Supplement"
  },
  "value": {
    "heading": "Od nápadu k systematickému uvedení na trh",
    "fields": {
      "body": "AI Production pomáhá vnímat launch jako ucelený proces: průzkum trhu, positioning, nabídku, program, komunikaci, prodej, finanční model, provozní přípravu a škálování.",
      "proof_line": "Výsledkem je praktické portfolio materiálů využitelné pro skutečný expertní projekt."
    }
  },
  "audience": {
    "heading": "Pro koho je program určen",
    "content": "- producentům online kurzů a expertních projektů;\n- marketérům, specialistům na sociální sítě, tvůrcům obsahu a prodejcům;\n- podnikatelům vytvářejícím vzdělávací nebo poradenské produkty;\n- expertům plánujícím systematicky uvést své znalosti na trh;\n- vedoucím online škol a vzdělávacích produktů;\n- HR, L&D a vzdělávacím manažerům;\n- konzultantům a vedoucím menších týmů;\n- specialistům přecházejícím do digitální produkce."
  },
  "outcomes": {
    "heading": "Po dokončení programu budete umět",
    "content": "- analyzovat niku, publikum, konkurenci a potenciál produktu;\n- vytvořit positioning, hodnotovou nabídku, offer a cenovou logiku;\n- navrhnout produkt, obsahový systém a zákaznickou cestu;\n- budovat komunikační rozehřátí publika, prodejní funnel a propagaci;\n- počítat rozpočet, bod zvratu a klíčové metriky;\n- používat AI pro analýzu, obsah, prezentace a automatizaci;\n- organizovat platformy, tutory, dodavatele a tým;\n- hodnotit výsledky, rizika a možnosti škálování."
  },
  "curriculum": {
    "heading": "Studijní program",
    "content": "1. Strategická metodologie uvedení expertního projektu na trh\n2. Partnerský model, práce s expertem a obchodní dohody\n3. Produktová strategie, hodnotová nabídka a obchodní model\n4. Profesní komunikace a rozvoj expertního blogu\n5. Komunikační strategie pro publikum a prodej\n6. Prodejní funnely, finanční model a provozní infrastruktura\n7. Organická propagace a komerční validace\n8. AI nástroje, automatizace a no-code prototypování\n9. Reklamní kampaně, analytika prodeje a mini-produkty\n10. Škálování, leadership a řízení týmu\n11. Příprava a obhajoba závěrečného projektu"
  },
  "learning_experience": {
    "heading": "Výuka postavená na praxi",
    "fields": {
      "body": "Formát kombinuje online setkání, videomateriály, praktické úkoly, samostatnou práci a konzultační podporu. Každý modul doplňuje další část portfolia pro uvedení produktu na trh.",
      "platforms": "Program může využívat Moodle, Zoom, Google Meet a další digitální nástroje."
    }
  },
  "expert": {
    "heading": "Expert programu",
    "fields": {
      "name": "Dmytro Shevchuk",
      "bio": "Praktický odborník na marketing a produkci vzdělávacích projektů.",
      "asset_status": "Portrétní fotografie byla dodána."
    }
  },
  "final_project": {
    "heading": "Závěrečný projekt",
    "fields": {
      "body": "Připravíte komplexní strategii uvedení expertního produktu na trh: analýzu niky a publika, nabídku, strukturu produktu, finanční model, komunikaci, prodejní funnel, AI nástroje, provozní plán, mapu rizik a plán škálování."
    }
  },
  "assessment_document": {
    "heading": "Dvě etapy studia, dva dokumenty",
    "fields": {
      "intro": "Úplná cesta trvá 6 měsíců a má rozsah 360 hodin / 12 ECTS."
    },
    "content": "### Po 3 měsících: univerzitní certifikát\nZískáte certifikát profesního rozvoje od Univerzity Alfreda Nobela: oficiální univerzitní dokument, 180 hodin / 6 ECTS, studium podle programu schváleného akademickou radou a potvrzení rozsahu a výsledků vzdělávání.\n### Po 6 měsících: mezinárodní diplom Mini-MBA\nZískáte Nobel ITBS `Diploma: Mini-MBA | Professional Development`, Diploma Supplement, deklarovanou úroveň kompetencí odpovídající EQF Level 7 a možnost uznání hodin a výsledků v plném MBA za podmínek přijetí a akademického uznání.\n### Hodnota kombinace dokumentů\n- akademické potvrzení účasti, rozsahu a výsledků;\n- mezinárodně srozumitelná prezentace kompetencí Mini-MBA;\n- doložení profesního rozvoje zaměstnavateli nebo klientovi;\n- silnější základ pro expertní a manažerské role a profesní positioning."
  },
  "faq": {
    "items": [
      {
        "question": "Potřebuji zkušenosti s produkcí?",
        "answer": "Základní zkušenost s marketingem, prodejem, vzděláváním, poradenstvím, obsahem nebo podnikáním je užitečná, program je však vhodný i pro experty tvořící první strukturovaný produkt."
      },
      {
        "question": "Potřebuji umět programovat?",
        "answer": "Ne. Technická část se soustředí na praktické využití AI, digitálních platforem a no-code nástrojů."
      },
      {
        "question": "Budu během studia vytvářet vlastní produkt?",
        "answer": "Ano. Praktické úkoly vytvářejí portfolio a závěrečný projekt je propojí do ucelené strategie."
      },
      {
        "question": "V jakém jazyce probíhá výuka?",
        "answer": "V ukrajinštině. Anglická a česká verze webu představují stejný ukrajinsky vyučovaný program."
      },
      {
        "question": "Jaké dokumenty získám?",
        "answer": "Po 3 měsících certifikát Univerzity Alfreda Nobela na 180 hodin / 6 ECTS; po 6 měsících mezinárodní diplom `Mini-MBA | Professional Development` od Nobel ITBS s Diploma Supplement. Celkem 360 hodin / 12 ECTS."
      }
    ]
  },
  "closing_cta": {
    "heading": "Máte expertní nápad, který je čas proměnit v produkt?",
    "fields": {
      "body": "Řekněte nám, na čem pracujete, a zeptejte se na formát a účast.",
      "primary_cta": "Položit dotaz"
    }
  }
}$json$::jsonb,
    'AI Production, Mini-MBA | Nobel ITBS',
    'Šestiměsíční program Mini-MBA o vytváření, uvádění na trh a škálování expertních produktů s marketingem, prodejem a AI. 360 hodin, 12 ECTS.',
    'AI Production — Mini-MBA pro expertní produkty',
    'Vytvořte systém pro tvorbu, uvedení na trh a škálování produktu pomocí marketingu, prodeje, managementu a AI.'
  ),
  (
    '00000000-0000-4000-8000-000000000302', 'en', 'published',
    'General Psychology',
    'Understand the key principles of the mind, behaviour and human inner experience.',
    'The programme builds a comprehensive foundation in psychology, from its subject and methods to personality, activity, motivation, emotions, attention, memory, thinking and speech. It is suitable for starting in psychology, systematising knowledge and preparing for further academic study.',
    $json${
  "eyebrow": "Professional development programme",
  "primary_cta_label": "Ask a question",
  "facts": {
    "content": "- Scope: 90 hours, 3 ECTS\n- Type: professional development programme\n- Status: continuously available programme\n- Format: 100% asynchronous distance learning in Moodle\n- Learning schedule: no Zoom sessions or fixed timetable\n- Access period: 1 year\n- Language of instruction: Ukrainian\n- Materials: video lectures, notes, presentations, tests and practical assignments\n- Completion: programme completion and final test\n- Document: professional development certificate from the University of Alfred Nobel"
  },
  "value": {
    "heading": "A strong foundation for understanding psychology",
    "fields": {
      "body": "The programme helps systematise the fundamental concepts of psychology and reveals the connections between mental processes, states, personality traits and behaviour. It provides a foundation for further professional learning, working with people and critically analysing psychological information."
    }
  },
  "audience": {
    "heading": "Who this programme is for",
    "content": "- psychology students who want to systematise their foundational knowledge;\n- prospective and master's students moving into psychology from other fields;\n- Ukrainians abroad looking for an academic programme taught in Ukrainian;\n- professionals in other fields who need a structured foundation in psychology;\n- anyone interested in studying psychology professionally and on an evidence-informed basis."
  },
  "outcomes": {
    "heading": "After completing the programme, you will be able to",
    "content": "- use the fundamental concepts and terminology of psychology;\n- analyse mental processes, states, traits and behavioural manifestations;\n- explain the relationship between the mind, brain, activity and environment;\n- distinguish key approaches to personality, motivation and emotions;\n- understand the mechanisms of attention, memory, imagination, thinking and speech;\n- critically evaluate psychological information and academic sources;\n- formulate reasoned conclusions in line with ethical principles."
  },
  "curriculum": {
    "heading": "What you will study",
    "content": "1. Psychology as a science: its subject, methods and principal fields\n2. The mind, brain, conscious and unconscious processes\n3. Personality and individual psychological characteristics\n4. Activity, goals, motives and skill formation\n5. Motivation, emotions, stress and volitional regulation\n6. Sensation, perception and attention\n7. Memory and imagination\n8. Thinking, intelligence, language and speech"
  },
  "learning_experience": {
    "heading": "Learn at your own pace",
    "fields": {
      "body": "The programme is delivered entirely online, with no Zoom sessions or fixed timetable. You receive 1 year of Moodle access to video lectures, notes, presentations, tests and practical assignments, and can learn at your own pace from any country."
    }
  },
  "expert": {
    "heading": "Programme lecturer",
    "fields": {
      "name": "Alina Yudina",
      "bio": "Psychologist, Head of Nobel Mental Health, Candidate of Sciences."
    }
  },
  "assessment_document": {
    "heading": "Certificate upon completion",
    "fields": {
      "body": "After completing the programme and passing the final test, you receive a professional development certificate from the University of Alfred Nobel. The document confirms 90 hours of learning, equivalent to 3 ECTS."
    }
  },
  "faq": {
    "items": [
      {
        "question": "Do I need a psychology background to start?",
        "answer": "No. The course is designed as a systematic foundation in general psychology and is suitable for beginners, students who want to fill gaps in foundational topics, and professionals who want to organise their knowledge."
      },
      {
        "question": "Can I learn at my own pace?",
        "answer": "Yes. The programme is continuously available and has no Zoom sessions or fixed timetable. Access to the Moodle materials is provided for 1 year."
      },
      {
        "question": "What is the language of instruction?",
        "answer": "The programme is taught in Ukrainian. The English and Czech website versions present this Ukrainian-language programme."
      },
      {
        "question": "Does the programme qualify me to work as a psychologist?",
        "answer": "No. A standalone programme does not replace a relevant professional education and does not independently grant the right to practise psychology, counselling or psychotherapy."
      },
      {
        "question": "What document will I receive?",
        "answer": "After completing the programme and final test, you receive a professional development certificate from the University of Alfred Nobel confirming 90 hours / 3 ECTS."
      }
    ]
  },
  "closing_cta": {
    "heading": "Start with a systematic understanding of psychology",
    "fields": {
      "body": "Ask us about access, the learning process and participation requirements.",
      "primary_cta": "Ask a question"
    }
  }
}$json$::jsonb,
    'General Psychology | Nobel ITBS',
    'A professional development programme in general psychology. 90 hours, 3 ECTS, distance learning and 1-year Moodle access.',
    'General Psychology — A Structured Foundation in Psychology',
    'Study the mind, personality, motivation, emotions and cognitive processes online at your own pace.'
  ),
  (
    '00000000-0000-4000-8000-000000000302', 'ua', 'published',
    'General Psychology',
    'Зрозумійте ключові закономірності психіки, поведінки та внутрішнього світу людини.',
    'Програма формує цілісну основу психологічних знань: від предмета й методів психології до особистості, діяльності, мотивації, емоцій, уваги, пам''яті, мислення та мовлення. Вона підходить для старту в психології, систематизації знань і підготовки до подальшого академічного навчання.',
    $json${
  "eyebrow": "Програма професійного підвищення кваліфікації",
  "primary_cta_label": "Поставити запитання",
  "facts": {
    "content": "- Обсяг: 90 годин, 3 ECTS\n- Тип: програма професійного підвищення кваліфікації\n- Статус: постійно діюча програма\n- Формат: 100% дистанційне асинхронне навчання в Moodle\n- Навчальний режим: без Zoom і фіксованого розкладу\n- Строк доступу: 1 рік\n- Мова навчання: українська\n- Матеріали: відеолекції, конспекти, презентації, тести та практичні завдання\n- Підсумок: завершення програми та підсумковий тест\n- Документ: сертифікат про підвищення кваліфікації від Університету імені Альфреда Нобеля"
  },
  "value": {
    "heading": "Міцна основа для розуміння психології",
    "fields": {
      "body": "Програма допомагає систематизувати базові поняття психології та побачити зв'язки між психічними процесами, станами, властивостями особистості й поведінкою. Це основа для подальшого професійного навчання, роботи з людьми та усвідомленого аналізу психологічної інформації."
    }
  },
  "audience": {
    "heading": "Кому підійде програма",
    "content": "- студентам психології, які хочуть систематизувати фундаментальні знання;\n- вступникам і магістрантам, які переходять у психологію з інших спеціальностей;\n- українцям за кордоном, які шукають академічну програму українською мовою;\n- фахівцям інших сфер, яким потрібна структурована психологічна база;\n- усім, хто цікавиться психологією та хоче вивчати її професійно й науково обґрунтовано."
  },
  "outcomes": {
    "heading": "Після програми ви зможете",
    "content": "- користуватися базовим понятійним апаратом психології;\n- аналізувати психічні процеси, стани, властивості та поведінкові прояви;\n- пояснювати взаємозв'язок психіки, мозку, діяльності й середовища;\n- розрізняти ключові підходи до особистості, мотивації та емоцій;\n- розуміти механізми уваги, пам'яті, уяви, мислення й мовлення;\n- критично працювати з психологічною інформацією та науковими джерелами;\n- формулювати аргументовані висновки з дотриманням етичних принципів."
  },
  "curriculum": {
    "heading": "Що ви вивчатимете",
    "content": "1. Психологія як наука, її предмет, методи та основні напрями\n2. Психіка, мозок, свідомі й несвідомі процеси\n3. Особистість та індивідуально-психологічні особливості\n4. Діяльність, цілі, мотиви та формування навичок\n5. Мотивація, емоції, стрес і вольова регуляція\n6. Відчуття, сприймання й увага\n7. Пам'ять та уява\n8. Мислення, інтелект, мова і мовлення"
  },
  "learning_experience": {
    "heading": "Навчайтеся у власному темпі",
    "fields": {
      "body": "Програма проходить повністю дистанційно, без Zoom і фіксованого розкладу. Протягом 1 року ви маєте доступ у Moodle до відеолекцій, конспектів, презентацій, тестів і практичних завдань та навчаєтеся у власному темпі з будь-якої країни."
    }
  },
  "expert": {
    "heading": "Викладачка програми",
    "fields": {
      "name": "Аліна Юдіна",
      "bio": "Психологиня, керівниця Клініки психічного здоров'я, кандидат наук."
    }
  },
  "assessment_document": {
    "heading": "Сертифікат після завершення",
    "fields": {
      "body": "Після завершення програми та успішного проходження підсумкового тесту ви отримуєте сертифікат про підвищення кваліфікації від Університету імені Альфреда Нобеля. Документ підтверджує обсяг навчання 90 годин, або 3 ECTS."
    }
  },
  "faq": {
    "items": [
      {
        "question": "Чи потрібна психологічна освіта для початку?",
        "answer": "Ні. Курс побудований як системна основа загальної психології та підходить початківцям, студентам із прогалинами у фундаментальних темах і фахівцям, які хочуть упорядкувати знання."
      },
      {
        "question": "Чи можна навчатися у власному темпі?",
        "answer": "Так. Програма є постійно діючою та проходить без Zoom і розкладу. Доступ до матеріалів у Moodle надається на 1 рік."
      },
      {
        "question": "Якою мовою проходить навчання?",
        "answer": "Українською мовою. Англійська та чеська версії сайту є презентаціями цієї україномовної програми."
      },
      {
        "question": "Чи дає програма право працювати психологом?",
        "answer": "Ні. Окрема програма не замінює профільну освіту та не надає самостійного права на професійну психологічну, консультативну чи психотерапевтичну практику."
      },
      {
        "question": "Який документ видається після навчання?",
        "answer": "Після завершення програми та підсумкового тесту видається сертифікат про підвищення кваліфікації від Університету імені Альфреда Нобеля на 90 годин / 3 ECTS."
      }
    ]
  },
  "closing_cta": {
    "heading": "Почніть із системного розуміння психології",
    "fields": {
      "body": "Поставте запитання про доступ, навчальний процес і вимоги до участі.",
      "primary_cta": "Поставити запитання"
    }
  }
}$json$::jsonb,
    'General Psychology | Nobel ITBS',
    'Програма професійного підвищення кваліфікації із загальної психології. 90 годин, 3 ECTS, дистанційне навчання та доступ у Moodle на 1 рік.',
    'General Psychology — системна основа психологічних знань',
    'Вивчайте психіку, особистість, мотивацію, емоції та когнітивні процеси дистанційно у власному темпі.'
  ),
  (
    '00000000-0000-4000-8000-000000000302', 'cz', 'published',
    'General Psychology',
    'Porozumějte klíčovým zákonitostem psychiky, chování a vnitřního světa člověka.',
    'Program vytváří ucelený základ psychologických znalostí, od předmětu a metod psychologie až po osobnost, činnost, motivaci, emoce, pozornost, paměť, myšlení a řeč. Je vhodný pro začátek studia psychologie, systematizaci znalostí i přípravu na další akademické vzdělávání.',
    $json${
  "eyebrow": "Program profesního rozvoje",
  "primary_cta_label": "Položit dotaz",
  "facts": {
    "content": "- Rozsah: 90 hodin, 3 ECTS\n- Typ: program profesního rozvoje\n- Stav: trvale dostupný program\n- Formát: 100% asynchronní distanční výuka v Moodle\n- Režim: bez Zoomu a pevného rozvrhu\n- Doba přístupu: 1 rok\n- Jazyk výuky: ukrajinština\n- Materiály: videopřednášky, studijní texty, prezentace, testy a praktické úkoly\n- Dokončení: absolvování programu a závěrečný test\n- Dokument: certifikát profesního rozvoje od Univerzity Alfreda Nobela"
  },
  "value": {
    "heading": "Pevný základ pro porozumění psychologii",
    "fields": {
      "body": "Program pomáhá systematizovat základní pojmy psychologie a odhalit souvislosti mezi psychickými procesy, stavy, osobnostními vlastnostmi a chováním. Vytváří základ pro další profesní vzdělávání, práci s lidmi a kritickou analýzu psychologických informací."
    }
  },
  "audience": {
    "heading": "Pro koho je program určen",
    "content": "- studentům psychologie, kteří chtějí systematizovat základní znalosti;\n- uchazečům a studentům magisterského studia přecházejícím k psychologii z jiných oborů;\n- Ukrajincům v zahraničí, kteří hledají akademický program v ukrajinštině;\n- profesionálům z jiných oborů, kteří potřebují strukturovaný psychologický základ;\n- všem, kdo chtějí studovat psychologii profesionálně a na vědecky podloženém základě."
  },
  "outcomes": {
    "heading": "Po dokončení programu budete umět",
    "content": "- používat základní pojmy a terminologii psychologie;\n- analyzovat psychické procesy, stavy, vlastnosti a projevy chování;\n- vysvětlit vztah mezi psychikou, mozkem, činností a prostředím;\n- rozlišovat klíčové přístupy k osobnosti, motivaci a emocím;\n- rozumět mechanismům pozornosti, paměti, představivosti, myšlení a řeči;\n- kriticky pracovat s psychologickými informacemi a odbornými zdroji;\n- formulovat odůvodněné závěry v souladu s etickými principy."
  },
  "curriculum": {
    "heading": "Co budete studovat",
    "content": "1. Psychologie jako věda, její předmět, metody a hlavní směry\n2. Psychika, mozek, vědomé a nevědomé procesy\n3. Osobnost a individuální psychologické charakteristiky\n4. Činnost, cíle, motivy a utváření dovedností\n5. Motivace, emoce, stres a volní regulace\n6. Čití, vnímání a pozornost\n7. Paměť a představivost\n8. Myšlení, inteligence, jazyk a řeč"
  },
  "learning_experience": {
    "heading": "Studujte vlastním tempem",
    "fields": {
      "body": "Program probíhá plně distančně, bez Zoomu a pevného rozvrhu. Po dobu 1 roku máte v Moodle přístup k videopřednáškám, textům, prezentacím, testům a praktickým úkolům a můžete studovat vlastním tempem z kterékoli země."
    }
  },
  "expert": {
    "heading": "Lektorka programu",
    "fields": {
      "name": "Alina Yudina",
      "bio": "Psycholožka, vedoucí Nobel Mental Health, kandidátka věd."
    }
  },
  "assessment_document": {
    "heading": "Certifikát po dokončení",
    "fields": {
      "body": "Po dokončení programu a úspěšném absolvování závěrečného testu získáte certifikát profesního rozvoje od Univerzity Alfreda Nobela. Dokument potvrzuje rozsah 90 hodin, tedy 3 ECTS."
    }
  },
  "faq": {
    "items": [
      {
        "question": "Potřebuji pro začátek psychologické vzdělání?",
        "answer": "Ne. Kurz je vytvořen jako systematický základ obecné psychologie a je vhodný pro začátečníky, studenty s mezerami v základních tématech i profesionály, kteří si chtějí uspořádat znalosti."
      },
      {
        "question": "Mohu studovat vlastním tempem?",
        "answer": "Ano. Program je trvale dostupný, bez Zoomu a pevného rozvrhu. Přístup k materiálům v Moodle je poskytován na 1 rok."
      },
      {
        "question": "V jakém jazyce probíhá výuka?",
        "answer": "V ukrajinštině. Anglická a česká verze webu představují tento program vyučovaný v ukrajinštině."
      },
      {
        "question": "Opravňuje program k práci psychologa?",
        "answer": "Ne. Samostatný program nenahrazuje příslušné odborné vzdělání a sám o sobě nezakládá oprávnění k psychologické, poradenské ani psychoterapeutické praxi."
      },
      {
        "question": "Jaký dokument získám?",
        "answer": "Po dokončení programu a závěrečného testu získáte certifikát profesního rozvoje od Univerzity Alfreda Nobela v rozsahu 90 hodin / 3 ECTS."
      }
    ]
  },
  "closing_cta": {
    "heading": "Začněte systematickým porozuměním psychologii",
    "fields": {
      "body": "Zeptejte se nás na přístup, průběh výuky a podmínky účasti.",
      "primary_cta": "Položit dotaz"
    }
  }
}$json$::jsonb,
    'General Psychology | Nobel ITBS',
    'Program profesního rozvoje v obecné psychologii. 90 hodin, 3 ECTS, distanční výuka a přístup do Moodle na 1 rok.',
    'General Psychology — strukturovaný základ psychologie',
    'Studujte psychiku, osobnost, motivaci, emoce a kognitivní procesy online vlastním tempem.'
  ),
  (
    '00000000-0000-4000-8000-000000000303', 'en', 'published',
    'Child Psychology',
    'Understand child development more deeply to provide professional, ethical and responsible support.',
    'The programme systematically explores psychological development from birth through adolescence, including interaction with children, teenagers and parents. It pays particular attention to developmental transitions, emotional states, assessment tools and the professional boundaries of support.',
    $json${
  "eyebrow": "Professional development programme",
  "primary_cta_label": "Ask a question",
  "facts": {
    "content": "- Scope: 90 hours, 3 ECTS\n- Type: professional development programme\n- Status: continuously available programme\n- Format: 100% asynchronous distance learning in Moodle\n- Learning schedule: no Zoom sessions or fixed timetable\n- Access period: 6 months\n- Materials: video lectures, presentations, notes and tests\n- Practice: no practical classes, placements or client work\n- Language of instruction: Ukrainian\n- Assessment: final test\n- Document: professional development certificate from the University of Alfred Nobel"
  },
  "value": {
    "heading": "From developmental patterns to professional understanding",
    "fields": {
      "body": "Supporting a child requires seeing more than an isolated symptom or difficult behaviour. It means understanding the full developmental context: age, family relationships, leading activity, emotional processes, communication and life circumstances. The programme develops a systematic perspective and helps participants choose professionally grounded approaches to interaction."
    }
  },
  "audience": {
    "heading": "Who this programme is for",
    "content": "- psychologists and practising psychologists;\n- professionals with a bachelor's or master's degree in Psychology;\n- preschool educators, teachers and education professionals;\n- social care and healthcare professionals;\n- other professionals who work with children and want to deepen their knowledge of child psychology."
  },
  "outcomes": {
    "heading": "After completing the programme, you will be able to",
    "content": "- explain the main patterns of psychological development from birth through adolescence;\n- analyse developmental transitions, leading activities and psychological development milestones;\n- better understand the development of communication, cognitive processes and emotional life;\n- assess psychological readiness for school and adaptation characteristics;\n- recognise signs of stress, anxiety and depressive states within the limits of your competence;\n- select appropriate methods of psychological assessment and support;\n- plan counselling work with children, teenagers and parents;\n- collaborate with colleagues in an interdisciplinary team;\n- make decisions that respect professional ethics and legal boundaries."
  },
  "curriculum": {
    "heading": "Five content modules",
    "content": "### 1. Foundations of child psychology\n\nPsychological development, psychological age, the perinatal period, early childhood, attachment, basic trust, developmental transitions and parental control.\n\n### 2. Preschool and primary school age\n\nCommunication, play, school readiness, projective methods, emotional intelligence, childhood fears, behavioural difficulties and the role of parents.\n\n### 3. Adolescence and young adulthood\n\nPersonality development, emotional instability, separation, peer groups, risk-taking behaviour, self-determination and sexuality education.\n\n### 4. Psychological support in crisis situations\n\nStress responses, traumatic events, anxiety and depressive states, sleep disturbances, risk assessment and the professional boundaries of support.\n\n### 5. Counselling children and teenagers\n\nThe family system, counselling interaction, online counselling and age-specific approaches to sensitive topics."
  },
  "learning_experience": {
    "heading": "Distance learning in Moodle",
    "fields": {
      "body": "The programme is delivered entirely online, with no Zoom sessions or fixed timetable. Participants receive 6 months of Moodle access to video lectures, presentations, notes and tests, and can learn at their own pace from any country. The programme does not include practical classes, placements or client work."
    }
  },
  "assessment_document": {
    "heading": "Certificate upon completion",
    "fields": {
      "body": "After completing the programme and successfully passing the final test, the learner receives a professional development certificate from the University of Alfred Nobel. The document confirms 90 hours of learning, equivalent to 3 ECTS."
    }
  },
  "academic_context": {
    "heading": "Academic foundation and development context",
    "fields": {
      "body": "The programme was developed by professionals who combine academic expertise with professional work involving children and teenagers. Its development is based at the Mental Health Clinic of the University of Alfred Nobel. This does not mean that participants undertake practical training or a placement at the Clinic."
    }
  },
  "faq": {
    "items": [
      {
        "question": "Is the programme suitable for people other than psychologists?",
        "answer": "Yes. It is also designed for educators, social care and healthcare professionals, and others who work with children. Participants should apply their knowledge within the boundaries of their education and professional competence."
      },
      {
        "question": "Can I learn at my own pace?",
        "answer": "Yes. This is a continuously available Moodle-based distance programme with no Zoom sessions or fixed timetable. Access to the materials is provided for 6 months."
      },
      {
        "question": "Does the programme include practical training?",
        "answer": "No. This is a theoretical distance-learning programme. It does not include practical classes, placements, training at the Clinic or client work."
      },
      {
        "question": "Does the certificate authorise psychotherapy or medical practice?",
        "answer": "No. The programme supports professional development but does not replace a foundational professional education or extend the learner's lawful scope of practice."
      },
      {
        "question": "What is the language of instruction?",
        "answer": "The programme is taught in Ukrainian. The English and Czech pages present the same Ukrainian-language programme."
      },
      {
        "question": "What document will I receive?",
        "answer": "After completing the programme and final test, you receive a professional development certificate from the University of Alfred Nobel confirming 90 hours / 3 ECTS."
      }
    ]
  },
  "closing_cta": {
    "heading": "Work with children and want to deepen your professional approach?",
    "fields": {
      "body": "Ask us about access, programme content and learning conditions.",
      "primary_cta": "Ask a question"
    }
  }
}$json$::jsonb,
    'Child Psychology | Nobel ITBS',
    'A professional development programme in child psychology covering child development, psychological support and counselling. 90 hours, 3 ECTS.',
    'Child Psychology — Understanding Child Development Professionally',
    'Deepen your knowledge of child and adolescent development, psychological support and responsible professional boundaries.'
  ),
  (
    '00000000-0000-4000-8000-000000000303', 'ua', 'published',
    'Child Psychology',
    'Розумійте розвиток дитини глибше, щоб підтримувати професійно, етично й відповідально.',
    'Програма системно розглядає психологічний розвиток від народження до юнацького віку, взаємодію з дітьми, підлітками та батьками. Окрема увага приділяється віковим кризам, емоційним станам, діагностичним інструментам і межам професійної допомоги.',
    $json${
  "eyebrow": "Програма професійного підвищення кваліфікації",
  "primary_cta_label": "Поставити запитання",
  "facts": {
    "content": "- Обсяг: 90 годин, 3 ECTS\n- Тип: програма професійного підвищення кваліфікації\n- Статус: постійно діюча програма\n- Формат: 100% дистанційне асинхронне навчання в Moodle\n- Навчальний режим: без Zoom і фіксованого розкладу\n- Строк доступу: 6 місяців\n- Матеріали: відеолекції, презентації, конспекти й тести\n- Практика: практичні заняття, стажування та робота з клієнтами не передбачені\n- Мова навчання: українська\n- Атестація: підсумкове тестування\n- Документ: сертифікат про підвищення кваліфікації від Університету імені Альфреда Нобеля"
  },
  "value": {
    "heading": "Від закономірностей розвитку до професійного розуміння",
    "fields": {
      "body": "Щоб допомагати дитині, важливо бачити не окремий симптом або складну поведінку, а весь контекст розвитку: вік, стосунки в сім'ї, провідну діяльність, емоційні процеси, комунікацію та життєві обставини. Програма формує системний погляд і допомагає обирати професійно обґрунтовані способи взаємодії."
    }
  },
  "audience": {
    "heading": "Для кого ця програма",
    "content": "- психологам і практичним психологам;\n- фахівцям з освітою бакалавра або магістра за спеціальністю Психологія;\n- вихователям, педагогам і працівникам освіти;\n- соціальним і медичним працівникам;\n- іншим фахівцям, які працюють із дітьми та прагнуть поглибити знання з дитячої психології."
  },
  "outcomes": {
    "heading": "Після програми ви зможете",
    "content": "- пояснювати основні закономірності психічного розвитку від народження до юнацтва;\n- аналізувати вікові кризи, провідну діяльність і психологічні новоутворення;\n- краще розуміти розвиток спілкування, пізнавальних процесів та емоційної сфери;\n- оцінювати психологічну готовність до школи й особливості адаптації;\n- розпізнавати ознаки стресу, тривожних і депресивних станів у межах своєї компетентності;\n- обирати коректні методи психологічної оцінки та підтримки;\n- планувати консультативну роботу з дітьми, підлітками й батьками;\n- взаємодіяти з колегами в міждисциплінарній команді;\n- приймати рішення з урахуванням професійної етики та правових меж."
  },
  "curriculum": {
    "heading": "П'ять змістових модулів",
    "content": "### 1. Загальні питання дитячої психології\n\nПсихічний розвиток, психологічний вік, перинатальний період, раннє дитинство, прихильність, базова довіра, вікові кризи та батьківський контроль.\n\n### 2. Дошкільний і молодший шкільний вік\n\nСпілкування, гра, готовність до школи, проективні методи, емоційний інтелект, дитячі страхи, поведінкові труднощі й роль батьків.\n\n### 3. Підлітковий і юнацький вік\n\nОсобистісне становлення, емоційна нестабільність, сепарація, групи однолітків, ризикована поведінка, самовизначення та сексуальна просвіта.\n\n### 4. Психологічний супровід у кризових станах\n\nСтресові реакції, травматичні події, тривожні й депресивні стани, порушення сну, оцінка ризиків і професійні межі допомоги.\n\n### 5. Консультування дітей і підлітків\n\nСімейна система, консультативна взаємодія, онлайн-консультування та вікові особливості роботи з чутливими темами."
  },
  "learning_experience": {
    "heading": "Дистанційне навчання в Moodle",
    "fields": {
      "body": "Програма проходить повністю дистанційно, без Zoom і фіксованого розкладу. Протягом 6 місяців учасники мають доступ у Moodle до відеолекцій, презентацій, конспектів і тестів та навчаються у власному темпі з будь-якої країни. Практичні заняття, стажування та робота з клієнтами в межах програми не передбачені."
    }
  },
  "assessment_document": {
    "heading": "Сертифікат після завершення",
    "fields": {
      "body": "Після завершення програми та успішного проходження підсумкового тестування слухач отримує сертифікат про підвищення кваліфікації від Університету імені Альфреда Нобеля. Документ підтверджує обсяг навчання 90 годин, або 3 ECTS."
    }
  },
  "academic_context": {
    "heading": "Академічна основа та контекст розробки",
    "fields": {
      "body": "Програму розробили фахівці, які поєднують академічну підготовку з професійною роботою з дітьми та підлітками. Базою розробки програми є Клініка психічного здоров'я Університету імені Альфреда Нобеля. Це не означає проходження практики або стажування в Клініці."
    }
  },
  "faq": {
    "items": [
      {
        "question": "Чи підходить програма не лише психологам?",
        "answer": "Так. Вона також розрахована на педагогів, соціальних і медичних працівників та інших фахівців, які працюють із дітьми. Застосовувати отримані знання потрібно в межах власної освіти й професійної компетентності."
      },
      {
        "question": "Чи можна навчатися у власному темпі?",
        "answer": "Так. Це постійно діюча дистанційна програма в Moodle без Zoom і фіксованого розкладу. Доступ до матеріалів надається на 6 місяців."
      },
      {
        "question": "Чи передбачена практика?",
        "answer": "Ні. Це дистанційна теоретична програма. Практичні заняття, стажування, практика в Клініці та робота з клієнтами не передбачені."
      },
      {
        "question": "Чи дає сертифікат право на психотерапевтичну або медичну практику?",
        "answer": "Ні. Програма підвищує кваліфікацію, але не замінює базову професійну освіту та не розширює законні межі практики слухача."
      },
      {
        "question": "Якою мовою проходить навчання?",
        "answer": "Українською мовою. Англійська та чеська сторінки презентують ту саму україномовну програму."
      },
      {
        "question": "Який документ видається після навчання?",
        "answer": "Після завершення програми та підсумкового тестування видається сертифікат про підвищення кваліфікації від Університету імені Альфреда Нобеля на 90 годин / 3 ECTS."
      }
    ]
  },
  "closing_cta": {
    "heading": "Працюєте з дітьми й хочете поглибити професійний підхід?",
    "fields": {
      "body": "Поставте запитання про доступ, зміст програми та умови навчання.",
      "primary_cta": "Поставити запитання"
    }
  }
}$json$::jsonb,
    'Child Psychology | Nobel ITBS',
    'Програма професійного підвищення кваліфікації з дитячої психології: розвиток дитини, психологічний супровід і консультування. 90 годин, 3 ECTS.',
    'Child Psychology — професійне розуміння розвитку дитини',
    'Поглибте знання про розвиток дітей і підлітків, психологічний супровід та відповідальні межі допомоги.'
  ),
  (
    '00000000-0000-4000-8000-000000000303', 'cz', 'published',
    'Child Psychology',
    'Porozumějte vývoji dítěte hlouběji a poskytujte podporu profesionálně, eticky a odpovědně.',
    'Program systematicky zkoumá psychologický vývoj od narození do adolescence a práci s dětmi, dospívajícími a rodiči. Zvláštní pozornost věnuje vývojovým krizím, emočním stavům, diagnostickým nástrojům a profesním hranicím pomoci.',
    $json${
  "eyebrow": "Program profesního rozvoje",
  "primary_cta_label": "Položit dotaz",
  "facts": {
    "content": "- Rozsah: 90 hodin, 3 ECTS\n- Typ: program profesního rozvoje\n- Stav: trvale dostupný program\n- Formát: 100% asynchronní distanční výuka v Moodle\n- Režim: bez Zoomu a pevného rozvrhu\n- Doba přístupu: 6 měsíců\n- Materiály: videopřednášky, prezentace, studijní texty a testy\n- Praxe: praktická výuka, stáž ani práce s klienty nejsou součástí programu\n- Jazyk výuky: ukrajinština\n- Hodnocení: závěrečný test\n- Dokument: certifikát profesního rozvoje od Univerzity Alfreda Nobela"
  },
  "value": {
    "heading": "Od zákonitostí vývoje k profesnímu porozumění",
    "fields": {
      "body": "Pro podporu dítěte je důležité vidět nejen jednotlivý příznak nebo náročné chování, ale celý vývojový kontext: věk, rodinné vztahy, vedoucí činnost, emoční procesy, komunikaci a životní okolnosti. Program rozvíjí systémový pohled a pomáhá volit odborně podložené způsoby interakce."
    }
  },
  "audience": {
    "heading": "Pro koho je program určen",
    "content": "- psychologům a praktickým psychologům;\n- absolventům bakalářského nebo magisterského studia psychologie;\n- vychovatelům, pedagogům a pracovníkům ve vzdělávání;\n- sociálním a zdravotnickým pracovníkům;\n- dalším profesionálům pracujícím s dětmi, kteří chtějí prohloubit znalosti dětské psychologie."
  },
  "outcomes": {
    "heading": "Po dokončení programu budete umět",
    "content": "- vysvětlit hlavní zákonitosti psychického vývoje od narození do adolescence;\n- analyzovat vývojové krize, vedoucí činnosti a psychologické vývojové změny;\n- lépe rozumět vývoji komunikace, kognitivních procesů a emocí;\n- posuzovat psychickou připravenost na školu a specifika adaptace;\n- rozpoznávat známky stresu, úzkostných a depresivních stavů v mezích své kompetence;\n- volit vhodné metody psychologického posouzení a podpory;\n- plánovat poradenskou práci s dětmi, dospívajícími a rodiči;\n- spolupracovat v mezioborovém týmu;\n- rozhodovat s ohledem na profesní etiku a právní hranice."
  },
  "curriculum": {
    "heading": "Pět obsahových modulů",
    "content": "### 1. Základy dětské psychologie\n\nPsychický vývoj, psychologický věk, perinatální období, rané dětství, attachment, základní důvěra, vývojové krize a rodičovská kontrola.\n\n### 2. Předškolní a mladší školní věk\n\nKomunikace, hra, připravenost na školu, projektivní metody, emoční inteligence, dětské strachy, problémy v chování a role rodičů.\n\n### 3. Adolescence a mladá dospělost\n\nVývoj osobnosti, emoční nestabilita, separace, vrstevnické skupiny, rizikové chování, sebeurčení a sexuální výchova.\n\n### 4. Psychologická podpora v krizových situacích\n\nStresové reakce, traumatické události, úzkostné a depresivní stavy, poruchy spánku, hodnocení rizik a profesní hranice pomoci.\n\n### 5. Poradenství pro děti a dospívající\n\nRodinný systém, poradenská interakce, online poradenství a věková specifika práce s citlivými tématy."
  },
  "learning_experience": {
    "heading": "Distanční výuka v Moodle",
    "fields": {
      "body": "Program probíhá plně distančně, bez Zoomu a pevného rozvrhu. Účastníci mají po dobu 6 měsíců v Moodle přístup k videopřednáškám, prezentacím, textům a testům a studují vlastním tempem z kterékoli země. Praktická výuka, stáž ani práce s klienty nejsou součástí programu."
    }
  },
  "assessment_document": {
    "heading": "Certifikát po dokončení",
    "fields": {
      "body": "Po dokončení programu a úspěšném absolvování závěrečného testu získá účastník certifikát profesního rozvoje od Univerzity Alfreda Nobela. Dokument potvrzuje rozsah 90 hodin, tedy 3 ECTS."
    }
  },
  "academic_context": {
    "heading": "Akademický základ a kontext vzniku",
    "fields": {
      "body": "Program vytvořili odborníci propojující akademické znalosti s profesní prací s dětmi a dospívajícími. Základem vývoje programu je Klinika duševního zdraví Univerzity Alfreda Nobela. Neznamená to praktickou výuku ani stáž na Klinice."
    }
  },
  "faq": {
    "items": [
      {
        "question": "Je program vhodný i pro jiné profese než psychology?",
        "answer": "Ano. Je určen také pedagogům, sociálním a zdravotnickým pracovníkům a dalším profesionálům pracujícím s dětmi. Znalosti je nutné používat v mezích vlastního vzdělání a profesní kompetence."
      },
      {
        "question": "Mohu studovat vlastním tempem?",
        "answer": "Ano. Jde o trvale dostupný distanční program v Moodle bez Zoomu a pevného rozvrhu. Přístup k materiálům je poskytován na 6 měsíců."
      },
      {
        "question": "Obsahuje program praxi?",
        "answer": "Ne. Jde o teoretický distanční program. Praktická výuka, stáž, praxe na Klinice ani práce s klienty nejsou součástí programu."
      },
      {
        "question": "Opravňuje certifikát k psychoterapeutické nebo zdravotnické praxi?",
        "answer": "Ne. Program podporuje profesní rozvoj, ale nenahrazuje základní odborné vzdělání ani nerozšiřuje zákonné hranice praxe účastníka."
      },
      {
        "question": "V jakém jazyce probíhá výuka?",
        "answer": "V ukrajinštině. Anglická a česká stránka představují stejný program vyučovaný v ukrajinštině."
      },
      {
        "question": "Jaký dokument získám?",
        "answer": "Po dokončení programu a závěrečného testu získáte certifikát profesního rozvoje od Univerzity Alfreda Nobela v rozsahu 90 hodin / 3 ECTS."
      }
    ]
  },
  "closing_cta": {
    "heading": "Pracujete s dětmi a chcete prohloubit svůj profesní přístup?",
    "fields": {
      "body": "Zeptejte se nás na přístup, obsah programu a podmínky studia.",
      "primary_cta": "Položit dotaz"
    }
  }
}$json$::jsonb,
    'Child Psychology | Nobel ITBS',
    'Program profesního rozvoje v dětské psychologii zaměřený na vývoj dítěte, psychologickou podporu a poradenství. 90 hodin, 3 ECTS.',
    'Child Psychology — profesní porozumění vývoji dítěte',
    'Prohlubte znalosti vývoje dětí a dospívajících, psychologické podpory a odpovědných profesních hranic.'
  ),
  (
    '00000000-0000-4000-8000-000000000304', 'en', 'published',
    'Neuroplastic Reconstruction',
    'Understand your reactions, develop self-regulation tools and discover the Neuroplastic Reconstruction method.',
    'The programme combines contemporary perspectives on neuroplasticity with self-regulation practice, working with imagery and behavioural patterns, the structure of a counselling conversation and the ethical boundaries of support. The learning pathway progresses from personal use of the method to practical exercises and professional reflection.',
    $json${
  "eyebrow": "Professional development programme",
  "primary_cta_label": "Visit programme website",
  "facts": {
    "content": "- Scope: 180 hours, 6 ECTS\n- Type: professional development programme\n- Duration: 3 months, or 12 weeks\n- Current cohort starts: 5 October 2026\n- Format: blended distance learning\n- Structure: 12 modules in three consecutive stages\n- Weekly rhythm: 2-3 video lectures, a demonstration session and a live session\n- Estimated workload: 5-7 hours per week plus independent work\n- Platforms: Moodle, Zoom and a learning community\n- Language of instruction: Ukrainian\n- Practice: exercises, cases, demonstration sessions, small-group work and counselling simulations\n- Documents for Master and VIP packages: university certificate with supplement and an international CPD UK certificate\n- Professional outcome of Master and VIP packages: MNR method consultant status and entry in the MNR consultant register"
  },
  "value": {
    "heading": "The science of change and the practice of responsible support",
    "fields": {
      "body": "Neuroplasticity describes the nervous system's capacity to change through experience and learning. The programme considers this capacity without oversimplified promises and in relation to cognitive processes, emotional regulation, stress, habitual reactions and the professional boundaries of psychological support."
    }
  },
  "audience": {
    "heading": "Who this programme is for",
    "fields": {
      "boundary_note": "How the content and skills may be applied depends on the learner's prior education and professional competence."
    },
    "content": "- people who want to better understand their reactions, emotions, needs and behavioural patterns;\n- learners without a psychology background who are exploring the method for personal development;\n- practising psychologists and counselling psychologists;\n- coaches, consultants and members of helping professions;\n- professionals in mental health, education, HR and social work;\n- professionals whose work requires support, communication and self-regulation skills;\n- learners planning to master the MNR counselling format under separate certification conditions."
  },
  "outcomes": {
    "heading": "After completing the programme, you will be able to",
    "content": "- explain the basic mechanisms of neuroplasticity and psychological regulation;\n- analyse the relationship between thoughts, emotions, bodily responses and behaviour;\n- recognise recurring behavioural patterns and cognitive distortions;\n- use foundational techniques for psycho-emotional self-regulation;\n- analyse symbols, imagery and psychological drawing as elements of learning practice;\n- understand the sequence in which the Neuroplastic Reconstruction method is applied;\n- structure a counselling conversation and support safe interaction;\n- analyse cases involving stress, anxiety, uncertainty and life changes;\n- identify the boundaries of psychological support and situations requiring referral to a medical professional;\n- plan further professional development and supervision support."
  },
  "curriculum": {
    "heading": "12 modules in three stages",
    "content": "### Stage 1. Foundations of the method and personal application\n\n1. The architecture of a healthy personality\n2. The theory and principles of neuroplasticity\n3. The language of the subconscious: symbols, imagery and archetypes\n4. Self-esteem, emotional regulation and personal boundaries\n\n### Stage 2. Tools for counselling interaction\n\n5. Psychological drawing as a tool for exploration and transformation\n6. The Neuroplastic Reconstruction method\n7. Consultation structure in the MNR method\n8. Working with automatic resistance and emotions\n\n### Stage 3. Integration, practice and professional development\n\n9. Method integration, contraindications and boundaries of competence\n10. Consultant positioning and personal brand\n11. Organising work and communicating with first clients\n12. Final certification, ethics, supervision and development planning"
  },
  "learning_experience": {
    "heading": "Theory, practice and professional reflection",
    "fields": {
      "body": "Each week, participants receive 2-3 short video lectures, attend a demonstration session with psychologists and join a live session with Nataliia Kholodenko. Learning also includes practical exercises, cases, small-group work, homework and counselling simulations. Session recordings are available for review."
    }
  },
  "expert": {
    "heading": "Method author and programme lead",
    "fields": {
      "name": "Nataliia Kholodenko",
      "bio": "Psychologist, Candidate of Sciences, author of the Neuroplastic Reconstruction method and programme developer. She participates in the learning process with the support of a team of specialist experts."
    }
  },
  "assessment_document": {
    "heading": "Final assessment",
    "fields": {
      "body": "In the Master and VIP packages, assessment includes practical assignments and final certification. After successful completion, the learner receives a professional development certificate from the University of Alfred Nobel for a 180-hour / 6-ECTS programme, a supplement listing the modules and scope of learning, and an international CPD UK certificate. The Personal package does not include certification documents or consultant status.",
      "status_note": "After meeting the certification requirements of the Master or VIP package, the graduate receives MNR method consultant status and is entered in the register of certified MNR consultants."
    }
  },
  "official_context": {
    "fields": {
      "label": "Official programme title",
      "value": "Neuroplastic Mechanisms of Self-Regulation and Transformation of Behavioural Patterns in Psychological Counselling",
      "note": "Neuroplastic Reconstruction is the approved short public title."
    }
  },
  "partnership_model": {
    "heading": "A partner programme with Nobel ITBS document infrastructure",
    "fields": {
      "body": "The content, method and learning process were created by the Nataliia Kholodenko Psychology Centre. The University of Alfred Nobel provides the academic foundation for the professional development certificate. Nobel ITBS provides the organisational infrastructure for properly issuing, assembling, registering and verifying the educational documents.",
      "trust_note": "This model provides the partner programme with a structured document package and allows graduates to verify the validity of an issued document by number or QR code, without public access to its PDF."
    }
  },
  "professional_boundary": {
    "heading": "An important professional boundary",
    "fields": {
      "body": "The programme does not confer the profession of psychologist or replace a higher education in psychology. It also does not authorise psychotherapy or medical practice. MNR method consultant status is a separate certification for work within this method after meeting the Master or VIP package requirements. Any professional practice must remain within the graduate's competence and comply with the law of the country where they work."
    }
  },
  "faq": {
    "items": [
      {
        "question": "Can I enrol without a psychology background?",
        "answer": "Yes. For learners without a foundational psychology education, the programme can provide a personal-development pathway and an introduction to the method. Completing the programme does not make a graduate a psychologist or authorise psychotherapy or medical practice."
      },
      {
        "question": "Does the programme include practical activities?",
        "answer": "Yes. It includes self-regulation exercises, case analysis, role-play counselling simulations and a practice-oriented final project."
      },
      {
        "question": "Does the programme teach participants to treat anxiety or depression?",
        "answer": "No. The programme considers psychological mechanisms and approaches to support, but does not replace medical diagnosis, treatment or specialist psychotherapy training."
      },
      {
        "question": "How much time does learning require each week?",
        "answer": "The estimated workload is 5-7 hours per week plus independent work. The programme combines video materials, live sessions, demonstration sessions and practical assignments."
      },
      {
        "question": "Can I counsel clients after completing the programme?",
        "answer": "The Master and VIP packages include preparation, certification and MNR method consultant status after the learning and assessment requirements are met. This status is not equivalent to the profession of psychologist, psychotherapist or medical professional."
      },
      {
        "question": "What is the language of instruction?",
        "answer": "The programme is taught in Ukrainian. The English and Czech pages present the same Ukrainian-language programme."
      },
      {
        "question": "What document will I receive?",
        "answer": "The Personal package does not include certification documents. After successful completion of the Master or VIP package, participants receive a professional development certificate from the University of Alfred Nobel confirming 180 hours / 6 ECTS, a certificate supplement and an international CPD UK certificate."
      }
    ]
  },
  "closing_cta": {
    "heading": "Want to better understand the mechanisms of self-regulation and behavioural change?",
    "fields": {
      "body": "Visit the programme website to review the learning format and current participation terms.",
      "primary_cta": "Visit programme website"
    }
  },
  "current_cohort": {
    "heading": "Current cohort",
    "fields": {
      "start_date": "5 October 2026"
    }
  }
}$json$::jsonb,
    'Neuroplastic Reconstruction | Nobel ITBS',
    'A professional development programme in neuroplasticity, self-regulation and behavioural patterns. 3 months, 180 hours, 6 ECTS.',
    'Neuroplastic Reconstruction — Neuroplasticity and Self-Regulation',
    'Explore self-regulation, behavioural patterns and the Neuroplastic Reconstruction method across 12 modules.'
  ),
  (
    '00000000-0000-4000-8000-000000000304', 'ua', 'published',
    'Neuroplastic Reconstruction',
    'Зрозумійте власні реакції, опануйте інструменти саморегуляції та познайомтеся з методом нейропластичної реконструкції.',
    'Програма поєднує сучасні уявлення про нейропластичність із практикою саморегуляції, роботою з образами та поведінковими патернами, структурою консультативної розмови й етичними межами допомоги. Навчальна траєкторія рухається від особистого застосування методу до практичних вправ і професійної рефлексії.',
    $json${
  "eyebrow": "Програма професійного підвищення кваліфікації",
  "primary_cta_label": "Перейти на сайт програми",
  "facts": {
    "content": "- Обсяг: 180 годин, 6 ECTS\n- Тип: програма професійного підвищення кваліфікації\n- Тривалість: 3 місяці, або 12 тижнів\n- Старт поточного набору: 5 жовтня 2026 року\n- Формат: змішане дистанційне навчання\n- Структура: 12 модулів у трьох послідовних етапах\n- Щотижневий ритм: 2-3 відеолекції, демонстраційна сесія та live-ефір\n- Орієнтовне навантаження: 5-7 годин на тиждень плюс самостійна робота\n- Платформи: Moodle, Zoom і навчальна спільнота\n- Мова навчання: українська\n- Практика: вправи, кейси, демонстраційні сесії, робота в малих групах і моделювання консультацій\n- Документи для тарифів Майстер і VIP: університетський сертифікат із додатком та міжнародний сертифікат CPD UK\n- Професійний результат тарифів Майстер і VIP: статус консультанта методу МНР і запис у реєстрі консультантів МНР"
  },
  "value": {
    "heading": "Наука про зміни, практика відповідальної підтримки",
    "fields": {
      "body": "Нейропластичність пояснює здатність нервової системи змінюватися під впливом досвіду й навчання. Програма розглядає цю здатність без спрощених обіцянок, у зв'язку з когнітивними процесами, емоційною регуляцією, стресом, звичними реакціями та професійними межами психологічної допомоги."
    }
  },
  "audience": {
    "heading": "Для кого ця програма",
    "fields": {
      "boundary_note": "Зміст і допустиме застосування навичок залежать від попередньої освіти та професійної компетентності слухача."
    },
    "content": "- тим, хто хоче краще розуміти власні реакції, емоції, потреби й поведінкові патерни;\n- слухачам без психологічної освіти, які вивчають метод для особистого розвитку;\n- практичним психологам і психологам-консультантам;\n- коучам, консультантам і представникам допомагаючих професій;\n- фахівцям сфери ментального здоров'я, освіти, HR і соціальної роботи;\n- фахівцям, чия робота потребує навичок підтримки, комунікації та саморегуляції;\n- слухачам, які планують опанувати консультативний формат методу МНР за окремими умовами сертифікації."
  },
  "outcomes": {
    "heading": "Після програми ви зможете",
    "content": "- пояснювати базові механізми нейропластичності та психічної регуляції;\n- аналізувати взаємозв'язок думок, емоцій, тілесних реакцій і поведінки;\n- розпізнавати повторювані поведінкові патерни й когнітивні викривлення;\n- використовувати базові техніки психоемоційної саморегуляції;\n- аналізувати символи, образи та психомалюнок як елементи навчальної практики;\n- розуміти послідовність застосування методу нейропластичної реконструкції;\n- структурувати консультативну розмову та підтримувати безпечну взаємодію;\n- аналізувати кейси стресу, тривоги, невизначеності й життєвих змін;\n- визначати межі психологічної підтримки та ситуації для направлення до медичного фахівця;\n- планувати подальший професійний розвиток і супервізійну підтримку."
  },
  "curriculum": {
    "heading": "12 модулів у трьох етапах",
    "content": "### Етап 1. Фундамент методу та особисте застосування\n\n1. Архітектура здорової особистості\n2. Теорія і принципи нейропластичності\n3. Мова підсвідомості: символи, образи та архетипи\n4. Самооцінка, емоційна регуляція та особисті межі\n\n### Етап 2. Інструментарій консультативної взаємодії\n\n5. Психомалюнок як інструмент дослідження й трансформації\n6. Метод нейропластичної реконструкції\n7. Структура консультації в методі МНР\n8. Робота з автоматичним опором та емоціями\n\n### Етап 3. Інтеграція, практика та професійний розвиток\n\n9. Інтеграція методу, протипоказання та межі компетентності\n10. Позиціонування та особистий бренд консультанта\n11. Організація роботи й комунікація з першими клієнтами\n12. Підсумкова сертифікація, етика, супервізія та план розвитку"
  },
  "learning_experience": {
    "heading": "Теорія, практика та професійна рефлексія",
    "fields": {
      "body": "Щотижня учасники отримують 2-3 короткі відеолекції, беруть участь у демонстраційній сесії з психологами та live-ефірі з Наталією Холоденко. Навчання також включає практичні вправи, кейси, роботу в малих групах, домашні завдання та моделювання консультативних ситуацій. Записи зустрічей доступні для повторного опрацювання."
    }
  },
  "expert": {
    "heading": "Авторка методу та ведуча програми",
    "fields": {
      "name": "Наталія Холоденко",
      "bio": "Психологиня, кандидат наук, авторка методу нейропластичної реконструкції та розробниця програми. Навчання проходить за її участі та за підтримки команди профільних експертів."
    }
  },
  "assessment_document": {
    "heading": "Підсумкова робота",
    "fields": {
      "body": "У тарифах Майстер і VIP оцінювання включає практичні завдання та фінальну атестацію. Після успішного завершення слухач отримує сертифікат про підвищення кваліфікації від Університету імені Альфреда Нобеля за програмою обсягом 180 годин / 6 ECTS, додаток із переліком модулів та обсягом навчання, а також міжнародний сертифікат CPD UK. Тариф Для себе не передбачає сертифікаційних документів або статусу консультанта.",
      "status_note": "Після виконання сертифікаційних умов тарифів Майстер або VIP випускник отримує статус консультанта методу МНР і вноситься до реєстру сертифікованих консультантів МНР."
    }
  },
  "official_context": {
    "fields": {
      "label": "Офіційна назва програми",
      "value": "Нейропластичні механізми саморегуляції та трансформації поведінкових патернів у психологічному консультуванні",
      "note": "Neuroplastic Reconstruction є затвердженою короткою публічною назвою."
    }
  },
  "partnership_model": {
    "heading": "Партнерська програма з інфраструктурою документів Nobel ITBS",
    "fields": {
      "body": "Зміст, метод і навчальний процес створені Центром психології Наталії Холоденко. Університет імені Альфреда Нобеля забезпечує академічну основу сертифіката про підвищення кваліфікації. Nobel ITBS виступає провайдером організаційної інфраструктури освітніх документів для їх належного оформлення, комплектації, реєстрації й верифікації.",
      "trust_note": "Така модель дає партнерській програмі структурований комплект документів, а випускнику дає змогу перевірити чинність виданого документа за номером або QR-кодом без публічного доступу до його PDF."
    }
  },
  "professional_boundary": {
    "heading": "Важлива професійна межа",
    "fields": {
      "body": "Програма не надає професію психолога й не замінює вищу психологічну освіту. Вона також не надає права здійснювати психотерапевтичну або медичну практику. Статус консультанта методу МНР є окремою сертифікацією для роботи в межах цього методу після виконання умов тарифу Майстер або VIP. Практична діяльність має відповідати компетентності випускника та законодавству країни, де він працює."
    }
  },
  "faq": {
    "items": [
      {
        "question": "Чи можна навчатися без психологічної освіти?",
        "answer": "Так. Для слухачів без базової психологічної освіти програма може бути траєкторією особистого розвитку та знайомства з методом. Завершення програми не робить випускника психологом і не надає права на психотерапевтичну чи медичну практику."
      },
      {
        "question": "Чи є в програмі практичні заняття?",
        "answer": "Так. Передбачені вправи із саморегуляції, аналіз кейсів, рольове моделювання консультацій та практико-орієнтований підсумковий проєкт."
      },
      {
        "question": "Чи навчає програма лікувати тривогу або депресію?",
        "answer": "Ні. Програма розглядає психологічні механізми та підходи до підтримки, але не замінює медичну діагностику, лікування або профільну психотерапевтичну підготовку."
      },
      {
        "question": "Скільки часу потрібно на навчання щотижня?",
        "answer": "Орієнтовне навантаження становить 5-7 годин на тиждень плюс самостійна робота. Програма поєднує відеоматеріали, live-ефіри, демонстраційні сесії та практичні завдання."
      },
      {
        "question": "Чи можна після програми консультувати клієнтів?",
        "answer": "Тарифи Майстер і VIP передбачають підготовку, сертифікацію та статус консультанта методу МНР після виконання навчальних і атестаційних умов. Цей статус не прирівнюється до професії психолога, психотерапевта або медичного фахівця."
      },
      {
        "question": "Якою мовою проходить навчання?",
        "answer": "Українською мовою. Англійська та чеська сторінки презентують ту саму україномовну програму."
      },
      {
        "question": "Який документ видається?",
        "answer": "У тарифі Для себе сертифікаційні документи не видаються. Після успішного завершення тарифу Майстер або VIP видаються сертифікат про підвищення кваліфікації від Університету імені Альфреда Нобеля за 180 годин / 6 ECTS, додаток до сертифіката та міжнародний сертифікат CPD UK."
      }
    ]
  },
  "closing_cta": {
    "heading": "Хочете краще розуміти механізми саморегуляції та поведінкових змін?",
    "fields": {
      "body": "Перейдіть на сайт програми, щоб ознайомитися з форматом навчання й актуальними умовами участі.",
      "primary_cta": "Перейти на сайт програми"
    }
  },
  "current_cohort": {
    "heading": "Поточний набір",
    "fields": {
      "start_date": "5 жовтня 2026 року"
    }
  }
}$json$::jsonb,
    'Neuroplastic Reconstruction | Nobel ITBS',
    'Програма професійного підвищення кваліфікації з нейропластичності, саморегуляції та поведінкових патернів. 3 місяці, 180 годин, 6 ECTS.',
    'Neuroplastic Reconstruction — нейропластичність і саморегуляція',
    'Досліджуйте механізми саморегуляції, поведінкові патерни та метод нейропластичної реконструкції у 12 модулях.'
  ),
  (
    '00000000-0000-4000-8000-000000000304', 'cz', 'published',
    'Neuroplastic Reconstruction',
    'Porozumějte svým reakcím, osvojte si nástroje seberegulace a poznejte metodu neuroplastické rekonstrukce.',
    'Program propojuje současné poznatky o neuroplasticitě s praxí seberegulace, prací s obrazy a behaviorálními vzorci, strukturou poradenského rozhovoru a etickými hranicemi pomoci.',
    $json${
  "eyebrow": "Program profesního rozvoje",
  "primary_cta_label": "Přejít na web programu",
  "facts": {
    "content": "- Rozsah: 180 hodin, 6 ECTS\n- Typ: program profesního rozvoje\n- Délka: 3 měsíce / 12 týdnů\n- Aktuální běh začíná: 5. října 2026\n- Formát: kombinovaná distanční výuka\n- Struktura: 12 modulů ve třech etapách\n- Týdně: 2-3 videopřednášky, demonstrační a live setkání\n- Zátěž: přibližně 5-7 hodin týdně plus samostatná práce\n- Platformy: Moodle, Zoom a vzdělávací komunita\n- Jazyk výuky: ukrajinština\n- Praxe: cvičení, případy, demonstrace, malé skupiny a simulace konzultací\n- Dokumenty Master/VIP: univerzitní certifikát s dodatkem a mezinárodní certifikát CPD UK\n- Výsledek Master/VIP: status konzultanta metody MNR a zápis do registru konzultantů MNR"
  },
  "value": {
    "heading": "Věda o změně a praxe odpovědné podpory",
    "fields": {
      "body": "Neuroplasticita popisuje schopnost nervové soustavy měnit se zkušeností a učením. Program ji představuje bez zjednodušených slibů, ve vztahu ke kognitivním procesům, emoční regulaci, stresu, navyklým reakcím a profesním hranicím."
    }
  },
  "audience": {
    "heading": "Pro koho je program určen",
    "fields": {
      "boundary_note": "Rozsah použití dovedností závisí na předchozím vzdělání a profesní kompetenci účastníka."
    },
    "content": "- lidem, kteří chtějí lépe rozumět svým reakcím, emocím, potřebám a vzorcům;\n- účastníkům bez psychologického vzdělání studujícím metodu pro osobní rozvoj;\n- praktickým psychologům a psychologickým poradcům;\n- koučům, konzultantům a zástupcům pomáhajících profesí;\n- odborníkům na duševní zdraví, vzdělávání, HR a sociální práci;\n- profesionálům, jejichž práce vyžaduje dovednosti podpory, komunikace a\n  seberegulace;\n- účastníkům plánujícím poradenský formát MNR za samostatných podmínek certifikace."
  },
  "outcomes": {
    "heading": "Po dokončení programu budete umět",
    "content": "- vysvětlit základy neuroplasticity a psychické regulace;\n- analyzovat vztah myšlenek, emocí, tělesných reakcí a chování;\n- rozpoznat opakující se vzorce a kognitivní zkreslení;\n- používat základní techniky psychoemoční seberegulace;\n- pracovat se symboly, obrazy a psychologickou kresbou ve výuce;\n- chápat postup metody Neuroplastic Reconstruction;\n- strukturovat poradenský rozhovor a bezpečnou interakci;\n- analyzovat případy stresu, úzkosti, nejistoty a životních změn;\n- rozpoznat hranice podpory a potřebu odeslání ke zdravotnickému odborníkovi;\n- plánovat další profesní rozvoj a supervizi."
  },
  "curriculum": {
    "heading": "12 modulů ve třech etapách",
    "content": "### Etapa 1. Základy metody a osobní použití\n1. Architektura zdravé osobnosti\n2. Teorie a principy neuroplasticity\n3. Jazyk podvědomí: symboly, obrazy a archetypy\n4. Sebehodnocení, emoční regulace a osobní hranice\n### Etapa 2. Nástroje poradenské interakce\n5. Psychologická kresba jako nástroj zkoumání a transformace\n6. Metoda Neuroplastic Reconstruction\n7. Struktura konzultace v metodě MNR\n8. Práce s automatickým odporem a emocemi\n### Etapa 3. Integrace, praxe a profesní rozvoj\n9. Integrace metody, kontraindikace a hranice kompetencí\n10. Positioning a osobní značka konzultanta\n11. Organizace práce a komunikace s prvními klienty\n12. Závěrečná certifikace, etika, supervize a plán rozvoje"
  },
  "learning_experience": {
    "heading": "Teorie, praxe a profesní reflexe",
    "fields": {
      "body": "Každý týden účastníci získají 2-3 krátké videopřednášky, demonstrační setkání s psychology a live setkání s Nataliiou Kholodenko. Výuka zahrnuje cvičení, případy, malé skupiny, domácí úkoly a simulace konzultací; záznamy jsou dostupné k opakování."
    }
  },
  "expert": {
    "heading": "Autorka metody a vedoucí programu",
    "fields": {
      "name": "Nataliia Kholodenko",
      "bio": "Psycholožka, kandidátka věd, autorka metody Neuroplastic Reconstruction a tvůrkyně programu. Na výuce se podílí s týmem odborných expertů."
    }
  },
  "assessment_document": {
    "heading": "Závěrečné hodnocení",
    "fields": {
      "body": "U variant Master a VIP zahrnuje hodnocení praktické úkoly a závěrečnou certifikaci. Po úspěšném dokončení získá účastník certifikát profesního rozvoje Univerzity Alfreda Nobela na 180 hodin / 6 ECTS, dodatek s moduly a rozsahem a mezinárodní certifikát CPD UK. Varianta Pro sebe dokumenty ani status konzultanta nezahrnuje.",
      "status_note": "Po splnění podmínek Master/VIP získá absolvent status konzultanta metody MNR a zápis do registru certifikovaných konzultantů MNR."
    }
  },
  "official_context": {
    "fields": {
      "label": "Oficiální název programu",
      "value": "Neuroplastické mechanismy seberegulace a transformace behaviorálních vzorců v psychologickém poradenství",
      "note": "Neuroplastic Reconstruction je schválený krátký veřejný název."
    }
  },
  "partnership_model": {
    "heading": "Partnerský program s dokumentovou infrastrukturou Nobel ITBS",
    "fields": {
      "body": "Obsah, metodu a výuku vytvořilo Psychologické centrum Nataliie Kholodenko. Univerzita Alfreda Nobela poskytuje akademický základ certifikátu profesního rozvoje. Nobel ITBS zajišťuje infrastrukturu pro řádnou přípravu, kompletaci, registraci a ověřování dokumentů.",
      "trust_note": "Absolvent může ověřit platnost vydaného dokumentu číslem nebo QR kódem bez veřejného přístupu k PDF."
    }
  },
  "professional_boundary": {
    "heading": "Důležitá profesní hranice",
    "fields": {
      "body": "Program neposkytuje profesi psychologa, nenahrazuje vysokoškolské psychologické vzdělání a neopravňuje k psychoterapeutické ani zdravotnické praxi. Status konzultanta MNR je samostatná certifikace pro práci v rámci metody. Praxe musí odpovídat kompetenci absolventa a právu země, kde působí."
    }
  },
  "faq": {
    "items": [
      {
        "question": "Mohu studovat bez psychologického vzdělání?",
        "answer": "Ano, pro osobní rozvoj a seznámení s metodou. Dokončení z absolventa nedělá psychologa a neopravňuje k psychoterapeutické ani zdravotnické praxi."
      },
      {
        "question": "Obsahuje program praktickou výuku?",
        "answer": "Ano, cvičení seberegulace, analýzu případů, simulace konzultací a prakticky zaměřený závěrečný projekt."
      },
      {
        "question": "Učí program léčit úzkost nebo depresi?",
        "answer": "Ne. Nenahrazuje zdravotnickou diagnostiku, léčbu ani odborný psychoterapeutický výcvik."
      },
      {
        "question": "Kolik času vyžaduje týdně?",
        "answer": "Přibližně 5-7 hodin plus samostatná práce."
      },
      {
        "question": "Mohu po programu pracovat s klienty?",
        "answer": "Master/VIP zahrnují přípravu a status konzultanta MNR po splnění podmínek. Status není rovnocenný profesi psychologa, psychoterapeuta ani zdravotníka."
      },
      {
        "question": "V jakém jazyce probíhá výuka?",
        "answer": "V ukrajinštině. Anglická a česká stránka představují stejný ukrajinsky vyučovaný program."
      },
      {
        "question": "Jaké dokumenty získám?",
        "answer": "Pro sebe dokumenty nezahrnuje. Master/VIP zahrnují certifikát Univerzity Alfreda Nobela na 180 hodin / 6 ECTS, dodatek a CPD UK."
      }
    ]
  },
  "closing_cta": {
    "heading": "Chcete lépe rozumět mechanismům seberegulace a změn chování?",
    "fields": {
      "body": "Na webu programu najdete formát výuky a aktuální podmínky účasti.",
      "primary_cta": "Přejít na web programu"
    }
  },
  "current_cohort": {
    "heading": "Aktuální běh",
    "fields": {
      "start_date": "5. října 2026"
    }
  }
}$json$::jsonb,
    'Neuroplastic Reconstruction | Nobel ITBS',
    'Program profesního rozvoje v oblasti neuroplasticity, seberegulace a behaviorálních vzorců. 3 měsíce, 180 hodin, 6 ECTS.',
    'Neuroplastic Reconstruction — neuroplasticita a seberegulace',
    'Poznejte seberegulaci, behaviorální vzorce a metodu Neuroplastic Reconstruction ve 12 modulech.'
  ),
  (
    '00000000-0000-4000-8000-000000000305', 'en', 'published',
    'Space Business',
    'Discover the business opportunities of the new space era.',
    'The programme introduces the commercial space sector, its technologies, markets, start-ups, legal environment and models of international cooperation. It helps you see space not only as a field of research, but as an environment for innovation, entrepreneurship and new professional opportunities.',
    $json${
  "eyebrow": "Certificate programme | Technology & Innovation",
  "primary_cta_label": "Ask a question",
  "facts": {
    "content": "- Scope: 90 hours\n- Type: certificate programme\n- Status: continuously available programme\n- Format: distance learning in Moodle\n- Languages of instruction: Ukrainian and English\n- Materials: video lectures, recorded meetings and additional resources\n- Practical component: consultation on your own project\n- Document: certificate issued by the University of Alfred Nobel; hours are not stated on the certificate"
  },
  "value": {
    "heading": "The space industry in the language of business",
    "fields": {
      "body": "Space Business provides a structured understanding of how the global market for space goods and services operates. You will explore the industry's principal participants, technology areas, project economics, legal regulation, marketing, logistics and international cooperation."
    }
  },
  "audience": {
    "heading": "Who this programme is for",
    "content": "- entrepreneurs exploring opportunities in the space market;\n- founders of start-ups and technology projects;\n- managers and innovation professionals;\n- business representatives evaluating new industries and partnerships;\n- researchers and professionals interested in technology commercialisation;\n- beginners seeking a systematic introduction to the space industry."
  },
  "outcomes": {
    "heading": "After completing the programme, you will be able to",
    "content": "- navigate the structure and principal segments of the modern space industry;\n- analyse the market for space goods and services;\n- understand the role of satellite, navigation and other space technologies;\n- assess opportunities for start-ups, technology transfer and new business models;\n- account for the economic, legal and intellectual-property aspects of projects;\n- understand the principles of international integration, cooperation and project management;\n- analyse marketing strategy and space-infrastructure logistics;\n- structure an idea for your own scientific, technology or start-up project."
  },
  "curriculum": {
    "heading": "Eight modules, 90 hours",
    "content": "### 1. Organisation of space activities, 12 hours\n\nCore concepts, the history of the global market, the modern space industry and its key participants.\n\n### 2. Space technologies, 16 hours\n\nThe market for goods and services, innovation development, engineering, communication and navigation systems.\n\n### 3. Start-ups in space activities, 16 hours\n\nCommercialisation of scientific programmes, space tourism, resources, space settlements and technology transfer.\n\n### 4. Economics of space activities, 12 hours\n\nInnovation potential, asset management and innovation re-engineering in the space industry.\n\n### 5. International legal framework, 12 hours\n\nThe Outer Space Treaty, national regulation and intellectual-property protection.\n\n### 6. International integration and cooperation, 12 hours\n\nProject management, marketing strategy and space-infrastructure logistics.\n\n### 7. Information flows in management, 8 hours\n\nInformation processes and management decisions in space-industry companies.\n\n### 8. Consultation on your own project, 2 hours\n\nStructuring the idea and receiving professional feedback on the project."
  },
  "learning_experience": {
    "heading": "Access space education online",
    "fields": {
      "body": "The programme is continuously available in Moodle. The learning experience may include video lectures, recorded expert meetings, additional materials on the development of the space market, a calendar of online meetings and question-and-answer sessions."
    }
  },
  "languages": {
    "heading": "Learning in Ukrainian and English",
    "fields": {
      "body": "The programme is available in Ukrainian and English. The Czech website version provides information about the programme, but the programme is not taught in Czech."
    }
  },
  "expert": {
    "heading": "Space-industry and business experts",
    "fields": {
      "body": "The programme materials involve professionals in engineering, management, marketing, international activities and space-project development."
    }
  },
  "assessment_document": {
    "heading": "Certificate upon completion",
    "fields": {
      "issuer": "University of Alfred Nobel",
      "hours_on_certificate": false
    },
    "content": "After meeting the programme requirements, the learner receives a certificate issued by the University of Alfred Nobel. The programme volume is 90 hours; the hours are not stated on the certificate."
  },
  "faq": {
    "items": [
      {
        "question": "Is the programme suitable for beginners?",
        "answer": "Yes. It starts with foundational concepts and gradually moves into technologies, economics, law, start-ups and space-project management."
      },
      {
        "question": "Can I study at a convenient time?",
        "answer": "Yes. This is a continuously available distance programme in Moodle. The access period and schedule of synchronous activities are provided during consultation."
      },
      {
        "question": "What are the languages of instruction?",
        "answer": "Ukrainian and English. The programme is presented in Czech on the website, but it is not taught in Czech."
      },
      {
        "question": "Can I work on my own project?",
        "answer": "The programme includes a consultation module for your own project. The precise format and amount of feedback depend on the current participation terms."
      },
      {
        "question": "Does the programme guarantee that I will launch a space start-up?",
        "answer": "No. It provides knowledge, analytical frameworks and professional context, but does not guarantee investment, partnerships, employment or a commercial outcome."
      },
      {
        "question": "What document will I receive?",
        "answer": "After meeting the programme requirements, you receive a certificate issued by the University of Alfred Nobel. The hours are not stated on the certificate."
      }
    ]
  },
  "closing_cta": {
    "heading": "Have an idea for the space market?",
    "fields": {
      "body": "Ask us about the programme, language of instruction, access and working on your own project.",
      "primary_cta": "Ask a question"
    }
  }
}$json$::jsonb,
    'Space Business | Nobel ITBS',
    'A distance programme covering the space market, technologies, start-ups, economics, law and international cooperation. 90 hours, taught in Ukrainian and English.',
    'Space Business — Opportunities in the Space Industry',
    'Explore the space market, technologies, start-ups, economics, law and international cooperation.'
  ),
  (
    '00000000-0000-4000-8000-000000000305', 'ua', 'published',
    'Space Business',
    'Відкрийте бізнес-можливості нової космічної ери.',
    'Програма знайомить із комерційним космічним сектором, його технологіями, ринками, стартапами, правовим середовищем та моделями міжнародної співпраці. Вона допомагає побачити космос не лише як сферу досліджень, а як простір для інновацій, підприємництва й нових професійних рішень.',
    $json${
  "eyebrow": "Certificate programme | Technology & Innovation",
  "primary_cta_label": "Поставити запитання",
  "facts": {
    "content": "- Обсяг: 90 годин\n- Тип: сертифікатна програма\n- Статус: постійно діюча програма\n- Формат: дистанційне навчання в Moodle\n- Мови навчання: українська та англійська\n- Матеріали: відеолекції, записи зустрічей і додаткові ресурси\n- Практичний компонент: консультація щодо власного проєкту\n- Документ: сертифікат Університету імені Альфреда Нобеля; години на сертифікаті не зазначаються"
  },
  "value": {
    "heading": "Космічна індустрія мовою бізнесу",
    "fields": {
      "body": "Space Business дає структуроване уявлення про те, як працює глобальний ринок космічних товарів і послуг. Ви знайомитеся з основними учасниками галузі, технологічними напрямами, економікою проєктів, правовим регулюванням, маркетингом, логістикою та міжнародною кооперацією."
    }
  },
  "audience": {
    "heading": "Для кого ця програма",
    "content": "- підприємці, які досліджують можливості космічного ринку;\n- засновники стартапів і технологічних проєктів;\n- менеджери та фахівці з інновацій;\n- представники бізнесу, які оцінюють нові галузі й партнерства;\n- дослідники та фахівці, зацікавлені в комерціалізації технологій;\n- початківці, яким потрібне системне знайомство з космічною індустрією."
  },
  "outcomes": {
    "heading": "Після програми ви зможете",
    "content": "- орієнтуватися в структурі сучасної космічної індустрії та її основних сегментах;\n- аналізувати ринок космічних товарів і послуг;\n- розуміти роль супутникових, навігаційних та інших космічних технологій;\n- оцінювати можливості для стартапів, трансферу технологій і нових бізнес-моделей;\n- враховувати економічні, правові та інтелектуально-правові аспекти проєктів;\n- розуміти принципи міжнародної інтеграції, кооперації та проєктного менеджменту;\n- аналізувати маркетингову стратегію й логістику космічної інфраструктури;\n- структурувати ідею власного наукового, технологічного або стартап-проєкту."
  },
  "curriculum": {
    "heading": "Вісім модулів, 90 годин",
    "content": "### 1. Організація космічної діяльності, 12 годин\n\nОсновні поняття, історія світового ринку, сучасна космічна індустрія та її ключові учасники.\n\n### 2. Космічні технології, 16 годин\n\nРинок товарів і послуг, інноваційний розвиток, інжиніринг, системи зв'язку й навігації.\n\n### 3. Стартапи у космічній діяльності, 16 годин\n\nКомерціалізація наукових програм, космічний туризм, ресурси, космічні поселення та трансфер технологій.\n\n### 4. Економіка космічної діяльності, 12 годин\n\nІнноваційний потенціал, управління активами та реінжиніринг інновацій у космічній галузі.\n\n### 5. Міжнародно-правова база, 12 годин\n\nДоговір про космос, національне регулювання та захист інтелектуальної власності.\n\n### 6. Міжнародна інтеграція та кооперація, 12 годин\n\nПроєктний менеджмент, маркетингова стратегія та логістика космічної інфраструктури.\n\n### 7. Інформаційні потоки в управлінні, 8 годин\n\nІнформаційні процеси й управлінські рішення в компаніях космічної галузі.\n\n### 8. Консалтинг щодо власного проєкту, 2 години\n\nСтруктурування ідеї та професійний зворотний зв'язок щодо проєкту."
  },
  "learning_experience": {
    "heading": "Доступ до космічної освіти онлайн",
    "fields": {
      "body": "Програма постійно доступна в Moodle. Навчальний досвід може включати відеолекції, записи зустрічей з експертами, додаткові матеріали про розвиток космічного ринку, календар онлайн-зустрічей і сесії запитань та відповідей."
    }
  },
  "languages": {
    "heading": "Навчання українською та англійською",
    "fields": {
      "body": "Програма доступна українською й англійською мовами. Чеська версія сайту допомагає ознайомитися з програмою, але навчання чеською не проводиться."
    }
  },
  "expert": {
    "heading": "Експерти космічної індустрії та бізнесу",
    "fields": {
      "body": "До матеріалів програми залучені фахівці з інженерії, управління, маркетингу, міжнародної діяльності й розвитку космічних проєктів."
    }
  },
  "assessment_document": {
    "heading": "Сертифікат після завершення",
    "fields": {
      "issuer": "Університет імені Альфреда Нобеля",
      "hours_on_certificate": false
    },
    "content": "Після виконання умов програми слухач отримує сертифікат Університету імені Альфреда Нобеля. Обсяг програми становить 90 годин; години на сертифікаті не зазначаються."
  },
  "faq": {
    "items": [
      {
        "question": "Чи підходить програма початківцям?",
        "answer": "Так. Навчання починається з базових понять і поступово переходить до технологій, економіки, права, стартапів та управління космічними проєктами."
      },
      {
        "question": "Чи можна навчатися у зручний час?",
        "answer": "Так. Це постійно діюча дистанційна програма в Moodle. Строк доступу й розклад синхронних активностей повідомляються під час консультації."
      },
      {
        "question": "Якими мовами проходить навчання?",
        "answer": "Українською та англійською. Чеською мовою доступна презентація програми на сайті, але не саме навчання."
      },
      {
        "question": "Чи можна працювати над власним проєктом?",
        "answer": "Програма містить модуль консалтингу щодо власного проєкту. Точний формат і обсяг зворотного зв'язку залежать від чинних умов участі."
      },
      {
        "question": "Чи гарантує програма запуск космічного стартапу?",
        "answer": "Ні. Вона дає знання, рамки аналізу й професійний контекст, але не гарантує інвестицій, партнерства, працевлаштування або комерційного результату."
      },
      {
        "question": "Який документ видається?",
        "answer": "Після виконання умов програми видається сертифікат Університету імені Альфреда Нобеля. Години на сертифікаті не зазначаються."
      }
    ]
  },
  "closing_cta": {
    "heading": "Маєте ідею для космічного ринку?",
    "fields": {
      "body": "Поставте запитання про програму, мову навчання, доступ і роботу над власним проєктом.",
      "primary_cta": "Поставити запитання"
    }
  }
}$json$::jsonb,
    'Space Business | Nobel ITBS',
    'Дистанційна програма про космічний ринок, технології, стартапи, економіку, право та міжнародну співпрацю. 90 годин, навчання українською й англійською.',
    'Space Business — бізнес-можливості космічної індустрії',
    'Досліджуйте космічний ринок, технології, стартапи, економіку, право та міжнародну співпрацю.'
  ),
  (
    '00000000-0000-4000-8000-000000000305', 'cz', 'published',
    'Space Business',
    'Objevte obchodní příležitosti nové vesmírné éry.',
    'Program představuje komerční vesmírný sektor, jeho technologie, trhy, start-upy, právní prostředí a modely mezinárodní spolupráce. Pomáhá vnímat vesmír nejen jako oblast výzkumu, ale také jako prostor pro inovace, podnikání a nové profesní příležitosti.',
    $json${
  "eyebrow": "Certifikátový program | Technology & Innovation",
  "primary_cta_label": "Položit dotaz",
  "facts": {
    "content": "- Rozsah: 90 hodin\n- Typ: certifikátový program\n- Stav: trvale dostupný program\n- Formát: distanční výuka v Moodle\n- Jazyky výuky: ukrajinština a angličtina\n- Materiály: videopřednášky, záznamy setkání a doplňkové zdroje\n- Praktická část: konzultace vlastního projektu\n- Dokument: certifikát Univerzity Alfreda Nobela; počet hodin se na certifikátu neuvádí"
  },
  "value": {
    "heading": "Vesmírný průmysl jazykem byznysu",
    "fields": {
      "body": "Space Business poskytuje strukturovaný přehled o fungování globálního trhu vesmírného zboží a služeb. Seznámíte se s hlavními aktéry, technologickými směry, ekonomikou projektů, právní regulací, marketingem, logistikou a mezinárodní spoluprací."
    }
  },
  "audience": {
    "heading": "Pro koho je program určen",
    "content": "- podnikatelům zkoumajícím příležitosti vesmírného trhu;\n- zakladatelům start-upů a technologických projektů;\n- manažerům a specialistům na inovace;\n- firmám posuzujícím nová odvětví a partnerství;\n- výzkumníkům a odborníkům se zájmem o komercializaci technologií;\n- začátečníkům hledajícím systematický úvod do vesmírného průmyslu."
  },
  "outcomes": {
    "heading": "Po dokončení programu budete umět",
    "content": "- orientovat se ve struktuře a segmentech moderního vesmírného průmyslu;\n- analyzovat trh vesmírného zboží a služeb;\n- rozumět roli satelitních, navigačních a dalších vesmírných technologií;\n- posuzovat příležitosti pro start-upy, transfer technologií a nové obchodní modely;\n- zohlednit ekonomické, právní a autorskoprávní aspekty projektů;\n- chápat principy mezinárodní integrace, spolupráce a projektového řízení;\n- analyzovat marketing a logistiku vesmírné infrastruktury;\n- strukturovat vlastní vědecký, technologický nebo start-upový projekt."
  },
  "curriculum": {
    "heading": "Osm modulů, 90 hodin",
    "content": "### 1. Organizace vesmírných aktivit, 12 hodin\n\nZákladní pojmy, historie světového trhu, moderní vesmírný průmysl a jeho hlavní\naktéři.\n\n### 2. Vesmírné technologie, 16 hodin\n\nTrh zboží a služeb, inovační rozvoj, inženýrství, komunikační a navigační\nsystémy.\n\n### 3. Start-upy ve vesmírných aktivitách, 16 hodin\n\nKomercializace vědeckých programů, vesmírná turistika, zdroje, vesmírná sídla a\ntransfer technologií.\n\n### 4. Ekonomika vesmírných aktivit, 12 hodin\n\nInovační potenciál, správa aktiv a reengineering inovací ve vesmírném průmyslu.\n\n### 5. Mezinárodní právní rámec, 12 hodin\n\nKosmická smlouva, národní regulace a ochrana duševního vlastnictví.\n\n### 6. Mezinárodní integrace a spolupráce, 12 hodin\n\nProjektové řízení, marketingová strategie a logistika vesmírné infrastruktury.\n\n### 7. Informační toky v řízení, 8 hodin\n\nInformační procesy a manažerská rozhodnutí ve společnostech vesmírného průmyslu.\n\n### 8. Konzultace vlastního projektu, 2 hodiny\n\nStrukturování nápadu a odborná zpětná vazba k projektu."
  },
  "learning_experience": {
    "heading": "Vesmírné vzdělávání online",
    "fields": {
      "body": "Program je trvale dostupný v Moodle. Výuka může zahrnovat videopřednášky, záznamy setkání s experty, doplňkové materiály o rozvoji trhu, kalendář online setkání a otázky a odpovědi."
    }
  },
  "languages": {
    "heading": "Výuka v ukrajinštině a angličtině",
    "fields": {
      "body": "Program je dostupný v ukrajinštině a angličtině. Česká verze webu program představuje, výuka však v češtině neprobíhá."
    }
  },
  "expert": {
    "heading": "Experti na vesmírný průmysl a byznys",
    "fields": {
      "body": "Na materiálech se podílejí odborníci na inženýrství, management, marketing, mezinárodní aktivity a rozvoj vesmírných projektů."
    }
  },
  "assessment_document": {
    "heading": "Certifikát po dokončení",
    "fields": {
      "issuer": "Univerzita Alfreda Nobela",
      "hours_on_certificate": false
    },
    "content": "Po splnění podmínek programu získá účastník certifikát Univerzity Alfreda Nobela. Rozsah programu činí 90 hodin; počet hodin se na certifikátu neuvádí."
  },
  "faq": {
    "items": [
      {
        "question": "Je program vhodný pro začátečníky?",
        "answer": "Ano. Začíná základními pojmy a postupně přechází k technologiím, ekonomice, právu, start-upům a řízení vesmírných projektů."
      },
      {
        "question": "Mohu studovat ve vhodném čase?",
        "answer": "Ano. Jde o trvale dostupný distanční program v Moodle. Doba přístupu a rozvrh synchronních aktivit budou sděleny při konzultaci."
      },
      {
        "question": "V jakých jazycích probíhá výuka?",
        "answer": "V ukrajinštině a angličtině. V češtině je dostupná prezentace programu, nikoli samotná výuka."
      },
      {
        "question": "Mohu pracovat na vlastním projektu?",
        "answer": "Program obsahuje konzultaci vlastního projektu. Přesný formát a rozsah zpětné vazby závisí na aktuálních podmínkách účasti."
      },
      {
        "question": "Zaručuje program spuštění vesmírného start-upu?",
        "answer": "Ne. Poskytuje znalosti a profesní kontext, ale nezaručuje investice, partnerství, zaměstnání ani komerční výsledek."
      },
      {
        "question": "Jaký dokument získám?",
        "answer": "Po splnění podmínek programu získáte certifikát Univerzity Alfreda Nobela. Počet hodin se na certifikátu neuvádí."
      }
    ]
  },
  "closing_cta": {
    "heading": "Máte nápad pro vesmírný trh?",
    "fields": {
      "body": "Zeptejte se na program, jazyk výuky, přístup a práci na vlastním projektu.",
      "primary_cta": "Položit dotaz"
    }
  }
}$json$::jsonb,
    'Space Business | Nobel ITBS',
    'Distanční program o vesmírném trhu, technologiích, start-upech, ekonomice, právu a mezinárodní spolupráci. 90 hodin, výuka v ukrajinštině a angličtině.',
    'Space Business — příležitosti vesmírného průmyslu',
    'Poznejte vesmírný trh, technologie, start-upy, ekonomiku, právo a mezinárodní spolupráci.'
  );

alter table public.programmes enable row level security;
alter table public.programmes force row level security;
alter table public.programme_translations enable row level security;
alter table public.programme_translations force row level security;

revoke all on table public.programmes from public, anon, authenticated;
revoke all on table public.programme_translations from public, anon, authenticated;
grant select on table public.programmes to anon;
grant select on table public.programme_translations to anon;
grant select, insert, update, delete on table public.programmes to authenticated;
grant select, insert, update, delete on table public.programme_translations to authenticated;
grant select, insert, update, delete on table public.programmes to postgres, service_role;
grant select, insert, update, delete on table public.programme_translations to postgres, service_role;
grant usage on type public.programme_publication_status to anon, authenticated, service_role;
grant usage on type public.programme_format to anon, authenticated, service_role;
grant usage on type public.programme_application_provider to anon, authenticated, service_role;

create policy programmes_public_read
on public.programmes for select to anon
using (publication_status = 'published');

create policy programmes_reference_read
on public.programmes for select to authenticated
using (
  publication_status = 'published'
  and internal.is_active_admin()
);

create policy programmes_content_read
on public.programmes for select to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programmes_content_insert
on public.programmes for insert to authenticated
with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programmes_content_update
on public.programmes for update to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]))
with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programmes_content_delete
on public.programmes for delete to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programme_translations_public_read
on public.programme_translations for select to anon
using (
  translation_status = 'published'
  and exists (
    select 1 from public.programmes programme_record
    where programme_record.id = programme_id
      and programme_record.publication_status = 'published'
  )
);

create policy programme_translations_reference_read
on public.programme_translations for select to authenticated
using (
  translation_status = 'published'
  and internal.is_active_admin()
  and exists (
    select 1 from public.programmes programme_record
    where programme_record.id = programme_id
      and programme_record.publication_status = 'published'
  )
);

create policy programme_translations_content_read
on public.programme_translations for select to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programme_translations_content_insert
on public.programme_translations for insert to authenticated
with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programme_translations_content_update
on public.programme_translations for update to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]))
with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programme_translations_content_delete
on public.programme_translations for delete to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));
