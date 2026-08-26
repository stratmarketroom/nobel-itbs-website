-- PDFGEN-006: Batch Generation and Review
-- Full explicitly selected cohorts, bounded resumable item processing, permanent
-- number preservation, and private human review. Activation remains PDFGEN-007.

create or replace function internal.assert_batch_generation_actor()
returns void
language plpgsql
stable
security definer
set search_path = internal, public, pg_temp
as $$
begin
  perform internal.assert_sensitive_action_allowed(
    array['owner', 'super_admin', 'credential_manager']::public.app_role[],
    'credential PDF batch generation and review'
  );
end;
$$;

comment on function internal.assert_batch_generation_actor() is
  'Requires an active MFA/AAL2 Owner, Super Admin, or Credential Manager for every batch mutation.';

revoke all on function internal.assert_batch_generation_actor() from public, anon, authenticated;
grant execute on function internal.assert_batch_generation_actor() to postgres, service_role;

create or replace function public.preview_credential_generation_batch(
  p_template_version_id uuid,
  p_programme_id uuid,
  p_programme_run_id uuid,
  p_credential_type_id uuid,
  p_language_code text,
  p_completion_date date,
  p_learner_ids uuid[]
)
returns table (
  learner_id uuid,
  learner_name text,
  position bigint,
  archived boolean,
  conflicting_credential_id uuid,
  conflicting_document_number text
)
language plpgsql
stable
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_selected_count integer;
begin
  perform internal.assert_batch_generation_actor();
  if p_template_version_id is null or p_programme_id is null or p_credential_type_id is null
    or lower(nullif(btrim(p_language_code), '')) not in ('en', 'ua', 'cz')
    or p_learner_ids is null or cardinality(p_learner_ids) = 0 then
    raise exception 'complete batch context and at least one learner are required' using errcode = '22023';
  end if;
  select count(distinct selected_id)::integer into v_selected_count
  from unnest(p_learner_ids) selected(selected_id);
  if v_selected_count <> cardinality(p_learner_ids) then
    raise exception 'batch learner selection contains duplicates' using errcode = '22023';
  end if;
  if (select count(*) from public.learners where id = any(p_learner_ids)) <> cardinality(p_learner_ids) then
    raise exception 'one or more selected learners do not exist' using errcode = '23503';
  end if;
  if not exists (
    select 1 from public.credential_template_versions version
    join public.credential_template_packages package on package.id = version.template_package_id
    where version.id = p_template_version_id and version.status = 'published'
      and package.programme_id = p_programme_id
      and package.programme_run_id is not distinct from p_programme_run_id
      and package.credential_type_id = p_credential_type_id
      and package.language_code = lower(btrim(p_language_code))
  ) then
    raise exception 'batch requires an exact matching published template version' using errcode = '23514';
  end if;

  return query
  select
    learner.id,
    case when lower(btrim(p_language_code)) = 'ua' then learner.ukrainian_full_name
      else concat_ws(' ', learner.latin_first_name, learner.latin_last_name) end,
    selected.position,
    learner.archived_at is not null,
    conflict.id,
    conflict.document_number
  from unnest(p_learner_ids) with ordinality selected(selected_id, position)
  join public.learners learner on learner.id = selected.selected_id
  left join lateral (
    select credential.id, credential.document_number
    from public.credentials credential
    join public.credential_sets credential_set on credential_set.id = credential.credential_set_id
    where credential.learner_id = learner.id
      and credential.programme_id = p_programme_id
      and credential.programme_run_id is not distinct from p_programme_run_id
      and credential.credential_type_id = p_credential_type_id
      and credential.language_code = lower(btrim(p_language_code))
      and credential_set.completion_date is not distinct from p_completion_date
      and credential.status <> 'voided'
    order by credential.created_at, credential.id
    limit 1
  ) conflict on true
  order by selected.position;
end;
$$;

comment on function public.preview_credential_generation_batch(uuid, uuid, uuid, uuid, text, date, uuid[]) is
  'Read-only complete-cohort preview with archived and exact-context conflict classification.';

