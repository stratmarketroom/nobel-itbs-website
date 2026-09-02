-- QA-LEGAL-001: remove unpublished editorial content and raw Markdown from the
-- published Ukrainian Privacy Policy without rewriting the applied CNT-005
-- migration or changing the approved legal wording.

begin;

do $$
declare
  affected_rows integer;
begin
  with target as (
    select
      translation.page_id,
      translation.language_code,
      jsonb_set(
        normalized.sections,
        '{blocks}',
        coalesce(cleaned.blocks, '[]'::jsonb),
        false
      ) as sections
    from public.content_page_translations as translation
    join public.content_pages as page
      on page.id = translation.page_id
    cross join lateral (
      select replace(
        translation.sections::text,
        '**номер телефону**',
        'номер телефону'
      )::jsonb as sections
    ) as normalized
    cross join lateral (
      select jsonb_agg(item.block order by item.ordinality) as blocks
      from jsonb_array_elements(normalized.sections->'blocks')
        with ordinality as item(block, ordinality)
      where item.block->>'heading'
        <> 'Примітка для Release 1 — не публікувати як частину Політики'
    ) as cleaned
    where page.page_key = 'privacy_policy'
      and translation.language_code = 'ua'
  )
  update public.content_page_translations as translation
  set sections = target.sections
  from target
  where translation.page_id = target.page_id
    and translation.language_code = target.language_code;

  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception
      'QA-LEGAL-001 expected one UA privacy translation, updated %',
      affected_rows;
  end if;
end
$$;

commit;
