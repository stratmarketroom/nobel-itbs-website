-- PDFGEN-001: Template and Generation Database Foundation
-- Private template identities, immutable published versions, multi-document/
-- multi-page placement metadata, resumable batch state, provenance, RLS, audit.
-- Storage buckets, PDF parsing, rendering, admin UI, and activation remain later tickets.

create type public.credential_template_version_status as enum (
  'draft',
  'published',
  'retired'
);

create type public.credential_template_field_key as enum (
  'holder_name',
  'programme_title',
  'credential_type',
  'document_number',
  'issue_date',
  'completion_date',
  'programme_run_label',
  'verification_qr',
  'verification_url',
  'static_text'
);

create type public.credential_template_text_alignment as enum (
  'left',
  'center',
  'right'
);

create type public.credential_template_fit_mode as enum (
  'single_line',
  'wrap',
  'shrink_to_fit',
  'fixed'
);

create type public.credential_generation_batch_status as enum (
  'draft',
  'confirmed',
  'processing',
  'review',
  'activating',
  'completed',
  'failed'
);

create type public.credential_generation_item_status as enum (
  'queued',
  'processing',
  'generated',
  'retryable',
  'conflict',
  'reviewed',
  'activating',
  'activated',
  'failed'
);

create table public.credential_template_packages (
  id uuid primary key default extensions.gen_random_uuid(),
  programme_id uuid not null references public.programmes(id) on delete restrict,
  programme_run_id uuid null,
  credential_type_id uuid not null references public.credential_types(id) on delete restrict,
  language_code text not null references public.languages(code) on delete restrict,
  variant_code text not null default 'standard',
  display_name text not null,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credential_template_packages_run_context_fk
    foreign key (programme_id, programme_run_id)
    references public.programme_runs(programme_id, id)
    on delete restrict,
  constraint credential_template_packages_variant_format check (
    variant_code ~ '^[a-z][a-z0-9_]{0,63}$'
  ),
  constraint credential_template_packages_display_name_not_blank check (
    display_name = btrim(display_name)
    and display_name <> ''
    and char_length(display_name) <= 200
  )
);

comment on table public.credential_template_packages is
  'Private reusable issuing-context identity for one programme, optional run, credential type, language, and explicit variant. Not a Credential Set and never public.';
comment on column public.credential_template_packages.variant_code is
  'Stable machine identifier for a programme document-package variant, for example intermediate or final.';

create unique index credential_template_packages_context_unique_idx
  on public.credential_template_packages (
    programme_id,
    programme_run_id,
    credential_type_id,
    language_code,
    variant_code
  ) nulls not distinct;

create index credential_template_packages_programme_idx
  on public.credential_template_packages (programme_id, language_code, credential_type_id);

create trigger credential_template_packages_set_updated_at
before update on public.credential_template_packages
for each row execute function internal.set_updated_at();

create table public.credential_template_versions (
  id uuid primary key default extensions.gen_random_uuid(),
  template_package_id uuid not null references public.credential_template_packages(id) on delete restrict,
  version_number integer not null,
  status public.credential_template_version_status not null default 'draft',
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  published_by uuid null references public.user_profiles(id) on delete restrict,
  published_at timestamptz null,
  retired_by uuid null references public.user_profiles(id) on delete restrict,
  retired_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credential_template_versions_number_positive check (version_number > 0),
  constraint credential_template_versions_lifecycle_consistency check (
    (
      status = 'draft'
      and published_by is null
      and published_at is null
      and retired_by is null
      and retired_at is null
    )
    or (
      status = 'published'
      and published_by is not null
      and published_at is not null
      and retired_by is null
      and retired_at is null
    )
    or (
      status = 'retired'
      and published_by is not null
      and published_at is not null
      and retired_by is not null
      and retired_at is not null
      and retired_at >= published_at
    )
  ),
  unique (template_package_id, version_number)
);

comment on table public.credential_template_versions is
  'Private version state for a Template Package. Published rendering content is immutable; retirement only removes future-use eligibility.';

create unique index credential_template_versions_one_draft_idx
  on public.credential_template_versions (template_package_id)
  where status = 'draft';

create index credential_template_versions_package_status_idx
  on public.credential_template_versions (template_package_id, status, version_number desc);

create trigger credential_template_versions_set_updated_at
before update on public.credential_template_versions
for each row execute function internal.set_updated_at();

create table public.credential_template_documents (
  id uuid primary key default extensions.gen_random_uuid(),
  template_version_id uuid not null references public.credential_template_versions(id) on delete restrict,
  file_type_id uuid not null references public.credential_file_types(id) on delete restrict,
  admin_label text not null,
  output_filename_pattern text not null,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  source_storage_bucket text not null default 'credential-templates',
  source_storage_path text not null unique,
  mime_type text not null default 'application/pdf',
  size_bytes bigint not null,
  page_count integer not null,
  source_sha256 text not null,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credential_template_documents_label_not_blank check (
    admin_label = btrim(admin_label)
    and admin_label <> ''
    and char_length(admin_label) <= 255
  ),
  constraint credential_template_documents_filename_safe check (
    output_filename_pattern = btrim(output_filename_pattern)
    and output_filename_pattern <> ''
    and char_length(output_filename_pattern) <= 255
    and lower(right(output_filename_pattern, 4)) = '.pdf'
    and strpos(output_filename_pattern, '/') = 0
    and strpos(output_filename_pattern, chr(92)) = 0
    and strpos(output_filename_pattern, chr(10)) = 0
    and strpos(output_filename_pattern, chr(13)) = 0
  ),
  constraint credential_template_documents_sort_order_nonnegative check (sort_order >= 0),
  constraint credential_template_documents_private_bucket check (
    source_storage_bucket = 'credential-templates'
  ),
  constraint credential_template_documents_canonical_path check (
    source_storage_path = template_version_id::text || '/' || id::text || '.pdf'
  ),
  constraint credential_template_documents_pdf_mime check (mime_type = 'application/pdf'),
  constraint credential_template_documents_size_limit check (
    size_bytes between 1 and 20971520
  ),
  constraint credential_template_documents_page_count_positive check (page_count > 0),
  constraint credential_template_documents_sha256_format check (
    source_sha256 ~ '^[0-9a-f]{64}$'
  ),
  unique (template_version_id, sort_order),
  unique (template_version_id, output_filename_pattern)
);

