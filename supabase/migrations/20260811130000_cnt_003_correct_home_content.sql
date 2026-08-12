-- CNT-003: Restore the approved Home master copy for EN, UA, and CZ.
--
-- This is a forward-only correction for malformed JSON introduced by
-- 20260805120000_cnt_003_public_layout_navigation.sql. It intentionally updates
-- only the three translations of the existing `home` content page.

with approved_home_content (
  language_code,
  seo_title,
  seo_description,
  h1,
  sections
) as (
  values
  (
    'en',
    'Nobel ITBS | Professional Education and Verifiable Documents',
    'Professional Nobel ITBS programmes in business, technology and psychology. Distance learning for adults and documents that can be verified online.',
    'Education that moves you forward',
    $json$
    {
      "blocks": [
        {
          "key": "hero",
          "title": "Hero",
          "fields": {
            "eyebrow": "Professional education for adults",
            "h1": "Education that moves you forward",
            "lead": "Professional programmes for development, career change and new opportunities in business, technology and working with people.",
            "supporting_text": "Nobel ITBS combines applied learning, an international context and a clear document system with online verification.",
            "primary_cta": "Explore programmes",
            "primary_cta_target": "/programmes"
          },
          "body": "",
          "cards": []
        },
        {
          "key": "verification_utility",
          "title": "Verification Utility",
          "fields": {
            "title": "Verify a document",
            "body": "Enter the document number or scan the QR code to check its status.",
            "input_label": "Document number",
            "input_placeholder": "For example, NITBS-C-2026-000123",
            "submit_label": "Verify",
            "link_label": "How verification works",
            "link_target": "/verify"
          },
          "body": "",
          "cards": []
        },
        {
          "key": "programme_areas",
          "title": "Programme Areas",
          "fields": {
            "eyebrow": "Programme areas",
            "h2": "Choose your professional pathway",
            "intro": "Each area brings together programmes with a clear professional goal, defined learning format and transparent outcome.",
            "section_cta": "View all programmes"
          },
          "body": "",
          "cards": [
            {
              "title": "Business & Management",
              "fields": {
                "title": "Business & Management",
                "body": "Management, entrepreneurship, AI production and competencies for developing businesses and teams.",
                "featured_programme": "AI Production"
              },
              "body": ""
            },
            {
              "title": "Technology & Innovation",
              "fields": {
                "title": "Technology & Innovation",
                "body": "Technology markets, innovation and emerging industries at the intersection of technology, economics and management.",
                "featured_programme": "Space Business"
              },
              "body": ""
            },
            {
              "title": "Psychology & Human",
              "fields": {
                "title": "Psychology & Human",
                "body": "Psychology, human development, self-regulation and professional approaches to behaviour and change.",
                "featured_programmes": "General Psychology; Child Psychology; Neuroplastic Reconstruction"
              },
              "body": ""
            }
          ]
        },
        {
          "key": "featured_programmes",
          "title": "Featured Programmes",
          "fields": {
            "eyebrow": "Nobel ITBS programmes",
            "h2": "Learning with a clear purpose",
            "intro": "Five programmes in different formats, from continuously available distance courses to a Mini-MBA and partner professional development programmes.",
            "section_cta": "Explore all programmes"
          },
          "body": "Programme cards are populated from the programme catalogue and must use approved programme master copy. The Home page must not maintain a second independent version of programme duration, price, document, or instruction-language facts.",
          "cards": []
        },
        {
          "key": "why_nobel_itbs",
          "title": "Why Nobel ITBS",
          "fields": {
            "eyebrow": "Why Nobel ITBS",
            "h2": "Education you can trust",
            "lead": "We build learning as a complete professional pathway, from a clear programme and outcomes to a properly issued document."
          },
          "body": "",
          "cards": [
            {
              "title": "Applied Professional Education",
              "fields": {
                "title": "Applied professional education",
                "body": "Programmes focus on competencies that can be used in professional work and further development."
              },
              "body": ""
            },
            {
              "title": "Structured Learning",
              "fields": {
                "title": "Clear structure",
                "body": "The format, duration, content, learning outcomes and document are described before learning begins."
              },
              "body": ""
            },
            {
              "title": "Own And Partner Programmes",
              "fields": {
                "title": "Own and partner programmes",
                "body": "Nobel ITBS creates its own educational products and provides infrastructure for partner programmes."
              },
              "body": ""
            },
            {
              "title": "Verifiable Credentials",
              "fields": {
                "title": "Verifiable documents",
                "body": "The status of documents registered with Nobel ITBS can be checked by document number or QR code."
              },
              "body": ""
            }
          ]
        },
        {
          "key": "how_the_model_works",
          "title": "How The Model Works",
          "fields": {
            "eyebrow": "From programme to confirmed outcome",
            "h2": "Learning, document, verification",
            "step_1_title": "Choose a programme",
            "step_1_body": "Compare its purpose, content, format, duration and learning outcome.",
            "step_2_title": "Complete your learning",
            "step_2_body": "Learn in the format defined by the programme and meet its completion requirements.",
            "step_3_title": "Receive your document",
            "step_3_body": "The type and scope of the document depend on the specific programme and are published on its page.",
            "step_4_title": "Confirm its authenticity",
            "step_4_body": "If the document is registered with Nobel ITBS, its status can be verified online."
          },
          "body": "",
          "cards": []
        },
        {
          "key": "for_organisations",
          "title": "For Organisations",
          "fields": {
            "eyebrow": "For online schools and experts",
            "h2": "Infrastructure for educational programmes and documents",
            "body": "Nobel ITBS helps online schools, experts and authors structure educational programmes and develop a document model. The infrastructure may include preparing documents and supplements, registration and online verification.",
            "primary_cta": "For organisations",
            "secondary_link": "Partnerships"
          },
          "body": "",
          "cards": []
        },
        {
          "key": "institutional_bridge",
          "title": "Institutional Bridge",
          "fields": {
            "eyebrow": "About Nobel ITBS",
            "h2": "A European platform for professional education",
            "body": "Nobel ITBS is a European professional education platform for adults and organisations, working across Business & Management, Technology & Innovation and Psychology & Human.",
            "cta": "Learn more about Nobel ITBS",
            "cta_target": "/about"
          },
          "body": "",
          "cards": []
        },
        {
          "key": "final_cta",
          "title": "Final CTA",
          "fields": {
            "h2": "Find a programme for your next step",
            "body": "Explore the programme areas, compare formats and choose the programme that matches your professional goal.",
            "cta": "Explore programmes"
          },
          "body": "",
          "cards": []
        }
      ]
    }
    $json$::jsonb
  ),
  (
    'ua',
    'Nobel ITBS | Професійна освіта та верифіковані документи',
    'Професійні програми Nobel ITBS у бізнесі, технологіях та психології. Дистанційне навчання для дорослих і документи, які можна перевірити онлайн.',
    'Освіта, що рухає вперед',
    $json$
    {
      "blocks": [
        {
          "key": "hero",
          "title": "Hero",
          "fields": {
            "eyebrow": "Професійна освіта для дорослих",
            "h1": "Освіта, що рухає вперед",
            "lead": "Професійні програми для розвитку, зміни кар'єри та нових рішень у бізнесі, технологіях і роботі з людьми.",
            "supporting_text": "Nobel ITBS поєднує прикладне навчання, міжнародний контекст і зрозумілу систему документів із можливістю онлайн-верифікації.",
            "primary_cta": "Переглянути програми",
            "primary_cta_target": "/ua/programmes"
          },
          "body": "",
          "cards": []
        },
        {
          "key": "verification_utility",
          "title": "Verification Utility",
          "fields": {
            "title": "Перевірити документ",
            "body": "Введіть номер документа або відскануйте QR-код, щоб перевірити його статус.",
            "input_label": "Номер документа",
            "input_placeholder": "Наприклад, NITBS-C-2026-000123",
            "submit_label": "Перевірити",
            "link_label": "Як працює верифікація",
            "link_target": "/ua/verify"
          },
          "body": "",
          "cards": []
        },
        {
          "key": "programme_areas",
          "title": "Programme Areas",
          "fields": {
            "eyebrow": "Напрями навчання",
            "h2": "Оберіть професійну траєкторію",
            "intro": "Кожен напрям об'єднує програми з чіткою професійною метою, визначеним форматом навчання та зрозумілим результатом.",
            "section_cta": "Усі програми"
          },
          "body": "",
          "cards": [
            {
              "title": "Business & Management",
              "fields": {
                "title": "Business & Management",
                "body": "Управління, підприємництво, AI-продюсування та компетентності для розвитку бізнесу й команд.",
                "featured_programme": "AI Production"
              },
              "body": ""
            },
            {
              "title": "Technology & Innovation",
              "fields": {
                "title": "Technology & Innovation",
                "body": "Технологічні ринки, інновації та нові індустрії на перетині технологій, економіки й управління.",
                "featured_programme": "Space Business"
              },
              "body": ""
            },
            {
              "title": "Psychology & Human",
              "fields": {
                "title": "Psychology & Human",
                "body": "Психологія, розвиток людини, саморегуляція та професійні підходи до роботи з поведінкою і змінами.",
                "featured_programmes": "Загальна психологія; Дитяча психологія; Нейропластична реконструкція"
              },
              "body": ""
            }
          ]
        },
        {
          "key": "featured_programmes",
          "title": "Featured Programmes",
          "fields": {
            "eyebrow": "Програми Nobel ITBS",
            "h2": "Навчання з конкретною метою",
            "intro": "П'ять програм різного формату — від постійно доступних дистанційних курсів до Mini-MBA та партнерських програм професійного розвитку.",
            "section_cta": "Переглянути всі програми"
          },
          "body": "Programme cards are populated from the programme catalogue and must use approved programme master copy. The Home page must not maintain a second independent version of programme duration, price, document, or instruction-language facts.",
          "cards": []
        },
        {
          "key": "why_nobel_itbs",
          "title": "Why Nobel ITBS",
          "fields": {
            "eyebrow": "Чому Nobel ITBS",
            "h2": "Освіта, якій можна довіряти",
            "lead": "Ми будуємо навчання як цілісну професійну траєкторію: від зрозумілої програми та результатів до належно оформленого документа."
          },
          "body": "",
          "cards": [
            {
              "title": "Applied Professional Education",
              "fields": {
                "title": "Прикладна професійна освіта",
                "body": "Програми орієнтовані на компетентності, які можна використовувати у професійній діяльності та подальшому розвитку."
              },
              "body": ""
            },
            {
              "title": "Structured Learning",
              "fields": {
                "title": "Зрозуміла структура",
                "body": "Формат, тривалість, зміст, результати навчання та документ описуються до початку навчання."
              },
              "body": ""
            },
            {
              "title": "Own And Partner Programmes",
              "fields": {
                "title": "Власні та партнерські програми",
                "body": "Nobel ITBS створює власні освітні продукти та надає інфраструктуру для партнерських програм."
              },
              "body": ""
            },
            {
              "title": "Verifiable Credentials",
              "fields": {
                "title": "Верифіковані документи",
                "body": "Для документів, внесених до реєстру Nobel ITBS, статус можна перевірити за номером або QR-кодом."
              },
              "body": ""
            }
          ]
        },
        {
          "key": "how_the_model_works",
          "title": "How The Model Works",
          "fields": {
            "eyebrow": "Від програми до підтвердженого результату",
            "h2": "Навчання, документ, верифікація",
            "step_1_title": "Обираєте програму",
            "step_1_body": "Порівнюєте мету, зміст, формат, тривалість і результат навчання.",
            "step_2_title": "Проходите навчання",
            "step_2_body": "Навчаєтеся у визначеному програмою форматі та виконуєте умови її завершення.",
            "step_3_title": "Отримуєте документ",
            "step_3_body": "Вид документа та його обсяг залежать від конкретної програми й публікуються на її сторінці.",
            "step_4_title": "Підтверджуєте справжність",
            "step_4_body": "Якщо документ зареєстрований у Nobel ITBS, його статус можна перевірити онлайн."
          },
          "body": "",
          "cards": []
        },
        {
          "key": "for_organisations",
          "title": "For Organisations",
          "fields": {
            "eyebrow": "Для онлайн-шкіл та експертів",
            "h2": "Інфраструктура для освітніх програм і документів",
            "body": "Nobel ITBS допомагає онлайн-школам, експертам і авторам структурувати освітні програми та вибудовувати модель документів. Інфраструктура може включати підготовку документів і додатків, реєстрацію та онлайн-верифікацію.",
            "primary_cta": "Для організацій",
            "secondary_link": "Партнерства"
          },
          "body": "",
          "cards": []
        },
        {
          "key": "institutional_bridge",
          "title": "Institutional Bridge",
          "fields": {
            "eyebrow": "Про Nobel ITBS",
            "h2": "Європейська платформа професійної освіти",
            "body": "Nobel ITBS — європейська платформа професійної освіти для дорослих та організацій, що працює на перетині Business & Management, Technology & Innovation і Psychology & Human.",
            "cta": "Дізнатися більше про Nobel ITBS",
            "cta_target": "/ua/about"
          },
          "body": "",
          "cards": []
        },
        {
          "key": "final_cta",
          "title": "Final CTA",
          "fields": {
            "h2": "Знайдіть програму для свого наступного кроку",
            "body": "Перегляньте напрями, порівняйте формати й оберіть програму, що відповідає вашій професійній меті.",
            "cta": "Переглянути програми"
          },
          "body": "",
          "cards": []
        }
      ]
    }
    $json$::jsonb
  ),
  (
    'cz',
    'Nobel ITBS | Profesní vzdělávání a ověřitelné dokumenty',
    'Profesní programy Nobel ITBS v oblasti byznysu, technologií a psychologie. Distanční vzdělávání dospělých a dokumenty ověřitelné online.',
    'Vzdělávání, které vás posouvá',
    $json$
    {
      "blocks": [
        {
          "key": "hero",
          "title": "Hero",
          "fields": {
            "eyebrow": "Profesní vzdělávání pro dospělé",
            "h1": "Vzdělávání, které vás posouvá",
            "lead": "Profesní programy pro rozvoj, změnu kariéry a nové možnosti v byznysu, technologiích a práci s lidmi.",
            "supporting_text": "Nobel ITBS propojuje prakticky zaměřené vzdělávání, mezinárodní kontext a srozumitelný systém dokumentů s online ověřováním.",
            "primary_cta": "Prohlédnout programy",
            "primary_cta_target": "/cz/programmes"
          },
          "body": "",
          "cards": []
        },
        {
          "key": "verification_utility",
          "title": "Verification Utility",
          "fields": {
            "title": "Ověřit dokument",
            "body": "Zadejte číslo dokumentu nebo naskenujte QR kód a ověřte jeho stav.",
            "input_label": "Číslo dokumentu",
            "input_placeholder": "Například NITBS-C-2026-000123",
            "submit_label": "Ověřit",
            "link_label": "Jak ověřování funguje",
            "link_target": "/cz/verify"
          },
          "body": "",
          "cards": []
        },
        {
          "key": "programme_areas",
          "title": "Programme Areas",
          "fields": {
            "eyebrow": "Oblasti vzdělávání",
            "h2": "Zvolte si profesní cestu",
            "intro": "Každá oblast sdružuje programy s jasným profesním cílem, vymezeným formátem a srozumitelným výsledkem.",
            "section_cta": "Všechny programy"
          },
          "body": "",
          "cards": [
            {
              "title": "Business & Management",
              "fields": {
                "title": "Business & Management",
                "body": "Management, podnikání, AI produkce a kompetence pro rozvoj firem a týmů.",
                "featured_programme": "AI Production"
              },
              "body": ""
            },
            {
              "title": "Technology & Innovation",
              "fields": {
                "title": "Technology & Innovation",
                "body": "Technologické trhy, inovace a nová odvětví na průsečíku technologií, ekonomiky a managementu.",
                "featured_programme": "Space Business"
              },
              "body": ""
            },
            {
              "title": "Psychology & Human",
              "fields": {
                "title": "Psychology & Human",
                "body": "Psychologie, lidský rozvoj, seberegulace a profesní přístupy k chování a změně.",
                "featured_programmes": "General Psychology; Child Psychology; Neuroplastic Reconstruction"
              },
              "body": ""
            }
          ]
        },
        {
          "key": "featured_programmes",
          "title": "Featured Programmes",
          "fields": {
            "eyebrow": "Programy Nobel ITBS",
            "h2": "Vzdělávání s konkrétním cílem",
            "intro": "Pět programů v různých formátech, od trvale dostupných distančních kurzů až po Mini-MBA a partnerské programy profesního rozvoje.",
            "section_cta": "Prohlédnout všechny programy"
          },
          "body": "Programové karty čerpají údaje ze schválených master-copy a nesmějí udržovat samostatnou verzi délky, ceny, dokumentu ani jazyka výuky.",
          "cards": []
        },
        {
          "key": "why_nobel_itbs",
          "title": "Why Nobel ITBS",
          "fields": {
            "eyebrow": "Proč Nobel ITBS",
            "h2": "Vzdělávání, kterému můžete důvěřovat",
            "lead": "Vzdělávání vytváříme jako ucelenou profesní cestu, od jasného programu a výsledků až po řádně vydaný dokument.",
            "title_1": "Prakticky zaměřené profesní vzdělávání",
            "body_1": "Programy se zaměřují na kompetence využitelné v profesní činnosti a dalším rozvoji.",
            "title_2": "Srozumitelná struktura",
            "body_2": "Formát, délka, obsah, výsledky a dokument jsou popsány před zahájením.",
            "title_3": "Vlastní a partnerské programy",
            "body_3": "Nobel ITBS vytváří vlastní vzdělávací produkty a poskytuje infrastrukturu partnerským programům.",
            "title_4": "Ověřitelné dokumenty",
            "body_4": "Stav dokumentů registrovaných u Nobel ITBS lze ověřit podle čísla nebo QR kódu."
          },
          "body": "",
          "cards": []
        },
        {
          "key": "how_the_model_works",
          "title": "How The Model Works",
          "fields": {
            "eyebrow": "Od programu k potvrzenému výsledku",
            "h2": "Vzdělávání, dokument, ověření",
            "step_1_title": "Vyberete si program",
            "step_1_body": "Porovnáte cíl, obsah, formát, délku a výsledek vzdělávání.",
            "step_2_title": "Absolvujete vzdělávání",
            "step_2_body": "Studujete ve stanoveném formátu a splníte podmínky dokončení.",
            "step_3_title": "Získáte dokument",
            "step_3_body": "Typ a rozsah dokumentu závisí na konkrétním programu a je uveden na jeho stránce.",
            "step_4_title": "Ověříte pravost",
            "step_4_body": "Je-li dokument registrován u Nobel ITBS, lze jeho stav ověřit online."
          },
          "body": "",
          "cards": []
        },
        {
          "key": "for_organisations",
          "title": "For Organisations",
          "fields": {
            "eyebrow": "Pro online školy a experty",
            "h2": "Infrastruktura pro vzdělávací programy a dokumenty",
            "body": "Nobel ITBS pomáhá online školám, expertům a autorům strukturovat vzdělávací programy a vytvářet model dokumentů. Infrastruktura může zahrnovat přípravu dokumentů a dodatků, registraci a online ověřování.",
            "primary_cta": "Pro organizace",
            "secondary_link": "Partnerství"
          },
          "body": "",
          "cards": []
        },
        {
          "key": "institutional_bridge",
          "title": "Institutional Bridge",
          "fields": {
            "eyebrow": "O Nobel ITBS",
            "h2": "Evropská platforma profesního vzdělávání",
            "body": "Nobel ITBS je evropská platforma profesního vzdělávání pro dospělé a organizace působící v oblastech Business & Management, Technology & Innovation a Psychology & Human.",
            "cta": "Více o Nobel ITBS",
            "cta_target": "/cz/about"
          },
          "body": "",
          "cards": []
        },
        {
          "key": "final_cta",
          "title": "Final CTA",
          "fields": {
            "h2": "Najděte program pro svůj další krok",
            "body": "Prohlédněte si oblasti, porovnejte formáty a vyberte program odpovídající vašemu profesnímu cíli.",
            "cta": "Prohlédnout programy"
          },
          "body": "",
          "cards": []
        }
      ]
    }
    $json$::jsonb
  )
)
update public.content_page_translations as translation
set
  translation_status = 'published'::public.translation_status,
  seo_title = approved.seo_title,
  seo_description = approved.seo_description,
  h1 = approved.h1,
  sections = approved.sections
