-- QA-I18N-001: add localized display labels to UA/CZ managed-page blocks while
-- retaining the stable English structural keys used by the content model.

begin;

do $$
declare
  affected_rows integer;
begin
  with localization(page_key, language_code, block_fields, card_titles) as (
    values
      (
        'about',
        'ua',
        '{"who_we_work_with":{"h2":"Для кого ми працюємо"}}'::jsonb,
        '{}'::jsonb
      ),
      (
        'about',
        'cz',
        '{"who_we_work_with":{"eyebrow":"Pro koho pracujeme","h2":"Pro koho pracujeme"}}'::jsonb,
        '{}'::jsonb
      ),
      (
        'partnerships',
        'ua',
        '{"hero":{"eyebrow":"Партнерства"},"partnership_principles":{"h2":"Принципи партнерства"},"partnership_models":{"h2":"Моделі партнерства"},"partnership_boundaries":{"h2":"Межі партнерства"}}'::jsonb,
        '{"partnership_models":{"Programme Partnership":"Партнерство у створенні програм","Expert Partnership":"Експертне партнерство","Infrastructure Partnership":"Інфраструктурне партнерство","Distribution And Promotion Partnership":"Партнерство у представленні та просуванні"}}'::jsonb
      ),
      (
        'partnerships',
        'cz',
        '{"hero":{"eyebrow":"Partnerství"},"partnership_principles":{"h2":"Zásady partnerství"},"partnership_models":{"h2":"Modely partnerství"},"partnership_boundaries":{"h2":"Hranice partnerství"}}'::jsonb,
        '{"partnership_models":{"Programme Partnership":"Partnerství při tvorbě programů","Expert Partnership":"Expertní partnerství","Infrastructure Partnership":"Infrastrukturní partnerství","Distribution And Promotion Partnership":"Partnerství pro distribuci a propagaci"}}'::jsonb
      ),
      (
        'for_organisations',
        'ua',
        '{"hero":{"eyebrow":"B2B-інфраструктура"},"the_business_need":{"h2":"Бізнес-потреба"},"who_we_work_with":{"h2":"З ким ми працюємо"},"infrastructure_services":{"h2":"Інфраструктурні послуги"},"what_the_client_receives":{"h2":"Що отримує клієнт"},"how_cooperation_works":{"h2":"Як відбувається співпраця"},"trust_and_boundaries":{"h2":"Довіра та межі"},"faq":{"h2":"Поширені запитання"}}'::jsonb,
        '{"who_we_work_with":{"Online Schools":"Онлайн-школи","Experts And Programme Authors":"Експерти та автори програм","Educational Projects":"Освітні проєкти"},"infrastructure_services":{"Programme Structuring":"Структурування програми","Document Model":"Модель документів","Document Preparation And Supplements":"Підготовка документів і додатків","Registration And Verification":"Реєстрація та верифікація","Partnership Workflow":"Процес партнерства"}}'::jsonb
      ),
      (
        'for_organisations',
        'cz',
        '{"hero":{"eyebrow":"B2B infrastruktura"},"the_business_need":{"h2":"Obchodní potřeba"},"who_we_work_with":{"h2":"S kým spolupracujeme"},"infrastructure_services":{"h2":"Infrastrukturní služby"},"what_the_client_receives":{"h2":"Co klient získá"},"how_cooperation_works":{"h2":"Jak spolupráce probíhá"},"trust_and_boundaries":{"h2":"Důvěra a hranice"},"faq":{"h2":"Časté dotazy"}}'::jsonb,
        '{"who_we_work_with":{"Online Schools":"Online školy","Experts And Programme Authors":"Experti a autoři programů","Educational Projects":"Vzdělávací projekty"},"infrastructure_services":{"Programme Structuring":"Strukturování programu","Document Model":"Model dokumentů","Document Preparation And Supplements":"Příprava dokumentů a dodatků","Registration And Verification":"Registrace a ověřování","Partnership Workflow":"Průběh partnerství"}}'::jsonb
      )
  )
  update public.content_page_translations as translation
  set sections = jsonb_set(
    translation.sections,
    '{blocks}',
    (
      select jsonb_agg(
        (
          block_item.block
          || jsonb_build_object(
            'fields',
            coalesce(block_item.block->'fields', '{}'::jsonb)
            || coalesce(
              localization.block_fields->(block_item.block->>'key'),
              '{}'::jsonb
            )
          )
        )
        || case
          when localization.card_titles ? (block_item.block->>'key') then
            jsonb_build_object(
              'cards',
              (
                select jsonb_agg(
                  card_item.card
                  || jsonb_build_object(
                    'fields',
                    coalesce(card_item.card->'fields', '{}'::jsonb)
                    || case
                      when localization.card_titles->(block_item.block->>'key')
                        ? (card_item.card->>'title') then
                        jsonb_build_object(
                          'title',
                          localization.card_titles
                            ->(block_item.block->>'key')
                            ->>(card_item.card->>'title')
                        )
                      else '{}'::jsonb
                    end
                  )
                  order by card_item.ordinality
                )
                from jsonb_array_elements(block_item.block->'cards')
                  with ordinality as card_item(card, ordinality)
              )
            )
          else '{}'::jsonb
        end
        order by block_item.ordinality
      )
      from jsonb_array_elements(translation.sections->'blocks')
        with ordinality as block_item(block, ordinality)
    ),
    false
  )
  from public.content_pages as page,
    localization
  where page.id = translation.page_id
    and page.page_key = localization.page_key
    and translation.language_code = localization.language_code;

  get diagnostics affected_rows = row_count;
  if affected_rows <> 6 then
    raise exception
      'QA-I18N-001 expected six managed-page translations, updated %',
      affected_rows;
  end if;
end
$$;

commit;
