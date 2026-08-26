-- PDFGEN-005: Single Credential Generation and Regeneration
-- MFA-guarded single-generation lease plus atomic current-file/provenance persistence.
-- PDF bytes remain in private Storage and never enter PostgreSQL.

create table internal.credential_single_generation_locks (
  credential_id uuid primary key references public.credentials(id) on delete cascade,
  lock_token uuid not null unique,
  template_version_id uuid not null references public.credential_template_versions(id) on delete restrict,
  generation_attempt integer not null,
  is_regeneration boolean not null,
  started_by uuid not null references public.user_profiles(id) on delete restrict,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint credential_single_generation_locks_attempt_positive check (generation_attempt > 0),
  constraint credential_single_generation_locks_expiry_after_start check (expires_at > created_at)
);

comment on table internal.credential_single_generation_locks is
  'Private short-lived single-credential generation lease. Prevents concurrent in-place PDF replacement and is never exposed to browser roles.';

alter table internal.credential_single_generation_locks enable row level security;
alter table internal.credential_single_generation_locks force row level security;
revoke all on table internal.credential_single_generation_locks from public, anon, authenticated, service_role;
grant select, insert, update, delete on table internal.credential_single_generation_locks to postgres;

create or replace function internal.assert_single_generation_actor()
returns void
language plpgsql
stable
security definer
set search_path = internal, public, pg_temp
as $$
begin
  perform internal.assert_sensitive_action_allowed(
    array['owner', 'super_admin', 'credential_manager']::public.app_role[],
    'single credential PDF generation'
  );
end;
$$;

comment on function internal.assert_single_generation_actor() is
  'Requires an active MFA/AAL2 Owner, Super Admin, or Credential Manager for single generation and review.';

revoke all on function internal.assert_single_generation_actor() from public, anon, authenticated;
grant execute on function internal.assert_single_generation_actor() to postgres, service_role;

create or replace function public.begin_single_credential_generation(
  p_credential_id uuid,
  p_template_version_id uuid,
  p_lock_token uuid
)
returns table (
  generation_attempt integer,
  is_regeneration boolean
)
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_credential public.credentials;
  v_package public.credential_template_packages;
  v_version_status public.credential_template_version_status;
  v_file_count integer;
  v_provenance_file_count integer;
  v_provenance_version_count integer;
  v_existing_version_id uuid;
  v_existing_lock internal.credential_single_generation_locks;
  v_attempt integer;
  v_is_regeneration boolean;
