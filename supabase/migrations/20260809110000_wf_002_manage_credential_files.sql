-- WF-002: Upload and Manage Credential PDFs
-- Controlled metadata mutations coordinated by actor-authorized server Storage routes.

create or replace function internal.credential_file_change_reason()
returns text
language sql
stable
set search_path = pg_catalog, pg_temp
as $$
  select nullif(btrim(current_setting('app.credential_file_change_reason', true)), '');
$$;

comment on function internal.credential_file_change_reason() is
  'Reads the transaction-local reason set only by controlled credential-file workflow functions.';

revoke all on function internal.credential_file_change_reason()
  from public, anon, authenticated;
grant execute on function internal.credential_file_change_reason()
  to postgres, service_role;

create or replace function internal.audit_credential_file_change()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_reason text := internal.credential_file_change_reason();
  v_operation text := nullif(btrim(current_setting('app.credential_file_operation', true)), '');
begin
  if tg_op = 'INSERT' then
    perform internal.write_audit_log(
      p_action => 'credential_file.attached',
      p_actor_id => auth.uid(),
      p_target_schema => 'public',
      p_target_table => 'credential_files',
      p_target_id => new.id,
      p_metadata => jsonb_strip_nulls(jsonb_build_object(
        'file_type_id', new.file_type_id,
        'is_primary', new.is_primary,
        'size_bytes', new.size_bytes,
        'reason', v_reason
      ))
    );

    return new;
  end if;

  if tg_op = 'DELETE' then
    perform internal.write_audit_log(
      p_action => 'credential_file.deleted',
      p_actor_id => auth.uid(),
      p_target_schema => 'public',
      p_target_table => 'credential_files',
      p_target_id => old.id,
      p_metadata => jsonb_strip_nulls(jsonb_build_object(
        'was_primary', old.is_primary,
        'reason', v_reason
      ))
    );

    return old;
  end if;

  perform internal.write_audit_log(
    p_action => case
      when v_operation = 'replace' then 'credential_file.replaced'
      else 'credential_file.updated'
    end,
    p_actor_id => auth.uid(),
    p_target_schema => 'public',
    p_target_table => 'credential_files',
    p_target_id => new.id,
    p_metadata => jsonb_strip_nulls(jsonb_build_object(
      'file_type_changed', old.file_type_id is distinct from new.file_type_id,
      'admin_label_changed', old.admin_label is distinct from new.admin_label,
      'primary_changed', old.is_primary is distinct from new.is_primary,
      'content_metadata_changed', v_operation = 'replace',
      'reason', v_reason
    ))
  );

  return new;
end;
$$;

comment on function internal.audit_credential_file_change() is
  'Audits attach, replacement, metadata/primary changes, and deletion with an optional controlled reason, without private paths or file content.';

create or replace function internal.record_credential_file_history()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_event_type text;
  v_reason text := internal.credential_file_change_reason();
  v_operation text := nullif(btrim(current_setting('app.credential_file_operation', true)), '');
begin
  if tg_op = 'INSERT' then
    perform internal.write_credential_history(
      p_credential_id => new.credential_id,
      p_event_type => 'credential_file.attached',
      p_reason => v_reason,
      p_after_data => jsonb_build_object(
        'credential_file_id', new.id,
        'file_type_id', new.file_type_id,
        'is_primary', new.is_primary,
        'size_bytes', new.size_bytes
      )
    );

    return new;
  end if;

  if tg_op = 'DELETE' then
    perform internal.write_credential_history(
      p_credential_id => old.credential_id,
      p_event_type => 'credential_file.deleted',
      p_reason => v_reason,
      p_before_data => jsonb_build_object(
        'credential_file_id', old.id,
        'file_type_id', old.file_type_id,
        'is_primary', old.is_primary,
        'size_bytes', old.size_bytes
      )
    );

    return old;
  end if;

  v_event_type := case
    when v_operation = 'replace' then 'credential_file.replaced'
    else 'credential_file.updated'
  end;

  perform internal.write_credential_history(
    p_credential_id => new.credential_id,
    p_event_type => v_event_type,
    p_reason => v_reason,
    p_before_data => jsonb_build_object(
      'credential_file_id', old.id,
      'file_type_id', old.file_type_id,
      'is_primary', old.is_primary,
      'size_bytes', old.size_bytes
    ),
    p_after_data => jsonb_build_object(
      'credential_file_id', new.id,
      'file_type_id', new.file_type_id,
      'is_primary', new.is_primary,
      'size_bytes', new.size_bytes
    )
  );

  return new;
