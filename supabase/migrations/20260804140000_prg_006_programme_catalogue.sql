-- PRG-006: Programme Catalogue
-- Public comparison fields, deterministic ordering, and future-filter language data.

alter table public.programmes
  add column catalogue_sort_order integer not null default 0,
  add column instruction_language_codes text[] not null default '{}'::text[];

alter table public.programmes
  add constraint programmes_catalogue_sort_order_nonnegative
    check (catalogue_sort_order >= 0);

comment on column public.programmes.catalogue_sort_order is
  'Stable manager-controlled order in the unfiltered Release 1 public catalogue.';
comment on column public.programmes.instruction_language_codes is
  'ISO 639-1 language codes used for future catalogue filtering; independent from the website locale.';

alter table public.programme_translations
  add column catalogue_description text null,
  add column catalogue_facts text null,
  add column catalogue_document_summary text null;

comment on column public.programme_translations.catalogue_description is
  'Localized short value description used by programme listings.';
comment on column public.programme_translations.catalogue_facts is
  'Localized compact duration, volume, format, access, and instruction-language summary.';
comment on column public.programme_translations.catalogue_document_summary is
  'Localized factual summary of the completion document; no pricing content.';

update public.programmes
set
  catalogue_sort_order = seed.catalogue_sort_order,
  instruction_language_codes = seed.instruction_language_codes
from (
  values
    ('ai-production', 10, array['uk']::text[]),
    ('general-psychology', 20, array['uk']::text[]),
    ('child-psychology', 30, array['uk']::text[]),
    ('neuroplastic-reconstruction', 40, array['uk']::text[]),
    ('space-business', 50, array['uk', 'en']::text[])
) as seed(slug, catalogue_sort_order, instruction_language_codes)
where programmes.slug = seed.slug;

alter table public.programmes
  add constraint programmes_instruction_languages_required check (
    publication_status <> 'published'
    or cardinality(instruction_language_codes) > 0
  );

update public.programme_translations
set
  catalogue_description = seed.catalogue_description,
  catalogue_facts = seed.catalogue_facts,
  catalogue_document_summary = seed.catalogue_document_summary
