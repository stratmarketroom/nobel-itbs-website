-- CRD-005: Credential Files
-- Private PDF bucket, configurable file types, metadata integrity, and one-primary rule.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'private-credentials',
  'private-credentials',
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

create table public.credential_file_types (
  id uuid primary key default extensions.gen_random_uuid(),
  code text not null unique,
  default_label text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credential_file_types_code_format check (
    code ~ '^[a-z][a-z0-9_]*$'
  ),
  constraint credential_file_types_default_label_not_blank check (
    default_label = btrim(default_label)
    and default_label <> ''
  )
);

comment on table public.credential_file_types is
  'Configurable administrative types for private credential PDF files.';

insert into public.credential_file_types (id, code, default_label, is_active)
values
  ('00000000-0000-4000-8000-000000000701', 'main_certificate', 'Main certificate', true),
  ('00000000-0000-4000-8000-000000000702', 'supplement', 'Supplement', true),
  ('00000000-0000-4000-8000-000000000703', 'transcript', 'Transcript', true);

create trigger credential_file_types_set_updated_at
before update on public.credential_file_types
for each row execute function internal.set_updated_at();

create table public.credential_files (
  id uuid primary key default extensions.gen_random_uuid(),
  credential_id uuid not null references public.credentials(id) on delete restrict,
  file_type_id uuid not null references public.credential_file_types(id) on delete restrict,
  admin_label text null,
  storage_bucket text not null default 'private-credentials',
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null,
  is_primary boolean not null default false,
  uploaded_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credential_files_admin_label_not_blank check (
    admin_label is null
    or (
      admin_label = btrim(admin_label)
      and admin_label <> ''
    )
  ),
  constraint credential_files_private_bucket check (
    storage_bucket = 'private-credentials'
  ),
  constraint credential_files_canonical_path check (
    storage_path = credential_id::text || '/' || id::text || '.pdf'
  ),
  constraint credential_files_pdf_mime check (
    mime_type = 'application/pdf'
  ),
  constraint credential_files_size_limit check (
    size_bytes between 1 and 20971520
  )
);

comment on table public.credential_files is
  'Private current PDF metadata. Storage objects are never public and Release 1 does not retain old PDF versions.';
comment on column public.credential_files.storage_path is
  'Canonical credential-id/file-id PDF path. Replacement overwrites the same private object path; no version rows are created.';
comment on column public.credential_files.is_primary is
  'At most one file per credential may be primary. Activation later requires one primary file.';

create unique index credential_files_one_primary_idx
  on public.credential_files (credential_id)
  where is_primary;

create index credential_files_credential_created_idx
  on public.credential_files (credential_id, created_at);

create index credential_files_type_idx
  on public.credential_files (file_type_id, created_at desc);

create trigger credential_files_set_updated_at
before update on public.credential_files
for each row execute function internal.set_updated_at();

create or replace function internal.enforce_credential_file_identity()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
begin
  if old.id is distinct from new.id
    or old.credential_id is distinct from new.credential_id
    or old.storage_bucket is distinct from new.storage_bucket
    or old.storage_path is distinct from new.storage_path
    or old.created_at is distinct from new.created_at then
    raise exception 'credential file identity and storage path are immutable'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function internal.enforce_credential_file_identity() is
  'Keeps a credential file bound to one credential and one canonical private object path across replacements.';

revoke all on function internal.enforce_credential_file_identity()
  from public, anon, authenticated;
grant execute on function internal.enforce_credential_file_identity()
  to postgres, service_role;

create trigger credential_files_enforce_identity
before update on public.credential_files
for each row execute function internal.enforce_credential_file_identity();

create or replace function internal.audit_credential_file_change()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    perform internal.write_audit_log(
      p_action => 'credential_file.attached',
      p_actor_id => auth.uid(),
      p_target_schema => 'public',
      p_target_table => 'credential_files',
      p_target_id => new.id,
      p_metadata => jsonb_build_object(
        'file_type_id', new.file_type_id,
        'is_primary', new.is_primary,
        'size_bytes', new.size_bytes
      )
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
      p_metadata => jsonb_build_object(
        'was_primary', old.is_primary
      )
    );

    return old;
  end if;

  perform internal.write_audit_log(
    p_action => case
      when old.size_bytes is distinct from new.size_bytes
        or old.mime_type is distinct from new.mime_type
        or old.uploaded_by is distinct from new.uploaded_by
      then 'credential_file.replaced'
      else 'credential_file.updated'
    end,
    p_actor_id => auth.uid(),
    p_target_schema => 'public',
    p_target_table => 'credential_files',
    p_target_id => new.id,
    p_metadata => jsonb_build_object(
      'file_type_changed', old.file_type_id is distinct from new.file_type_id,
      'admin_label_changed', old.admin_label is distinct from new.admin_label,
      'primary_changed', old.is_primary is distinct from new.is_primary,
      'content_metadata_changed',
        old.size_bytes is distinct from new.size_bytes
        or old.mime_type is distinct from new.mime_type
        or old.uploaded_by is distinct from new.uploaded_by
    )
  );

  return new;
end;
$$;

comment on function internal.audit_credential_file_change() is
  'Audits attach, replacement, metadata/primary changes, and deletion without logging storage paths or private file content.';

revoke all on function internal.audit_credential_file_change()
  from public, anon, authenticated;
grant execute on function internal.audit_credential_file_change()
  to postgres, service_role;

create trigger credential_files_audit_change
after insert or update or delete on public.credential_files
for each row execute function internal.audit_credential_file_change();

alter table public.credential_file_types enable row level security;
alter table public.credential_file_types force row level security;
alter table public.credential_files enable row level security;
alter table public.credential_files force row level security;

revoke all on table public.credential_file_types from public, anon, authenticated, service_role;
revoke all on table public.credential_files from public, anon, authenticated, service_role;

grant select on table public.credential_file_types to authenticated, service_role;
grant insert (code, default_label, is_active) on table public.credential_file_types to authenticated;
grant update (code, default_label, is_active) on table public.credential_file_types to authenticated;
grant select on table public.credential_files to authenticated, service_role;

grant select, insert, update on table public.credential_file_types to postgres;
grant select, insert, update, delete on table public.credential_files to postgres;

create policy credential_file_types_authorized_read
on public.credential_file_types
for select
to authenticated
using (
  internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);

create policy credential_file_types_admin_insert
on public.credential_file_types
for insert
to authenticated
with check (
  internal.has_any_role(array['owner', 'super_admin']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);

create policy credential_file_types_admin_update
on public.credential_file_types
for update
to authenticated
using (
  internal.has_any_role(array['owner', 'super_admin']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
)
with check (
  internal.has_any_role(array['owner', 'super_admin']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);

create policy credential_files_authorized_read
on public.credential_files
for select
to authenticated
using (
  internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);

-- No storage.objects policy is created for private-credentials.
-- Browser JWTs cannot list, upload, read, update, or delete these objects.
-- WF-002 will use actor-authorized server routes and server-only Storage access.
