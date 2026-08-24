-- QA-005-CTA-002: Configure the Owner-approved Space Business destination.
-- For Organisations intentionally remains on the on-site organisation enquiry form.

do $$
declare
  v_updated integer;
begin
  if exists (
    select 1
    from public.programme_runs run_record
    join public.programmes programme_record on programme_record.id = run_record.programme_id
    where programme_record.slug = 'space-business'
      and run_record.status <> 'closed'
      and run_record.application_url is not null
  ) then
    raise exception 'QA-005 CTA-002 migration found an active Space Business run URL override.';
  end if;

  if exists (
    select 1
    from public.programme_pricing_options pricing_record
    join public.programmes programme_record on programme_record.id = pricing_record.programme_id
    where programme_record.slug = 'space-business'
      and pricing_record.is_active
      and pricing_record.application_url is not null
  ) then
    raise exception 'QA-005 CTA-002 migration found an active Space Business pricing URL override.';
  end if;

  if not exists (
    select 1
    from public.site_settings
    where setting_key = 'for_organisations_application_url'
      and is_public
      and value_text is null
  ) then
    raise exception 'QA-005 CTA-002 expected For Organisations to use the on-site form fallback.';
  end if;

  update public.programmes
  set
    application_provider = 'leeloo',
    application_url = 'https://event.duan.edu.ua/et6naw'
  where slug = 'space-business';

  get diagnostics v_updated = row_count;
  if v_updated <> 1 then
    raise exception 'QA-005 CTA-002 expected one Space Business programme, updated %.', v_updated;
  end if;
end;
$$;
