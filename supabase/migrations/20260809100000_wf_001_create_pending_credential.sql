-- WF-001: Create Pending Credential
-- Atomic set lookup/creation, permanent number reservation, and pending credential creation.

create or replace function public.create_pending_credential(
  p_learner_id uuid,
  p_programme_id uuid,
  p_credential_type_id uuid,
  p_language_code text,
  p_issue_date date,
  p_verification_token_lookup_hash text,
  p_verification_token_encrypted text,
  p_token_encryption_key_version integer,
  p_public_holder_name text,
  p_public_programme_title text,
  p_public_credential_type text,
  p_programme_run_id uuid default null,
  p_completion_date date default null,
  p_manual_document_number text default null,
  p_manual_reason text default null
)
returns table (
  credential_id uuid,
  credential_set_id uuid,
  document_number text,
  status public.credential_status,
  language_code text,
  issue_date date,
  public_holder_name text,
  public_programme_title text,
  public_credential_type text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_set_id uuid;
  v_number_log_id uuid;
  v_document_number text;
  v_credential_id uuid := extensions.gen_random_uuid();
  v_manual boolean := nullif(btrim(p_manual_document_number), '') is not null;
begin
  if not internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
    or not internal.is_mfa_requirement_satisfied() then
    raise exception 'credential role with MFA is required'
      using errcode = '42501';
  end if;

  if p_learner_id is null
    or p_programme_id is null
    or p_credential_type_id is null
    or p_issue_date is null then
    raise exception 'learner, programme, credential type, and issue date are required'
      using errcode = '22023';
  end if;

  if nullif(btrim(p_language_code), '') is null
    or nullif(btrim(p_verification_token_lookup_hash), '') is null
    or nullif(btrim(p_verification_token_encrypted), '') is null
    or p_token_encryption_key_version is null
    or nullif(btrim(p_public_holder_name), '') is null
    or nullif(btrim(p_public_programme_title), '') is null
    or nullif(btrim(p_public_credential_type), '') is null then
    raise exception 'language, protected token material, and current public fields are required'
      using errcode = '22023';
  end if;

  if v_manual <> (nullif(btrim(p_manual_reason), '') is not null) then
    raise exception 'manual document number and reason must be provided together'
      using errcode = '22023';
  end if;

  v_set_id := public.find_or_create_credential_set(
    p_learner_id,
    p_programme_id,
    p_programme_run_id,
    p_completion_date
  );

  if v_manual then
    select reservation.log_id, reservation.reserved_document_number
      into v_number_log_id, v_document_number
    from public.reserve_manual_document_number(
      p_credential_type_id,
      p_issue_date,
      p_manual_document_number,
      p_manual_reason
    ) reservation;
  else
    select reservation.log_id, reservation.reserved_document_number
      into v_number_log_id, v_document_number
    from public.reserve_document_number(
      p_credential_type_id,
      p_issue_date
    ) reservation;
  end if;

  if v_number_log_id is null or v_document_number is null then
    raise exception 'document number could not be reserved'
      using errcode = '40001';
  end if;

  insert into public.credentials (
    id,
    credential_set_id,
    learner_id,
    programme_id,
    programme_run_id,
    credential_type_id,
    language_code,
    status,
    issue_date,
    document_number,
    verification_token_lookup_hash,
    verification_token_encrypted,
    token_encryption_key_version,
    public_holder_name,
    public_programme_title,
    public_credential_type
  )
  values (
    v_credential_id,
    v_set_id,
    p_learner_id,
    p_programme_id,
    p_programme_run_id,
    p_credential_type_id,
    lower(btrim(p_language_code)),
    'pending',
    p_issue_date,
    v_document_number,
    lower(btrim(p_verification_token_lookup_hash)),
    btrim(p_verification_token_encrypted),
    p_token_encryption_key_version,
    btrim(p_public_holder_name),
    btrim(p_public_programme_title),
    btrim(p_public_credential_type)
  );

  update public.document_number_log number_log
  set credential_id = v_credential_id
  where number_log.id = v_number_log_id
    and number_log.status = 'reserved'
    and number_log.credential_id is null;

  if not found then
    raise exception 'reserved document number could not be linked to the credential'
      using errcode = '40001';
  end if;

  perform internal.write_credential_history(
    p_credential_id => v_credential_id,
    p_event_type => 'document_number.reserved',
    p_after_data => jsonb_build_object(
      'status', 'reserved',
      'manual', v_manual,
      'credential_type_id', p_credential_type_id,
      'issue_year', extract(year from p_issue_date)::integer
    )
  );

  return query
  select
    credential.id,
    credential.credential_set_id,
    credential.document_number,
    credential.status,
    credential.language_code,
    credential.issue_date,
    credential.public_holder_name,
    credential.public_programme_title,
    credential.public_credential_type,
    credential.created_at
  from public.credentials credential
  where credential.id = v_credential_id;
end;
$$;

comment on function public.create_pending_credential(
  uuid,
  uuid,
  uuid,
  text,
  date,
  text,
  text,
  integer,
  text,
  text,
  text,
  uuid,
  date,
  text,
  text
) is
  'Creates one pending credential through an MFA-protected workflow. Token generation/encryption stays server-side; this function receives only HMAC lookup and encrypted material and returns no token fields.';

revoke all on function public.create_pending_credential(
  uuid,
  uuid,
  uuid,
  text,
  date,
  text,
  text,
  integer,
  text,
  text,
  text,
  uuid,
  date,
  text,
  text
)
from public, anon, authenticated;

grant execute on function public.create_pending_credential(
  uuid,
  uuid,
  uuid,
  text,
  date,
  text,
  text,
  integer,
  text,
  text,
  text,
  uuid,
  date,
  text,
  text
)
to authenticated, postgres, service_role;
