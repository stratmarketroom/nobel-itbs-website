-- PDFGEN-006 forward-only correction after development database linting.
-- PostgreSQL resolves CASE text literals as text; cast the batch item state
-- explicitly so confirmation can insert into the enum-typed status column.

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
      case
        when v_conflicting_credential_id is null then 'queued'::public.credential_generation_item_status
        else 'conflict'::public.credential_generation_item_status
      end,
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
