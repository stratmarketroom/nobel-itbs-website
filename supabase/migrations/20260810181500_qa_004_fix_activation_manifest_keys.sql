-- QA-004: allow the approved size_bytes manifest field while continuing to
-- reject exact private-storage keys during credential activation.

create or replace function public.activate_credential(
  p_credential_id uuid,
  p_recipient_email text,
  p_subject text,
  p_body text,
  p_files jsonb
)
returns table (
  credential_id uuid,
  credential_status public.credential_status,
  activated_at timestamptz,
  email_send_id uuid,
  email_status public.credential_email_send_status
)
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_credential public.credentials;
  v_send_id uuid;
  v_email_status public.credential_email_send_status;
  v_email extensions.citext := nullif(lower(btrim(p_recipient_email)), '')::extensions.citext;
  v_activated_at timestamptz := now();
  v_file_count integer;
begin
  if not internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
    or not internal.is_mfa_requirement_satisfied() then
    raise exception 'credential role with MFA is required'
      using errcode = '42501';
  end if;

  if p_credential_id is null
    or nullif(btrim(p_subject), '') is null
    or nullif(btrim(p_body), '') is null then
    raise exception 'credential, email subject, and email body are required'
      using errcode = '22023';
  end if;

  if char_length(btrim(p_subject)) > 180 or char_length(btrim(p_body)) > 20000 then
    raise exception 'email subject or body is too long'
      using errcode = '22023';
  end if;

  if v_email is not null and v_email::text !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'recipient email is invalid'
      using errcode = '22023';
  end if;

  if p_files is null or jsonb_typeof(p_files) <> 'array' or jsonb_array_length(p_files) < 1 then
    raise exception 'current credential file manifest is required'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_files) manifest_file
    cross join lateral jsonb_object_keys(manifest_file) manifest_key
    where manifest_key in ('storage_path', 'storage_bucket', 'file_content', 'bytes')
  ) then
    raise exception 'file manifest contains forbidden private data'
      using errcode = '22023';
  end if;

  select credential.*
    into v_credential
  from public.credentials credential
  where credential.id = p_credential_id
  for update;

  if v_credential.id is null then
    raise exception 'credential not found'
      using errcode = '22023';
  end if;

  if v_credential.status <> 'pending' then
    raise exception 'only a pending credential can be activated'
      using errcode = '23514';
  end if;

  if not exists (
    select 1 from public.credential_files credential_file
    where credential_file.credential_id = p_credential_id
      and credential_file.is_primary
  ) then
    raise exception 'a primary PDF is required for activation'
      using errcode = '23514';
  end if;

  select count(*)::integer
    into v_file_count
  from public.credential_files credential_file
  where credential_file.credential_id = p_credential_id;

  if v_file_count <> jsonb_array_length(p_files) then
    raise exception 'file manifest must include every current credential file'
      using errcode = '23514';
  end if;

  if (
    select count(distinct manifest_file ->> 'file_id')
    from jsonb_array_elements(p_files) manifest_file
  ) <> v_file_count then
    raise exception 'file manifest must contain each current credential file exactly once'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_files) manifest_file
    where not exists (
      select 1
      from public.credential_files credential_file
      where credential_file.credential_id = p_credential_id
        and credential_file.id = (manifest_file ->> 'file_id')::uuid
        and credential_file.file_type_id = (manifest_file ->> 'file_type_id')::uuid
        and credential_file.size_bytes = (manifest_file ->> 'size_bytes')::bigint
        and credential_file.is_primary = (manifest_file ->> 'is_primary')::boolean
    )
  ) then
    raise exception 'file manifest does not match current credential files'
      using errcode = '23514';
  end if;

  update public.document_number_log number_log
  set status = 'issued'
  where number_log.credential_id = p_credential_id
    and number_log.document_number = v_credential.document_number
    and number_log.status = 'reserved';

  if not found then
    raise exception 'reserved document number could not be issued'
      using errcode = '23514';
  end if;

  update public.credentials credential
  set status = 'valid', activated_at = v_activated_at
  where credential.id = p_credential_id;

  v_email_status := case
    when v_email is null then 'skipped_empty_recipient'::public.credential_email_send_status
    else 'pending'::public.credential_email_send_status
  end;

  insert into public.credential_email_sends (
    credential_id,
    recipient_email,
    subject,
    body,
    status,
    technical_error,
    sent_by,
    files
  )
  values (
    p_credential_id,
    v_email,
    btrim(p_subject),
    btrim(p_body),
    v_email_status,
    case when v_email is null then 'Recipient email is empty; no delivery was attempted.' else null end,
    v_actor_id,
    p_files
  )
  returning id into v_send_id;

  perform internal.write_credential_history(
    p_credential_id => p_credential_id,
    p_event_type => 'credential.activated',
    p_before_data => jsonb_build_object('status', 'pending'),
    p_after_data => jsonb_build_object('status', 'valid', 'file_count', v_file_count)
  );

  perform internal.write_credential_history(
    p_credential_id => p_credential_id,
    p_event_type => case when v_email is null then 'credential_email.skipped' else 'credential_email.queued' end,
    p_after_data => jsonb_build_object(
      'email_send_id', v_send_id,
      'status', v_email_status,
      'file_count', v_file_count
    )
  );

  perform internal.write_audit_log(
    p_action => 'credential.activated',
    p_actor_id => v_actor_id,
    p_target_schema => 'public',
    p_target_table => 'credentials',
    p_target_id => p_credential_id,
    p_metadata => jsonb_build_object(
      'status', 'valid',
      'delivery_status', v_email_status,
      'file_count', v_file_count
    )
  );

  return query
  select p_credential_id, 'valid'::public.credential_status, v_activated_at, v_send_id, v_email_status;
end;
$$;

comment on function public.activate_credential(uuid, text, text, text, jsonb) is
  'Atomically activates one pending credential, issues its permanent number, and creates a delivery-history row; manifest privacy checks match exact forbidden keys.';

revoke all on function public.activate_credential(uuid, text, text, text, jsonb)
  from public, anon, authenticated;

grant execute on function public.activate_credential(uuid, text, text, text, jsonb)
  to authenticated, postgres, service_role;
