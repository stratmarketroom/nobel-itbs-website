-- WF-007: Update Valid Credential Public Data
-- Controlled correction of the current public verification record with private History/Audit.

create or replace function public.update_valid_credential_public_data(
  p_credential_id uuid,
  p_public_holder_name text,
  p_public_programme_title text,
  p_public_credential_type text,
  p_reason text
)
returns table (
  credential_id uuid,
  credential_status public.credential_status,
  public_holder_name text,
  public_programme_title text,
  public_credential_type text,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_credential public.credentials;
  v_holder_name text := nullif(btrim(p_public_holder_name), '');
  v_programme_title text := nullif(btrim(p_public_programme_title), '');
  v_credential_type text := nullif(btrim(p_public_credential_type), '');
  v_reason text := nullif(btrim(p_reason), '');
  v_changed_fields text[];
  v_updated public.credentials;
begin
  if not internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
    or not internal.is_mfa_requirement_satisfied() then
    raise exception 'credential role with MFA is required'
      using errcode = '42501';
  end if;

  if p_credential_id is null
    or v_holder_name is null
    or v_programme_title is null
    or v_credential_type is null
    or v_reason is null then
    raise exception 'credential, public data, and change reason are required'
      using errcode = '22023';
  end if;

  if char_length(v_holder_name) > 320
    or char_length(v_programme_title) > 500
    or char_length(v_credential_type) > 200
    or char_length(v_reason) > 4000 then
    raise exception 'public credential data or reason is too long'
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

  if v_credential.status <> 'valid' then
    raise exception 'only a valid credential can have public data corrected'
      using errcode = '23514';
  end if;

  v_changed_fields := array_remove(array[
    case when v_credential.public_holder_name is distinct from v_holder_name then 'public_holder_name' end,
    case when v_credential.public_programme_title is distinct from v_programme_title then 'public_programme_title' end,
    case when v_credential.public_credential_type is distinct from v_credential_type then 'public_credential_type' end
  ], null);

  if coalesce(array_length(v_changed_fields, 1), 0) = 0 then
    raise exception 'at least one public credential value must change'
      using errcode = '22023';
  end if;

  update public.credentials credential
  set
    public_holder_name = v_holder_name,
    public_programme_title = v_programme_title,
    public_credential_type = v_credential_type
  where credential.id = p_credential_id
  returning credential.* into v_updated;

  perform internal.write_credential_history(
    p_credential_id => p_credential_id,
    p_event_type => 'credential.public_data_updated',
    p_reason => v_reason,
    p_before_data => jsonb_build_object(
      'public_holder_name', v_credential.public_holder_name,
      'public_programme_title', v_credential.public_programme_title,
      'public_credential_type', v_credential.public_credential_type
    ),
    p_after_data => jsonb_build_object(
      'public_holder_name', v_updated.public_holder_name,
      'public_programme_title', v_updated.public_programme_title,
      'public_credential_type', v_updated.public_credential_type
    )
  );

  perform internal.write_audit_log(
    p_action => 'credential.public_data_updated',
    p_actor_id => v_actor_id,
    p_target_schema => 'public',
    p_target_table => 'credentials',
    p_target_id => p_credential_id,
    p_metadata => jsonb_build_object(
      'changed_fields', to_jsonb(v_changed_fields),
      'status', 'valid'
    )
  );

  return query
  select
    v_updated.id,
    v_updated.status,
    v_updated.public_holder_name,
    v_updated.public_programme_title,
    v_updated.public_credential_type,
    v_updated.updated_at;
end;
$$;

comment on function public.update_valid_credential_public_data(uuid, text, text, text, text) is
  'Corrects only the current public fields of a valid credential, with mandatory private reason, detailed History, and PII-minimal Audit.';

revoke all on function public.update_valid_credential_public_data(uuid, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.update_valid_credential_public_data(uuid, text, text, text, text)
  to authenticated, postgres, service_role;
