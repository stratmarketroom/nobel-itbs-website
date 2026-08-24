-- QA-005-CTA-001: Configure the two Owner-approved Leeloo destinations.
-- AI Production intentionally remains on the on-site question fallback.

do $$
declare
  v_updated integer;
begin
  if exists (
    select 1
    from public.programme_runs run_record
    join public.programmes programme_record on programme_record.id = run_record.programme_id
    where programme_record.slug in ('general-psychology', 'child-psychology', 'ai-production')
      and run_record.status <> 'closed'
      and run_record.application_url is not null
  ) then
    raise exception 'QA-005 CTA migration found an active run URL override.';
  end if;

  if exists (
    select 1
    from public.programme_pricing_options pricing_record
    join public.programmes programme_record on programme_record.id = pricing_record.programme_id
    where programme_record.slug in ('general-psychology', 'child-psychology', 'ai-production')
      and pricing_record.is_active
      and pricing_record.application_url is not null
  ) then
    raise exception 'QA-005 CTA migration found an active pricing URL override.';
  end if;

  update public.programmes
  set
    application_provider = 'leeloo',
    application_url = case slug
      when 'general-psychology' then 'https://event.duan.edu.ua/ie80iq'
      when 'child-psychology' then 'https://event.duan.edu.ua/830uga'
    end
  where slug in ('general-psychology', 'child-psychology');

  get diagnostics v_updated = row_count;
  if v_updated <> 2 then
    raise exception 'QA-005 CTA migration expected two psychology programmes, updated %.', v_updated;
  end if;

  update public.programmes
  set
    application_provider = 'partner_site',
    application_url = null
  where slug = 'ai-production';

  get diagnostics v_updated = row_count;
  if v_updated <> 1 then
    raise exception 'QA-005 CTA migration expected one AI Production programme, updated %.', v_updated;
  end if;
end;
$$;
