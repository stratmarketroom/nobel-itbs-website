-- PDFGEN-003: Template Package Admin and Field Placement Editor
-- Atomic draft document metadata/placement writes, publication validation,
-- and privacy-minimal sample-preview audit. No PDF generation is added here.

create or replace function internal.credential_template_validation_issues(
  p_template_version_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = internal, public, storage, pg_temp
as $$
declare
  v_issues jsonb := '[]'::jsonb;
  v_required public.credential_template_field_key;
begin
  if not exists (
    select 1
    from public.credential_template_versions template_version
    where template_version.id = p_template_version_id
  ) then
    raise exception 'credential template version was not found'
      using errcode = 'P0002';
  end if;

  if not exists (
    select 1
    from public.credential_template_documents template_document
    where template_document.template_version_id = p_template_version_id
  ) then
    v_issues := v_issues || jsonb_build_array(jsonb_build_object(
      'code', 'no_documents',
      'message', 'Add at least one source PDF document.'
    ));
  end if;

  if (
    select count(*)
    from public.credential_template_documents template_document
    where template_document.template_version_id = p_template_version_id
      and template_document.is_primary
  ) <> 1 then
    v_issues := v_issues || jsonb_build_array(jsonb_build_object(
      'code', 'primary_document_count',
      'message', 'Select exactly one primary document.'
    ));
  end if;

  if exists (
    select 1
    from public.credential_template_documents template_document
    left join lateral (
      select
        count(*)::integer as page_rows,
        count(distinct template_page.page_number)::integer as distinct_pages,
        min(template_page.page_number)::integer as min_page,
        max(template_page.page_number)::integer as max_page
      from public.credential_template_document_pages template_page
      where template_page.template_document_id = template_document.id
    ) page_summary on true
    where template_document.template_version_id = p_template_version_id
      and (
        coalesce(page_summary.page_rows, 0) <> template_document.page_count
        or coalesce(page_summary.distinct_pages, 0) <> template_document.page_count
        or coalesce(page_summary.min_page, 0) <> 1
        or coalesce(page_summary.max_page, 0) <> template_document.page_count
      )
  ) then
    v_issues := v_issues || jsonb_build_array(jsonb_build_object(
      'code', 'incomplete_page_metadata',
      'message', 'Every source PDF must have complete contiguous page metadata.'
    ));
  end if;

  if exists (
    select 1
    from public.credential_template_documents template_document
    where template_document.template_version_id = p_template_version_id
      and not exists (
        select 1
        from storage.objects source_object
        where source_object.bucket_id = template_document.source_storage_bucket
          and source_object.name = template_document.source_storage_path
      )
  ) then
    v_issues := v_issues || jsonb_build_array(jsonb_build_object(
      'code', 'missing_source_object',
      'message', 'A private source PDF is missing from Storage.'
    ));
  end if;

  if exists (
    select 1
    from public.credential_template_documents template_document
    join public.credential_file_types file_type
      on file_type.id = template_document.file_type_id
    where template_document.template_version_id = p_template_version_id
      and not file_type.is_active
  ) then
    v_issues := v_issues || jsonb_build_array(jsonb_build_object(
      'code', 'inactive_file_type',
      'message', 'Every document must use an active credential file type.'
    ));
  end if;

  foreach v_required in array array[
    'holder_name'::public.credential_template_field_key,
    'document_number'::public.credential_template_field_key,
    'verification_qr'::public.credential_template_field_key
  ] loop
    if not exists (
      select 1
      from public.credential_template_field_placements placement
      join public.credential_template_documents template_document
        on template_document.id = placement.template_document_id
      where template_document.template_version_id = p_template_version_id
        and placement.field_key = v_required
        and placement.is_required
    ) then
      v_issues := v_issues || jsonb_build_array(jsonb_build_object(
        'code', 'required_field_missing',
        'fieldKey', v_required,
        'message', format('Add one required %s placement.', replace(v_required::text, '_', ' '))
      ));
    end if;
  end loop;

  if exists (
    select 1
    from public.credential_template_field_placements placement
    join public.credential_template_documents template_document
      on template_document.id = placement.template_document_id
    where template_document.template_version_id = p_template_version_id
      and placement.field_key <> 'verification_qr'
      and placement.font_family <> 'noto_sans'
  ) then
    v_issues := v_issues || jsonb_build_array(jsonb_build_object(
      'code', 'unsupported_font',
      'message', 'Dynamic text must use the approved Noto Sans font family.'
    ));
  end if;

  if exists (
    select 1
    from public.credential_template_field_placements placement
    join public.credential_template_document_pages template_page
      on template_page.template_document_id = placement.template_document_id
     and template_page.page_number = placement.page_number
    join public.credential_template_documents template_document
      on template_document.id = placement.template_document_id
    where template_document.template_version_id = p_template_version_id
      and (
        placement.x_points < 0
        or placement.y_points < 0
        or placement.x_points + placement.width_points > template_page.width_points
        or placement.y_points + placement.height_points > template_page.height_points
      )
  ) then
    v_issues := v_issues || jsonb_build_array(jsonb_build_object(
      'code', 'placement_out_of_bounds',
      'message', 'Every placement must fit completely inside its PDF page.'
    ));
  end if;

  return v_issues;
end;
$$;

comment on function internal.credential_template_validation_issues(uuid) is
  'Returns privacy-safe structural publication issues without exposing source paths, hashes, bytes, or sample data.';

revoke all on function internal.credential_template_validation_issues(uuid)
  from public, anon, authenticated;
grant execute on function internal.credential_template_validation_issues(uuid)
  to postgres, service_role;

create or replace function public.validate_credential_template_version(
  p_template_version_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_issues jsonb;
begin
  perform internal.assert_sensitive_action_allowed(
    array['owner'::public.app_role, 'super_admin'::public.app_role],
    'credential template validation'
  );

  v_issues := internal.credential_template_validation_issues(p_template_version_id);
  return jsonb_build_object(
    'valid', jsonb_array_length(v_issues) = 0,
    'issues', v_issues
  );
end;
$$;

comment on function public.validate_credential_template_version(uuid) is
  'Validates one private template version for an MFA-verified Owner or Super Admin and returns only safe issue codes/messages.';

revoke all on function public.validate_credential_template_version(uuid)
  from public, anon;
grant execute on function public.validate_credential_template_version(uuid)
  to authenticated, service_role;

create or replace function public.update_credential_template_document(
  p_template_version_id uuid,
  p_document_id uuid,
  p_file_type_id uuid,
  p_admin_label text,
  p_output_filename_pattern text,
  p_sort_order integer,
  p_is_primary boolean
)
returns table (
  id uuid,
  template_version_id uuid,
  file_type_id uuid,
  admin_label text,
  output_filename_pattern text,
  sort_order integer,
  is_primary boolean,
  mime_type text,
  size_bytes bigint,
  page_count integer,
  created_at timestamptz,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_status public.credential_template_version_status;
begin
  perform internal.assert_sensitive_action_allowed(
    array['owner'::public.app_role, 'super_admin'::public.app_role],
    'credential template document update'
  );

  select template_version.status
    into v_status
  from public.credential_template_versions template_version
  join public.credential_template_documents template_document
    on template_document.template_version_id = template_version.id
  where template_version.id = p_template_version_id
    and template_document.id = p_document_id
  for update of template_version, template_document;

  if v_status is null then
    raise exception 'credential template document was not found'
      using errcode = 'P0002';
  end if;
  if v_status <> 'draft' then
    raise exception 'template document metadata can be changed only on a draft version'
      using errcode = '23514';
  end if;
  if not exists (
    select 1 from public.credential_file_types file_type
    where file_type.id = p_file_type_id and file_type.is_active
  ) then
    raise exception 'active credential file type was not found'
      using errcode = '22023';
  end if;

  if coalesce(p_is_primary, false) then
    update public.credential_template_documents template_document
    set is_primary = false
    where template_document.template_version_id = p_template_version_id
      and template_document.id <> p_document_id
      and template_document.is_primary;
  end if;

  update public.credential_template_documents template_document
  set
    file_type_id = p_file_type_id,
    admin_label = btrim(p_admin_label),
    output_filename_pattern = btrim(p_output_filename_pattern),
    sort_order = p_sort_order,
    is_primary = coalesce(p_is_primary, false)
  where template_document.id = p_document_id
    and template_document.template_version_id = p_template_version_id;

  return query
  select
    template_document.id,
    template_document.template_version_id,
    template_document.file_type_id,
    template_document.admin_label,
    template_document.output_filename_pattern,
    template_document.sort_order,
    template_document.is_primary,
    template_document.mime_type,
    template_document.size_bytes,
    template_document.page_count,
    template_document.created_at,
    template_document.updated_at
  from public.credential_template_documents template_document
  where template_document.id = p_document_id;
end;
$$;

comment on function public.update_credential_template_document(uuid, uuid, uuid, text, text, integer, boolean) is
  'Atomically updates safe draft document metadata and transfers the one-primary flag without exposing source metadata.';

revoke all on function public.update_credential_template_document(uuid, uuid, uuid, text, text, integer, boolean)
  from public, anon;
grant execute on function public.update_credential_template_document(uuid, uuid, uuid, text, text, integer, boolean)
  to authenticated, service_role;

create or replace function public.replace_credential_template_document_placements(
  p_template_version_id uuid,
  p_template_document_id uuid,
  p_placements jsonb
)
returns setof public.credential_template_field_placements
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_status public.credential_template_version_status;
begin
  perform internal.assert_sensitive_action_allowed(
    array['owner'::public.app_role, 'super_admin'::public.app_role],
    'credential template field placement'
  );

  select template_version.status
    into v_status
  from public.credential_template_versions template_version
  join public.credential_template_documents template_document
    on template_document.template_version_id = template_version.id
  where template_version.id = p_template_version_id
    and template_document.id = p_template_document_id
  for update of template_version, template_document;

  if v_status is null then
    raise exception 'credential template document was not found'
      using errcode = 'P0002';
  end if;
  if v_status <> 'draft' then
    raise exception 'field placements can be changed only on a draft version'
      using errcode = '23514';
  end if;
  if jsonb_typeof(p_placements) <> 'array'
    or jsonb_array_length(p_placements) > 250 then
    raise exception 'field placements must be an array with at most 250 items'
      using errcode = '22023';
  end if;

  delete from public.credential_template_field_placements placement
  where placement.template_document_id = p_template_document_id;

  insert into public.credential_template_field_placements (
    template_document_id,
    page_number,
    field_key,
    occurrence_order,
    x_points,
    y_points,
    width_points,
    height_points,
    font_family,
    font_size_points,
    min_font_size_points,
    font_weight,
    font_color,
    text_alignment,
    fit_mode,
    date_format,
    static_text,
    is_required,
    created_by
  )
  select
    p_template_document_id,
    item.page_number,
    item.field_key,
    item.occurrence_order,
    item.x_points,
    item.y_points,
    item.width_points,
    item.height_points,
    item.font_family,
    item.font_size_points,
    item.min_font_size_points,
    item.font_weight,
    item.font_color,
    item.text_alignment,
    item.fit_mode,
    item.date_format,
    item.static_text,
    item.is_required,
    auth.uid()
  from jsonb_to_recordset(p_placements) as item(
    page_number integer,
    field_key public.credential_template_field_key,
    occurrence_order integer,
    x_points numeric,
    y_points numeric,
    width_points numeric,
    height_points numeric,
    font_family text,
    font_size_points numeric,
    min_font_size_points numeric,
    font_weight smallint,
    font_color text,
    text_alignment public.credential_template_text_alignment,
    fit_mode public.credential_template_fit_mode,
    date_format text,
    static_text text,
    is_required boolean
  );

  return query
  select placement.*
  from public.credential_template_field_placements placement
  where placement.template_document_id = p_template_document_id
  order by placement.page_number, placement.occurrence_order, placement.id;
end;
$$;

comment on function public.replace_credential_template_document_placements(uuid, uuid, jsonb) is
  'Atomically replaces one draft document placement set after role/MFA and database geometry/rendering validation.';

revoke all on function public.replace_credential_template_document_placements(uuid, uuid, jsonb)
  from public, anon;
grant execute on function public.replace_credential_template_document_placements(uuid, uuid, jsonb)
  to authenticated, service_role;

create or replace function public.record_credential_template_preview(
  p_template_version_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
begin
  perform internal.assert_sensitive_action_allowed(
    array['owner'::public.app_role, 'super_admin'::public.app_role],
    'credential template sample preview'
  );

  if not exists (
    select 1 from public.credential_template_versions template_version
    where template_version.id = p_template_version_id
  ) then
    raise exception 'credential template version was not found'
      using errcode = 'P0002';
  end if;

  perform internal.write_audit_log(
    p_action => 'credential_template.sample_previewed',
    p_actor_id => auth.uid(),
    p_target_schema => 'public',
    p_target_table => 'credential_template_versions',
    p_target_id => p_template_version_id,
    p_metadata => jsonb_build_object('sample_data', true)
  );
  return true;
end;
$$;

comment on function public.record_credential_template_preview(uuid) is
  'Records a privacy-minimal non-production sample preview event without sample values, PDF bytes, or private paths.';

revoke all on function public.record_credential_template_preview(uuid)
  from public, anon;
grant execute on function public.record_credential_template_preview(uuid)
  to authenticated, service_role;

create or replace function public.publish_credential_template_version(p_template_version_id uuid)
returns public.credential_template_versions
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_version public.credential_template_versions;
  v_issues jsonb;
begin
  perform internal.assert_sensitive_action_allowed(
    array['owner'::public.app_role, 'super_admin'::public.app_role],
    'credential template publication'
  );

  select * into v_version
  from public.credential_template_versions template_version
  where template_version.id = p_template_version_id
  for update;

  if not found then
    raise exception 'credential template version was not found'
      using errcode = 'P0002';
  end if;
  if v_version.status <> 'draft' then
    raise exception 'only a draft credential template version can be published'
      using errcode = '23514';
  end if;

  v_issues := internal.credential_template_validation_issues(p_template_version_id);
  if jsonb_array_length(v_issues) > 0 then
    raise exception 'credential template version did not pass publication validation'
      using errcode = '23514', detail = v_issues::text;
  end if;

  update public.credential_template_versions template_version
  set
    status = 'published',
    published_by = auth.uid(),
    published_at = now()
  where template_version.id = p_template_version_id
  returning * into v_version;

  return v_version;
end;
$$;

comment on function public.publish_credential_template_version(uuid) is
  'Publishes a locked, structurally valid draft with one primary document, complete private sources/pages, required fields, safe bounds, and the approved font family.';

revoke all on function public.publish_credential_template_version(uuid)
  from public, anon;
grant execute on function public.publish_credential_template_version(uuid)
  to authenticated, service_role;