begin
  perform internal.assert_single_generation_actor();

  if p_credential_id is null or p_template_version_id is null or p_lock_token is null then
    raise exception 'credential, template version, and generation lock are required'
      using errcode = '22023';
  end if;

  select credential.* into v_credential
  from public.credentials credential
  where credential.id = p_credential_id
  for update;

  if v_credential.id is null then
    raise exception 'credential not found' using errcode = 'P0002';
  end if;
  if v_credential.status <> 'pending' then
    raise exception 'only a pending credential can generate or regenerate PDFs'
      using errcode = '23514';
  end if;

  select template_package
    into v_package
  from public.credential_template_versions template_version
  join public.credential_template_packages template_package
    on template_package.id = template_version.template_package_id
  where template_version.id = p_template_version_id;

  select template_version.status
    into v_version_status
  from public.credential_template_versions template_version
  where template_version.id = p_template_version_id;

  if v_package.id is null then
    raise exception 'credential template version not found' using errcode = 'P0002';
  end if;
  if v_package.programme_id <> v_credential.programme_id
    or v_package.credential_type_id <> v_credential.credential_type_id
    or v_package.language_code <> v_credential.language_code
    or (
      v_package.programme_run_id is not null
      and v_package.programme_run_id is distinct from v_credential.programme_run_id
    ) then
    raise exception 'credential template context does not match the pending credential'
      using errcode = '23514';
  end if;

  select generation_lock.* into v_existing_lock
  from internal.credential_single_generation_locks generation_lock
  where generation_lock.credential_id = p_credential_id
  for update;

  if v_existing_lock.credential_id is not null and v_existing_lock.expires_at > now() then
    raise exception 'credential generation is already in progress'
      using errcode = '55P03';
  end if;

  if v_existing_lock.credential_id is not null then
    perform internal.write_credential_history(
      p_credential_id => p_credential_id,
      p_event_type => 'credential_generation.failed',
      p_after_data => jsonb_build_object(
        'template_version_id', v_existing_lock.template_version_id,
        'generation_attempt', v_existing_lock.generation_attempt,
        'error_code', 'lease_expired'
      )
    );
    perform internal.write_audit_log(
      p_action => 'credential_generation.failed',
      p_actor_id => auth.uid(),
      p_target_schema => 'public',
      p_target_table => 'credentials',
      p_target_id => p_credential_id,
      p_metadata => jsonb_build_object(
        'template_version_id', v_existing_lock.template_version_id,
        'generation_attempt', v_existing_lock.generation_attempt,
        'error_code', 'lease_expired'
      )
    );
    delete from internal.credential_single_generation_locks
    where credential_id = p_credential_id;
  end if;

  select count(*)::integer into v_file_count
  from public.credential_files credential_file
  where credential_file.credential_id = p_credential_id;

  if v_file_count = 0 then
    if v_version_status <> 'published' then
      raise exception 'first generation requires a published template version'
        using errcode = '23514';
    end if;
    v_is_regeneration := false;
  else
    with latest_provenance as (
      select distinct on (generation.credential_file_id)
        generation.credential_file_id,
        generation.template_version_id
      from public.credential_file_generations generation
      join public.credential_files credential_file
        on credential_file.id = generation.credential_file_id
      where credential_file.credential_id = p_credential_id
      order by generation.credential_file_id, generation.generation_attempt desc
    )
    select
      count(*)::integer,
      count(distinct latest.template_version_id)::integer,
      (array_agg(distinct latest.template_version_id))[1]
    into v_provenance_file_count, v_provenance_version_count, v_existing_version_id
    from latest_provenance latest;

    if v_provenance_file_count <> v_file_count then
      raise exception 'remove manually managed current PDFs before first template generation'
        using errcode = '23514';
    end if;
    if v_provenance_version_count <> 1 or v_existing_version_id <> p_template_version_id then
      raise exception 'pending regeneration must use the same immutable template version'
        using errcode = '23514';
    end if;
    if v_version_status not in ('published', 'retired') then
      raise exception 'pending regeneration requires its published or retired provenance version'
        using errcode = '23514';
    end if;
    v_is_regeneration := true;
  end if;

  select coalesce(max(generation.generation_attempt), 0) + 1
    into v_attempt
  from public.credential_file_generations generation
  join public.credential_files credential_file
    on credential_file.id = generation.credential_file_id
  where credential_file.credential_id = p_credential_id;

  insert into internal.credential_single_generation_locks (
    credential_id,
    lock_token,
    template_version_id,
    generation_attempt,
    is_regeneration,
    started_by,
    expires_at
  ) values (
    p_credential_id,
    p_lock_token,
    p_template_version_id,
    v_attempt,
    v_is_regeneration,
    auth.uid(),
    now() + interval '15 minutes'
  );

  perform internal.write_credential_history(
    p_credential_id => p_credential_id,
    p_event_type => case when v_is_regeneration then 'credential_generation.regeneration_started' else 'credential_generation.started' end,
    p_after_data => jsonb_build_object(
      'template_package_id', v_package.id,
      'template_version_id', p_template_version_id,
      'generation_attempt', v_attempt
    )
  );
  perform internal.write_audit_log(
    p_action => case when v_is_regeneration then 'credential_generation.regeneration_started' else 'credential_generation.started' end,
    p_actor_id => auth.uid(),
    p_target_schema => 'public',
    p_target_table => 'credentials',
    p_target_id => p_credential_id,
    p_metadata => jsonb_build_object(
      'template_package_id', v_package.id,
      'template_version_id', p_template_version_id,
      'generation_attempt', v_attempt
    )
  );

  return query select v_attempt, v_is_regeneration;
end;
$$;

comment on function public.begin_single_credential_generation(uuid, uuid, uuid) is
  'Validates pending lifecycle and exact published-template context, fixes regeneration to existing provenance, and acquires a private 15-minute lease.';

create or replace function public.refresh_single_credential_generation(
  p_credential_id uuid,
  p_lock_token uuid
)
returns void
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
begin
  perform internal.assert_single_generation_actor();

  update internal.credential_single_generation_locks generation_lock
  set expires_at = now() + interval '15 minutes'
  where generation_lock.credential_id = p_credential_id
    and generation_lock.lock_token = p_lock_token
    and generation_lock.started_by = auth.uid()
    and generation_lock.expires_at > now();

  if not found then
    raise exception 'credential generation lease is missing or expired'
      using errcode = '55P03';
  end if;
