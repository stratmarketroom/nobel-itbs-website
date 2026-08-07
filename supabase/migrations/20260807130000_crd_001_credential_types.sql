-- CRD-001: Credential Types
-- Stable document identity types and localized admin/public labels.

create table public.credential_types (
  id uuid primary key default extensions.gen_random_uuid(),
  code text not null unique,
  document_letter text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credential_types_code_format check (code ~ '^[a-z][a-z0-9_]*$'),
  constraint credential_types_document_letter_format check (document_letter ~ '^[A-Z]$')
);

comment on table public.credential_types is
  'Stable credential document identity types used for number generation and public labels.';
comment on column public.credential_types.code is
  'Locale-independent machine code. Existing codes must remain stable once referenced.';
comment on column public.credential_types.document_letter is
  'Single uppercase letter embedded in generated document numbers.';
comment on column public.credential_types.is_active is
  'Controls availability for new credentials without removing historical references.';

create table public.credential_type_translations (
  credential_type_id uuid not null references public.credential_types(id) on delete cascade,
  language_code text not null references public.languages(code) on delete restrict,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (credential_type_id, language_code),
  constraint credential_type_translations_display_name_not_blank check (
    display_name = btrim(display_name) and display_name <> ''
  )
);

comment on table public.credential_type_translations is
  'Localized current display labels for credential document identity types.';

create index credential_type_translations_language_idx
  on public.credential_type_translations (language_code, credential_type_id);

create trigger credential_types_set_updated_at
before update on public.credential_types
for each row execute function internal.set_updated_at();

create trigger credential_type_translations_set_updated_at
before update on public.credential_type_translations
for each row execute function internal.set_updated_at();

insert into public.credential_types (id, code, document_letter, is_active)
values
  ('00000000-0000-4000-8000-000000000601', 'certificate', 'C', true),
  ('00000000-0000-4000-8000-000000000602', 'diploma', 'D', true);

insert into public.credential_type_translations (
  credential_type_id,
  language_code,
  display_name
)
values
  ('00000000-0000-4000-8000-000000000601', 'en', 'Certificate'),
  ('00000000-0000-4000-8000-000000000601', 'ua', 'Сертифікат'),
  ('00000000-0000-4000-8000-000000000601', 'cz', 'Certifikát'),
  ('00000000-0000-4000-8000-000000000602', 'en', 'Diploma'),
  ('00000000-0000-4000-8000-000000000602', 'ua', 'Диплом'),
  ('00000000-0000-4000-8000-000000000602', 'cz', 'Diplom');

alter table public.credential_types enable row level security;
alter table public.credential_types force row level security;
alter table public.credential_type_translations enable row level security;
alter table public.credential_type_translations force row level security;

revoke all on table public.credential_types from public, anon, authenticated;
revoke all on table public.credential_type_translations from public, anon, authenticated;

grant select on table public.credential_types, public.credential_type_translations to authenticated;
grant insert (code, document_letter, is_active) on table public.credential_types to authenticated;
grant update (code, document_letter, is_active) on table public.credential_types to authenticated;
grant insert (credential_type_id, language_code, display_name) on table public.credential_type_translations to authenticated;
grant update (display_name) on table public.credential_type_translations to authenticated;

grant select, insert, update, delete on table public.credential_types, public.credential_type_translations
  to postgres, service_role;

create policy credential_types_authorized_read
on public.credential_types
for select
to authenticated
using (
  internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);

create policy credential_types_admin_insert
on public.credential_types
for insert
to authenticated
with check (
  internal.has_any_role(array['owner', 'super_admin']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);

create policy credential_types_admin_update
on public.credential_types
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

create policy credential_type_translations_authorized_read
on public.credential_type_translations
for select
to authenticated
using (
  internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);

create policy credential_type_translations_admin_insert
on public.credential_type_translations
for insert
to authenticated
with check (
  internal.has_any_role(array['owner', 'super_admin']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);

create policy credential_type_translations_admin_update
on public.credential_type_translations
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
