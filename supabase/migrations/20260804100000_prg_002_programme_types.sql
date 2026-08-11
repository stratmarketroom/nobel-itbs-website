-- PRG-002: Programme Types
-- Structured programme-type records and complete approved EN/UA/CZ landing-page content.

create table if not exists public.programme_types (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  status public.record_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint programme_types_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint programme_types_sort_order_nonnegative check (sort_order >= 0)
);

comment on table public.programme_types is
  'Extensible programme-type identity, ordering, and publication lifecycle.';
comment on column public.programme_types.slug is
  'Locale-independent slug in the shared /programmes namespace.';

create table if not exists public.programme_type_translations (
  type_id uuid not null references public.programme_types(id) on delete cascade,
  language_code text not null references public.languages(code) on delete restrict,
  translation_status public.translation_status not null default 'missing',
  title text null,
  landing_title text null,
  short_description text null,
  intro_content text null,
  sections jsonb not null default '{}'::jsonb,
  seo_title text null,
  seo_description text null,
  og_title text null,
  og_description text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (type_id, language_code),
  constraint programme_type_translations_sections_object check (
    jsonb_typeof(sections) = 'object'
  ),
  constraint programme_type_translations_published_complete check (
    translation_status <> 'published'
    or (
      title is not null and btrim(title) <> ''
      and landing_title is not null and btrim(landing_title) <> ''
      and short_description is not null and btrim(short_description) <> ''
      and intro_content is not null and btrim(intro_content) <> ''
      and sections ?& array['primary_cta_label', 'audience', 'comparison', 'listing', 'closing_cta']
      and seo_title is not null and btrim(seo_title) <> ''
      and seo_description is not null and btrim(seo_description) <> ''
      and og_title is not null and btrim(og_title) <> ''
      and og_description is not null and btrim(og_description) <> ''
    )
  )
);

comment on table public.programme_type_translations is
  'Complete localized content for fixed-layout programme-type landing pages.';
comment on column public.programme_type_translations.landing_title is
  'Localized H1, stored separately from the singular programme-type label.';
comment on column public.programme_type_translations.sections is
  'Fixed-shape content for audience, comparison, listing, empty state, and closing CTA; not a page builder.';

create index if not exists programme_type_translations_language_status_idx
  on public.programme_type_translations (language_code, translation_status);

create trigger programme_types_set_updated_at
before update on public.programme_types
for each row
execute function internal.set_updated_at();

create trigger programme_type_translations_set_updated_at
before update on public.programme_type_translations
for each row
execute function internal.set_updated_at();

insert into public.programme_types (id, slug, status, sort_order)
values
  ('00000000-0000-4000-8000-000000000201', 'certificate-programme', 'published', 10),
  ('00000000-0000-4000-8000-000000000202', 'mini-mba', 'published', 20),
  ('00000000-0000-4000-8000-000000000203', 'professional-development-course', 'published', 30)
on conflict (slug) do update
set
  status = excluded.status,
  sort_order = excluded.sort_order;

