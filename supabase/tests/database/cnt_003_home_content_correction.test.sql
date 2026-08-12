begin;

select plan(15);

select is(
  (
    select count(*)::integer
    from public.content_page_translations as translation
    join public.content_pages as page on page.id = translation.page_id
    where page.page_key = 'home'
      and translation.language_code in ('en', 'ua', 'cz')
      and translation.translation_status = 'published'
  ),
  3,
  'Home should have three published translations'
);

select is(
  (
    select count(*)::integer
    from public.content_page_translations as translation
    join public.content_pages as page on page.id = translation.page_id
    cross join lateral jsonb_path_query_first(
      translation.sections,
      '$.blocks[*] ? (@.key == "programme_areas")'
    ) as areas(block)
    where page.page_key = 'home'
      and translation.language_code in ('en', 'ua', 'cz')
      and jsonb_array_length(areas.block -> 'cards') = 3
  ),
  3,
  'Every Home translation should expose three programme areas'
);

select is(
  (
    select count(*)::integer
    from public.content_page_translations as translation
    join public.content_pages as page on page.id = translation.page_id
    cross join lateral jsonb_path_query_first(
      translation.sections,
      '$.blocks[*] ? (@.key == "how_the_model_works")'
    ) as model(block)
    where page.page_key = 'home'
      and translation.language_code in ('en', 'ua', 'cz')
      and model.block #>> '{fields,step_4_title}' is not null
      and model.block #>> '{fields,step_4_body}' is not null
  ),
  3,
  'Every Home translation should expose all four model steps'
);

select is(
  (
    select count(*)::integer
    from public.content_page_translations as translation
    join public.content_pages as page on page.id = translation.page_id
    cross join lateral jsonb_path_query_first(
      translation.sections,
      '$.blocks[*] ? (@.key == "verification_utility")'
    ) as verification(block)
    where page.page_key = 'home'
      and translation.language_code in ('en', 'ua', 'cz')
      and verification.block #>> '{fields,body}' is not null
      and verification.block #>> '{fields,input_label}' is not null
      and verification.block #>> '{fields,input_placeholder}' is not null
      and verification.block #>> '{fields,submit_label}' is not null
      and verification.block #>> '{fields,link_label}' is not null
      and verification.block #>> '{fields,link_target}' is not null
  ),
  3,
  'Every Home translation should expose complete verification utility fields'
);

select is(
  (
    select jsonb_array_length(trust.block -> 'cards')
    from public.content_page_translations as translation
    join public.content_pages as page on page.id = translation.page_id
    cross join lateral jsonb_path_query_first(
      translation.sections,
      '$.blocks[*] ? (@.key == "why_nobel_itbs")'
    ) as trust(block)
    where page.page_key = 'home' and translation.language_code = 'en'
  ),
  4,
  'English Home should expose four trust cards'
);

select is(
  (
    select jsonb_array_length(trust.block -> 'cards')
    from public.content_page_translations as translation
    join public.content_pages as page on page.id = translation.page_id
    cross join lateral jsonb_path_query_first(
      translation.sections,
      '$.blocks[*] ? (@.key == "why_nobel_itbs")'
    ) as trust(block)
    where page.page_key = 'home' and translation.language_code = 'ua'
  ),
  4,
  'Ukrainian Home should expose four trust cards'
);

select ok(
  (
    select trust.block #>> '{fields,title_4}' = 'Ověřitelné dokumenty'
      and trust.block #>> '{fields,body_4}' <> ''
    from public.content_page_translations as translation
    join public.content_pages as page on page.id = translation.page_id
    cross join lateral jsonb_path_query_first(
      translation.sections,
      '$.blocks[*] ? (@.key == "why_nobel_itbs")'
    ) as trust(block)
    where page.page_key = 'home' and translation.language_code = 'cz'
  ),
  'Czech Home should expose the fourth trust item'
);

select is(
  (
    select count(*)::integer
    from public.content_page_translations as translation
    join public.content_pages as page on page.id = translation.page_id
    cross join lateral jsonb_path_query_first(
      translation.sections,
      '$.blocks[*] ? (@.key == "why_nobel_itbs")'
    ) as trust(block)
    where page.page_key = 'home'
      and translation.language_code in ('en', 'ua', 'cz')
      and jsonb_array_length(trust.block -> 'cards') = 4
  ),
  3,
  'Every Home translation should expose four normalized trust cards'
);

select is(
  (
    select h1
    from public.content_page_translations as translation
    join public.content_pages as page on page.id = translation.page_id
    where page.page_key = 'home' and translation.language_code = 'en'
  ),
  'Education that moves you forward',
  'English Home should retain the approved H1'
);

select is(
  (
    select h1
    from public.content_page_translations as translation
    join public.content_pages as page on page.id = translation.page_id
    where page.page_key = 'home' and translation.language_code = 'ua'
  ),
  'Освіта, що рухає вперед',
  'Ukrainian Home should retain the approved H1'
);

select is(
  (
    select h1
    from public.content_page_translations as translation
    join public.content_pages as page on page.id = translation.page_id
    where page.page_key = 'home' and translation.language_code = 'cz'
  ),
  'Vzdělávání, které vás posouvá',
  'Czech Home should retain the approved H1'
);

select is(
  (
    select hero.block #>> '{fields,primary_cta_target}'
    from public.content_page_translations as translation
    join public.content_pages as page on page.id = translation.page_id
    cross join lateral jsonb_path_query_first(
      translation.sections,
      '$.blocks[*] ? (@.key == "hero")'
    ) as hero(block)
    where page.page_key = 'home' and translation.language_code = 'en'
  ),
  '/programmes',
  'English Home CTA target should not contain markdown backticks'
);

select is(
  (
    select hero.block #>> '{fields,primary_cta_target}'
    from public.content_page_translations as translation
    join public.content_pages as page on page.id = translation.page_id
    cross join lateral jsonb_path_query_first(
      translation.sections,
      '$.blocks[*] ? (@.key == "hero")'
    ) as hero(block)
    where page.page_key = 'home' and translation.language_code = 'ua'
  ),
  '/ua/programmes',
  'Ukrainian Home CTA target should use the approved localized path'
);

select is(
  (
    select hero.block #>> '{fields,primary_cta_target}'
    from public.content_page_translations as translation
    join public.content_pages as page on page.id = translation.page_id
    cross join lateral jsonb_path_query_first(
      translation.sections,
      '$.blocks[*] ? (@.key == "hero")'
    ) as hero(block)
    where page.page_key = 'home' and translation.language_code = 'cz'
  ),
  '/cz/programmes',
  'Czech Home CTA target should use the approved localized path'
);

select is(
  (
    select count(*)::integer
    from public.content_page_translations as translation
    join public.content_pages as page on page.id = translation.page_id
    where page.page_key = 'home'
      and translation.language_code in ('en', 'ua', 'cz')
      and jsonb_array_length(translation.sections -> 'blocks') = 9
  ),
  3,
  'Every Home translation should retain the nine approved structured blocks'
);

select * from finish();
rollback;
