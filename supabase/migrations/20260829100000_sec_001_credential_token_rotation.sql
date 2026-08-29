-- SEC-001: Controlled credential-token key rotation
-- Rewraps existing token material without changing the raw verification token,
-- document number, credential lifecycle, generated PDF, or public QR URL.

create or replace function internal.enforce_credential_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_token_material_changed boolean;
  v_token_rotation_allowed boolean := current_setting('app.credential_token_rotation', true) = 'allowed';
begin
  if tg_op = 'DELETE' then
    raise exception 'credentials are not hard-deleted'
      using errcode = '23514';
  end if;

  if old.id is distinct from new.id
    or old.learner_id is distinct from new.learner_id
    or old.programme_id is distinct from new.programme_id
    or old.programme_run_id is distinct from new.programme_run_id
    or old.credential_type_id is distinct from new.credential_type_id
    or old.language_code is distinct from new.language_code
    or old.issue_date is distinct from new.issue_date
    or old.document_number is distinct from new.document_number
    or old.created_at is distinct from new.created_at then
    raise exception 'credential identity fields are immutable'
      using errcode = '23514';
  end if;

  v_token_material_changed :=
    old.verification_token_lookup_hash is distinct from new.verification_token_lookup_hash
    or old.verification_token_encrypted is distinct from new.verification_token_encrypted
    or old.token_encryption_key_version is distinct from new.token_encryption_key_version;

  if v_token_material_changed and not v_token_rotation_allowed then
    raise exception 'credential identity fields are immutable'
      using errcode = '23514';
  end if;

  if v_token_material_changed and new.token_encryption_key_version <= old.token_encryption_key_version then
    raise exception 'credential token key version must advance during rotation'
      using errcode = '23514';
  end if;

  if old.status <> new.status and not (
    (old.status = 'pending' and new.status in ('valid', 'voided'))
    or (old.status = 'valid' and new.status = 'revoked')
  ) then
    raise exception 'invalid credential status transition'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function internal.enforce_credential_lifecycle() is
  'Prevents hard delete and identity rewrites; token ciphertext/hash changes require the service-only controlled rotation function and a strictly newer key version.';

revoke all on function internal.enforce_credential_lifecycle()
  from public, anon, authenticated;
grant execute on function internal.enforce_credential_lifecycle()
  to postgres, service_role;

create or replace function public.rotate_credential_token_material_batch(
  p_expected_key_version integer,
  p_new_key_version integer,
  p_items jsonb
)
returns table (
  rotated_count integer,
  already_rotated_count integer
)
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_item record;
  v_current public.credentials%rowtype;
  v_rotated_count integer := 0;
  v_already_rotated_count integer := 0;
begin
  if p_expected_key_version is null
    or p_new_key_version is null
    or p_expected_key_version < 1
    or p_new_key_version <= p_expected_key_version then
    raise exception 'credential token key version must advance'
      using errcode = '22023';
  end if;

  if jsonb_typeof(p_items) <> 'array' then
    raise exception 'credential token rotation items must be an array'
      using errcode = '22023';
  end if;

  if jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 100 then
    raise exception 'credential token rotation batch must contain 1 to 100 items'
      using errcode = '22023';
  end if;

  perform set_config('app.credential_token_rotation', 'allowed', true);

  for v_item in
    select *
    from jsonb_to_recordset(p_items) as item(
      credential_id uuid,
      lookup_hash text,
      encrypted_material text
    )
  loop
    if v_item.credential_id is null
      or v_item.lookup_hash is null
      or v_item.lookup_hash !~ '^[0-9a-f]{64}$'
      or v_item.encrypted_material is null
      or nullif(btrim(v_item.encrypted_material), '') is null
      or char_length(v_item.encrypted_material) > 1000 then
      raise exception 'credential token rotation item is invalid'
        using errcode = '22023';
    end if;

    select credential.*
      into v_current
    from public.credentials credential
    where credential.id = v_item.credential_id
    for update;

    if v_current.id is null then
      raise exception 'credential token rotation target was not found'
        using errcode = 'P0002';
    end if;

    if v_current.token_encryption_key_version = p_new_key_version then
      if v_current.verification_token_lookup_hash = v_item.lookup_hash
        and v_current.verification_token_encrypted = btrim(v_item.encrypted_material) then
        v_already_rotated_count := v_already_rotated_count + 1;
        continue;
      end if;

      raise exception 'credential token material conflicts with the requested key version'
        using errcode = '23514';
    end if;

    if v_current.token_encryption_key_version <> p_expected_key_version then
      raise exception 'credential token key version does not match the expected version'
        using errcode = '23514';
    end if;

    update public.credentials
    set
      verification_token_lookup_hash = v_item.lookup_hash,
      verification_token_encrypted = btrim(v_item.encrypted_material),
      token_encryption_key_version = p_new_key_version
    where id = v_current.id;

    v_rotated_count := v_rotated_count + 1;
  end loop;

  perform internal.write_audit_log(
    p_action => 'credential.token_material_rotated',
    p_target_schema => 'public',
    p_target_table => 'credentials',
    p_metadata => jsonb_build_object(
      'from_key_version', p_expected_key_version,
      'to_key_version', p_new_key_version,
      'rotated_count', v_rotated_count,
      'already_rotated_count', v_already_rotated_count
    )
  );

  return query select v_rotated_count, v_already_rotated_count;
end;
$$;

comment on function public.rotate_credential_token_material_batch(integer, integer, jsonb) is
  'Service-only, bounded, idempotent credential-token rewrap. Accepts hash/ciphertext only, advances the key version, and writes count-only Audit metadata.';

revoke all on function public.rotate_credential_token_material_batch(integer, integer, jsonb)
  from public, anon, authenticated;
grant execute on function public.rotate_credential_token_material_batch(integer, integer, jsonb)
  to postgres, service_role;