comment on table public.credential_template_documents is
  'Private source-PDF metadata for one output in a Template Package version. One package may contain multiple documents and each document may be multi-page.';
comment on column public.credential_template_documents.source_storage_path is
  'Canonical private template object path. The credential-templates bucket is created in PDFGEN-002.';

create unique index credential_template_documents_one_primary_idx
  on public.credential_template_documents (template_version_id)
  where is_primary;

create index credential_template_documents_version_order_idx
  on public.credential_template_documents (template_version_id, sort_order, id);

create trigger credential_template_documents_set_updated_at
before update on public.credential_template_documents
for each row execute function internal.set_updated_at();

create table public.credential_template_document_pages (
  template_document_id uuid not null references public.credential_template_documents(id) on delete restrict,
  page_number integer not null,
  width_points numeric(12, 3) not null,
  height_points numeric(12, 3) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (template_document_id, page_number),
  constraint credential_template_document_pages_number_positive check (page_number > 0),
  constraint credential_template_document_pages_dimensions_positive check (
    width_points > 0 and height_points > 0
  )
);

comment on table public.credential_template_document_pages is
  'Per-page dimensions for multi-page template documents; supports different page sizes and placement-bound validation.';

create trigger credential_template_document_pages_set_updated_at
before update on public.credential_template_document_pages
for each row execute function internal.set_updated_at();

create table public.credential_template_field_placements (
  id uuid primary key default extensions.gen_random_uuid(),
  template_document_id uuid not null,
  page_number integer not null,
  field_key public.credential_template_field_key not null,
  occurrence_order integer not null default 0,
  x_points numeric(12, 3) not null,
  y_points numeric(12, 3) not null,
  width_points numeric(12, 3) not null,
  height_points numeric(12, 3) not null,
  font_family text null,
  font_size_points numeric(8, 3) null,
  min_font_size_points numeric(8, 3) null,
  font_weight smallint null,
  font_color text null,
  text_alignment public.credential_template_text_alignment not null default 'left',
  fit_mode public.credential_template_fit_mode not null,
  date_format text null,
  static_text text null,
  is_required boolean not null default true,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credential_template_field_placements_page_fk
    foreign key (template_document_id, page_number)
    references public.credential_template_document_pages(template_document_id, page_number)
    on delete restrict,
  constraint credential_template_field_placements_occurrence_nonnegative check (
    occurrence_order >= 0
  ),
  constraint credential_template_field_placements_geometry_positive check (
    x_points >= 0
    and y_points >= 0
    and width_points > 0
    and height_points > 0
  ),
  constraint credential_template_field_placements_font_family_format check (
    font_family is null or font_family ~ '^[a-z][a-z0-9_]{0,63}$'
  ),
  constraint credential_template_field_placements_font_sizes check (
    (
      font_size_points is null
      and min_font_size_points is null
      and font_weight is null
      and font_color is null
    )
    or (
      font_size_points > 0
      and min_font_size_points > 0
      and min_font_size_points <= font_size_points
      and font_weight between 100 and 900
      and font_weight % 100 = 0
      and font_color ~ '^#[0-9A-Fa-f]{6}$'
    )
  ),
  constraint credential_template_field_placements_date_format_safe check (
    date_format is null
    or (
      field_key in ('issue_date', 'completion_date')
      and date_format = btrim(date_format)
      and date_format <> ''
      and char_length(date_format) <= 64
      and date_format !~ '[{}<>]'
    )
  ),
  constraint credential_template_field_placements_static_text_safe check (
    (
      field_key = 'static_text'
      and static_text is not null
      and static_text = btrim(static_text)
      and static_text <> ''
      and char_length(static_text) <= 2000
    )
    or (
      field_key <> 'static_text'
      and static_text is null
    )
  ),
  constraint credential_template_field_placements_rendering_mode check (
    (
      field_key = 'verification_qr'
      and fit_mode = 'fixed'
      and font_family is null
      and font_size_points is null
      and min_font_size_points is null
      and font_weight is null
      and font_color is null
      and date_format is null
    )
    or (
      field_key <> 'verification_qr'
      and font_family is not null
      and font_size_points is not null
      and min_font_size_points is not null
      and font_weight is not null
      and font_color is not null
      and fit_mode <> 'fixed'
    )
  ),
  unique (template_document_id, page_number, field_key, occurrence_order)
);

comment on table public.credential_template_field_placements is
  'Constrained text/date/QR placement metadata. Arbitrary code, expressions, HTML, remote fonts, and database queries are not representable.';

create index credential_template_field_placements_document_page_idx
  on public.credential_template_field_placements (
    template_document_id,
    page_number,
    occurrence_order,
    id
  );

create trigger credential_template_field_placements_set_updated_at
before update on public.credential_template_field_placements
for each row execute function internal.set_updated_at();

create table public.credential_generation_batches (
  id uuid primary key default extensions.gen_random_uuid(),
  idempotency_key uuid not null default extensions.gen_random_uuid() unique,
  template_version_id uuid not null references public.credential_template_versions(id) on delete restrict,
  programme_id uuid not null references public.programmes(id) on delete restrict,
  programme_run_id uuid null,
  credential_type_id uuid not null references public.credential_types(id) on delete restrict,
  language_code text not null references public.languages(code) on delete restrict,
  issue_date date not null,
  completion_date date null,
  status public.credential_generation_batch_status not null default 'draft',
  processing_chunk_size smallint not null default 25,
  created_by uuid not null references public.user_profiles(id) on delete restrict,
  confirmed_by uuid null references public.user_profiles(id) on delete restrict,
  confirmed_at timestamptz null,
  started_at timestamptz null,
  finished_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credential_generation_batches_run_context_fk
    foreign key (programme_id, programme_run_id)
    references public.programme_runs(programme_id, id)
    on delete restrict,
  constraint credential_generation_batches_chunk_size_safe check (
    processing_chunk_size between 1 and 250
  ),
  constraint credential_generation_batches_lifecycle_consistency check (
    (
      status = 'draft'
      and confirmed_by is null
      and confirmed_at is null
      and started_at is null
      and finished_at is null
    )
    or (
      status = 'confirmed'
      and confirmed_by is not null
      and confirmed_at is not null
      and started_at is null
      and finished_at is null
    )
    or (
      status in ('processing', 'review', 'activating')
      and confirmed_by is not null
      and confirmed_at is not null
      and started_at is not null
      and finished_at is null
    )
    or (
      status in ('completed', 'failed')
      and confirmed_by is not null
      and confirmed_at is not null
      and started_at is not null
      and finished_at is not null
      and finished_at >= started_at
    )
  )
);

