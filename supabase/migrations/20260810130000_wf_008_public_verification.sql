-- WF-008: Public Verification
-- Server-only token/document-number lookup with a curated privacy-safe response.

create table internal.credential_verification_rate_limits (
  rate_key text primary key,
  window_started_at timestamptz not null,
  request_count integer not null,
  constraint credential_verification_rate_limits_key_format check (
    rate_key ~ '^[a-f0-9]{64}$'
  ),
  constraint credential_verification_rate_limits_count_positive check (
    request_count > 0
  )
);

comment on table internal.credential_verification_rate_limits is
  'Server-only IP-derived hashes for the public credential verification limit. No token, document number, or PII is stored.';

create index credential_verification_rate_limits_window_idx
  on internal.credential_verification_rate_limits (window_started_at);

revoke all on table internal.credential_verification_rate_limits
  from public, anon, authenticated;
grant all on table internal.credential_verification_rate_limits
  to service_role;

create or replace function public.verify_public_credential(
  p_lookup_kind text,
  p_lookup_value text,
  p_rate_key text
)
returns table (
  verification_result text,
  public_status text,
  document_number text,
  holder_name text,
  programme_title text,
  credential_type text,
  issue_date date
)
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_kind text := lower(btrim(coalesce(p_lookup_kind, '')));
  v_value text := btrim(coalesce(p_lookup_value, ''));
  v_request_count integer;
  v_credential public.credentials%rowtype;
begin
  if p_rate_key !~ '^[a-f0-9]{64}$' then
    raise exception using errcode = '22023', message = 'INVALID_RATE_KEY';
  end if;

  if v_kind not in ('token_hash', 'document_number')
    or v_value = ''
    or char_length(v_value) > 100 then
    raise exception using errcode = '22023', message = 'INVALID_VERIFICATION_LOOKUP';
  end if;

  if v_kind = 'token_hash' and v_value !~ '^[a-f0-9]{64}$' then
    raise exception using errcode = '22023', message = 'INVALID_VERIFICATION_LOOKUP';
  end if;

  insert into internal.credential_verification_rate_limits as rate_limit (
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

  if v_request_count > 30 then
    raise exception using errcode = 'P0001', message = 'CREDENTIAL_VERIFICATION_RATE_LIMITED';
  end if;

  if v_kind = 'token_hash' then
    select credential.*
      into v_credential
    from public.credentials credential
    where credential.verification_token_lookup_hash = v_value;
  else
    select credential.*
      into v_credential
    from public.credentials credential
    where credential.document_number = upper(v_value);
  end if;

  delete from internal.credential_verification_rate_limits
  where window_started_at < now() - interval '1 day';

  if v_credential.id is null or v_credential.status in ('pending', 'voided') then
    return query select
      'not_found'::text,
      null::text,
      null::text,
      null::text,
      null::text,
      null::text,
      null::date;
    return;
  end if;

  if v_credential.status = 'revoked' then
    return query select
      'revoked'::text,
      'Відкликаний'::text,
      null::text,
      null::text,
      null::text,
      null::text,
      null::date;
    return;
  end if;

  return query select
    'valid'::text,
    'Дійсний'::text,
    v_credential.document_number,
    v_credential.public_holder_name,
    v_credential.public_programme_title,
    v_credential.public_credential_type,
    v_credential.issue_date;
end;
$$;

comment on function public.verify_public_credential(text, text, text) is
  'Server-only public verification lookup. Valid returns the current curated public record, revoked returns status only, and pending/voided/absent records are indistinguishable.';

revoke all on function public.verify_public_credential(text, text, text)
  from public, anon, authenticated;
grant execute on function public.verify_public_credential(text, text, text)
  to service_role;