insert into public.programme_type_translations (
  type_id,
  language_code,
  translation_status,
  title,
  landing_title,
  short_description,
  intro_content,
  sections,
  seo_title,
  seo_description,
  og_title,
  og_description
)
values
  (
    '00000000-0000-4000-8000-000000000201', 'en', 'published',
    'Certificate programme',
    'Certificate Programmes',
    'Structured learning with defined content, outcomes, and a document awarded after the programme requirements have been met.',
    $content$A Certificate programme is a professional education programme with a defined subject, learning volume, format, and learning outcomes. After successful completion, the participant receives the certificate specified by the individual programme.

The Programme Type does not automatically define the number of ECTS credits, qualification level, issuer, or international status of the document. These characteristics are stated separately on each programme page.$content$,
    $json${
      "primary_cta_label": "View programmes",
      "audience": {
        "heading": "Who this format is for",
        "items": [
          "Specialists who want to study a focused professional subject",
          "Participants who value a defined learning volume",
          "Professionals who need a document confirming programme completion",
          "People choosing a shorter, focused format instead of a long academic programme"
        ]
      },
      "comparison": {
        "heading": "What to compare",
        "intro": "Before choosing a programme, review:",
        "items": [
          "Subject and learning outcomes",
          "Duration, hours, and ECTS where applicable",
          "Format and language of instruction",
          "Assessment and completion requirements",
          "Name, type, and issuer of the certificate",
          "Document verification, where provided by the programme"
        ]
      },
      "listing": {
        "heading": "Certificate programmes",
        "intro": "Compare the available programmes by subject, format, learning volume, and completion document.",
        "empty_heading": "Programmes of this type are being prepared",
        "empty_body": "There are currently no published certificate programmes. Explore other learning formats or return to the catalogue later.",
        "empty_cta_label": "View all programmes"
      },
      "closing_cta": {
        "heading": "Choose a certificate programme based on your professional goal",
        "copy": "Compare the content, format, and document provided by each programme.",
        "label": "View programmes"
      }
    }$json$::jsonb,
    'Certificate Programmes | Nobel ITBS',
    'Explore Nobel ITBS certificate programmes with defined content, learning volume, outcomes, and a document awarded after completion.',
    'Nobel ITBS Certificate Programmes',
    'Compare structured professional programmes by their format, learning volume, and completion document.'
  ),
  (
    '00000000-0000-4000-8000-000000000201', 'ua', 'published',
    'Сертифікатна програма',
    'Сертифікатні програми',
    'Структуроване навчання з визначеним змістом, результатами та документом після виконання умов програми.',
    $content$Certificate programme — це професійна освітня програма з визначеною тематикою, навчальним обсягом, форматом і результатами навчання. Після успішного завершення учасник отримує сертифікат, передбачений умовами конкретної програми.

Тип програми не визначає автоматично кількість ECTS, рівень кваліфікації, емітента або міжнародний статус документа. Ці характеристики зазначаються окремо на сторінці кожної програми.$content$,
    $json${
      "primary_cta_label": "Переглянути програми",
      "audience": {"heading": "Для кого цей формат", "items": ["Фахівці, які хочуть опанувати окрему професійну тему", "Учасники, яким важливий визначений навчальний обсяг", "Професіонали, які потребують документа про завершення програми", "Ті, хто обирає коротший і сфокусований формат замість тривалої академічної програми"]},
      "comparison": {"heading": "Що порівняти", "intro": "Перед вибором програми зверніть увагу на:", "items": ["Тематику й результати навчання", "Тривалість, години та ECTS, якщо вони передбачені", "Формат і мову навчання", "Оцінювання та умови завершення", "Назву, тип і емітента сертифіката", "Можливість перевірки документа, якщо вона передбачена програмою"]},
      "listing": {"heading": "Сертифікатні програми", "intro": "Перегляньте доступні програми та порівняйте їхню тематику, формат, обсяг і документ після завершення.", "empty_heading": "Програми цього типу готуються до публікації", "empty_body": "Наразі немає опублікованих сертифікатних програм. Перегляньте інші формати навчання або поверніться до каталогу пізніше.", "empty_cta_label": "Переглянути всі програми"},
      "closing_cta": {"heading": "Оберіть сертифікатну програму за професійною метою", "copy": "Порівняйте зміст, формат і документ кожної програми перед вибором.", "label": "Переглянути програми"}
    }$json$::jsonb,
    'Сертифікатні програми | Nobel ITBS',
    'Сертифікатні професійні програми Nobel ITBS із визначеним змістом, навчальним обсягом, результатами та документом після завершення.',
    'Сертифікатні програми Nobel ITBS',
    'Обирайте структуровані професійні програми та перевіряйте формат, обсяг і документ, передбачений кожною з них.'
  ),
  (
    '00000000-0000-4000-8000-000000000201', 'cz', 'published',
    'Certifikátový program',
    'Certifikátové programy',
    'Strukturované vzdělávání s vymezeným obsahem, výsledky a dokumentem vydaným po splnění požadavků programu.',
    $content$Certifikátový program je program profesního vzdělávání s vymezeným tématem, rozsahem, formátem a výsledky vzdělávání. Po úspěšném dokončení obdrží účastník certifikát uvedený u konkrétního programu.

Programme Type automaticky neurčuje počet kreditů ECTS, úroveň kvalifikace, vydavatele ani mezinárodní status dokumentu. Tyto vlastnosti jsou uvedeny samostatně na stránce každého programu.$content$,
    $json${
      "primary_cta_label": "Zobrazit programy",
      "audience": {"heading": "Pro koho je tento formát", "items": ["Specialisty, kteří chtějí studovat konkrétní profesní téma", "Účastníky, pro něž je důležitý jasně vymezený rozsah vzdělávání", "Profesionály, kteří potřebují dokument potvrzující dokončení programu", "Osoby, které místo dlouhého akademického programu volí kratší zaměřený formát"]},
      "comparison": {"heading": "Co porovnat", "intro": "Před výběrem programu porovnejte:", "items": ["Téma a výsledky vzdělávání", "Délku, počet hodin a případné ECTS", "Formát a jazyk výuky", "Hodnocení a podmínky dokončení", "Název, typ a vydavatele certifikátu", "Ověření dokumentu, pokud je v programu dostupné"]},
      "listing": {"heading": "Certifikátové programy", "intro": "Porovnejte dostupné programy podle tématu, formátu, rozsahu a dokumentu po dokončení.", "empty_heading": "Programy tohoto typu se připravují", "empty_body": "Momentálně nejsou zveřejněny žádné certifikátové programy. Prohlédněte si jiné formáty nebo se do katalogu vraťte později.", "empty_cta_label": "Zobrazit všechny programy"},
      "closing_cta": {"heading": "Vyberte si certifikátový program podle svého profesního cíle", "copy": "Porovnejte obsah, formát a dokument vydávaný u jednotlivých programů.", "label": "Zobrazit programy"}
    }$json$::jsonb,
    'Certifikátové programy | Nobel ITBS',
    'Prohlédněte si certifikátové programy Nobel ITBS s vymezeným obsahem, rozsahem, výsledky vzdělávání a dokumentem vydávaným po dokončení.',
    'Certifikátové programy Nobel ITBS',
    'Porovnejte strukturované profesní programy podle formátu, rozsahu vzdělávání a dokumentu po dokončení.'
  ),
  (
    '00000000-0000-4000-8000-000000000202', 'en', 'published',
    'Mini-MBA', 'Mini-MBA',
    'A concentrated professional format for developing business and management competencies as a connected system.',
    $content$A Mini-MBA is a professional programme that brings together key areas of business and management in a more compact format. Depending on the programme, it may cover strategy, product, marketing, sales, finance, operations, people, and leadership.

A Mini-MBA is not an academic degree and does not replace a full MBA programme. Duration, learning volume, assessment, documents, and any possible recognition of learning are defined by the individual programme.$content$,
    $json${
      "primary_cta_label": "View programmes",
      "audience": {"heading": "Who this format is for", "items": ["Entrepreneurs and project owners", "Managers and team leaders", "Experts creating or scaling their own product", "Specialists moving into a business or management role", "Professionals who need to structure practical experience"]},
      "comparison": {"heading": "What the format develops", "intro": "", "items": ["A systems view of business and its connected functions", "The ability to make reasoned management decisions", "Understanding of products, markets, and customer value", "Skills for working with finance, processes, and teams", "Application of learning outcomes in the participant's own project"]},
      "listing": {"heading": "Mini-MBA programmes", "intro": "Compare available programmes by specialisation, learning volume, applied outcome, and completion documents.", "empty_heading": "Programmes of this type are being prepared", "empty_body": "There are currently no published Mini-MBA programmes. Explore other learning formats or return to the catalogue later.", "empty_cta_label": "View all programmes"},
      "closing_cta": {"heading": "Turn your experience into structured management decisions", "copy": "Choose a Mini-MBA programme that matches your business challenges and professional direction.", "label": "View programmes"}
    }$json$::jsonb,
    'Mini-MBA Programmes | Nobel ITBS',
    'Applied Nobel ITBS Mini-MBA programmes for developing management thinking, business competencies, and work on participants'' own projects.',
    'Mini-MBA at Nobel ITBS',
    'Structure your business knowledge and develop competencies for working with products, teams, and management decisions.'
  ),
  (
    '00000000-0000-4000-8000-000000000202', 'ua', 'published',
    'Mini-MBA', 'Mini-MBA',
    'Концентрований професійний формат для системного розвитку бізнес- та управлінських компетентностей.',
    $content$Mini-MBA — це професійна програма, що в компактнішому форматі об’єднує ключові теми бізнесу й управління. Залежно від конкретної програми вона може охоплювати стратегію, продукт, маркетинг, продажі, фінанси, операційні процеси, команду та лідерство.

Mini-MBA не є академічним ступенем і не замінює повну MBA-програму. Тривалість, навчальний обсяг, оцінювання, документи та можливість подальшого зарахування результатів визначаються умовами конкретної програми.$content$,
    $json${
      "primary_cta_label": "Переглянути програми",
      "audience": {"heading": "Для кого цей формат", "items": ["Підприємці та власники проєктів", "Менеджери й керівники команд", "Експерти, які створюють або масштабують власний продукт", "Фахівці, які переходять до бізнес- чи управлінської ролі", "Професіонали, яким потрібно систематизувати практичний досвід"]},
      "comparison": {"heading": "Що розвиває формат", "intro": "", "items": ["Системне бачення бізнесу та взаємозв’язку його функцій", "Здатність обґрунтовувати управлінські рішення", "Розуміння продукту, ринку та цінності для клієнта", "Навички роботи з фінансами, процесами й командами", "Застосування навчальних результатів у власному проєкті"]},
      "listing": {"heading": "Програми Mini-MBA", "intro": "Перегляньте доступні програми та зверніть увагу на їхню спеціалізацію, обсяг, практичний результат і документи.", "empty_heading": "Програми цього типу готуються до публікації", "empty_body": "Наразі немає опублікованих Mini-MBA програм. Перегляньте інші формати навчання або поверніться до каталогу пізніше.", "empty_cta_label": "Переглянути всі програми"},
      "closing_cta": {"heading": "Перетворюйте досвід на системні управлінські рішення", "copy": "Оберіть Mini-MBA програму відповідно до бізнес-завдань і професійної траєкторії.", "label": "Переглянути програми"}
    }$json$::jsonb,
    'Програми Mini-MBA | Nobel ITBS',
    'Прикладні програми Mini-MBA Nobel ITBS для розвитку управлінського мислення, бізнес-компетентностей і роботи над власними проєктами.',
    'Mini-MBA у Nobel ITBS',
    'Систематизуйте бізнес-знання й розвивайте компетентності для роботи з продуктами, командами та управлінськими рішеннями.'
  ),
  (
    '00000000-0000-4000-8000-000000000202', 'cz', 'published',
    'Mini-MBA', 'Mini-MBA',
    'Koncentrovaný profesní formát pro rozvoj obchodních a manažerských kompetencí jako propojeného systému.',
    $content$Mini-MBA je profesní program, který v kompaktnějším formátu propojuje klíčové oblasti byznysu a managementu. Podle konkrétního programu může zahrnovat strategii, produkt, marketing, prodej, finance, provoz, práci s lidmi a vedení.

Mini-MBA není akademický titul a nenahrazuje plný program MBA. Délku, rozsah, hodnocení, dokumenty a případné uznání vzdělávání určuje konkrétní program.$content$,
    $json${
      "primary_cta_label": "Zobrazit programy",
      "audience": {"heading": "Pro koho je tento formát", "items": ["Podnikatele a vlastníky projektů", "Manažery a vedoucí týmů", "Experti, kteří vytvářejí nebo škálují vlastní produkt", "Specialisty přecházející do obchodní nebo manažerské role", "Profesionály, kteří potřebují systematizovat praktické zkušenosti"]},
      "comparison": {"heading": "Co formát rozvíjí", "intro": "", "items": ["Systémový pohled na byznys a jeho propojené funkce", "Schopnost přijímat odůvodněná manažerská rozhodnutí", "Porozumění produktům, trhům a hodnotě pro zákazníka", "Dovednosti pro práci s financemi, procesy a týmy", "Využití výsledků vzdělávání ve vlastním projektu účastníka"]},
      "listing": {"heading": "Programy Mini-MBA", "intro": "Porovnejte programy podle specializace, rozsahu, praktického výsledku a dokumentů po dokončení.", "empty_heading": "Programy tohoto typu se připravují", "empty_body": "Momentálně nejsou zveřejněny žádné programy Mini-MBA. Prohlédněte si jiné formáty nebo se do katalogu vraťte později.", "empty_cta_label": "Zobrazit všechny programy"},
      "closing_cta": {"heading": "Proměňte zkušenosti ve strukturovaná manažerská rozhodnutí", "copy": "Vyberte si program Mini-MBA odpovídající vašim obchodním výzvám a profesnímu směru.", "label": "Zobrazit programy"}
    }$json$::jsonb,
    'Programy Mini-MBA | Nobel ITBS',
    'Prakticky zaměřené programy Mini-MBA Nobel ITBS pro rozvoj manažerského myšlení, obchodních kompetencí a práci na vlastních projektech.',
    'Mini-MBA v Nobel ITBS',
    'Systematizujte své znalosti byznysu a rozvíjejte kompetence pro práci s produkty, týmy a manažerskými rozhodnutími.'
  ),
  (
    '00000000-0000-4000-8000-000000000203', 'en', 'published',
    'Professional development course',
    'Professional Development Courses',
    'Deepen your professional knowledge through structured programmes with a defined learning volume, content, and outcomes.',
    $content$A Professional development course helps participants update, expand, or structure knowledge in a specific professional field. Each programme has its own subject, audience, learning volume, format, assessment, and completion requirements.

Completing an individual programme does not automatically confer a new profession, academic degree, or the right to regulated, medical, or psychotherapeutic practice. Professional opportunities and limits on applying the learning depend on the programme content and the rules of the relevant country or profession.$content$,
    $json${
      "primary_cta_label": "View programmes",
      "audience": {"heading": "Who this format is for", "items": ["Specialists deepening knowledge in their field", "Professionals who need to structure practical experience", "Participants preparing for further professional or academic learning", "Specialists from related fields who need a structured subject foundation", "People choosing a programme with a defined learning volume and outcomes"]},
      "comparison": {"heading": "What to compare", "intro": "Before choosing a programme, review:", "items": ["Intended audience and entry requirements", "Learning outcomes and boundaries of competence", "Duration, hours, and ECTS", "Format, language, and mode of study", "Assessment and completion requirements", "The document, its issuer, and any supplement provided"]},
      "listing": {"heading": "Professional development courses", "intro": "Compare the subject, learning volume, format, and completion document to choose the right professional direction.", "empty_heading": "Programmes of this type are being prepared", "empty_body": "There are currently no published professional development courses. Explore other formats or return to the catalogue later.", "empty_cta_label": "View all programmes"},
      "closing_cta": {"heading": "Choose a programme for your next stage of professional development", "copy": "Compare programme content, learning volume, and format to find the one that matches your goals.", "label": "View programmes"}
    }$json$::jsonb,
    'Professional Development Courses | Nobel ITBS',
    'Nobel ITBS professional development courses for deepening knowledge, developing competencies, and pursuing structured professional learning.',
    'Professional Development Courses',
    'Choose a structured programme to update your knowledge, deepen competencies, and continue your professional development.'
  ),
  (
    '00000000-0000-4000-8000-000000000203', 'ua', 'published',
    'Програма професійного підвищення кваліфікації',
    'Програми професійного підвищення кваліфікації',
    'Поглиблюйте професійні знання у структурованих програмах із визначеним обсягом, змістом і результатами навчання.',
    $content$Програма професійного підвищення кваліфікації допомагає оновити, розширити або систематизувати знання в конкретній професійній сфері. Кожна програма має власну тематику, аудиторію, навчальний обсяг, формат, оцінювання та умови завершення.

Завершення окремої програми не означає автоматичного здобуття нової професії, академічного ступеня або права на регульовану, медичну чи психотерапевтичну практику. Професійні можливості й межі застосування результатів визначаються змістом програми та правилами відповідної країни або професії.$content$,
    $json${
      "primary_cta_label": "Переглянути програми",
      "audience": {"heading": "Для кого цей формат", "items": ["Фахівці, які поглиблюють знання у своїй сфері", "Професіонали, яким потрібно систематизувати практичний досвід", "Учасники, які готуються до подальшого професійного або академічного навчання", "Спеціалісти суміжних сфер, яким потрібна структурована предметна основа", "Ті, хто обирає програму з визначеним навчальним обсягом і результатами"]},
      "comparison": {"heading": "Що порівняти", "intro": "Перед вибором програми перевірте:", "items": ["Для кого вона розроблена й які має вступні вимоги", "Навчальні результати та межі компетентності", "Тривалість, години та ECTS", "Формат, мову й режим навчання", "Оцінювання та умови завершення", "Документ, його емітента й додаток, якщо він передбачений"]},
      "listing": {"heading": "Програми професійного підвищення кваліфікації", "intro": "Порівняйте тематику, навчальний обсяг, формат і документ кожної програми, щоб обрати відповідну професійну траєкторію.", "empty_heading": "Програми цього типу готуються до публікації", "empty_body": "Наразі немає опублікованих програм професійного підвищення кваліфікації. Перегляньте інші формати або поверніться до каталогу пізніше.", "empty_cta_label": "Переглянути всі програми"},
      "closing_cta": {"heading": "Оберіть програму для подальшого професійного розвитку", "copy": "Порівняйте зміст, обсяг і формат програм та оберіть ту, що відповідає вашим цілям.", "label": "Переглянути програми"}
    }$json$::jsonb,
    'Професійне підвищення кваліфікації | Nobel ITBS',
    'Програми професійного підвищення кваліфікації Nobel ITBS для поглиблення знань, розвитку компетентностей і системного професійного навчання.',
    'Програми професійного підвищення кваліфікації',
    'Обирайте структуровані програми для оновлення знань, поглиблення компетентностей і подальшого професійного розвитку.'
  ),
  (
    '00000000-0000-4000-8000-000000000203', 'cz', 'published',
    'Kurz profesního rozvoje',
    'Kurzy profesního rozvoje',
    'Prohlubujte své profesní znalosti ve strukturovaných programech s vymezeným rozsahem, obsahem a výsledky vzdělávání.',
    $content$Kurz profesního rozvoje pomáhá účastníkům aktualizovat, rozšířit nebo systematizovat znalosti v konkrétním profesním oboru. Každý program má vlastní téma, cílovou skupinu, rozsah, formát, hodnocení a podmínky dokončení.

Dokončení jednotlivého programu automaticky nepřiznává novou profesi, akademický titul ani oprávnění k regulované, zdravotnické nebo psychoterapeutické praxi. Profesní možnosti a hranice využití znalostí závisí na obsahu programu a pravidlech příslušné země či profese.$content$,
    $json${
      "primary_cta_label": "Zobrazit programy",
      "audience": {"heading": "Pro koho je tento formát", "items": ["Specialisty prohlubující znalosti ve svém oboru", "Profesionály, kteří potřebují systematizovat praktické zkušenosti", "Účastníky připravující se na další profesní nebo akademické vzdělávání", "Specialisty z příbuzných oborů, kteří potřebují strukturovaný základ", "Osoby volící program s vymezeným rozsahem a výsledky"]},
      "comparison": {"heading": "Co porovnat", "intro": "Před výběrem programu porovnejte:", "items": ["Cílovou skupinu a vstupní požadavky", "Výsledky vzdělávání a hranice kompetencí", "Délku, počet hodin a ECTS", "Formát, jazyk a způsob studia", "Hodnocení a podmínky dokončení", "Dokument, jeho vydavatele a případný dodatek"]},
      "listing": {"heading": "Kurzy profesního rozvoje", "intro": "Porovnejte téma, rozsah, formát a dokument po dokončení a vyberte si správný profesní směr.", "empty_heading": "Programy tohoto typu se připravují", "empty_body": "Momentálně nejsou zveřejněny žádné kurzy profesního rozvoje. Prohlédněte si jiné formáty nebo se do katalogu vraťte později.", "empty_cta_label": "Zobrazit všechny programy"},
      "closing_cta": {"heading": "Vyberte si program pro další etapu profesního rozvoje", "copy": "Porovnejte obsah, rozsah a formát programů a najděte ten, který odpovídá vašim cílům.", "label": "Zobrazit programy"}
    }$json$::jsonb,
    'Kurzy profesního rozvoje | Nobel ITBS',
    'Kurzy profesního rozvoje Nobel ITBS pro prohloubení znalostí, rozvoj kompetencí a strukturované další profesní vzdělávání.',
    'Kurzy profesního rozvoje',
    'Vyberte si strukturovaný program pro aktualizaci znalostí, prohloubení kompetencí a další profesní rozvoj.'
  )