create or replace function public.confirm_credential_generation_batch(
  p_idempotency_key uuid,
  p_template_version_id uuid,
  p_programme_id uuid,
  p_programme_run_id uuid,
  p_credential_type_id uuid,
  p_language_code text,
  p_issue_date date,
  p_completion_date date,
  p_learner_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_batch_id uuid;
  v_existing public.credential_generation_batches;
  v_selected_count integer;
  v_conflicting_credential_id uuid;
  v_item record;
begin
  perform internal.assert_batch_generation_actor();

  if p_idempotency_key is null or p_template_version_id is null or p_programme_id is null
    or p_credential_type_id is null or p_issue_date is null
    or lower(nullif(btrim(p_language_code), '')) not in ('en', 'ua', 'cz')
    or p_learner_ids is null or cardinality(p_learner_ids) = 0 then
    raise exception 'complete batch context and at least one learner are required'
      using errcode = '22023';
  end if;

  select count(distinct learner_id)::integer into v_selected_count
  from unnest(p_learner_ids) selected(learner_id);
  if v_selected_count <> cardinality(p_learner_ids) then
    raise exception 'batch learner selection contains duplicates' using errcode = '22023';
  end if;

  select batch.* into v_existing
  from public.credential_generation_batches batch
  where batch.idempotency_key = p_idempotency_key;
  if v_existing.id is not null then
    if v_existing.template_version_id is distinct from p_template_version_id
      or v_existing.programme_id is distinct from p_programme_id
      or v_existing.programme_run_id is distinct from p_programme_run_id
      or v_existing.credential_type_id is distinct from p_credential_type_id
      or v_existing.language_code is distinct from lower(btrim(p_language_code))
      or v_existing.issue_date is distinct from p_issue_date
      or v_existing.completion_date is distinct from p_completion_date
      or (select count(*) from public.credential_generation_batch_items where batch_id = v_existing.id) <> cardinality(p_learner_ids)
      or (select array_agg(learner_id order by position) from public.credential_generation_batch_items where batch_id = v_existing.id) is distinct from p_learner_ids then
      raise exception 'idempotency key is already bound to another batch request'
        using errcode = '23514';
    end if;
    return v_existing.id;
  end if;

  if not exists (
    select 1
    from public.credential_template_versions version
    join public.credential_template_packages package on package.id = version.template_package_id
    where version.id = p_template_version_id
      and version.status = 'published'
      and package.programme_id = p_programme_id
      and package.programme_run_id is not distinct from p_programme_run_id
      and package.credential_type_id = p_credential_type_id
      and package.language_code = lower(btrim(p_language_code))
  ) then
    raise exception 'batch requires an exact matching published template version'
      using errcode = '23514';
  end if;

  if (select count(*) from public.learners where id = any(p_learner_ids)) <> cardinality(p_learner_ids) then
    raise exception 'one or more selected learners do not exist' using errcode = '23503';
  end if;
  if exists (select 1 from public.learners where id = any(p_learner_ids) and archived_at is not null) then
    raise exception 'archived learners cannot be included in a generation batch'
      using errcode = '23514';
  end if;

  insert into public.credential_generation_batches (
    idempotency_key, template_version_id, programme_id, programme_run_id,
    credential_type_id, language_code, issue_date, completion_date, status,
    processing_chunk_size, created_by, confirmed_by, confirmed_at
  ) values (
    p_idempotency_key, p_template_version_id, p_programme_id, p_programme_run_id,
    p_credential_type_id, lower(btrim(p_language_code)), p_issue_date, p_completion_date,
    'confirmed', 5, auth.uid(), auth.uid(), now()
  ) returning id into v_batch_id;

  for v_item in
    select learner_id, position
    from unnest(p_learner_ids) with ordinality selected(learner_id, position)
    order by position
  loop
    select credential.id into v_conflicting_credential_id
    from public.credentials credential
    join public.credential_sets credential_set on credential_set.id = credential.credential_set_id
    where credential.learner_id = v_item.learner_id
      and credential.programme_id = p_programme_id
      and credential.programme_run_id is not distinct from p_programme_run_id
      and credential.credential_type_id = p_credential_type_id
      and credential.language_code = lower(btrim(p_language_code))
      and credential_set.completion_date is not distinct from p_completion_date
      and credential.status <> 'voided'
    order by credential.created_at, credential.id
    limit 1;

    insert into public.credential_generation_batch_items (
      batch_id, learner_id, position, status, conflicting_credential_id, last_error_code
    ) values (
      v_batch_id,
      v_item.learner_id,
      v_item.position,
      case when v_conflicting_credential_id is null then 'queued' else 'conflict' end,
      v_conflicting_credential_id,
      case when v_conflicting_credential_id is null then null else 'existing_non_voided_credential' end
    );
    v_conflicting_credential_id := null;
  end loop;

  return v_batch_id;
end;
$$;

comment on function public.confirm_credential_generation_batch(uuid, uuid, uuid, uuid, uuid, text, date, date, uuid[]) is
  'Atomically confirms one complete explicitly selected cohort, rejects archived learners, and records exact-context conflicts without a product-facing cohort cap.';

create or replace function public.begin_credential_generation_batch_item(
  p_batch_item_id uuid,
  p_lease_token uuid
)
returns table (
  credential_id uuid,
  template_version_id uuid,
  generation_attempt integer
)
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_item public.credential_generation_batch_items;
  v_batch public.credential_generation_batches;
begin
  perform internal.assert_batch_generation_actor();
  if p_batch_item_id is null or p_lease_token is null then
    raise exception 'batch item and lease token are required' using errcode = '22023';
  end if;

  select item.* into v_item
  from public.credential_generation_batch_items item
  where item.id = p_batch_item_id
  for update;
  if v_item.id is null then raise exception 'batch item not found' using errcode = 'P0002'; end if;

  select batch.* into v_batch
  from public.credential_generation_batches batch
  where batch.id = v_item.batch_id
  for update;

  if v_batch.status not in ('confirmed', 'processing', 'review') then
    raise exception 'batch is not available for generation processing' using errcode = '23514';
  end if;
  if v_item.status = 'processing' and v_item.lease_expires_at <= now() then
    update public.credential_generation_batch_items
    set status = 'retryable', lease_token = null, lease_expires_at = null, last_error_code = 'lease_expired'
    where id = v_item.id;
    v_item.status := 'retryable';
  end if;
  if v_item.status not in ('queued', 'retryable') then
    raise exception 'batch item is not queued for generation' using errcode = '55P03';
  end if;

  update public.credential_generation_batch_items
  set status = 'processing', attempt_count = attempt_count + 1,
      lease_token = p_lease_token, lease_expires_at = now() + interval '15 minutes',
      last_error_code = null
  where id = v_item.id
  returning public.credential_generation_batch_items.attempt_count into v_item.attempt_count;

  update public.credential_generation_batches
  set status = 'processing', started_at = coalesce(started_at, now())
  where id = v_batch.id;

  perform internal.write_audit_log(
    p_action => 'credential_generation.batch_item_started',
    p_actor_id => auth.uid(), p_target_schema => 'public',
    p_target_table => 'credential_generation_batch_items', p_target_id => v_item.id,
    p_metadata => jsonb_build_object('batch_id', v_batch.id, 'attempt', v_item.attempt_count)
  );

  return query select v_item.credential_id, v_batch.template_version_id, v_item.attempt_count;
end;
$$;

create or replace function public.prepare_credential_generation_batch_item(
  p_batch_item_id uuid,
  p_lease_token uuid,
  p_verification_token_lookup_hash text,
  p_verification_token_encrypted text,
  p_token_encryption_key_version integer
)
returns uuid
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_item public.credential_generation_batch_items;
  v_batch public.credential_generation_batches;
  v_learner public.learners;
  v_conflict uuid;
  v_holder_name text;
  v_programme_title text;
  v_credential_type text;
  v_credential_id uuid;
begin
  perform internal.assert_batch_generation_actor();

  select item.* into v_item
  from public.credential_generation_batch_items item
  where item.id = p_batch_item_id
  for update;
  if v_item.id is null or v_item.status <> 'processing'
    or v_item.lease_token is distinct from p_lease_token or v_item.lease_expires_at <= now() then
    raise exception 'batch item generation lease is missing or expired' using errcode = '55P03';
  end if;
  if v_item.credential_id is not null then return v_item.credential_id; end if;

  select batch.* into v_batch
  from public.credential_generation_batches batch where batch.id = v_item.batch_id;
  select learner.* into v_learner from public.learners learner where learner.id = v_item.learner_id;
  if v_learner.archived_at is not null then
    raise exception 'archived learner cannot create a batch credential' using errcode = '23514';
  end if;

  select credential.id into v_conflict
  from public.credentials credential
  join public.credential_sets credential_set on credential_set.id = credential.credential_set_id
  where credential.learner_id = v_item.learner_id
    and credential.programme_id = v_batch.programme_id
    and credential.programme_run_id is not distinct from v_batch.programme_run_id
    and credential.credential_type_id = v_batch.credential_type_id
    and credential.language_code = v_batch.language_code
    and credential_set.completion_date is not distinct from v_batch.completion_date
    and credential.status <> 'voided'
  order by credential.created_at, credential.id
  limit 1;
  if v_conflict is not null then
    update public.credential_generation_batch_items
    set status = 'conflict', conflicting_credential_id = v_conflict,
        last_error_code = 'existing_non_voided_credential', lease_token = null, lease_expires_at = null
    where id = v_item.id;
    if not exists (
      select 1 from public.credential_generation_batch_items
      where batch_id = v_batch.id and status in ('queued', 'processing')
    ) then update public.credential_generation_batches set status = 'review' where id = v_batch.id; end if;
    return null;
  end if;

  v_holder_name := case when v_batch.language_code = 'ua'
    then v_learner.ukrainian_full_name
    else concat_ws(' ', v_learner.latin_first_name, v_learner.latin_last_name)
  end;
  select coalesce(
    (select title from public.programme_translations where programme_id = v_batch.programme_id and language_code = v_batch.language_code limit 1),
    (select title from public.programme_translations where programme_id = v_batch.programme_id and language_code = 'en' limit 1),
    (select slug from public.programmes where id = v_batch.programme_id)
  ) into v_programme_title;
  select coalesce(
    (select display_name from public.credential_type_translations where credential_type_id = v_batch.credential_type_id and language_code = v_batch.language_code limit 1),
    (select display_name from public.credential_type_translations where credential_type_id = v_batch.credential_type_id and language_code = 'en' limit 1),
    (select code from public.credential_types where id = v_batch.credential_type_id)
  ) into v_credential_type;

  select created.credential_id into v_credential_id
  from public.create_pending_credential(
    v_item.learner_id, v_batch.programme_id, v_batch.credential_type_id,
    v_batch.language_code, v_batch.issue_date,
    p_verification_token_lookup_hash, p_verification_token_encrypted,
    p_token_encryption_key_version, v_holder_name, v_programme_title, v_credential_type,
    v_batch.programme_run_id, v_batch.completion_date, null, null
  ) created;

  update public.credential_generation_batch_items
  set credential_id = v_credential_id
  where id = v_item.id and credential_id is null;
  if not found then raise exception 'batch credential link changed concurrently' using errcode = '40001'; end if;

  perform internal.write_audit_log(
    p_action => 'credential_generation.batch_item_credential_created',
    p_actor_id => auth.uid(), p_target_schema => 'public',
    p_target_table => 'credential_generation_batch_items', p_target_id => v_item.id,
    p_metadata => jsonb_build_object('batch_id', v_batch.id, 'credential_id', v_credential_id)
  );
  return v_credential_id;
end;
$$;

create or replace function public.refresh_credential_generation_batch_item(
  p_batch_item_id uuid,
  p_lease_token uuid
)
returns void
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
begin
  perform internal.assert_batch_generation_actor();
  update public.credential_generation_batch_items
  set lease_expires_at = now() + interval '15 minutes'
  where id = p_batch_item_id and status = 'processing'
    and lease_token = p_lease_token and lease_expires_at > now();
  if not found then raise exception 'batch item generation lease is missing or expired' using errcode = '55P03'; end if;
end;
$$;

create or replace function public.complete_credential_generation_batch_item(
  p_batch_item_id uuid,
  p_lease_token uuid,
  p_outputs jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_item public.credential_generation_batch_items;
  v_batch public.credential_generation_batches;
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
  v_total_pages integer := 0;
begin
  perform internal.assert_batch_generation_actor();
  if jsonb_typeof(p_outputs) <> 'array' or jsonb_array_length(p_outputs) = 0 then
    raise exception 'generated output manifest must be a non-empty JSON array' using errcode = '22023';
  end if;

  select item.* into v_item
  from public.credential_generation_batch_items item
  where item.id = p_batch_item_id
  for update;
  if v_item.id is null or v_item.status <> 'processing' or v_item.credential_id is null
    or v_item.lease_token is distinct from p_lease_token or v_item.lease_expires_at <= now() then
    raise exception 'batch item generation lease is missing, unprepared, or expired' using errcode = '55P03';
  end if;
  select batch.* into v_batch from public.credential_generation_batches batch where batch.id = v_item.batch_id for update;

  if not exists (select 1 from public.credentials where id = v_item.credential_id and status = 'pending') then
    raise exception 'only a pending batch credential can complete generation' using errcode = '23514';
  end if;
  if exists (select 1 from public.credential_files where credential_id = v_item.credential_id) then
    raise exception 'batch generation cannot replace an existing credential package' using errcode = '40001';
  end if;

  select count(*)::integer into v_document_count
  from public.credential_template_documents where template_version_id = v_batch.template_version_id;
  v_output_count := jsonb_array_length(p_outputs);
  if v_output_count <> v_document_count then
    raise exception 'generated output manifest must cover every template document exactly once' using errcode = '23514';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_outputs) item
    cross join lateral jsonb_object_keys(item) key
    where key not in ('file_id','template_document_id','file_type_id','admin_label','size_bytes','page_count','is_primary','input_sha256','output_sha256')
  ) then raise exception 'generated output manifest contains unsupported fields' using errcode = '22023'; end if;
  if (select count(distinct item ->> 'file_id') from jsonb_array_elements(p_outputs) item) <> v_output_count
    or (select count(distinct item ->> 'template_document_id') from jsonb_array_elements(p_outputs) item) <> v_output_count then
    raise exception 'generated output manifest contains duplicate identities' using errcode = '23514';
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
      raise exception 'generated output manifest contains invalid values' using errcode = '22023';
    end;
    if v_admin_label is null or char_length(v_admin_label) > 255
      or v_size_bytes not between 1 and 20971520 or v_page_count < 1
      or v_input_sha256 !~ '^[0-9a-f]{64}$' or v_output_sha256 !~ '^[0-9a-f]{64}$' then
      raise exception 'generated output manifest contains unsafe metadata' using errcode = '22023';
    end if;
    if not exists (
      select 1 from public.credential_template_documents document
      where document.id = v_template_document_id
        and document.template_version_id = v_batch.template_version_id
        and document.file_type_id = v_file_type_id
        and document.admin_label = v_admin_label
        and document.page_count = v_page_count
        and document.is_primary = v_is_primary
        and document.source_sha256 = v_input_sha256
    ) then raise exception 'generated output metadata does not match the immutable template document' using errcode = '23514'; end if;
    if v_is_primary then v_primary_count := v_primary_count + 1; end if;
    v_total_pages := v_total_pages + v_page_count;
  end loop;
  if v_primary_count <> 1 then raise exception 'generated credential package must contain exactly one primary PDF' using errcode = '23514'; end if;

  perform set_config('app.credential_file_change_reason', 'Automatic batch generation from immutable Template Package', true);
  perform set_config('app.credential_file_operation', 'attach', true);
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

    insert into public.credential_files (
      id, credential_id, file_type_id, admin_label, storage_bucket, storage_path,
      mime_type, size_bytes, is_primary, uploaded_by
    ) values (
      v_file_id, v_item.credential_id, v_file_type_id, v_admin_label,
      'private-credentials', v_item.credential_id::text || '/' || v_file_id::text || '.pdf',
      'application/pdf', v_size_bytes, v_is_primary, auth.uid()
    );
    insert into public.credential_file_generations (
      credential_file_id, template_version_id, template_document_id,
      generation_batch_item_id, generation_attempt, input_sha256, output_sha256, generated_by
    ) values (
      v_file_id, v_batch.template_version_id, v_template_document_id,
      v_item.id, v_item.attempt_count, v_input_sha256, v_output_sha256, auth.uid()
    );
  end loop;

  update public.credential_generation_batch_items
  set status = 'generated', generated_at = now(), lease_token = null,
      lease_expires_at = null, last_error_code = null
  where id = v_item.id;

  perform internal.write_credential_history(
    p_credential_id => v_item.credential_id,
    p_event_type => 'credential_generation.batch_completed',
    p_after_data => jsonb_build_object(
      'batch_id', v_batch.id, 'batch_item_id', v_item.id,
      'template_version_id', v_batch.template_version_id,
      'generation_attempt', v_item.attempt_count,
      'file_count', v_output_count, 'page_count', v_total_pages
    )
  );
  perform internal.write_audit_log(
    p_action => 'credential_generation.batch_item_completed',
    p_actor_id => auth.uid(), p_target_schema => 'public',
    p_target_table => 'credential_generation_batch_items', p_target_id => v_item.id,
    p_metadata => jsonb_build_object('batch_id', v_batch.id, 'attempt', v_item.attempt_count, 'file_count', v_output_count, 'page_count', v_total_pages)
  );

  if not exists (
    select 1 from public.credential_generation_batch_items
    where batch_id = v_batch.id and status in ('queued', 'processing')
  ) then
    update public.credential_generation_batches set status = 'review' where id = v_batch.id;
  end if;

  return jsonb_build_object(
    'credential_id', v_item.credential_id,
    'template_version_id', v_batch.template_version_id,
    'generation_attempt', v_item.attempt_count,
    'file_count', v_output_count,
    'page_count', v_total_pages
  );
