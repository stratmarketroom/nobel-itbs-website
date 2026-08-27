-- PDFGEN-LINT-001: correct composite Template Package assignment in the
-- already deployed PDFGEN-005 single-generation begin function. The function
-- signature, authorization, lifecycle, lease, audit, and return contract remain
-- unchanged.

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

  select template_package.*
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