end;
$$;

comment on function internal.record_credential_file_history() is
  'Records credential PDF events and controlled reasons without storing file paths, labels, or content.';

create or replace function internal.require_credential_file_mutation(
  p_credential_id uuid,
  p_reason text,
  p_allow_delete boolean default false
)
returns public.credential_status
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_status public.credential_status;
begin
  if not internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
    or not internal.is_mfa_requirement_satisfied() then
    raise exception 'credential role with MFA is required'
      using errcode = '42501';
  end if;

  select credential.status
    into v_status
  from public.credentials credential
  where credential.id = p_credential_id
  for update;

  if v_status is null then
    raise exception 'credential not found'
      using errcode = '22023';
  end if;

  if p_allow_delete and v_status <> 'pending' then
    raise exception 'credential files can be deleted only while the credential is pending'
      using errcode = '23514';
  end if;

  if not p_allow_delete and v_status not in ('pending', 'valid') then
    raise exception 'credential files cannot be changed for revoked or voided credentials'
      using errcode = '23514';
  end if;

  if v_status = 'valid' and nullif(btrim(p_reason), '') is null then
    raise exception 'a reason is required to change a valid credential PDF'
      using errcode = '22023';
  end if;

  return v_status;
end;
$$;

comment on function internal.require_credential_file_mutation(uuid, text, boolean) is
  'Checks actor role/MFA and credential lifecycle. Valid PDF changes require a reason; deletion is pending-only.';

revoke all on function internal.require_credential_file_mutation(uuid, text, boolean)
  from public, anon, authenticated;
grant execute on function internal.require_credential_file_mutation(uuid, text, boolean)
  to postgres, service_role;

create or replace function public.attach_credential_file(
  p_file_id uuid,
  p_credential_id uuid,
  p_file_type_id uuid,
  p_admin_label text,
  p_size_bytes bigint,
  p_is_primary boolean default false,
  p_reason text default null
)
returns table (
  file_id uuid,
  credential_id uuid,
  file_type_id uuid,
  admin_label text,
  mime_type text,
  size_bytes bigint,
  is_primary boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
begin
  perform internal.require_credential_file_mutation(p_credential_id, p_reason, false);

  if p_file_id is null or p_file_type_id is null then
    raise exception 'file ID and active file type are required'
      using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.credential_file_types file_type
    where file_type.id = p_file_type_id and file_type.is_active
  ) then
    raise exception 'active credential file type not found'
      using errcode = '22023';
  end if;

  perform set_config('app.credential_file_change_reason', coalesce(btrim(p_reason), ''), true);
  perform set_config('app.credential_file_operation', 'attach', true);

  if coalesce(p_is_primary, false) then
    update public.credential_files existing
    set is_primary = false
    where existing.credential_id = p_credential_id
      and existing.is_primary;
  end if;

  insert into public.credential_files (
    id,
    credential_id,
    file_type_id,
    admin_label,
    storage_path,
    mime_type,
    size_bytes,
    is_primary,
    uploaded_by
  )
  values (
    p_file_id,
    p_credential_id,
    p_file_type_id,
    nullif(btrim(p_admin_label), ''),
    p_credential_id::text || '/' || p_file_id::text || '.pdf',
    'application/pdf',
    p_size_bytes,
    coalesce(p_is_primary, false),
    auth.uid()
  );

  return query
  select file.id, file.credential_id, file.file_type_id, file.admin_label,
    file.mime_type, file.size_bytes, file.is_primary, file.created_at, file.updated_at
  from public.credential_files file
  where file.id = p_file_id;
end;
$$;

comment on function public.attach_credential_file(uuid, uuid, uuid, text, bigint, boolean, text) is
  'Attaches current private PDF metadata after server-side Storage upload. Valid credentials require a reason.';