end;
$$;

comment on function public.refresh_single_credential_generation(uuid, uuid) is
  'Extends the private lease immediately before current private PDF objects are replaced.';

create or replace function public.complete_single_credential_generation(
  p_credential_id uuid,
  p_lock_token uuid,
  p_outputs jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_lock internal.credential_single_generation_locks;
  v_template_package_id uuid;
  v_output jsonb;
  v_file_id uuid;
  v_template_document_id uuid;
  v_file_type_id uuid;
  v_admin_label text;
  v_size_bytes bigint;
  v_page_count integer;
  v_is_primary boolean;
  v_input_sha256 text;
  v_output_sha256 text;
  v_output_count integer;
  v_document_count integer;
  v_primary_count integer := 0;
  v_current_file_count integer;
  v_previous_document_id uuid;
  v_total_pages integer := 0;
  v_credential_status public.credential_status;
begin
  perform internal.assert_single_generation_actor();

  if jsonb_typeof(p_outputs) <> 'array' or jsonb_array_length(p_outputs) = 0 then
    raise exception 'generated output manifest must be a non-empty JSON array'
      using errcode = '22023';
  end if;

  select generation_lock.* into v_lock
  from internal.credential_single_generation_locks generation_lock
  where generation_lock.credential_id = p_credential_id
    and generation_lock.lock_token = p_lock_token
    and generation_lock.started_by = auth.uid()
  for update;

  if v_lock.credential_id is null or v_lock.expires_at <= now() then
    raise exception 'credential generation lease is missing or expired'
      using errcode = '55P03';
  end if;
  select credential.status into v_credential_status
  from public.credentials credential
  where credential.id = p_credential_id
  for update;

  if v_credential_status is distinct from 'pending'::public.credential_status then
    raise exception 'only a pending credential can complete PDF generation'
      using errcode = '23514';
  end if;

  select template_version.template_package_id into v_template_package_id
  from public.credential_template_versions template_version
  where template_version.id = v_lock.template_version_id;

  select count(*)::integer into v_document_count
  from public.credential_template_documents template_document
  where template_document.template_version_id = v_lock.template_version_id;

  v_output_count := jsonb_array_length(p_outputs);
  if v_output_count <> v_document_count then
    raise exception 'generated output manifest must cover every template document exactly once'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_outputs) item
    cross join lateral jsonb_object_keys(item) key
    where key not in (
      'file_id', 'template_document_id', 'file_type_id', 'admin_label',
      'size_bytes', 'page_count', 'is_primary', 'input_sha256', 'output_sha256'
    )
  ) then
    raise exception 'generated output manifest contains unsupported fields'
      using errcode = '22023';
  end if;

  if (
    select count(distinct item ->> 'file_id')
    from jsonb_array_elements(p_outputs) item
  ) <> v_output_count or (
    select count(distinct item ->> 'template_document_id')
    from jsonb_array_elements(p_outputs) item
  ) <> v_output_count then
    raise exception 'generated output manifest contains duplicate identities'
      using errcode = '23514';
  end if;

  for v_output in select value from jsonb_array_elements(p_outputs)
  loop
    begin
      v_file_id := (v_output ->> 'file_id')::uuid;
      v_template_document_id := (v_output ->> 'template_document_id')::uuid;
      v_file_type_id := (v_output ->> 'file_type_id')::uuid;
      v_admin_label := nullif(btrim(v_output ->> 'admin_label'), '');
      v_size_bytes := (v_output ->> 'size_bytes')::bigint;
      v_page_count := (v_output ->> 'page_count')::integer;
      v_is_primary := (v_output ->> 'is_primary')::boolean;
      v_input_sha256 := v_output ->> 'input_sha256';
      v_output_sha256 := v_output ->> 'output_sha256';
    exception when others then
      raise exception 'generated output manifest contains invalid values'
        using errcode = '22023';
    end;

    if v_admin_label is null or char_length(v_admin_label) > 255
      or v_size_bytes not between 1 and 20971520
      or v_page_count < 1
      or v_input_sha256 is null
      or v_input_sha256 !~ '^[0-9a-f]{64}$'
      or v_output_sha256 is null
      or v_output_sha256 !~ '^[0-9a-f]{64}$' then
      raise exception 'generated output manifest contains unsafe metadata'
        using errcode = '22023';
    end if;

    if not exists (
      select 1
      from public.credential_template_documents template_document
      where template_document.id = v_template_document_id
        and template_document.template_version_id = v_lock.template_version_id
        and template_document.file_type_id = v_file_type_id
        and template_document.admin_label = v_admin_label
        and template_document.page_count = v_page_count
        and template_document.is_primary = v_is_primary
        and template_document.source_sha256 = v_input_sha256
    ) then
      raise exception 'generated output metadata does not match the immutable template document'
        using errcode = '23514';
    end if;

    if v_is_primary then v_primary_count := v_primary_count + 1; end if;
    v_total_pages := v_total_pages + v_page_count;
  end loop;

  if v_primary_count <> 1 then
    raise exception 'generated credential package must contain exactly one primary PDF'
      using errcode = '23514';
  end if;

  select count(*)::integer into v_current_file_count
  from public.credential_files credential_file
  where credential_file.credential_id = p_credential_id;

  if v_lock.is_regeneration and v_current_file_count <> v_output_count then
    raise exception 'current generated credential package changed during regeneration'
      using errcode = '40001';
  end if;
  if not v_lock.is_regeneration and v_current_file_count <> 0 then
    raise exception 'credential files changed during first generation'
      using errcode = '40001';
  end if;

  perform set_config('app.credential_file_change_reason', 'Automatic generation from immutable Template Package', true);
  perform set_config('app.credential_file_operation', case when v_lock.is_regeneration then 'replace' else 'attach' end, true);

  for v_output in select value from jsonb_array_elements(p_outputs)
  loop
    v_file_id := (v_output ->> 'file_id')::uuid;
    v_template_document_id := (v_output ->> 'template_document_id')::uuid;
    v_file_type_id := (v_output ->> 'file_type_id')::uuid;
    v_admin_label := btrim(v_output ->> 'admin_label');
    v_size_bytes := (v_output ->> 'size_bytes')::bigint;
    v_is_primary := (v_output ->> 'is_primary')::boolean;
    v_input_sha256 := v_output ->> 'input_sha256';
    v_output_sha256 := v_output ->> 'output_sha256';

    if v_lock.is_regeneration then
      select latest.template_document_id into v_previous_document_id
      from (
        select generation.template_document_id
        from public.credential_file_generations generation
        where generation.credential_file_id = v_file_id
        order by generation.generation_attempt desc
        limit 1
      ) latest;

      if v_previous_document_id is distinct from v_template_document_id
        or not exists (
          select 1 from public.credential_files credential_file
          where credential_file.id = v_file_id
            and credential_file.credential_id = p_credential_id
        ) then
        raise exception 'regeneration file identity does not match current template provenance'
          using errcode = '23514';
      end if;

      update public.credential_files credential_file
      set
        file_type_id = v_file_type_id,
        admin_label = v_admin_label,
        mime_type = 'application/pdf',
        size_bytes = v_size_bytes,
        is_primary = v_is_primary,
        uploaded_by = auth.uid()
      where credential_file.id = v_file_id;
    else
      insert into public.credential_files (
        id,
        credential_id,
        file_type_id,
        admin_label,
        storage_bucket,
        storage_path,
        mime_type,
        size_bytes,
        is_primary,
        uploaded_by
      ) values (
        v_file_id,
        p_credential_id,
        v_file_type_id,
        v_admin_label,
        'private-credentials',
        p_credential_id::text || '/' || v_file_id::text || '.pdf',
        'application/pdf',
        v_size_bytes,
        v_is_primary,
        auth.uid()
      );
    end if;

    insert into public.credential_file_generations (
      credential_file_id,
      template_version_id,
      template_document_id,
      generation_batch_item_id,
      generation_attempt,
      input_sha256,
      output_sha256,
      generated_by
    ) values (
      v_file_id,
      v_lock.template_version_id,
      v_template_document_id,
      null,
      v_lock.generation_attempt,
      v_input_sha256,
      v_output_sha256,
      auth.uid()
    );
  end loop;

  perform internal.write_credential_history(
    p_credential_id => p_credential_id,
    p_event_type => case when v_lock.is_regeneration then 'credential_generation.regenerated' else 'credential_generation.completed' end,
    p_after_data => jsonb_build_object(
      'template_package_id', v_template_package_id,
      'template_version_id', v_lock.template_version_id,
      'generation_attempt', v_lock.generation_attempt,
      'file_count', v_output_count,
      'page_count', v_total_pages
    )
  );
  perform internal.write_audit_log(
    p_action => case when v_lock.is_regeneration then 'credential_generation.regenerated' else 'credential_generation.completed' end,
    p_actor_id => auth.uid(),
    p_target_schema => 'public',
    p_target_table => 'credentials',
    p_target_id => p_credential_id,
    p_metadata => jsonb_build_object(
      'template_package_id', v_template_package_id,
      'template_version_id', v_lock.template_version_id,
      'generation_attempt', v_lock.generation_attempt,
      'file_count', v_output_count,
      'page_count', v_total_pages
    )
  );

  delete from internal.credential_single_generation_locks
  where credential_id = p_credential_id and lock_token = p_lock_token;

  return jsonb_build_object(
    'template_package_id', v_template_package_id,
    'template_version_id', v_lock.template_version_id,
    'generation_attempt', v_lock.generation_attempt,
    'is_regeneration', v_lock.is_regeneration,
    'file_count', v_output_count,
    'page_count', v_total_pages
  );
