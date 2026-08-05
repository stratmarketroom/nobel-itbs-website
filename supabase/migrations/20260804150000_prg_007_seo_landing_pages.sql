-- PRG-007: SEO Landing Pages and Shared Programme Slug Namespace
-- Area landing sections, complete EN/UA/CZ publication data, and cross-entity slug collision prevention.

alter table public.programme_area_translations
  add column sections jsonb not null default '{}'::jsonb,
  add column og_title text null,
  add column og_description text null,
  add constraint programme_area_translations_sections_object check (jsonb_typeof(sections) = 'object');

insert into public.programme_area_translations (
  area_id, language_code, translation_status, title, short_description,
  intro_content, sections, seo_title, seo_description, og_title, og_description
)
values
  ('00000000-0000-4000-8000-000000000101', 'en', 'published', 'Business & Management', 'Strong businesses begin with decisions that can be explained and put', 'Business & Management focuses on turning ideas into structured products and
manageable processes. Participants consider business as a connected system in
which strategy, finance, marketing, sales, people, and operations need to work
together.

Programmes in this area combine professional concepts with applied tasks,
decision analysis, and work on participants'' own projects.', $json${"eyebrow":"Programme Area","supporting_copy":"This area brings together programmes in management,","primary_cta_label":"View programmes","about":{"heading":"About The Area","content":"Business & Management focuses on turning ideas into structured products and\nmanageable processes. Participants consider business as a connected system in\nwhich strategy, finance, marketing, sales, people, and operations need to work\ntogether.\n\nProgrammes in this area combine professional concepts with applied tasks,\ndecision analysis, and work on participants' own projects."},"audience":{"heading":"Who This Area Is For","items":["entrepreneurs and project founders","managers and team leaders","experts creating or scaling their own products","specialists moving into management responsibility","professionals who need to structure their business knowledge."]},"outcomes":{"heading":"What You Develop","items":["strategic and systems thinking","the ability to assess business decisions and their consequences","understanding of products, markets, and customer value","skills for working with processes, finance, marketing, and sales","approaches to managing teams, change, and project development."]},"listing":{"heading":"Programmes in this area","intro":"Choose a programme based on your professional goal, preferred","empty_heading":"New programmes in this area are being prepared for publication.","empty_body":""},"closing_cta":{"heading":"Find a programme for your next professional step","copy":"Explore Business & Management programmes and choose the format that","label":"View programmes"}}$json$::jsonb, 'Business & Management Programmes | Nobel ITBS', 'Professional programmes in business, management, strategic', 'Business & Management at Nobel ITBS', 'Develop your management thinking and build structured'),
  ('00000000-0000-4000-8000-000000000101', 'ua', 'published', 'Business & Management', 'Сильний бізнес починається з рішень, які можна обґрунтувати й реалізувати.', 'Business & Management зосереджується на тому, як перетворювати ідеї на
структуровані продукти й керовані процеси. Учасники розглядають бізнес не як
набір окремих інструментів, а як систему, у якій стратегія, фінанси, маркетинг,
продажі, команда й операційні рішення мають працювати узгоджено.

Програми напряму поєднують професійні концепції з прикладними завданнями,
аналізом рішень і роботою над власними проєктами.', $json${"eyebrow":"Programme Area","supporting_copy":"Напрям об’єднує програми про управління, підприємництво,","primary_cta_label":"Переглянути програми","about":{"heading":"About The Area","content":"Business & Management зосереджується на тому, як перетворювати ідеї на\nструктуровані продукти й керовані процеси. Учасники розглядають бізнес не як\nнабір окремих інструментів, а як систему, у якій стратегія, фінанси, маркетинг,\nпродажі, команда й операційні рішення мають працювати узгоджено.\n\nПрограми напряму поєднують професійні концепції з прикладними завданнями,\nаналізом рішень і роботою над власними проєктами."},"audience":{"heading":"Who This Area Is For","items":["підприємці та засновники проєктів","менеджери й керівники команд","експерти, які створюють або масштабують власні продукти","фахівці, які переходять до управлінської відповідальності","професіонали, яким потрібно систематизувати бізнес-знання."]},"outcomes":{"heading":"What You Develop","items":["стратегічне й системне мислення","здатність оцінювати бізнес-рішення та їхні наслідки","розуміння логіки продукту, ринку й цінності для клієнта","навички роботи з процесами, фінансами, маркетингом і продажами","підходи до управління командами, змінами та розвитком проєктів."]},"listing":{"heading":"Програми напряму","intro":"Оберіть програму відповідно до професійної мети, бажаного","empty_heading":"Нові програми напряму готуються до публікації.","empty_body":""},"closing_cta":{"heading":"Знайдіть програму для наступного професійного кроку","copy":"Перегляньте доступні програми Business & Management та оберіть формат,","label":"Переглянути програми"}}$json$::jsonb, 'Business & Management | Професійні програми Nobel ITBS', 'Професійні програми з бізнесу, управління, стратегічних', 'Business & Management у Nobel ITBS', 'Розвивайте управлінське мислення та створюйте системні рішення'),
  ('00000000-0000-4000-8000-000000000101', 'cz', 'published', 'Business & Management', 'Silné firmy začínají rozhodnutími, která lze vysvětlit a uvést do praxe.', 'Business & Management se zaměřuje na přeměnu nápadů ve strukturované produkty a
řiditelné procesy. Účastníci vnímají firmu jako propojený systém, v němž musí
společně fungovat strategie, finance, marketing, prodej, lidé a provoz.

Programy v této oblasti propojují profesní koncepty s aplikovanými úkoly,
analýzou rozhodnutí a prací na vlastních projektech účastníků.', $json${"eyebrow":"Programme Area","supporting_copy":"Tato oblast sdružuje programy zaměřené na management,","primary_cta_label":"Zobrazit programy","about":{"heading":"About The Area","content":"Business & Management se zaměřuje na přeměnu nápadů ve strukturované produkty a\nřiditelné procesy. Účastníci vnímají firmu jako propojený systém, v němž musí\nspolečně fungovat strategie, finance, marketing, prodej, lidé a provoz.\n\nProgramy v této oblasti propojují profesní koncepty s aplikovanými úkoly,\nanalýzou rozhodnutí a prací na vlastních projektech účastníků."},"audience":{"heading":"Who This Area Is For","items":["podnikatele a zakladatele projektů","manažery a vedoucí týmů","experty, kteří vytvářejí nebo škálují vlastní produkty","specialisty přecházející do manažerské odpovědnosti","profesionály, kteří potřebují systematizovat své znalosti byznysu."]},"outcomes":{"heading":"What You Develop","items":["strategické a systémové myšlení","schopnost posuzovat podniková rozhodnutí a jejich důsledky","porozumění produktům, trhům a hodnotě pro zákazníka","dovednosti pro práci s procesy, financemi, marketingem a prodejem","přístupy k řízení týmů, změn a rozvoje projektů."]},"listing":{"heading":"Programy v této oblasti","intro":"Vyberte si program podle profesního cíle, preferovaného formátu","empty_heading":"Nové programy v této oblasti se připravují ke zveřejnění.","empty_body":""},"closing_cta":{"heading":"Najděte program pro svůj další profesní krok","copy":"Prohlédněte si programy Business & Management a vyberte si formát, který","label":"Zobrazit programy"}}$json$::jsonb, 'Programy Business & Management | Nobel ITBS', 'Profesní programy v oblasti byznysu, managementu,', 'Business & Management v Nobel ITBS', 'Rozvíjejte manažerské myšlení a vytvářejte strukturovaná'),
  ('00000000-0000-4000-8000-000000000102', 'en', 'published', 'Technology & Innovation', 'Technology creates value when we understand how to apply it.', 'Technology & Innovation helps participants navigate an environment in which
technology is rapidly changing markets, professions, and product development.
Programmes connect technological context with business, economics, management,
and international cooperation.

The purpose is to provide a foundation for analysing emerging technologies,
asking the right questions, and making decisions with an understanding of their
opportunities, limitations, and practical context.', $json${"eyebrow":"Programme Area","supporting_copy":"This area brings together programmes in emerging","primary_cta_label":"View programmes","about":{"heading":"About The Area","content":"Technology & Innovation helps participants navigate an environment in which\ntechnology is rapidly changing markets, professions, and product development.\nProgrammes connect technological context with business, economics, management,\nand international cooperation.\n\nThe purpose is to provide a foundation for analysing emerging technologies,\nasking the right questions, and making decisions with an understanding of their\nopportunities, limitations, and practical context."},"audience":{"heading":"Who This Area Is For","items":["specialists in technology and digital fields","managers and entrepreneurs working with technology products","professionals from other fields who need to understand modern technologies","team members developing or implementing innovative solutions","people planning professional development in emerging industries."]},"outcomes":{"heading":"What You Develop","items":["understanding of technological and innovation decision-making","the ability to assess emerging markets and opportunities","decision-making skills informed by technological context","understanding of the relationship between technology, economics, and business models;","readiness to work with interdisciplinary products and teams."]},"listing":{"heading":"Programmes in this area","intro":"Explore technologies and industries through programmes that","empty_heading":"New programmes in this area are being prepared for publication.","empty_body":""},"closing_cta":{"heading":"Explore the opportunities of emerging industries","copy":"View Technology & Innovation programmes and find a direction for your","label":"View programmes"}}$json$::jsonb, 'Technology & Innovation Programmes | Nobel ITBS', 'Professional programmes in technology, innovation, and', 'Technology & Innovation at Nobel ITBS', 'Understand emerging technologies and turn that understanding'),
  ('00000000-0000-4000-8000-000000000102', 'ua', 'published', 'Technology & Innovation', 'Технології створюють цінність тоді, коли ми розуміємо, як їх застосувати.', 'Technology & Innovation допомагає орієнтуватися у середовищі, де технології
швидко змінюють ринки, професії та способи створення продуктів. Програми напряму
поєднують технологічний контекст із бізнесом, економікою, управлінням і
міжнародною співпрацею.

Мета напряму — дати достатню основу, щоб аналізувати нові технології, ставити
правильні запитання та приймати рішення з урахуванням їхніх можливостей,
обмежень і практичного контексту.', $json${"eyebrow":"Programme Area","supporting_copy":"Напрям об’єднує програми про нові технології, інноваційні","primary_cta_label":"Переглянути програми","about":{"heading":"About The Area","content":"Technology & Innovation допомагає орієнтуватися у середовищі, де технології\nшвидко змінюють ринки, професії та способи створення продуктів. Програми напряму\nпоєднують технологічний контекст із бізнесом, економікою, управлінням і\nміжнародною співпрацею.\n\nМета напряму — дати достатню основу, щоб аналізувати нові технології, ставити\nправильні запитання та приймати рішення з урахуванням їхніх можливостей,\nобмежень і практичного контексту."},"audience":{"heading":"Who This Area Is For","items":["фахівці у технологічних і цифрових сферах","менеджери та підприємці, які працюють із технологічними продуктами","професіонали з інших галузей, яким потрібно розуміти сучасні технології","учасники команд, що розробляють або впроваджують інноваційні рішення","ті, хто планує професійний розвиток у нових індустріях."]},"outcomes":{"heading":"What You Develop","items":["розуміння логіки технологічних та інноваційних рішень","здатність оцінювати нові ринки й можливості","навички прийняття рішень із технологічним контекстом","розуміння взаємозв’язку технологій, економіки та бізнес-моделей","готовність працювати з міждисциплінарними продуктами й командами."]},"listing":{"heading":"Програми напряму","intro":"Досліджуйте технології та індустрії через програми, що","empty_heading":"Нові програми напряму готуються до публікації.","empty_body":""},"closing_cta":{"heading":"Досліджуйте можливості нових індустрій","copy":"Перегляньте програми Technology & Innovation і знайдіть напрям для","label":"Переглянути програми"}}$json$::jsonb, 'Technology & Innovation | Програми Nobel ITBS', 'Професійні програми про технології, інновації та нові', 'Technology & Innovation у Nobel ITBS', 'Розумійте нові технології та перетворюйте їх на обґрунтовані'),
  ('00000000-0000-4000-8000-000000000102', 'cz', 'published', 'Technology & Innovation', 'Technologie vytváří hodnotu, když rozumíme tomu, jak ji využít.', 'Technology & Innovation pomáhá účastníkům orientovat se v prostředí, kde
technologie rychle mění trhy, profese a vývoj produktů. Programy propojují
technologický kontext s byznysem, ekonomikou, managementem a mezinárodní
spoluprací.

Cílem je vytvořit základ pro analýzu nových technologií, kladení správných
otázek a rozhodování s porozuměním jejich možnostem, omezením a praktickému
kontextu.', $json${"eyebrow":"Programme Area","supporting_copy":"Tato oblast sdružuje programy zaměřené na nové technologie,","primary_cta_label":"Zobrazit programy","about":{"heading":"About The Area","content":"Technology & Innovation pomáhá účastníkům orientovat se v prostředí, kde\ntechnologie rychle mění trhy, profese a vývoj produktů. Programy propojují\ntechnologický kontext s byznysem, ekonomikou, managementem a mezinárodní\nspoluprací.\n\nCílem je vytvořit základ pro analýzu nových technologií, kladení správných\notázek a rozhodování s porozuměním jejich možnostem, omezením a praktickému\nkontextu."},"audience":{"heading":"Who This Area Is For","items":["specialisty v technologických a digitálních oborech","manažery a podnikatele pracující s technologickými produkty","profesionály z jiných oborů, kteří potřebují rozumět moderním technologiím","členy týmů vyvíjejících nebo zavádějících inovativní řešení","osoby plánující profesní rozvoj v nových odvětvích."]},"outcomes":{"heading":"What You Develop","items":["porozumění technologickému a inovačnímu rozhodování","schopnost posuzovat nové trhy a příležitosti","rozhodovací dovednosti založené na technologickém kontextu","porozumění vztahu mezi technologiemi, ekonomikou a obchodními modely","připravenost pracovat s mezioborovými produkty a týmy."]},"listing":{"heading":"Programy v této oblasti","intro":"Poznávejte technologie a odvětví prostřednictvím programů,","empty_heading":"Nové programy v této oblasti se připravují ke zveřejnění.","empty_body":""},"closing_cta":{"heading":"Prozkoumejte příležitosti nových odvětví","copy":"Prohlédněte si programy Technology & Innovation a najděte směr pro svou","label":"Zobrazit programy"}}$json$::jsonb, 'Programy Technology & Innovation | Nobel ITBS', 'Profesní programy v oblasti technologií, inovací a nových', 'Technology & Innovation v Nobel ITBS', 'Porozumějte novým technologiím a proměňte toto porozumění v'),
  ('00000000-0000-4000-8000-000000000103', 'en', 'published', 'Psychology & Human', 'Understanding people helps us act with greater care, professionalism,', 'Psychology & Human considers people from different perspectives, from basic
mental processes and age-related development to behavioural patterns, inner
states, and the capacity for self-regulation.

Each programme has its own audience, content, learning volume, and professional
boundaries. Completing an individual programme is not equivalent to qualifying
as a psychologist, psychotherapist, or medical professional.', $json${"eyebrow":"Programme Area","supporting_copy":"This area brings together programmes about the psyche,","primary_cta_label":"View programmes","about":{"heading":"About The Area","content":"Psychology & Human considers people from different perspectives, from basic\nmental processes and age-related development to behavioural patterns, inner\nstates, and the capacity for self-regulation.\n\nEach programme has its own audience, content, learning volume, and professional\nboundaries. Completing an individual programme is not equivalent to qualifying\nas a psychologist, psychotherapist, or medical professional."},"audience":{"heading":"Who This Area Is For","items":["people beginning a structured introduction to psychology","psychologists and professionals in helping roles who wish to deepen their knowledge;","educators and specialists working with children and families","managers, consultants, and professionals whose work involves people","participants interested in self-regulation and behavioural patterns."]},"outcomes":{"heading":"What You Develop","items":["a structured understanding of the psyche and behaviour","knowledge of psychological development across different life stages","sensitivity to emotional states and behavioural responses","understanding of self-regulation and neuroplasticity","the ability to recognise professional boundaries and apply knowledge responsibly."]},"listing":{"heading":"Programmes in this area","intro":"Choose a programme by topic, learning volume, format, and the","empty_heading":"New programmes in this area are being prepared for publication.","empty_body":""},"closing_cta":{"heading":"Choose a programme for a deeper understanding of people","copy":"Compare Psychology & Human programmes by content, format, and learning","label":"View programmes"}}$json$::jsonb, 'Psychology & Human Programmes | Nobel ITBS', 'Programmes in psychology, human development, behaviour, and', 'Psychology & Human at Nobel ITBS', 'Deepen your understanding of the psyche, development,'),
  ('00000000-0000-4000-8000-000000000103', 'ua', 'published', 'Psychology & Human', 'Розуміння людини допомагає діяти уважніше, професійніше й відповідальніше.', 'Psychology & Human розглядає людину в різних вимірах: від базових психічних
процесів і вікового розвитку до поведінкових патернів, внутрішніх станів і
здатності до саморегуляції.

Кожна програма має власну аудиторію, зміст, навчальний обсяг і професійні межі.
Сторінка напряму не прирівнює завершення окремої програми до отримання професії
психолога, психотерапевта або медичного фахівця.', $json${"eyebrow":"Programme Area","supporting_copy":"Напрям об’єднує програми про психіку, поведінку, розвиток,","primary_cta_label":"Переглянути програми","about":{"heading":"About The Area","content":"Psychology & Human розглядає людину в різних вимірах: від базових психічних\nпроцесів і вікового розвитку до поведінкових патернів, внутрішніх станів і\nздатності до саморегуляції.\n\nКожна програма має власну аудиторію, зміст, навчальний обсяг і професійні межі.\nСторінка напряму не прирівнює завершення окремої програми до отримання професії\nпсихолога, психотерапевта або медичного фахівця."},"audience":{"heading":"Who This Area Is For","items":["ті, хто починає системне знайомство з психологією","психологи та фахівці допоміжних професій, які поглиблюють знання","освітяни й спеціалісти, які працюють із дітьми та родинами","менеджери, консультанти й фахівці, чия робота передбачає взаємодію з людьми","учасники, зацікавлені у саморегуляції та розумінні поведінкових патернів."]},"outcomes":{"heading":"What You Develop","items":["системне розуміння психіки й поведінки","знання про психологічний розвиток у різні вікові періоди","уважність до емоційних станів і поведінкових реакцій","розуміння механізмів саморегуляції та нейропластичності","здатність бачити межі компетентності й відповідально застосовувати знання."]},"listing":{"heading":"Програми напряму","intro":"Оберіть програму за тематикою, навчальним обсягом, форматом і","empty_heading":"Нові програми напряму готуються до публікації.","empty_body":""},"closing_cta":{"heading":"Оберіть програму для глибшого розуміння людини","copy":"Порівняйте програми Psychology & Human за змістом, форматом і","label":"Переглянути програми"}}$json$::jsonb, 'Psychology & Human | Програми з психології Nobel ITBS', 'Програми із психології, розвитку людини, поведінки та', 'Psychology & Human у Nobel ITBS', 'Поглиблюйте розуміння психіки, розвитку, поведінки та'),
  ('00000000-0000-4000-8000-000000000103', 'cz', 'published', 'Psychology & Human', 'Porozumění lidem nám pomáhá jednat ohleduplněji, profesionálněji a', 'Psychology & Human nahlíží na člověka z různých perspektiv, od základních
psychických procesů a vývoje v jednotlivých věkových obdobích až po behaviorální
vzorce, vnitřní stavy a schopnost seberegulace.

Každý program má vlastní cílovou skupinu, obsah, rozsah vzdělávání a profesní
hranice. Dokončení jednotlivého programu není rovnocenné získání kvalifikace
psychologa, psychoterapeuta nebo zdravotnického pracovníka.', $json${"eyebrow":"Programme Area","supporting_copy":"Tato oblast sdružuje programy o psychice, chování, vývoji,","primary_cta_label":"Zobrazit programy","about":{"heading":"About The Area","content":"Psychology & Human nahlíží na člověka z různých perspektiv, od základních\npsychických procesů a vývoje v jednotlivých věkových obdobích až po behaviorální\nvzorce, vnitřní stavy a schopnost seberegulace.\n\nKaždý program má vlastní cílovou skupinu, obsah, rozsah vzdělávání a profesní\nhranice. Dokončení jednotlivého programu není rovnocenné získání kvalifikace\npsychologa, psychoterapeuta nebo zdravotnického pracovníka."},"audience":{"heading":"Who This Area Is For","items":["osoby, které začínají se strukturovaným úvodem do psychologie","psychology a profesionály v pomáhajících profesích, kteří si chtějí prohloubit znalosti;","pedagogy a specialisty pracující s dětmi a rodinami","manažery, konzultanty a profesionály, jejichž práce zahrnuje práci s lidmi","účastníky se zájmem o seberegulaci a behaviorální vzorce."]},"outcomes":{"heading":"What You Develop","items":["strukturované porozumění psychice a chování","znalosti psychologického vývoje v různých etapách života","citlivost k emočním stavům a behaviorálním reakcím","porozumění seberegulaci a neuroplasticitě","schopnost rozpoznat profesní hranice a odpovědně uplatňovat znalosti."]},"listing":{"heading":"Programy v této oblasti","intro":"Vyberte si program podle tématu, rozsahu, formátu a výsledku,","empty_heading":"Nové programy v této oblasti se připravují ke zveřejnění.","empty_body":""},"closing_cta":{"heading":"Vyberte si program pro hlubší porozumění člověku","copy":"Porovnejte programy Psychology & Human podle obsahu, formátu a výsledků","label":"Zobrazit programy"}}$json$::jsonb, 'Programy Psychology & Human | Nobel ITBS', 'Programy v oblasti psychologie, lidského rozvoje, chování a', 'Psychology & Human v Nobel ITBS', 'Prohlubte své porozumění psychice, vývoji, chování a')
on conflict (area_id, language_code) do update
set
  translation_status = excluded.translation_status,
  title = excluded.title,
  short_description = excluded.short_description,
  intro_content = excluded.intro_content,
  sections = excluded.sections,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description,
  og_title = excluded.og_title,
  og_description = excluded.og_description;

alter table public.programme_area_translations
  add constraint programme_area_translations_published_landing_complete check (
    translation_status <> 'published'
    or (
      sections ?& array['eyebrow', 'primary_cta_label', 'about', 'audience', 'outcomes', 'listing', 'closing_cta']
      and og_title is not null and btrim(og_title) <> ''
      and og_description is not null and btrim(og_description) <> ''
    )
  );

create or replace function internal.assert_programme_slug_available(
  p_slug text,
  p_entity_type text,
  p_entity_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if exists (
    select 1 from public.programmes where slug = p_slug and (p_entity_type <> 'programme' or id <> p_entity_id)
    union all
    select 1 from public.programme_areas where slug = p_slug and (p_entity_type <> 'area' or id <> p_entity_id)
    union all
    select 1 from public.programme_types where slug = p_slug and (p_entity_type <> 'type' or id <> p_entity_id)
  ) then
    raise unique_violation using
      constraint = 'programme_shared_slug_unique',
      message = format('Programme namespace slug "%s" is already used.', p_slug);
  end if;
end;
$$;

comment on function internal.assert_programme_slug_available(text, text, uuid) is
  'Rejects slug collisions across programmes, programme areas, and programme types.';

revoke all on function internal.assert_programme_slug_available(text, text, uuid) from public;
grant execute on function internal.assert_programme_slug_available(text, text, uuid) to postgres, service_role;

create or replace function internal.enforce_programme_shared_slug()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  entity_type text;
begin
  entity_type := case tg_table_name
    when 'programmes' then 'programme'
    when 'programme_areas' then 'area'
    when 'programme_types' then 'type'
    else null
  end;
  if entity_type is null then
    raise exception 'Unsupported programme namespace table: %', tg_table_name;
  end if;
  perform internal.assert_programme_slug_available(new.slug, entity_type, new.id);
  return new;
end;
$$;

revoke all on function internal.enforce_programme_shared_slug() from public;
grant execute on function internal.enforce_programme_shared_slug() to postgres, service_role;

create trigger programmes_enforce_shared_slug
before insert or update of slug on public.programmes
for each row execute function internal.enforce_programme_shared_slug();

create trigger programme_areas_enforce_shared_slug
before insert or update of slug on public.programme_areas
for each row execute function internal.enforce_programme_shared_slug();

create trigger programme_types_enforce_shared_slug
before insert or update of slug on public.programme_types
for each row execute function internal.enforce_programme_shared_slug();