on conflict (type_id, language_code) do update
set
  translation_status = excluded.translation_status,
  title = excluded.title,
  landing_title = excluded.landing_title,
  short_description = excluded.short_description,
  intro_content = excluded.intro_content,
  sections = excluded.sections,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  og_title = excluded.og_title,
  og_description = excluded.og_description;

alter table public.programme_types enable row level security;
alter table public.programme_types force row level security;
alter table public.programme_type_translations enable row level security;
alter table public.programme_type_translations force row level security;

revoke all on table public.programme_types from public, anon, authenticated;
revoke all on table public.programme_type_translations from public, anon, authenticated;
grant select on table public.programme_types to anon;
grant select on table public.programme_type_translations to anon;
grant select, insert, update, delete on table public.programme_types to authenticated;
grant select, insert, update, delete on table public.programme_type_translations to authenticated;
grant select, insert, update, delete on table public.programme_types to postgres, service_role;
grant select, insert, update, delete on table public.programme_type_translations to postgres, service_role;

create policy programme_types_public_read
on public.programme_types for select to anon
using (status = 'published');

create policy programme_types_reference_read
on public.programme_types for select to authenticated
using (status = 'published' and internal.is_active_admin());

create policy programme_types_content_read
on public.programme_types for select to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programme_types_content_insert
on public.programme_types for insert to authenticated
with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programme_types_content_update
on public.programme_types for update to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]))
with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programme_types_content_delete
on public.programme_types for delete to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programme_type_translations_public_read
on public.programme_type_translations for select to anon
using (
  translation_status = 'published'
  and exists (
    select 1 from public.programme_types type_record
    where type_record.id = type_id and type_record.status = 'published'
  )
);

create policy programme_type_translations_reference_read
on public.programme_type_translations for select to authenticated
using (
  translation_status = 'published'
  and internal.is_active_admin()
  and exists (
    select 1 from public.programme_types type_record
    where type_record.id = type_id and type_record.status = 'published'
  )
);

create policy programme_type_translations_content_read
on public.programme_type_translations for select to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programme_type_translations_content_insert
on public.programme_type_translations for insert to authenticated
with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programme_type_translations_content_update
on public.programme_type_translations for update to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]))
with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programme_type_translations_content_delete
on public.programme_type_translations for delete to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));
