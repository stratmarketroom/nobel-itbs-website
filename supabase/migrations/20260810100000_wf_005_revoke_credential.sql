-- WF-005: Revoke Credential
-- Irreversible valid-to-revoked transition with a mandatory private reason.

create or replace function public.revoke_credential(
  p_credential_id uuid,
  p_reason text
)
returns table (
  credential_id uuid,
  credential_status public.credential_status,
  revoked_at timestamptz
)
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_credential public.credentials;
  v_reason text := nullif(btrim(p_reason), '');
  v_revoked_at timestamptz := now();
begin
  if not internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
    or not internal.is_mfa_requirement_satisfied() then
    raise exception 'credential role with MFA is required'
      using errcode = '42501';
  end if;

  if p_credential_id is null or v_reason is null then
    raise exception 'credential and revocation reason are required'
      using errcode = '22023';
  end if;

  if char_length(v_reason) > 4000 then
    raise exception 'revocation reason is too long'
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
    raise exception 'only a valid credential can be revoked'
      using errcode = '23514';
  end if;

  update public.credentials credential
  set
    status = 'revoked',
    revoked_at = v_revoked_at,
    revoked_by = v_actor_id,
    revocation_reason = v_reason
  where credential.id = p_credential_id;

  -- The existing credentials_record_core_history trigger appends the private
  -- credential.status_changed event and its reason in this same transaction.
  perform internal.write_audit_log(
    p_action => 'credential.revoked',
    p_actor_id => v_actor_id,
    p_target_schema => 'public',
    p_target_table => 'credentials',
    p_target_id => p_credential_id,
    p_metadata => jsonb_build_object(
      'from_status', 'valid',
      'to_status', 'revoked'
    )
  );

  return query
  select p_credential_id, 'revoked'::public.credential_status, v_revoked_at;
end;
$$;

comment on function public.revoke_credential(uuid, text) is
  'Irreversibly revokes one valid credential, preserving its issued document number and recording private History/Audit context.';

revoke all on function public.revoke_credential(uuid, text)
  from public, anon, authenticated;
grant execute on function public.revoke_credential(uuid, text)
  to authenticated, postgres, service_role;