end;
$$;

comment on function public.complete_single_credential_generation(uuid, uuid, jsonb) is
  'Atomically attaches or replaces the complete current private PDF package and appends immutable template provenance after server Storage writes.';

create or replace function public.fail_single_credential_generation(
  p_credential_id uuid,
  p_lock_token uuid,
  p_error_code text
)
returns boolean
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_lock internal.credential_single_generation_locks;
  v_code text := lower(nullif(btrim(p_error_code), ''));
begin
  perform internal.assert_single_generation_actor();

  if v_code is null or v_code !~ '^[a-z][a-z0-9_]{0,63}$' then
    raise exception 'safe generation error code is required' using errcode = '22023';
  end if;

  select generation_lock.* into v_lock
  from internal.credential_single_generation_locks generation_lock
  where generation_lock.credential_id = p_credential_id
    and generation_lock.lock_token = p_lock_token
    and generation_lock.started_by = auth.uid()
  for update;

  if v_lock.credential_id is null then return false; end if;

  perform internal.write_credential_history(
    p_credential_id => p_credential_id,
    p_event_type => 'credential_generation.failed',
    p_after_data => jsonb_build_object(
      'template_version_id', v_lock.template_version_id,
      'generation_attempt', v_lock.generation_attempt,
      'error_code', v_code
    )
  );
  perform internal.write_audit_log(
    p_action => 'credential_generation.failed',
    p_actor_id => auth.uid(),
    p_target_schema => 'public',
    p_target_table => 'credentials',
    p_target_id => p_credential_id,
    p_metadata => jsonb_build_object(
      'template_version_id', v_lock.template_version_id,
      'generation_attempt', v_lock.generation_attempt,
      'error_code', v_code
    )
  );

  delete from internal.credential_single_generation_locks
  where credential_id = p_credential_id and lock_token = p_lock_token;
  return true;
end;
$$;

comment on function public.fail_single_credential_generation(uuid, uuid, text) is
  'Releases the private lease and records only a bounded non-sensitive failure code; no token, PDF bytes, path, or PII is persisted.';

revoke all on function public.begin_single_credential_generation(uuid, uuid, uuid) from public, anon;
revoke all on function public.refresh_single_credential_generation(uuid, uuid) from public, anon;
revoke all on function public.complete_single_credential_generation(uuid, uuid, jsonb) from public, anon;
revoke all on function public.fail_single_credential_generation(uuid, uuid, text) from public, anon;

grant execute on function public.begin_single_credential_generation(uuid, uuid, uuid) to authenticated, service_role;
grant execute on function public.refresh_single_credential_generation(uuid, uuid) to authenticated, service_role;
grant execute on function public.complete_single_credential_generation(uuid, uuid, jsonb) to authenticated, service_role;
grant execute on function public.fail_single_credential_generation(uuid, uuid, text) to authenticated, service_role;

-- No public/generated-file Storage policy is added. Browser roles still have no
-- direct access to credential-templates or private-credentials objects.