comment on table public.credential_generation_batches is
  'Private full-cohort generation batch. The cohort has no product-facing size cap; processing_chunk_size is an internal bounded-execution control only.';

create index credential_generation_batches_status_created_idx
  on public.credential_generation_batches (status, created_at desc, id desc);

create index credential_generation_batches_context_idx
  on public.credential_generation_batches (
    programme_id,
    programme_run_id,
    credential_type_id,
    language_code,
    issue_date
  );

create trigger credential_generation_batches_set_updated_at
before update on public.credential_generation_batches
for each row execute function internal.set_updated_at();

create table public.credential_generation_batch_items (
  id uuid primary key default extensions.gen_random_uuid(),
  batch_id uuid not null references public.credential_generation_batches(id) on delete restrict,
  learner_id uuid not null references public.learners(id) on delete restrict,
  position bigint not null,
  idempotency_key uuid not null default extensions.gen_random_uuid() unique,
  credential_id uuid null references public.credentials(id) on delete restrict,
  conflicting_credential_id uuid null references public.credentials(id) on delete restrict,
  status public.credential_generation_item_status not null default 'queued',
  attempt_count integer not null default 0,
  lease_token uuid null,
  lease_expires_at timestamptz null,
  last_error_code text null,
  generated_at timestamptz null,
  reviewed_by uuid null references public.user_profiles(id) on delete restrict,
  reviewed_at timestamptz null,
  activated_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credential_generation_batch_items_position_positive check (position > 0),
  constraint credential_generation_batch_items_attempt_nonnegative check (attempt_count >= 0),
  constraint credential_generation_batch_items_lease_consistency check (
    (
      status = 'processing'
      and lease_token is not null
      and lease_expires_at is not null
    )
    or (
      status <> 'processing'
      and lease_token is null
      and lease_expires_at is null
    )
  ),
  constraint credential_generation_batch_items_error_code_format check (
    last_error_code is null
    or last_error_code ~ '^[a-z][a-z0-9_]{0,127}$'
  ),
  constraint credential_generation_batch_items_conflict_consistency check (
    (
      status = 'conflict'
      and conflicting_credential_id is not null
      and credential_id is null
      and last_error_code is not null
    )
    or (
      status <> 'conflict'
      and conflicting_credential_id is null
    )
  ),
  constraint credential_generation_batch_items_generation_consistency check (
    (
      status in ('generated', 'reviewed', 'activating', 'activated')
      and credential_id is not null
      and generated_at is not null
    )
    or status not in ('generated', 'reviewed', 'activating', 'activated')
  ),
  constraint credential_generation_batch_items_review_consistency check (
    (
      status in ('reviewed', 'activating', 'activated')
      and reviewed_by is not null
      and reviewed_at is not null
      and reviewed_at >= generated_at
    )
    or status not in ('reviewed', 'activating', 'activated')
  ),
  constraint credential_generation_batch_items_activation_consistency check (
    (
      status = 'activated'
      and activated_at is not null
      and activated_at >= reviewed_at
    )
    or (
      status <> 'activated'
      and activated_at is null
    )
  ),
  unique (batch_id, learner_id),
  unique (batch_id, position)
);

comment on table public.credential_generation_batch_items is
  'Private per-learner generation state with idempotency, bounded lease, retry, review, and activation markers. No learner contact data is copied here.';

create unique index credential_generation_batch_items_credential_unique_idx
  on public.credential_generation_batch_items (credential_id)
  where credential_id is not null;

create index credential_generation_batch_items_batch_status_position_idx
  on public.credential_generation_batch_items (batch_id, status, position, id);

create index credential_generation_batch_items_retry_lease_idx
  on public.credential_generation_batch_items (status, lease_expires_at, batch_id, position)
  where status in ('queued', 'processing', 'retryable');

create trigger credential_generation_batch_items_set_updated_at
before update on public.credential_generation_batch_items
for each row execute function internal.set_updated_at();

create table public.credential_file_generations (
  id uuid primary key default extensions.gen_random_uuid(),
  credential_file_id uuid not null references public.credential_files(id) on delete restrict,
  template_version_id uuid not null references public.credential_template_versions(id) on delete restrict,
  template_document_id uuid not null references public.credential_template_documents(id) on delete restrict,
  generation_batch_item_id uuid null references public.credential_generation_batch_items(id) on delete restrict,
  generation_attempt integer not null,
  input_sha256 text not null,
  output_sha256 text not null,
  generated_by uuid not null references public.user_profiles(id) on delete restrict,
  generated_at timestamptz not null default now(),
  constraint credential_file_generations_attempt_positive check (generation_attempt > 0),
  constraint credential_file_generations_input_sha256_format check (
    input_sha256 ~ '^[0-9a-f]{64}$'
  ),
  constraint credential_file_generations_output_sha256_format check (
    output_sha256 ~ '^[0-9a-f]{64}$'
  ),
  unique (credential_file_id, generation_attempt)
);

comment on table public.credential_file_generations is
  'Append-only private generation provenance. Stores hashes and template identity only; never source/output bytes, raw tokens, learner contacts, or private paths.';

create index credential_file_generations_template_version_idx
  on public.credential_file_generations (template_version_id, generated_at desc, id desc);

create index credential_file_generations_batch_item_idx
  on public.credential_file_generations (generation_batch_item_id, generated_at, id)
  where generation_batch_item_id is not null;

create or replace function internal.can_manage_credential_templates()
returns boolean
language sql
stable
security definer
set search_path = internal, public, pg_temp
as $$
  select coalesce(
    internal.has_any_role(array['owner', 'super_admin']::public.app_role[])
    and internal.is_mfa_requirement_satisfied(),
    false
  );
$$;

comment on function internal.can_manage_credential_templates() is
  'True only for an active MFA-satisfied Owner or Super Admin.';

