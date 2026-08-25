-- PDFGEN-002: Private Template Storage and Validation
-- Creates the private source-PDF bucket, protects published objects, narrows
-- browser-visible metadata, and exposes atomic draft document/page mutations.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'credential-templates',
  'credential-templates',
  false,
  20971520,
  array['application/pdf']::text[]
)
on conflict (id) do update
set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

comment on table public.credential_template_documents is
  'Private validated source-PDF metadata for one output in a Template Package version. Source object paths and hashes remain server-only.';

-- Browser/request clients may read only non-sensitive document metadata. The
-- server-only service role retains the existing full SELECT grant for the
-- controlled upload, validation, preview, and later generation workflows.
revoke select on table public.credential_template_documents from authenticated;
grant select (
  id,
  template_version_id,
  file_type_id,
  admin_label,
  output_filename_pattern,
  sort_order,
  is_primary,
  mime_type,
  size_bytes,
  page_count,
  created_by,
  created_at,
  updated_at
) on table public.credential_template_documents to authenticated;

create or replace function internal.enforce_credential_template_storage_object()
returns trigger
language plpgsql
security definer
set search_path = internal, public, storage, pg_temp
as $$
declare
  v_bucket_id text;
  v_object_name text;
  v_version_status public.credential_template_version_status;
begin
  v_bucket_id := case when tg_op = 'DELETE' then old.bucket_id else new.bucket_id end;
  v_object_name := case when tg_op = 'DELETE' then old.name else new.name end;

  if v_bucket_id <> 'credential-templates' then
    if tg_op = 'DELETE' then
      return old;
    end if;

    return new;
  end if;

  if v_object_name !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.pdf$' then
    raise exception 'credential template object path must use version-id/document-id.pdf'
      using errcode = '23514';
  end if;

  if tg_op = 'UPDATE' and (
    old.bucket_id is distinct from new.bucket_id
    or old.name is distinct from new.name
  ) then
    raise exception 'credential template object identity is immutable'
      using errcode = '23514';
  end if;

  if tg_op in ('UPDATE', 'DELETE') then
    select template_version.status
      into v_version_status
    from public.credential_template_documents template_document
    join public.credential_template_versions template_version
      on template_version.id = template_document.template_version_id
    where template_document.source_storage_bucket = 'credential-templates'
      and template_document.source_storage_path = old.name
    for share of template_version;

    if v_version_status in ('published', 'retired') then
      raise exception 'published or retired credential template objects are immutable'
        using errcode = '23514';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

comment on function internal.enforce_credential_template_storage_object() is
  'Restricts credential-templates to canonical PDF paths and blocks any update/delete once the owning version is published or retired.';

revoke all on function internal.enforce_credential_template_storage_object()
  from public, anon, authenticated;
grant execute on function internal.enforce_credential_template_storage_object()
  to postgres, service_role;

drop trigger if exists credential_template_objects_enforce_safety on storage.objects;
create trigger credential_template_objects_enforce_safety
before insert or update or delete on storage.objects
for each row execute function internal.enforce_credential_template_storage_object();

create or replace function internal.require_template_source_objects_for_publication()
returns trigger
language plpgsql
security definer
set search_path = internal, public, storage, pg_temp
as $$
begin
  if old.status = 'draft' and new.status = 'published' and exists (
    select 1
    from public.credential_template_documents template_document
    where template_document.template_version_id = new.id
      and not exists (
        select 1
        from storage.objects source_object
        where source_object.bucket_id = template_document.source_storage_bucket
          and source_object.name = template_document.source_storage_path
      )
  ) then
    raise exception 'credential template publication requires every private source PDF object'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function internal.require_template_source_objects_for_publication() is
  'Prevents publishing metadata whose validated private source PDF is absent from Storage.';

revoke all on function internal.require_template_source_objects_for_publication()
  from public, anon, authenticated;
grant execute on function internal.require_template_source_objects_for_publication()
  to postgres, service_role;

drop trigger if exists credential_template_versions_require_source_objects
  on public.credential_template_versions;
create trigger credential_template_versions_require_source_objects
before update on public.credential_template_versions
for each row execute function internal.require_template_source_objects_for_publication();

