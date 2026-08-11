-- CNT-001: Languages
-- Release 1 language reference data and translation publication states.

do $$
begin
  if not exists (
    select 1
    from pg_type type_record
    join pg_namespace namespace_record
      on namespace_record.oid = type_record.typnamespace
    where namespace_record.nspname = 'public'
      and type_record.typname = 'translation_status'
  ) then
    create type public.translation_status as enum (
      'missing',
      'draft',
      'published'
    );
  end if;
end
$$;

comment on type public.translation_status is
  'Publication state for a localized content record. Only published translations may be shown publicly.';

create table if not exists public.languages (
  code text primary key,
  name text not null,
  native_name text not null,
  url_prefix text null,
  is_default boolean not null default false,
  is_active boolean not null default true,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint languages_code_format check (code ~ '^[a-z]{2}$'),
  constraint languages_name_not_blank check (btrim(name) <> ''),
  constraint languages_native_name_not_blank check (btrim(native_name) <> ''),
  constraint languages_url_prefix_format check (
    url_prefix is null or url_prefix ~ '^/[a-z]{2}$'
  ),
  constraint languages_default_has_no_prefix check (
    not is_default or url_prefix is null
  ),
  constraint languages_sort_order_nonnegative check (sort_order >= 0)
);

comment on table public.languages is
  'Release 1 public languages and their canonical URL prefixes.';
comment on column public.languages.code is
  'Two-letter application language code. Release 1 uses en, ua, and cz.';
comment on column public.languages.url_prefix is
  'Canonical public URL prefix. NULL represents the unprefixed English default.';
comment on column public.languages.is_default is
  'Marks the English fallback language used when a requested translation is not published.';

create unique index if not exists languages_url_prefix_unique_idx
  on public.languages (url_prefix)
  where url_prefix is not null;

create unique index if not exists languages_one_default_idx
  on public.languages (is_default)
  where is_default;

create trigger languages_set_updated_at
before update on public.languages
for each row
execute function internal.set_updated_at();

insert into public.languages (
  code,
  name,
  native_name,
  url_prefix,
  is_default,
  is_active,
  sort_order
)
values
  ('en', 'English', 'English', null, true, true, 10),
  ('ua', 'Ukrainian', 'Українська', '/ua', false, true, 20),
  ('cz', 'Czech', 'Čeština', '/cz', false, true, 30)
on conflict (code) do update
set
  name = excluded.name,
  native_name = excluded.native_name,
  url_prefix = excluded.url_prefix,
  is_default = excluded.is_default,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;

alter table public.languages enable row level security;
alter table public.languages force row level security;

revoke all on table public.languages from public, anon, authenticated;
grant select on table public.languages to anon, authenticated;
grant select, insert, update, delete on table public.languages to postgres, service_role;

grant usage on type public.translation_status to anon, authenticated, service_role;

create policy languages_read_active
on public.languages
for select
to anon, authenticated
using (is_active);
