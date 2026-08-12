-- CNT-003: Restore the approved Home programme areas and trust cards.
--
-- This forward-only production repair intentionally replaces only the `cards`
-- arrays of `programme_areas` and `why_nobel_itbs` for EN, UA, and CZ.

with approved_home_sections (language_code, area_cards, trust_cards) as (
  values
  (
    'en',
    $json$
    [
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
    $json$::jsonb,
    $json$
    [
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
    $json$::jsonb
  ),
  (
    'ua',
    $json$
    [
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
    $json$::jsonb,
    $json$
    [
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
    $json$::jsonb
  ),
  (
    'cz',
    $json$
    [
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
    $json$::jsonb,
    $json$
    [
      {
        "title": "Applied Professional Education",
        "fields": {
          "title": "Prakticky zaměřené profesní vzdělávání",
          "body": "Programy se zaměřují na kompetence využitelné v profesní činnosti a dalším rozvoji."
        },
        "body": ""
      },
      {
        "title": "Structured Learning",
        "fields": {
          "title": "Srozumitelná struktura",
          "body": "Formát, délka, obsah, výsledky a dokument jsou popsány před zahájením."
        },
        "body": ""
      },
      {
        "title": "Own And Partner Programmes",
        "fields": {
          "title": "Vlastní a partnerské programy",
          "body": "Nobel ITBS vytváří vlastní vzdělávací produkty a poskytuje infrastrukturu partnerským programům."
        },
        "body": ""
      },
      {
        "title": "Verifiable Credentials",
        "fields": {
          "title": "Ověřitelné dokumenty",
          "body": "Stav dokumentů registrovaných u Nobel ITBS lze ověřit podle čísla nebo QR kódu."
        },
        "body": ""
      }
    ]
    $json$::jsonb
  )
),
home_page as (
  select id
  from public.content_pages
  where page_key = 'home'
),
rebuilt_sections as (
  select
    translation.page_id,
    translation.language_code,
    jsonb_set(
      translation.sections,
      '{blocks}',
      (
        select jsonb_agg(
          case block.value ->> 'key'
            when 'programme_areas' then jsonb_set(block.value, '{cards}', approved.area_cards, true)
            when 'why_nobel_itbs' then jsonb_set(block.value, '{cards}', approved.trust_cards, true)
            else block.value
          end
          order by block.ordinality
        )
        from jsonb_array_elements(translation.sections -> 'blocks') with ordinality as block(value, ordinality)
      ),
      false
    ) as sections
  from public.content_page_translations as translation
  join home_page on home_page.id = translation.page_id
  join approved_home_sections as approved on approved.language_code = translation.language_code
)
update public.content_page_translations as translation
set sections = rebuilt.sections
from rebuilt_sections as rebuilt
where translation.page_id = rebuilt.page_id
  and translation.language_code = rebuilt.language_code;

do $$
declare
  valid_translation_count integer;
begin
  select count(*)
  into valid_translation_count
  from public.content_page_translations as translation
  join public.content_pages as page on page.id = translation.page_id
  cross join lateral jsonb_path_query_first(
    translation.sections,
    '$.blocks[*] ? (@.key == "programme_areas")'
  ) as areas(block)
  cross join lateral jsonb_path_query_first(
    translation.sections,
    '$.blocks[*] ? (@.key == "why_nobel_itbs")'
  ) as trust(block)
  where page.page_key = 'home'
    and translation.language_code in ('en', 'ua', 'cz')
    and jsonb_array_length(areas.block -> 'cards') = 3
    and jsonb_array_length(trust.block -> 'cards') = 4;

  if valid_translation_count <> 3 then
    raise exception 'CNT-003 production Home repair expected 3 valid translations, found %', valid_translation_count;
  end if;
end;
$$;
