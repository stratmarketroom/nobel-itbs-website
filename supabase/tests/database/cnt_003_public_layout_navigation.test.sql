begin;
select plan(14);
select is((select count(*)::integer from public.content_pages where page_key in ('home','about','partnerships','for_organisations') and status='published'), 4, 'all core public pages are published');
select is((select count(*)::integer from public.content_page_translations where translation_status='published'), 12, 'all core page translations are published');
select is((select count(*)::integer from public.content_page_translations where h1 is null or btrim(h1)=''), 0, 'all translations have h1');
select is((select count(*)::integer from public.content_page_translations where seo_title is null or seo_description is null), 0, 'all translations have SEO fields');
select is((select count(*)::integer from public.content_page_translations where jsonb_typeof(sections) <> 'object'), 0, 'all sections are structured objects');
select is((select count(*)::integer from public.content_page_translations where not (sections ? 'blocks')), 0, 'all pages use controlled blocks key');
select is((select count(*)::integer from public.content_pages where page_key='news'), 0, 'News is absent');
select is((select count(*)::integer from public.content_page_translations where language_code in ('en','ua','cz')), 12, 'language model is EN UA CZ');
select is((
  select count(*)::integer
  from public.content_page_translations t
  join public.content_pages p on p.id = t.page_id
  where
    (p.page_key = 'about' and t.language_code = 'ua' and t.sections @> '{"blocks":[{"key":"who_we_work_with","fields":{"h2":"Для кого ми працюємо"}}]}'::jsonb)
    or (p.page_key = 'about' and t.language_code = 'cz' and t.sections @> '{"blocks":[{"key":"who_we_work_with","fields":{"h2":"Pro koho pracujeme"}}]}'::jsonb)
    or (p.page_key = 'partnerships' and t.language_code = 'ua' and t.sections @> '{"blocks":[{"key":"partnership_principles","fields":{"h2":"Принципи партнерства"}},{"key":"partnership_models","fields":{"h2":"Моделі партнерства"}},{"key":"partnership_boundaries","fields":{"h2":"Межі партнерства"}}]}'::jsonb)
    or (p.page_key = 'partnerships' and t.language_code = 'cz' and t.sections @> '{"blocks":[{"key":"partnership_principles","fields":{"h2":"Zásady partnerství"}},{"key":"partnership_models","fields":{"h2":"Modely partnerství"}},{"key":"partnership_boundaries","fields":{"h2":"Hranice partnerství"}}]}'::jsonb)
    or (p.page_key = 'for_organisations' and t.language_code = 'ua' and t.sections @> '{"blocks":[{"key":"the_business_need","fields":{"h2":"Бізнес-потреба"}},{"key":"who_we_work_with","fields":{"h2":"З ким ми працюємо"}},{"key":"infrastructure_services","fields":{"h2":"Інфраструктурні послуги"}},{"key":"what_the_client_receives","fields":{"h2":"Що отримує клієнт"}},{"key":"how_cooperation_works","fields":{"h2":"Як відбувається співпраця"}},{"key":"trust_and_boundaries","fields":{"h2":"Довіра та межі"}},{"key":"faq","fields":{"h2":"Поширені запитання"}}]}'::jsonb)
    or (p.page_key = 'for_organisations' and t.language_code = 'cz' and t.sections @> '{"blocks":[{"key":"the_business_need","fields":{"h2":"Obchodní potřeba"}},{"key":"who_we_work_with","fields":{"h2":"S kým spolupracujeme"}},{"key":"infrastructure_services","fields":{"h2":"Infrastrukturní služby"}},{"key":"what_the_client_receives","fields":{"h2":"Co klient získá"}},{"key":"how_cooperation_works","fields":{"h2":"Jak spolupráce probíhá"}},{"key":"trust_and_boundaries","fields":{"h2":"Důvěra a hranice"}},{"key":"faq","fields":{"h2":"Časté dotazy"}}]}'::jsonb)
), 6, 'UA and CZ managed-page sections use localized display headings');
select is((
  select count(*)::integer
  from public.content_page_translations t
  join public.content_pages p on p.id = t.page_id
  where
    (p.page_key = 'about' and t.language_code = 'ua' and t.sections @> '{"blocks":[{"key":"exclusive_academic_partnership","cards":[{"fields":{"title":"Ключові факти про університет"}}]}]}'::jsonb)
    or (p.page_key = 'about' and t.language_code = 'cz' and t.sections @> '{"blocks":[{"key":"exclusive_academic_partnership","cards":[{"fields":{"title":"Klíčová fakta o univerzitě"}}]}]}'::jsonb)
    or (p.page_key = 'partnerships' and t.language_code = 'ua' and t.sections @> '{"blocks":[{"key":"partnership_models","cards":[{"fields":{"title":"Партнерство у створенні програм"}},{"fields":{"title":"Експертне партнерство"}},{"fields":{"title":"Інфраструктурне партнерство"}}]}]}'::jsonb)
    or (p.page_key = 'partnerships' and t.language_code = 'cz' and t.sections @> '{"blocks":[{"key":"partnership_models","cards":[{"fields":{"title":"Partnerství při tvorbě programů"}},{"fields":{"title":"Expertní partnerství"}},{"fields":{"title":"Infrastrukturní partnerství"}}]}]}'::jsonb)
    or (p.page_key = 'for_organisations' and t.language_code = 'ua' and t.sections @> '{"blocks":[{"key":"who_we_work_with","cards":[{"fields":{"title":"Онлайн-школи"}},{"fields":{"title":"Експерти та автори програм"}}]},{"key":"infrastructure_services","cards":[{"fields":{"title":"Структурування програми"}},{"fields":{"title":"Модель документів"}},{"fields":{"title":"Підготовка документів і додатків"}},{"fields":{"title":"Реєстрація та верифікація"}}]}]}'::jsonb)
    or (p.page_key = 'for_organisations' and t.language_code = 'cz' and t.sections @> '{"blocks":[{"key":"who_we_work_with","cards":[{"fields":{"title":"Online školy"}},{"fields":{"title":"Experti a autoři programů"}}]},{"key":"infrastructure_services","cards":[{"fields":{"title":"Strukturování programu"}},{"fields":{"title":"Model dokumentů"}},{"fields":{"title":"Příprava dokumentů a dodatků"}},{"fields":{"title":"Registrace a ověřování"}}]}]}'::jsonb)
), 6, 'UA and CZ managed-page cards use localized display titles');
select is((
  select count(*)::integer
  from public.content_page_translations t
  join public.content_pages p on p.id = t.page_id
  cross join lateral jsonb_array_elements(t.sections->'blocks') as block(item)
  where p.page_key in ('about', 'partnerships', 'for_organisations')
    and block.item ? 'items'
), 9, 'managed-page Markdown lists are stored as nine structured item collections');
select is((
  select count(*)::integer
  from public.content_page_translations t
  join public.content_pages p on p.id = t.page_id
  cross join lateral jsonb_array_elements(t.sections->'blocks') as block(item)
  where p.page_key in ('about', 'partnerships', 'for_organisations')
    and block.item->>'body' like '- %'
), 0, 'managed-page list content is not flattened into paragraph strings');
select is((
  select count(*)::integer
  from public.content_page_translations t
  join public.content_pages p on p.id = t.page_id
  where
    (
      p.page_key = 'partnerships'
      and (
        select jsonb_array_length(block.item->'cards')
        from jsonb_array_elements(t.sections->'blocks') as block(item)
        where block.item->>'key' = 'partnership_models'
      ) = 4
    )
    or (
      p.page_key = 'for_organisations'
      and (
        select jsonb_array_length(block.item->'cards')
        from jsonb_array_elements(t.sections->'blocks') as block(item)
        where block.item->>'key' = 'who_we_work_with'
      ) = 3
      and (
        select jsonb_array_length(block.item->'cards')
        from jsonb_array_elements(t.sections->'blocks') as block(item)
        where block.item->>'key' = 'infrastructure_services'
      ) = 5
      and (
        select jsonb_array_length(block.item->'cards')
        from jsonb_array_elements(t.sections->'blocks') as block(item)
        where block.item->>'key' = 'faq'
      ) = 4
      and t.sections @> '{"blocks":[{"key":"final_cta"}]}'::jsonb
    )
), 6, 'managed pages retain terminal cards and final CTA sections in all locales');
select is((
  select count(*)::integer
  from public.content_page_translations t
  join public.content_pages p on p.id = t.page_id
  where p.page_key in ('about', 'partnerships', 'for_organisations')
    and t.sections::text ~* '(Editorial Guardrails|Partner card fields|Expert card fields|Publication dependency)'
), 0, 'managed pages exclude internal editorial and schema instructions');
select * from finish();
rollback;
