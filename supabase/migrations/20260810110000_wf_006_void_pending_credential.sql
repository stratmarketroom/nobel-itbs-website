-- WF-006: Void Pending Credential
-- Atomic irreversible voiding of a pending credential and its reserved permanent number.

create or replace function public.void_pending_credential(
  p_credential_id uuid,
  p_reason text
)
returns table (
  credential_id uuid,
  credential_status public.credential_status,
  voided_at timestamptz,
  document_number_status public.document_number_status
)
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_credential public.credentials;
  v_number_log public.document_number_log;
  v_reason text := nullif(btrim(p_reason), '');
  v_voided_at timestamptz := now();
begin
  if not internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
    or not internal.is_mfa_requirement_satisfied() then
    raise exception 'credential role with MFA is required'
      using errcode = '42501';
  end if;

  if p_credential_id is null or v_reason is null then
    raise exception 'credential and void reason are required'
      using errcode = '22023';
  end if;

  if char_length(v_reason) > 4000 then
    raise exception 'void reason is too long'
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
    raise exception 'only a pending credential can be voided'
      using errcode = '23514';
  end if;

  select number_log.*
    into v_number_log
  from public.document_number_log number_log
  where number_log.credential_id = p_credential_id
    and number_log.document_number = v_credential.document_number
    and number_log.credential_type_id = v_credential.credential_type_id
    and number_log.status = 'reserved'
  for update;

  if v_number_log.id is null then
    raise exception 'matching reserved document number not found'
      using errcode = '23514';
  end if;

  update public.document_number_log number_log
  set
    status = 'voided',
    voided_by = v_actor_id,
    void_reason = v_reason
  where number_log.id = v_number_log.id;

  update public.credentials credential
  set
    status = 'voided',
    voided_at = v_voided_at,
    voided_by = v_actor_id,
    void_reason = v_reason
  where credential.id = p_credential_id;

  -- Existing credential and number triggers append both private History events
  -- with the reason in this same transaction.
  perform internal.write_audit_log(
    p_action => 'document_number.voided',
    p_actor_id => v_actor_id,
    p_target_schema => 'public',
    p_target_table => 'document_number_log',
    p_target_id => v_number_log.id,
    p_metadata => jsonb_build_object(
      'credential_id', p_credential_id,
      'from_status', 'reserved',
      'to_status', 'voided'
    )
  );

  perform internal.write_audit_log(
    p_action => 'credential.voided',
    p_actor_id => v_actor_id,
    p_target_schema => 'public',
    p_target_table => 'credentials',
    p_target_id => p_credential_id,
    p_metadata => jsonb_build_object(
      'from_status', 'pending',
      'to_status', 'voided',
      'document_number_log_id', v_number_log.id
    )
  );

  return query
  select
    p_credential_id,
    'voided'::public.credential_status,
    v_voided_at,
    'voided'::public.document_number_status;
end;
$$;

comment on function public.void_pending_credential(uuid, text) is
  'Atomically and irreversibly voids one pending credential and its reserved permanent number with private History/Audit context.';

revoke all on function public.void_pending_credential(uuid, text)
  from public, anon, authenticated;
grant execute on function public.void_pending_credential(uuid, text)
  to authenticated, postgres, service_role;