from approved_home_content as approved
where translation.page_id = (
  select page.id
  from public.content_pages as page
  where page.page_key = 'home'
)
and translation.language_code = approved.language_code;

do $$
declare
  corrected_translation_count integer;
  invalid_block_count integer;
begin
  select count(*)
  into corrected_translation_count
  from public.content_page_translations as translation
  join public.content_pages as page on page.id = translation.page_id
  where page.page_key = 'home'
    and translation.language_code in ('en', 'ua', 'cz')
    and translation.translation_status = 'published';

  if corrected_translation_count <> 3 then
    raise exception 'CNT-003 Home correction expected 3 published translations, found %', corrected_translation_count;
  end if;

  select count(*)
  into invalid_block_count
  from public.content_page_translations as translation
  join public.content_pages as page on page.id = translation.page_id
  cross join lateral jsonb_path_query_first(
    translation.sections,
    '$.blocks[*] ? (@.key == "programme_areas")'
  ) as areas(block)
  cross join lateral jsonb_path_query_first(
    translation.sections,
    '$.blocks[*] ? (@.key == "how_the_model_works")'
  ) as model(block)
  where page.page_key = 'home'
    and translation.language_code in ('en', 'ua', 'cz')
    and (
      jsonb_array_length(areas.block -> 'cards') <> 3
      or model.block #>> '{fields,step_4_title}' is null
      or model.block #>> '{fields,step_4_body}' is null
    );

  if invalid_block_count <> 0 then
    raise exception 'CNT-003 Home correction left % invalid translations', invalid_block_count;
  end if;
end;
$$;