create or replace function public.replace_credential_file(
  p_file_id uuid,
  p_size_bytes bigint,
  p_reason text default null
)
returns table (
  file_id uuid,
  credential_id uuid,
  file_type_id uuid,
  admin_label text,
  mime_type text,
  size_bytes bigint,
  is_primary boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_credential_id uuid;
begin
  select file.credential_id into v_credential_id
  from public.credential_files file
  where file.id = p_file_id
  for update;

  if v_credential_id is null then
    raise exception 'credential file not found'
      using errcode = '22023';
  end if;

  perform internal.require_credential_file_mutation(v_credential_id, p_reason, false);
  perform set_config('app.credential_file_change_reason', coalesce(btrim(p_reason), ''), true);
  perform set_config('app.credential_file_operation', 'replace', true);

  update public.credential_files file
  set
    size_bytes = p_size_bytes,
    mime_type = 'application/pdf',
    uploaded_by = auth.uid()
  where file.id = p_file_id;

  return query
  select file.id, file.credential_id, file.file_type_id, file.admin_label,
    file.mime_type, file.size_bytes, file.is_primary, file.created_at, file.updated_at
  from public.credential_files file
  where file.id = p_file_id;
end;
$$;

comment on function public.replace_credential_file(uuid, bigint, text) is
  'Updates metadata after server-side in-place PDF replacement. Old object versions are not retained; valid credentials require a reason.';

create or replace function public.update_credential_file(
  p_file_id uuid,
  p_file_type_id uuid,
  p_admin_label text,
  p_is_primary boolean,
  p_reason text default null
)
returns table (
  file_id uuid,
  credential_id uuid,
  file_type_id uuid,
  admin_label text,
  mime_type text,
  size_bytes bigint,
  is_primary boolean,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_credential_id uuid;
  v_status public.credential_status;
  v_was_primary boolean;
begin
  select file.credential_id, file.is_primary
    into v_credential_id, v_was_primary
  from public.credential_files file
  where file.id = p_file_id
  for update;

  if v_credential_id is null then
    raise exception 'credential file not found'
      using errcode = '22023';
  end if;

  v_status := internal.require_credential_file_mutation(v_credential_id, p_reason, false);

  if not exists (
    select 1 from public.credential_file_types file_type
    where file_type.id = p_file_type_id and file_type.is_active
  ) then
    raise exception 'active credential file type not found'
      using errcode = '22023';
  end if;

  if v_status = 'valid' and v_was_primary and not coalesce(p_is_primary, false) then
    raise exception 'a valid credential must retain one primary PDF'
      using errcode = '23514';
  end if;

  perform set_config('app.credential_file_change_reason', coalesce(btrim(p_reason), ''), true);
  perform set_config('app.credential_file_operation', 'metadata', true);

  if coalesce(p_is_primary, false) then
    update public.credential_files existing
    set is_primary = false
    where existing.credential_id = v_credential_id
      and existing.id <> p_file_id
      and existing.is_primary;
  end if;

  update public.credential_files file
  set
    file_type_id = p_file_type_id,
    admin_label = nullif(btrim(p_admin_label), ''),
    is_primary = coalesce(p_is_primary, false)
  where file.id = p_file_id;

  return query
  select file.id, file.credential_id, file.file_type_id, file.admin_label,
    file.mime_type, file.size_bytes, file.is_primary, file.created_at, file.updated_at
  from public.credential_files file
  where file.id = p_file_id;
end;
$$;

comment on function public.update_credential_file(uuid, uuid, text, boolean, text) is
  'Updates current file type, admin label, or primary selection. Valid credentials require a reason and retain a primary PDF.';

create or replace function public.delete_credential_file(
  p_file_id uuid,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_credential_id uuid;
begin
  select file.credential_id into v_credential_id
  from public.credential_files file
  where file.id = p_file_id
  for update;

  if v_credential_id is null then
    raise exception 'credential file not found'
      using errcode = '22023';
  end if;

  perform internal.require_credential_file_mutation(v_credential_id, p_reason, true);
  perform set_config('app.credential_file_change_reason', coalesce(btrim(p_reason), ''), true);
  perform set_config('app.credential_file_operation', 'delete', true);

  delete from public.credential_files file
  where file.id = p_file_id;

  return p_file_id;
end;
$$;

comment on function public.delete_credential_file(uuid, text) is
  'Deletes current metadata only for a pending credential after the server removes the private object.';

revoke all on function public.attach_credential_file(uuid, uuid, uuid, text, bigint, boolean, text)
  from public, anon, authenticated;
revoke all on function public.replace_credential_file(uuid, bigint, text)
  from public, anon, authenticated;
revoke all on function public.update_credential_file(uuid, uuid, text, boolean, text)
  from public, anon, authenticated;
revoke all on function public.delete_credential_file(uuid, text)
  from public, anon, authenticated;

grant execute on function public.attach_credential_file(uuid, uuid, uuid, text, bigint, boolean, text)
  to authenticated, postgres, service_role;
grant execute on function public.replace_credential_file(uuid, bigint, text)
  to authenticated, postgres, service_role;
grant execute on function public.update_credential_file(uuid, uuid, text, boolean, text)
  to authenticated, postgres, service_role;
grant execute on function public.delete_credential_file(uuid, text)
  to authenticated, postgres, service_role;