revoke all on function internal.can_manage_credential_templates() from public, anon;
grant execute on function internal.can_manage_credential_templates() to authenticated, service_role;

create or replace function internal.can_read_credential_template_version(p_template_version_id uuid)
returns boolean
language sql
stable
security definer
set search_path = internal, public, pg_temp
as $$
  select coalesce(
    internal.is_mfa_requirement_satisfied()
    and (
      internal.has_any_role(array['owner', 'super_admin']::public.app_role[])
      or (
        internal.has_role('credential_manager'::public.app_role)
        and exists (
          select 1
          from public.credential_template_versions template_version
          where template_version.id = p_template_version_id
            and template_version.status in ('published', 'retired')
        )
      )
    ),
    false
  );
$$;

comment on function internal.can_read_credential_template_version(uuid) is
  'Allows Owner/Super Admin to read all template versions and Credential Manager to read only published/retired versions, always with MFA.';

revoke all on function internal.can_read_credential_template_version(uuid) from public, anon;
grant execute on function internal.can_read_credential_template_version(uuid) to authenticated, service_role;

create or replace function internal.can_read_credential_template_package(p_template_package_id uuid)
returns boolean
language sql
stable
security definer
set search_path = internal, public, pg_temp
as $$
  select coalesce(
    internal.is_mfa_requirement_satisfied()
    and (
      internal.has_any_role(array['owner', 'super_admin']::public.app_role[])
      or (
        internal.has_role('credential_manager'::public.app_role)
        and exists (
          select 1
          from public.credential_template_versions template_version
          where template_version.template_package_id = p_template_package_id
            and template_version.status in ('published', 'retired')
        )
      )
    ),
    false
  );
$$;

comment on function internal.can_read_credential_template_package(uuid) is
  'Allows Owner/Super Admin to read every package and Credential Manager to discover only packages with published/retired versions, always with MFA.';

revoke all on function internal.can_read_credential_template_package(uuid) from public, anon;
grant execute on function internal.can_read_credential_template_package(uuid) to authenticated, service_role;

create or replace function internal.enforce_template_package_identity()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'credential template packages are not hard-deleted'
      using errcode = '23514';
  end if;

  if old.id is distinct from new.id
    or old.created_by is distinct from new.created_by
    or old.created_at is distinct from new.created_at then
    raise exception 'credential template package identity fields are immutable'
      using errcode = '23514';
  end if;

  if (
    old.programme_id is distinct from new.programme_id
    or old.programme_run_id is distinct from new.programme_run_id
    or old.credential_type_id is distinct from new.credential_type_id
    or old.language_code is distinct from new.language_code
    or old.variant_code is distinct from new.variant_code
  ) and exists (
    select 1
    from public.credential_template_versions template_version
    where template_version.template_package_id = old.id
      and template_version.status in ('published', 'retired')
  ) then
    raise exception 'published credential template package context is immutable'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function internal.enforce_template_package_identity() is
  'Prevents hard deletion, identity mutation, and issuing-context changes after publication.';

revoke all on function internal.enforce_template_package_identity()
  from public, anon, authenticated;
grant execute on function internal.enforce_template_package_identity()
  to postgres, service_role;

create trigger credential_template_packages_enforce_identity
before update or delete on public.credential_template_packages
for each row execute function internal.enforce_template_package_identity();

create or replace function internal.enforce_template_version_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'credential template versions are not hard-deleted'
      using errcode = '23514';
  end if;

  if old.id is distinct from new.id
    or old.template_package_id is distinct from new.template_package_id
    or old.version_number is distinct from new.version_number
    or old.created_by is distinct from new.created_by
    or old.created_at is distinct from new.created_at then
    raise exception 'credential template version identity fields are immutable'
      using errcode = '23514';
  end if;

  if old.status is distinct from new.status and not (
    (old.status = 'draft' and new.status = 'published')
    or (old.status = 'published' and new.status = 'retired')
  ) then
    raise exception 'invalid credential template version transition'
      using errcode = '23514';
  end if;

  if old.status in ('published', 'retired') and (
    old.published_by is distinct from new.published_by
    or old.published_at is distinct from new.published_at
  ) then
    raise exception 'published credential template provenance is immutable'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function internal.enforce_template_version_lifecycle() is
  'Allows only draft to published to retired and preserves published provenance.';

revoke all on function internal.enforce_template_version_lifecycle()
  from public, anon, authenticated;
grant execute on function internal.enforce_template_version_lifecycle()
  to postgres, service_role;

