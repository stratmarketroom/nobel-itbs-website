-- PCE-004: Public Contact Entry Points
-- Add server-only creation for general, partnership, and organisation enquiries.

create or replace function public.create_public_contact_submission(
  p_type public.contact_submission_type,
  p_name text,
  p_email text,
  p_phone text,
  p_message text,
  p_language_code text,
  p_rate_key text,
  p_privacy_notice_path text
)
returns uuid
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_request_count integer;
  v_submission_id uuid;
  v_source text;
begin
  if p_type not in ('general', 'partner_enquiry', 'organisation_enquiry') then
    raise exception using errcode = '22023', message = 'INVALID_CONTACT_TYPE';
  end if;

  if p_rate_key !~ '^[a-f0-9]{64}$' then
    raise exception using errcode = '22023', message = 'INVALID_RATE_KEY';
  end if;

  insert into internal.contact_submission_rate_limits as rate_limit (
    rate_key,
    window_started_at,
    request_count
  ) values (
    p_rate_key,
    now(),
    1
  )
  on conflict (rate_key) do update
  set
    window_started_at = case
      when rate_limit.window_started_at <= now() - interval '15 minutes' then now()
      else rate_limit.window_started_at
    end,
    request_count = case
      when rate_limit.window_started_at <= now() - interval '15 minutes' then 1
      else rate_limit.request_count + 1
    end
  returning request_count into v_request_count;

  if v_request_count > 5 then
    raise exception using errcode = 'P0001', message = 'CONTACT_RATE_LIMITED';
  end if;

  v_source := case p_type
    when 'general' then 'about_contact'
    when 'partner_enquiry' then 'partnerships_page'
    when 'organisation_enquiry' then 'for_organisations_page'
  end;

  insert into public.contact_submissions (
    type,
    programme_id,
    name,
    email,
    phone,
    message,
    language_code,
    metadata
  ) values (
    p_type,
    null,
    btrim(p_name),
    lower(btrim(p_email)),
    nullif(btrim(p_phone), ''),
    btrim(p_message),
    p_language_code,
    jsonb_build_object(
      'source', v_source,
      'privacy_acknowledged', true,
      'privacy_notice_path', p_privacy_notice_path
    )
  )
  returning id into v_submission_id;

  delete from internal.contact_submission_rate_limits
  where window_started_at < now() - interval '1 day';

  return v_submission_id;
end;
$$;

comment on function public.create_public_contact_submission(public.contact_submission_type, text, text, text, text, text, text, text) is
  'Server-only atomic creation for general, partnership, and organisation enquiries with database-backed rate limiting.';

revoke all on function public.create_public_contact_submission(public.contact_submission_type, text, text, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.create_public_contact_submission(public.contact_submission_type, text, text, text, text, text, text, text)
  to service_role;