end;
$$;

create or replace function public.fail_credential_generation_batch_item(
  p_batch_item_id uuid,
  p_lease_token uuid,
  p_error_code text
)
returns boolean
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_item public.credential_generation_batch_items;
  v_code text := lower(nullif(btrim(p_error_code), ''));
begin
  perform internal.assert_batch_generation_actor();
  if v_code is null or v_code !~ '^[a-z][a-z0-9_]{0,63}$' then
    raise exception 'safe generation error code is required' using errcode = '22023';
  end if;
  select item.* into v_item from public.credential_generation_batch_items item
  where item.id = p_batch_item_id and item.status = 'processing'
    and item.lease_token = p_lease_token for update;
  if v_item.id is null then return false; end if;
  update public.credential_generation_batch_items
  set status = 'retryable', last_error_code = v_code,
      lease_token = null, lease_expires_at = null
  where id = v_item.id;
  if v_item.credential_id is not null then
    perform internal.write_credential_history(
      p_credential_id => v_item.credential_id,
      p_event_type => 'credential_generation.batch_failed',
      p_after_data => jsonb_build_object('batch_id', v_item.batch_id, 'batch_item_id', v_item.id, 'generation_attempt', v_item.attempt_count, 'error_code', v_code)
    );
  end if;
  perform internal.write_audit_log(
    p_action => 'credential_generation.batch_item_failed',
    p_actor_id => auth.uid(), p_target_schema => 'public',
    p_target_table => 'credential_generation_batch_items', p_target_id => v_item.id,
    p_metadata => jsonb_build_object('batch_id', v_item.batch_id, 'attempt', v_item.attempt_count, 'error_code', v_code)
  );
  if not exists (
    select 1 from public.credential_generation_batch_items
    where batch_id = v_item.batch_id and status in ('queued', 'processing')
  ) then update public.credential_generation_batches set status = 'review' where id = v_item.batch_id; end if;
  return true;