from (
  values
    ('00000000-0000-4000-8000-000000000301'::uuid, 'en',
      'Create, launch, and scale expert-led and educational products with product strategy, marketing, sales, management, and AI.',
      '6 months · 360 hours / 12 ECTS · distance learning · Ukrainian',
      'University certificate after 3 months and an international Mini-MBA diploma with Diploma Supplement after completing the full programme.'),
    ('00000000-0000-4000-8000-000000000301'::uuid, 'ua',
      'Створюйте, запускайте й масштабуйте експертні та освітні продукти за допомогою продуктової стратегії, маркетингу, продажів, управління й AI.',
      '6 місяців · 360 годин / 12 ECTS · дистанційне навчання · українська',
      'Університетський сертифікат після 3 місяців і міжнародний диплом Mini-MBA з Diploma Supplement після завершення програми.'),
    ('00000000-0000-4000-8000-000000000301'::uuid, 'cz',
      'Vytvářejte, uvádějte na trh a škálujte expertní a vzdělávací produkty pomocí produktové strategie, marketingu, prodeje, managementu a AI.',
      '6 měsíců · 360 hodin / 12 ECTS · distanční výuka · ukrajinština',
      'Univerzitní certifikát po 3 měsících a mezinárodní diplom Mini-MBA s Diploma Supplement po dokončení celého programu.'),

    ('00000000-0000-4000-8000-000000000302'::uuid, 'en',
      'Build a structured foundation in the psyche, personality, motivation, emotions, and cognitive processes.',
      '90 hours / 3 ECTS · distance learning in Moodle · 1-year access · Ukrainian',
      'Professional development certificate from the University of Alfred Nobel.'),
    ('00000000-0000-4000-8000-000000000302'::uuid, 'ua',
      'Сформуйте системну основу знань про психіку, особистість, мотивацію, емоції та пізнавальні процеси.',
      '90 годин / 3 ECTS · дистанційно в Moodle · доступ на 1 рік · українська',
      'Сертифікат про підвищення кваліфікації від Університету імені Альфреда Нобеля.'),
    ('00000000-0000-4000-8000-000000000302'::uuid, 'cz',
      'Vybudujte si strukturovaný základ v oblasti psychiky, osobnosti, motivace, emocí a kognitivních procesů.',
      '90 hodin / 3 ECTS · distanční výuka v Moodle · přístup na 1 rok · ukrajinština',
      'Certifikát profesního rozvoje od Univerzity Alfreda Nobela.'),

    ('00000000-0000-4000-8000-000000000303'::uuid, 'en',
      'Deepen your understanding of child development, age-related characteristics, and responsible psychological support.',
      '90 hours / 3 ECTS · distance learning in Moodle · 6-month access · Ukrainian',
      'Professional development certificate from the University of Alfred Nobel.'),
    ('00000000-0000-4000-8000-000000000303'::uuid, 'ua',
      'Поглибте розуміння психологічного розвитку дитини, вікових особливостей і відповідального психологічного супроводу.',
      '90 годин / 3 ECTS · дистанційно в Moodle · доступ на 6 місяців · українська',
      'Сертифікат про підвищення кваліфікації від Університету імені Альфреда Нобеля.'),
    ('00000000-0000-4000-8000-000000000303'::uuid, 'cz',
      'Prohlubte své porozumění vývoji dítěte, věkovým specifikům a odpovědné psychologické podpoře.',
      '90 hodin / 3 ECTS · distanční výuka v Moodle · přístup na 6 měsíců · ukrajinština',
      'Certifikát profesního rozvoje od Univerzity Alfreda Nobela.'),

    ('00000000-0000-4000-8000-000000000304'::uuid, 'en',
      'Explore neuroplasticity, self-regulation, and behavioural patterns in a structured 12-module programme.',
      '3 months · 180 hours / 6 ECTS · blended distance learning · Ukrainian',
      'Documents and professional status depend on the selected pricing tier.'),
    ('00000000-0000-4000-8000-000000000304'::uuid, 'ua',
      'Досліджуйте нейропластичність, саморегуляцію та поведінкові патерни у структурованій 12-модульній програмі.',
      '3 місяці · 180 годин / 6 ECTS · змішане дистанційне навчання · українська',
      'Документи та професійний статус залежать від обраного тарифу.'),
    ('00000000-0000-4000-8000-000000000304'::uuid, 'cz',
      'Prozkoumejte neuroplasticitu, seberegulaci a behaviorální vzorce ve strukturovaném programu o 12 modulech.',
      '3 měsíce · 180 hodin / 6 ECTS · kombinovaná distanční výuka · ukrajinština',
      'Dokumenty a profesní status závisí na zvolené cenové variantě.'),

    ('00000000-0000-4000-8000-000000000305'::uuid, 'en',
      'Understand the space market, technology, start-ups, economics, law, and models of international cooperation.',
      '90 hours · distance learning in Moodle · Ukrainian and English',
      'Certificate issued by the University of Alfred Nobel; hours are not stated on the certificate.'),
    ('00000000-0000-4000-8000-000000000305'::uuid, 'ua',
      'Зрозумійте космічний ринок, технології, стартапи, економіку, право та моделі міжнародної співпраці.',
      '90 годин · дистанційно в Moodle · українська та англійська',
      'Сертифікат Університету імені Альфреда Нобеля; години на сертифікаті не зазначаються.'),
    ('00000000-0000-4000-8000-000000000305'::uuid, 'cz',
      'Porozumějte vesmírnému trhu, technologiím, start-upům, ekonomice, právu a modelům mezinárodní spolupráce.',
      '90 hodin · distanční výuka v Moodle · ukrajinština a angličtina',
      'Certifikát Univerzity Alfreda Nobela; počet hodin se na certifikátu neuvádí.')
) as seed(
  programme_id,
  language_code,
  catalogue_description,
  catalogue_facts,
  catalogue_document_summary
)
where programme_translations.programme_id = seed.programme_id
  and programme_translations.language_code = seed.language_code;

alter table public.programme_translations
  add constraint programme_translations_published_catalogue_complete check (
    translation_status <> 'published'
    or (
      catalogue_description is not null and btrim(catalogue_description) <> ''
      and catalogue_facts is not null and btrim(catalogue_facts) <> ''
      and catalogue_document_summary is not null and btrim(catalogue_document_summary) <> ''
    )
  );

create index programmes_public_catalogue_order_idx
  on public.programmes (publication_status, catalogue_sort_order, created_at);

create index programmes_instruction_languages_idx
  on public.programmes using gin (instruction_language_codes);