create trigger credential_template_versions_enforce_lifecycle
before update or delete on public.credential_template_versions
for each row execute function internal.enforce_template_version_lifecycle();

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
  elsif tg_table_name in ('credential_template_document_pages', 'credential_template_field_placements') then
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

    if tg_op = 'UPDATE' and tg_table_name = 'credential_template_document_pages' and (
      old.template_document_id is distinct from new.template_document_id
      or old.page_number is distinct from new.page_number
      or old.created_at is distinct from new.created_at
    ) then
      raise exception 'credential template page identity is immutable'
        using errcode = '23514';
    end if;

    if tg_op = 'UPDATE' and tg_table_name = 'credential_template_field_placements' and (
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
  'Allows document, page, and placement changes only while the parent template version is draft.';

revoke all on function internal.enforce_template_draft_content()
  from public, anon, authenticated;
grant execute on function internal.enforce_template_draft_content()
  to postgres, service_role;

create trigger credential_template_documents_require_draft
before insert or update or delete on public.credential_template_documents
for each row execute function internal.enforce_template_draft_content();

create trigger credential_template_document_pages_require_draft
before insert or update or delete on public.credential_template_document_pages
for each row execute function internal.enforce_template_draft_content();

create trigger credential_template_field_placements_require_draft
before insert or update or delete on public.credential_template_field_placements
for each row execute function internal.enforce_template_draft_content();

create or replace function internal.validate_template_field_placement_bounds()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_page_width numeric(12, 3);
  v_page_height numeric(12, 3);
begin
  select template_page.width_points, template_page.height_points
    into v_page_width, v_page_height
  from public.credential_template_document_pages template_page
  where template_page.template_document_id = new.template_document_id
    and template_page.page_number = new.page_number;

  if v_page_width is null or v_page_height is null
    or new.x_points + new.width_points > v_page_width
    or new.y_points + new.height_points > v_page_height then
    raise exception 'credential template placement must fit inside its page bounds'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function internal.validate_template_field_placement_bounds() is
  'Rejects field placements outside their referenced PDF page dimensions.';

revoke all on function internal.validate_template_field_placement_bounds()
  from public, anon, authenticated;
grant execute on function internal.validate_template_field_placement_bounds()
  to postgres, service_role;

create trigger credential_template_field_placements_validate_bounds
before insert or update on public.credential_template_field_placements
for each row execute function internal.validate_template_field_placement_bounds();

create or replace function internal.validate_generation_batch_context()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_template_status public.credential_template_version_status;
begin
  select template_version.status
    into v_template_status
  from public.credential_template_versions template_version
  join public.credential_template_packages template_package
    on template_package.id = template_version.template_package_id
  where template_version.id = new.template_version_id
    and template_package.programme_id = new.programme_id
    and template_package.programme_run_id is not distinct from new.programme_run_id
    and template_package.credential_type_id = new.credential_type_id
    and template_package.language_code = new.language_code;

  if tg_op = 'INSERT' then
    if v_template_status is distinct from 'published'::public.credential_template_version_status then
      raise exception 'new generation batch requires a published matching template version'
        using errcode = '23514';
    end if;
  elsif v_template_status is null or v_template_status = 'draft' then
    raise exception 'generation batch must retain a matching published or retired template version'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function internal.validate_generation_batch_context() is
  'Requires every generation batch to match one published programme/run/type/language template version.';

revoke all on function internal.validate_generation_batch_context()
  from public, anon, authenticated;
grant execute on function internal.validate_generation_batch_context()
  to postgres, service_role;

create trigger credential_generation_batches_validate_context
before insert or update on public.credential_generation_batches
for each row execute function internal.validate_generation_batch_context();

create or replace function internal.enforce_generation_batch_identity()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'credential generation batches are not hard-deleted'
      using errcode = '23514';
  end if;

  if old.id is distinct from new.id
    or old.idempotency_key is distinct from new.idempotency_key
    or old.template_version_id is distinct from new.template_version_id
    or old.programme_id is distinct from new.programme_id
    or old.programme_run_id is distinct from new.programme_run_id
    or old.credential_type_id is distinct from new.credential_type_id
    or old.language_code is distinct from new.language_code
    or old.issue_date is distinct from new.issue_date
    or old.completion_date is distinct from new.completion_date
    or old.created_by is distinct from new.created_by
    or old.created_at is distinct from new.created_at then
    raise exception 'credential generation batch identity and issuing context are immutable'
      using errcode = '23514';
  end if;

  if old.status = 'completed' and old is distinct from new then
    raise exception 'completed credential generation batches are immutable'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function internal.enforce_generation_batch_identity() is
  'Prevents batch deletion/context mutation and makes completed batches terminal.';

revoke all on function internal.enforce_generation_batch_identity()
  from public, anon, authenticated;
grant execute on function internal.enforce_generation_batch_identity()
  to postgres, service_role;

create trigger credential_generation_batches_enforce_identity
before update or delete on public.credential_generation_batches
for each row execute function internal.enforce_generation_batch_identity();

create or replace function internal.enforce_generation_item_identity()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'credential generation batch items are not hard-deleted'
      using errcode = '23514';
  end if;

  if old.id is distinct from new.id
    or old.batch_id is distinct from new.batch_id
    or old.learner_id is distinct from new.learner_id
    or old.position is distinct from new.position
    or old.idempotency_key is distinct from new.idempotency_key
    or old.created_at is distinct from new.created_at then
    raise exception 'credential generation batch item identity is immutable'
      using errcode = '23514';
  end if;

  if old.credential_id is not null and old.credential_id is distinct from new.credential_id then
    raise exception 'generated credential link is immutable once assigned'
      using errcode = '23514';
  end if;

  if old.status = 'activated' and old is distinct from new then
    raise exception 'activated credential generation batch items are immutable'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function internal.enforce_generation_item_identity() is
  'Prevents item deletion/identity mutation, credential relinking, and post-activation changes.';

revoke all on function internal.enforce_generation_item_identity()
  from public, anon, authenticated;
grant execute on function internal.enforce_generation_item_identity()
  to postgres, service_role;

create trigger credential_generation_batch_items_enforce_identity
before update or delete on public.credential_generation_batch_items
for each row execute function internal.enforce_generation_item_identity();

create or replace function internal.validate_credential_file_generation()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_credential_id uuid;
  v_batch_credential_id uuid;
  v_batch_template_version_id uuid;
begin
  if not exists (
    select 1
    from public.credential_template_documents template_document
    where template_document.id = new.template_document_id
      and template_document.template_version_id = new.template_version_id
      and exists (
        select 1
        from public.credential_template_versions template_version
        where template_version.id = new.template_version_id
          and template_version.status in ('published', 'retired')
      )
  ) then
    raise exception 'credential file generation must reference a matching published or retired template document'
      using errcode = '23514';
  end if;

  select credential_file.credential_id
    into v_credential_id
  from public.credential_files credential_file
  where credential_file.id = new.credential_file_id;

  if new.generation_batch_item_id is not null then
    select batch_item.credential_id, batch.template_version_id
      into v_batch_credential_id, v_batch_template_version_id
    from public.credential_generation_batch_items batch_item
    join public.credential_generation_batches batch on batch.id = batch_item.batch_id
    where batch_item.id = new.generation_batch_item_id;

    if v_batch_credential_id is distinct from v_credential_id
      or v_batch_template_version_id is distinct from new.template_version_id then
      raise exception 'generation batch item must match the generated credential file and template version'
        using errcode = '23514';
    end if;
  end if;

  return new;
end;
$$;

comment on function internal.validate_credential_file_generation() is
  'Validates generated-file template provenance and optional batch linkage without exposing private paths or token material.';

revoke all on function internal.validate_credential_file_generation()
  from public, anon, authenticated;
grant execute on function internal.validate_credential_file_generation()
  to postgres, service_role;

create trigger credential_file_generations_validate_context
before insert on public.credential_file_generations
for each row execute function internal.validate_credential_file_generation();

create or replace function internal.prevent_credential_file_generation_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
begin
  raise exception 'credential file generation provenance is append-only'
    using errcode = '42501';
end;
$$;

comment on function internal.prevent_credential_file_generation_mutation() is
  'Blocks update, delete, and truncate of generated-file provenance.';

revoke all on function internal.prevent_credential_file_generation_mutation()
  from public, anon, authenticated;
grant execute on function internal.prevent_credential_file_generation_mutation()
  to postgres, service_role;

create trigger credential_file_generations_prevent_mutation
before update or delete on public.credential_file_generations
for each row execute function internal.prevent_credential_file_generation_mutation();

create trigger credential_file_generations_prevent_truncate
before truncate on public.credential_file_generations
for each statement execute function internal.prevent_credential_file_generation_mutation();

create or replace function internal.audit_credential_template_package_change()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
begin
  perform internal.write_audit_log(
    p_action => case when tg_op = 'INSERT' then 'credential_template.package_created' else 'credential_template.package_updated' end,
    p_actor_id => auth.uid(),
    p_target_schema => 'public',
    p_target_table => 'credential_template_packages',
    p_target_id => new.id,
    p_metadata => case when tg_op = 'INSERT'
      then jsonb_build_object(
        'programme_id', new.programme_id,
        'credential_type_id', new.credential_type_id,
        'language_code', new.language_code,
        'variant_code', new.variant_code
      )
      else jsonb_build_object(
        'context_changed', old.programme_id is distinct from new.programme_id
          or old.programme_run_id is distinct from new.programme_run_id
          or old.credential_type_id is distinct from new.credential_type_id
          or old.language_code is distinct from new.language_code
          or old.variant_code is distinct from new.variant_code,
        'display_name_changed', old.display_name is distinct from new.display_name
      )
    end
  );

  return new;
end;
$$;

revoke all on function internal.audit_credential_template_package_change()
  from public, anon, authenticated;
grant execute on function internal.audit_credential_template_package_change()
  to postgres, service_role;

create trigger credential_template_packages_audit_change
after insert or update on public.credential_template_packages
for each row execute function internal.audit_credential_template_package_change();

create or replace function internal.audit_credential_template_version_change()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
begin
  perform internal.write_audit_log(
    p_action => case
      when tg_op = 'INSERT' then 'credential_template.version_created'
      when new.status = 'published' and old.status = 'draft' then 'credential_template.version_published'
      when new.status = 'retired' and old.status = 'published' then 'credential_template.version_retired'
      else 'credential_template.version_updated'
    end,
    p_actor_id => auth.uid(),
    p_target_schema => 'public',
    p_target_table => 'credential_template_versions',
    p_target_id => new.id,
    p_metadata => jsonb_build_object(
      'template_package_id', new.template_package_id,
      'version_number', new.version_number,
      'status', new.status
    )
  );

  return new;
end;
$$;

revoke all on function internal.audit_credential_template_version_change()
  from public, anon, authenticated;
grant execute on function internal.audit_credential_template_version_change()
  to postgres, service_role;

create trigger credential_template_versions_audit_change
after insert or update on public.credential_template_versions
for each row execute function internal.audit_credential_template_version_change();

create or replace function internal.audit_credential_template_content_change()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_target_id uuid;
  v_action text;
  v_metadata jsonb;
begin
  if tg_table_name = 'credential_template_documents' then
    v_target_id := case when tg_op = 'DELETE' then old.id else new.id end;
    v_action := 'credential_template.document_' || lower(tg_op);
    v_metadata := jsonb_build_object(
      'template_version_id', case when tg_op = 'DELETE' then old.template_version_id else new.template_version_id end,
      'file_type_id', case when tg_op = 'DELETE' then old.file_type_id else new.file_type_id end,
      'is_primary', case when tg_op = 'DELETE' then old.is_primary else new.is_primary end,
      'page_count', case when tg_op = 'DELETE' then old.page_count else new.page_count end
    );
  elsif tg_table_name = 'credential_template_document_pages' then
    v_target_id := case when tg_op = 'DELETE' then old.template_document_id else new.template_document_id end;
    v_action := 'credential_template.page_' || lower(tg_op);
    v_metadata := jsonb_build_object(
      'page_number', case when tg_op = 'DELETE' then old.page_number else new.page_number end
    );
  else
    v_target_id := case when tg_op = 'DELETE' then old.id else new.id end;
    v_action := 'credential_template.placement_' || lower(tg_op);
    v_metadata := jsonb_build_object(
      'template_document_id', case when tg_op = 'DELETE' then old.template_document_id else new.template_document_id end,
      'page_number', case when tg_op = 'DELETE' then old.page_number else new.page_number end,
      'field_key', case when tg_op = 'DELETE' then old.field_key else new.field_key end
    );
  end if;

  perform internal.write_audit_log(
    p_action => v_action,
    p_actor_id => auth.uid(),
    p_target_schema => 'public',
    p_target_table => tg_table_name,
    p_target_id => v_target_id,
    p_metadata => v_metadata
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

comment on function internal.audit_credential_template_content_change() is
  'Audits template document/page/placement structure without source paths, PDF bytes, static text, coordinates, fonts, or learner data.';

revoke all on function internal.audit_credential_template_content_change()
  from public, anon, authenticated;
grant execute on function internal.audit_credential_template_content_change()
  to postgres, service_role;

create trigger credential_template_documents_audit_change
after insert or update or delete on public.credential_template_documents
for each row execute function internal.audit_credential_template_content_change();

create trigger credential_template_document_pages_audit_change
after insert or update or delete on public.credential_template_document_pages
for each row execute function internal.audit_credential_template_content_change();

create trigger credential_template_field_placements_audit_change
after insert or update or delete on public.credential_template_field_placements
for each row execute function internal.audit_credential_template_content_change();

create or replace function internal.audit_credential_generation_batch_change()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    perform internal.write_audit_log(
      p_action => case when tg_op = 'INSERT'
        then 'credential_generation.batch_created'
        else 'credential_generation.batch_status_changed'
      end,
      p_actor_id => auth.uid(),
      p_target_schema => 'public',
      p_target_table => 'credential_generation_batches',
      p_target_id => new.id,
      p_metadata => case when tg_op = 'INSERT'
        then jsonb_build_object(
          'template_version_id', new.template_version_id,
          'status', new.status,
          'processing_chunk_size', new.processing_chunk_size
        )
        else jsonb_build_object('from_status', old.status, 'to_status', new.status)
      end
    );
  end if;

  return new;
end;
$$;

comment on function internal.audit_credential_generation_batch_change() is
  'Audits aggregate batch creation/status only; never copies learner identities, contacts, errors, tokens, or file paths.';

revoke all on function internal.audit_credential_generation_batch_change()
  from public, anon, authenticated;
grant execute on function internal.audit_credential_generation_batch_change()
  to postgres, service_role;

create trigger credential_generation_batches_audit_change
after insert or update on public.credential_generation_batches
for each row execute function internal.audit_credential_generation_batch_change();

create or replace function public.create_credential_template_package(
  p_programme_id uuid,
  p_programme_run_id uuid,
  p_credential_type_id uuid,
  p_language_code text,
  p_variant_code text,
  p_display_name text
)
returns table (
  template_package_id uuid,
  template_version_id uuid,
  version_number integer
)
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_package_id uuid;
  v_version_id uuid;
begin
  perform internal.assert_sensitive_action_allowed(
    array['owner'::public.app_role, 'super_admin'::public.app_role],
    'credential template package creation'
  );

  insert into public.credential_template_packages (
    programme_id,
    programme_run_id,
    credential_type_id,
    language_code,
    variant_code,
    display_name,
    created_by
  ) values (
    p_programme_id,
    p_programme_run_id,
    p_credential_type_id,
    lower(btrim(p_language_code)),
    lower(btrim(p_variant_code)),
    btrim(p_display_name),
    auth.uid()
  )
  returning id into v_package_id;

  insert into public.credential_template_versions (
    template_package_id,
    version_number,
    created_by
  ) values (
    v_package_id,
    1,
    auth.uid()
  )
  returning id into v_version_id;

  return query select v_package_id, v_version_id, 1;
end;
$$;

comment on function public.create_credential_template_package(uuid, uuid, uuid, text, text, text) is
  'Creates one private Template Package and draft version 1 for an MFA-verified Owner or Super Admin.';

revoke all on function public.create_credential_template_package(uuid, uuid, uuid, text, text, text)
  from public, anon;
grant execute on function public.create_credential_template_package(uuid, uuid, uuid, text, text, text)
  to authenticated, service_role;

create or replace function public.create_credential_template_version(p_template_package_id uuid)
returns uuid
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_version_id uuid;
  v_next_version integer;
begin
  perform internal.assert_sensitive_action_allowed(
    array['owner'::public.app_role, 'super_admin'::public.app_role],
    'credential template version creation'
  );

  perform 1
  from public.credential_template_packages template_package
  where template_package.id = p_template_package_id
  for update;

  if not found then
    raise exception 'credential template package was not found'
      using errcode = 'P0002';
  end if;

  if exists (
    select 1
    from public.credential_template_versions template_version
    where template_version.template_package_id = p_template_package_id
      and template_version.status = 'draft'
  ) then
    raise exception 'credential template package already has a draft version'
      using errcode = '23505';
  end if;

  select coalesce(max(template_version.version_number), 0) + 1
    into v_next_version
  from public.credential_template_versions template_version
  where template_version.template_package_id = p_template_package_id;

  insert into public.credential_template_versions (
    template_package_id,
    version_number,
    created_by
  ) values (
    p_template_package_id,
    v_next_version,
    auth.uid()
  )
  returning id into v_version_id;

  return v_version_id;
end;
$$;

comment on function public.create_credential_template_version(uuid) is
  'Creates the next draft version after locking the package and refusing parallel drafts.';

revoke all on function public.create_credential_template_version(uuid)
  from public, anon;
grant execute on function public.create_credential_template_version(uuid)
  to authenticated, service_role;

create or replace function public.publish_credential_template_version(p_template_version_id uuid)
returns public.credential_template_versions
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_version public.credential_template_versions;
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

  if (select count(*) from public.credential_template_documents template_document where template_document.template_version_id = p_template_version_id) < 1 then
    raise exception 'credential template publication requires at least one document'
      using errcode = '23514';
  end if;

  if (select count(*) from public.credential_template_documents template_document where template_document.template_version_id = p_template_version_id and template_document.is_primary) <> 1 then
    raise exception 'credential template publication requires exactly one primary document'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from public.credential_template_documents template_document
    left join lateral (
      select count(*)::integer as page_rows, max(template_page.page_number)::integer as max_page
      from public.credential_template_document_pages template_page
      where template_page.template_document_id = template_document.id
    ) page_summary on true
    where template_document.template_version_id = p_template_version_id
      and (
        coalesce(page_summary.page_rows, 0) <> template_document.page_count
        or coalesce(page_summary.max_page, 0) <> template_document.page_count
      )
  ) then
    raise exception 'credential template publication requires complete contiguous page metadata'
      using errcode = '23514';
  end if;

  if exists (
    select required_field.field_key
    from unnest(array[
      'holder_name'::public.credential_template_field_key,
      'document_number'::public.credential_template_field_key,
      'verification_qr'::public.credential_template_field_key
    ]) as required_field(field_key)
    where not exists (
      select 1
      from public.credential_template_field_placements placement
      join public.credential_template_documents template_document
        on template_document.id = placement.template_document_id
      where template_document.template_version_id = p_template_version_id
        and placement.field_key = required_field.field_key
        and placement.is_required
    )
  ) then
    raise exception 'credential template publication requires holder name, document number, and verification QR placements'
      using errcode = '23514';
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
  'Publishes a structurally complete draft after validating one primary document, page metadata, and required holder/number/QR placements.';

revoke all on function public.publish_credential_template_version(uuid)
  from public, anon;
grant execute on function public.publish_credential_template_version(uuid)
  to authenticated, service_role;

create or replace function public.retire_credential_template_version(p_template_version_id uuid)
returns public.credential_template_versions
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_version public.credential_template_versions;
begin
  perform internal.assert_sensitive_action_allowed(
    array['owner'::public.app_role, 'super_admin'::public.app_role],
    'credential template retirement'
  );

  update public.credential_template_versions template_version
  set
    status = 'retired',
    retired_by = auth.uid(),
    retired_at = now()
  where template_version.id = p_template_version_id
    and template_version.status = 'published'
  returning * into v_version;

  if v_version.id is null then
    raise exception 'only a published credential template version can be retired'
      using errcode = '23514';
  end if;

  return v_version;
end;
$$;

comment on function public.retire_credential_template_version(uuid) is
  'Retires a published version for future generation without deleting its immutable provenance.';

revoke all on function public.retire_credential_template_version(uuid)
  from public, anon;
grant execute on function public.retire_credential_template_version(uuid)
  to authenticated, service_role;

alter table public.credential_template_packages enable row level security;
alter table public.credential_template_packages force row level security;
alter table public.credential_template_versions enable row level security;
alter table public.credential_template_versions force row level security;
alter table public.credential_template_documents enable row level security;
alter table public.credential_template_documents force row level security;
alter table public.credential_template_document_pages enable row level security;
alter table public.credential_template_document_pages force row level security;
alter table public.credential_template_field_placements enable row level security;
alter table public.credential_template_field_placements force row level security;
alter table public.credential_generation_batches enable row level security;
alter table public.credential_generation_batches force row level security;
alter table public.credential_generation_batch_items enable row level security;
alter table public.credential_generation_batch_items force row level security;
alter table public.credential_file_generations enable row level security;
alter table public.credential_file_generations force row level security;

revoke all on table public.credential_template_packages from public, anon, authenticated, service_role;
revoke all on table public.credential_template_versions from public, anon, authenticated, service_role;
revoke all on table public.credential_template_documents from public, anon, authenticated, service_role;
revoke all on table public.credential_template_document_pages from public, anon, authenticated, service_role;
revoke all on table public.credential_template_field_placements from public, anon, authenticated, service_role;
revoke all on table public.credential_generation_batches from public, anon, authenticated, service_role;
revoke all on table public.credential_generation_batch_items from public, anon, authenticated, service_role;
revoke all on table public.credential_file_generations from public, anon, authenticated, service_role;

grant select on table
  public.credential_template_packages,
  public.credential_template_versions,
  public.credential_template_documents,
  public.credential_template_document_pages,
  public.credential_template_field_placements,
  public.credential_generation_batches,
  public.credential_generation_batch_items,
  public.credential_file_generations
to authenticated, service_role;

grant update (
  programme_id,
  programme_run_id,
  credential_type_id,
  language_code,
  variant_code,
  display_name
) on table public.credential_template_packages to authenticated;

grant insert, update, delete on table
  public.credential_template_documents,
  public.credential_template_document_pages,
  public.credential_template_field_placements
to authenticated;

grant select, insert, update, delete on table
  public.credential_template_packages,
  public.credential_template_versions,
  public.credential_template_documents,
  public.credential_template_document_pages,
  public.credential_template_field_placements,
  public.credential_generation_batches,
  public.credential_generation_batch_items,
  public.credential_file_generations
to postgres;

create policy credential_template_packages_authorized_read
on public.credential_template_packages
for select
to authenticated
using (
  internal.can_read_credential_template_package(id)
);

create policy credential_template_packages_admin_update
on public.credential_template_packages
for update
to authenticated
using (internal.can_manage_credential_templates())
with check (internal.can_manage_credential_templates());

create policy credential_template_versions_authorized_read
on public.credential_template_versions
for select
to authenticated
using (internal.can_read_credential_template_version(id));

create policy credential_template_documents_authorized_read
on public.credential_template_documents
for select
to authenticated
using (internal.can_read_credential_template_version(template_version_id));

create policy credential_template_documents_admin_insert
on public.credential_template_documents
for insert
to authenticated
with check (
  internal.can_manage_credential_templates()
  and exists (
    select 1 from public.credential_template_versions template_version
    where template_version.id = template_version_id and template_version.status = 'draft'
  )
);

create policy credential_template_documents_admin_update
on public.credential_template_documents
for update
to authenticated
using (internal.can_manage_credential_templates())
with check (internal.can_manage_credential_templates());

create policy credential_template_documents_admin_delete
on public.credential_template_documents
for delete
to authenticated
using (internal.can_manage_credential_templates());

create policy credential_template_document_pages_authorized_read
on public.credential_template_document_pages
for select
to authenticated
using (
  exists (
    select 1
    from public.credential_template_documents template_document
    where template_document.id = template_document_id
      and internal.can_read_credential_template_version(template_document.template_version_id)
  )
);

create policy credential_template_document_pages_admin_insert
on public.credential_template_document_pages
for insert
to authenticated
with check (internal.can_manage_credential_templates());

create policy credential_template_document_pages_admin_update
on public.credential_template_document_pages
for update
to authenticated
using (internal.can_manage_credential_templates())
with check (internal.can_manage_credential_templates());

create policy credential_template_document_pages_admin_delete
on public.credential_template_document_pages
for delete
to authenticated
using (internal.can_manage_credential_templates());

create policy credential_template_field_placements_authorized_read
on public.credential_template_field_placements
for select
to authenticated
using (
  exists (
    select 1
    from public.credential_template_documents template_document
    where template_document.id = template_document_id
      and internal.can_read_credential_template_version(template_document.template_version_id)
  )
);

create policy credential_template_field_placements_admin_insert
on public.credential_template_field_placements
for insert
to authenticated
with check (internal.can_manage_credential_templates());

create policy credential_template_field_placements_admin_update
on public.credential_template_field_placements
for update
to authenticated
using (internal.can_manage_credential_templates())
with check (internal.can_manage_credential_templates());

create policy credential_template_field_placements_admin_delete
on public.credential_template_field_placements
for delete
to authenticated
using (internal.can_manage_credential_templates());

create policy credential_generation_batches_authorized_read
on public.credential_generation_batches
for select
to authenticated
using (
  internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);

create policy credential_generation_batch_items_authorized_read
on public.credential_generation_batch_items
for select
to authenticated
using (
  internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);

create policy credential_file_generations_authorized_read
on public.credential_file_generations
for select
to authenticated
using (
  internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);

-- No storage bucket or storage.objects policy is created in PDFGEN-001.
-- PDFGEN-002 owns the private credential-templates bucket and source-PDF validation.
-- No direct authenticated DML grant exists for versions, batches, items, or provenance.