end;
$$;

create or replace function public.queue_credential_generation_batch_item(p_batch_item_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
begin
  perform internal.assert_batch_generation_actor();
  update public.credential_generation_batch_items
  set status = 'queued', last_error_code = null, lease_token = null, lease_expires_at = null
  where id = p_batch_item_id and status in ('retryable', 'failed');
  if not found then raise exception 'only a failed or retryable batch item can be queued again' using errcode = '23514'; end if;
  return true;
end;
$$;

create or replace function public.review_credential_generation_batch_item(p_batch_item_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_item public.credential_generation_batch_items;
  v_expected integer;
  v_files integer;
  v_primary integer;
  v_provenance integer;
begin
  perform internal.assert_batch_generation_actor();
  select item.* into v_item from public.credential_generation_batch_items item
  where item.id = p_batch_item_id for update;
  if v_item.id is null then raise exception 'batch item not found' using errcode = 'P0002'; end if;
  if v_item.status <> 'generated' or v_item.credential_id is null then
    raise exception 'only a generated batch item can be marked reviewed' using errcode = '23514';
  end if;
  if not exists (select 1 from public.credentials where id = v_item.credential_id and status = 'pending') then
    raise exception 'review requires a pending credential' using errcode = '23514';
  end if;
  select count(*)::integer into v_expected
  from public.credential_template_documents document
  join public.credential_generation_batches batch on batch.template_version_id = document.template_version_id
  where batch.id = v_item.batch_id;
  select count(*)::integer, count(*) filter (where is_primary)::integer
    into v_files, v_primary
  from public.credential_files where credential_id = v_item.credential_id;
  select count(*)::integer into v_provenance
  from public.credential_file_generations where generation_batch_item_id = v_item.id;
  if v_files <> v_expected or v_provenance <> v_expected or v_primary <> 1 then
    raise exception 'complete generated package with exactly one primary PDF is required for review'
      using errcode = '23514';
  end if;
  update public.credential_generation_batch_items
  set status = 'reviewed', reviewed_by = auth.uid(), reviewed_at = now()
  where id = v_item.id;
  perform internal.write_audit_log(
    p_action => 'credential_generation.batch_item_reviewed',
    p_actor_id => auth.uid(), p_target_schema => 'public',
    p_target_table => 'credential_generation_batch_items', p_target_id => v_item.id,
    p_metadata => jsonb_build_object('batch_id', v_item.batch_id, 'credential_id', v_item.credential_id)
  );
  return true;
end;
$$;

revoke all on function public.confirm_credential_generation_batch(uuid, uuid, uuid, uuid, uuid, text, date, date, uuid[]) from public, anon;
revoke all on function public.preview_credential_generation_batch(uuid, uuid, uuid, uuid, text, date, uuid[]) from public, anon;
revoke all on function public.begin_credential_generation_batch_item(uuid, uuid) from public, anon;
revoke all on function public.prepare_credential_generation_batch_item(uuid, uuid, text, text, integer) from public, anon;
revoke all on function public.refresh_credential_generation_batch_item(uuid, uuid) from public, anon;
revoke all on function public.complete_credential_generation_batch_item(uuid, uuid, jsonb) from public, anon;
revoke all on function public.fail_credential_generation_batch_item(uuid, uuid, text) from public, anon;
revoke all on function public.queue_credential_generation_batch_item(uuid) from public, anon;
revoke all on function public.review_credential_generation_batch_item(uuid) from public, anon;

grant execute on function public.confirm_credential_generation_batch(uuid, uuid, uuid, uuid, uuid, text, date, date, uuid[]) to authenticated, service_role;
grant execute on function public.preview_credential_generation_batch(uuid, uuid, uuid, uuid, text, date, uuid[]) to authenticated, service_role;
grant execute on function public.begin_credential_generation_batch_item(uuid, uuid) to authenticated, service_role;
grant execute on function public.prepare_credential_generation_batch_item(uuid, uuid, text, text, integer) to authenticated, service_role;
grant execute on function public.refresh_credential_generation_batch_item(uuid, uuid) to authenticated, service_role;
grant execute on function public.complete_credential_generation_batch_item(uuid, uuid, jsonb) to authenticated, service_role;
grant execute on function public.fail_credential_generation_batch_item(uuid, uuid, text) to authenticated, service_role;
grant execute on function public.queue_credential_generation_batch_item(uuid) to authenticated, service_role;
grant execute on function public.review_credential_generation_batch_item(uuid) to authenticated, service_role;

-- Browser roles still receive no direct DML on batches/items/provenance and no
-- Storage policy for credential-templates or private-credentials.
