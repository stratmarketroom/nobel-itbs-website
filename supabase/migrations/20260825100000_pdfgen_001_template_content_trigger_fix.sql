-- PDFGEN-001 follow-up: make the shared draft-content trigger safe for tables
-- with different row shapes. The foundation migration is already forward-only;
-- this replacement preserves its contract without rewriting applied history.

create or replace function internal.enforce_template_draft_content()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_old_template_version_id uuid;
  v_new_template_version_id uuid;
  v_status public.credential_template_version_status;
begin
  if tg_table_name = 'credential_template_documents' then
    if tg_op <> 'INSERT' then
      v_old_template_version_id := old.template_version_id;
    end if;
    if tg_op <> 'DELETE' then
      v_new_template_version_id := new.template_version_id;
    end if;

    if tg_op = 'UPDATE' and (
      old.id is distinct from new.id
      or old.template_version_id is distinct from new.template_version_id
      or old.created_by is distinct from new.created_by
      or old.created_at is distinct from new.created_at
    ) then
      raise exception 'credential template document identity is immutable'
        using errcode = '23514';
    end if;
  elsif tg_table_name = 'credential_template_document_pages' then
    if tg_op <> 'INSERT' then
      select template_document.template_version_id
        into v_old_template_version_id
      from public.credential_template_documents template_document
      where template_document.id = old.template_document_id;
    end if;

    if tg_op <> 'DELETE' then
      select template_document.template_version_id
        into v_new_template_version_id
      from public.credential_template_documents template_document
      where template_document.id = new.template_document_id;
    end if;

    if tg_op = 'UPDATE' and (
      old.template_document_id is distinct from new.template_document_id
      or old.page_number is distinct from new.page_number
      or old.created_at is distinct from new.created_at
    ) then
      raise exception 'credential template page identity is immutable'
        using errcode = '23514';
    end if;
  elsif tg_table_name = 'credential_template_field_placements' then
    if tg_op <> 'INSERT' then
      select template_document.template_version_id
        into v_old_template_version_id
      from public.credential_template_documents template_document
      where template_document.id = old.template_document_id;
    end if;

    if tg_op <> 'DELETE' then
      select template_document.template_version_id
        into v_new_template_version_id
      from public.credential_template_documents template_document
      where template_document.id = new.template_document_id;
    end if;

    if tg_op = 'UPDATE' and (
      old.id is distinct from new.id
      or old.template_document_id is distinct from new.template_document_id
      or old.page_number is distinct from new.page_number
      or old.created_by is distinct from new.created_by
      or old.created_at is distinct from new.created_at
    ) then
      raise exception 'credential template placement identity is immutable'
        using errcode = '23514';
    end if;
  else
    raise exception 'unsupported credential template content table'
      using errcode = '23514';
  end if;

  if v_old_template_version_id is not null then
    select template_version.status
      into v_status
    from public.credential_template_versions template_version
    where template_version.id = v_old_template_version_id;

    if v_status is distinct from 'draft'::public.credential_template_version_status then
      raise exception 'published or retired credential template content is immutable'
        using errcode = '23514';
    end if;
  end if;

  if v_new_template_version_id is not null
    and v_new_template_version_id is distinct from v_old_template_version_id then
    select template_version.status
      into v_status
    from public.credential_template_versions template_version
    where template_version.id = v_new_template_version_id;

    if v_status is distinct from 'draft'::public.credential_template_version_status then
      raise exception 'published or retired credential template content is immutable'
        using errcode = '23514';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

comment on function internal.enforce_template_draft_content() is
  'Allows document, page, and placement changes only while the parent template version is draft and preserves each table-specific identity safely.';

revoke all on function internal.enforce_template_draft_content()
  from public, anon, authenticated;
grant execute on function internal.enforce_template_draft_content()
  to postgres, service_role;
