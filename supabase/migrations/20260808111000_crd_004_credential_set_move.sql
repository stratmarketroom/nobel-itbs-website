-- CRD-004 follow-up: activate the CRD-002 credential add/move operation
-- now that public.credentials exists.

create or replace function public.move_credential_to_set(
  p_credential_id uuid,
  p_target_set_id uuid
)
returns public.credentials
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_credential public.credentials;
begin
  if not internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
    or not internal.is_mfa_requirement_satisfied() then
    raise exception 'credential role with MFA is required'
      using errcode = '42501';
  end if;

  if p_credential_id is null or p_target_set_id is null then
    raise exception 'credential and target set are required'
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

  if v_credential.credential_set_id = p_target_set_id then
    return v_credential;
  end if;

  update public.credentials credential
  set credential_set_id = p_target_set_id
  where credential.id = p_credential_id
  returning credential.* into v_credential;

  return v_credential;
end;
$$;

comment on function public.move_credential_to_set(uuid, uuid) is
  'Moves a credential to another matching learner/programme/run set. The context trigger validates the target and the audit trigger records the move.';

revoke all on function public.move_credential_to_set(uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.move_credential_to_set(uuid, uuid)
  to authenticated, postgres, service_role;