create or replace function public.attach_credential_template_document(
  p_document_id uuid,
  p_template_version_id uuid,
  p_file_type_id uuid,
  p_admin_label text,
  p_output_filename_pattern text,
  p_sort_order integer,
  p_is_primary boolean,
  p_size_bytes bigint,
  p_page_count integer,
  p_source_sha256 text,
  p_pages jsonb
)
returns table (
  document_id uuid,
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
set search_path = internal, public, storage, pg_temp
as $$
declare
  v_status public.credential_template_version_status;
  v_page_rows integer;
  v_distinct_pages integer;
  v_min_page integer;
  v_max_page integer;
begin
  perform internal.assert_sensitive_action_allowed(
    array['owner'::public.app_role, 'super_admin'::public.app_role],
    'credential template source upload'
  );

  select template_version.status
    into v_status
  from public.credential_template_versions template_version
  where template_version.id = p_template_version_id
  for update;

  if v_status is null then
    raise exception 'credential template version was not found'
      using errcode = 'P0002';
  end if;

  if v_status <> 'draft' then
    raise exception 'template sources can be attached only to a draft version'
      using errcode = '23514';
  end if;

  if p_document_id is null or p_page_count is null or p_page_count < 1 then
    raise exception 'document ID and positive page count are required'
      using errcode = '22023';
  end if;

  if jsonb_typeof(p_pages) <> 'array' or jsonb_array_length(p_pages) <> p_page_count then
    raise exception 'page metadata must contain exactly one row per source PDF page'
      using errcode = '22023';
  end if;

  select
    count(*)::integer,
    count(distinct page.page_number)::integer,
    min(page.page_number),
    max(page.page_number)
  into v_page_rows, v_distinct_pages, v_min_page, v_max_page
  from jsonb_to_recordset(p_pages) as page(
    page_number integer,
    width_points numeric,
    height_points numeric
  );

  if v_page_rows <> p_page_count
    or v_distinct_pages <> p_page_count
    or v_min_page <> 1
    or v_max_page <> p_page_count
    or exists (
      select 1
      from jsonb_to_recordset(p_pages) as page(
        page_number integer,
        width_points numeric,
        height_points numeric
      )
      where page.page_number is null
        or page.width_points is null
        or page.height_points is null
        or page.width_points <= 0
        or page.height_points <= 0
    ) then
    raise exception 'page metadata must be contiguous and use positive dimensions'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.credential_file_types file_type
    where file_type.id = p_file_type_id and file_type.is_active
  ) then
    raise exception 'active credential file type was not found'
      using errcode = '22023';
  end if;

  if not exists (
    select 1
    from storage.objects source_object
    where source_object.bucket_id = 'credential-templates'
      and source_object.name = p_template_version_id::text || '/' || p_document_id::text || '.pdf'
  ) then
    raise exception 'validated private template source PDF must be uploaded before metadata attachment'
      using errcode = '23514';
  end if;

  insert into public.credential_template_documents (
    id,
    template_version_id,
    file_type_id,
    admin_label,
    output_filename_pattern,
    sort_order,
    is_primary,
    source_storage_path,
    size_bytes,
    page_count,
    source_sha256,
    created_by
  ) values (
    p_document_id,
    p_template_version_id,
    p_file_type_id,
    btrim(p_admin_label),
    btrim(p_output_filename_pattern),
    p_sort_order,
    coalesce(p_is_primary, false),
    p_template_version_id::text || '/' || p_document_id::text || '.pdf',
    p_size_bytes,
    p_page_count,
    lower(btrim(p_source_sha256)),
    auth.uid()
  );

  insert into public.credential_template_document_pages (
    template_document_id,
    page_number,
    width_points,
    height_points
  )
  select
    p_document_id,
    page.page_number,
    page.width_points,
    page.height_points
  from jsonb_to_recordset(p_pages) as page(
    page_number integer,
    width_points numeric,
    height_points numeric
  )
  order by page.page_number;

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

comment on function public.attach_credential_template_document(uuid, uuid, uuid, text, text, integer, boolean, bigint, integer, text, jsonb) is
  'Atomically attaches validated draft source-PDF metadata and contiguous per-page dimensions without returning the private path or source hash.';

revoke all on function public.attach_credential_template_document(uuid, uuid, uuid, text, text, integer, boolean, bigint, integer, text, jsonb)
  from public, anon;
grant execute on function public.attach_credential_template_document(uuid, uuid, uuid, text, text, integer, boolean, bigint, integer, text, jsonb)
  to authenticated, service_role;

create or replace function public.delete_credential_template_document(
  p_template_version_id uuid,
  p_document_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = internal, public, storage, pg_temp
as $$
declare
  v_status public.credential_template_version_status;
begin
  perform internal.assert_sensitive_action_allowed(
    array['owner'::public.app_role, 'super_admin'::public.app_role],
    'credential template source deletion'
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
    raise exception 'template sources can be deleted only from a draft version'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from storage.objects source_object
    where source_object.bucket_id = 'credential-templates'
      and source_object.name = p_template_version_id::text || '/' || p_document_id::text || '.pdf'
  ) then
    raise exception 'private template source PDF must be removed through the controlled server route before metadata deletion'
      using errcode = '23514';
  end if;

  delete from public.credential_template_field_placements placement
  where placement.template_document_id = p_document_id;

  delete from public.credential_template_document_pages page
  where page.template_document_id = p_document_id;

  delete from public.credential_template_documents template_document
  where template_document.id = p_document_id
    and template_document.template_version_id = p_template_version_id;

  return true;
end;
$$;

comment on function public.delete_credential_template_document(uuid, uuid) is
  'Deletes one draft Template Document and its page/placement metadata after the controlled server route removes its private object.';

revoke all on function public.delete_credential_template_document(uuid, uuid)
  from public, anon;
grant execute on function public.delete_credential_template_document(uuid, uuid)
  to authenticated, service_role;

-- No storage.objects policy is created. Browser clients have no direct bucket
-- read/write access; all object operations use authorized server-only routes.
