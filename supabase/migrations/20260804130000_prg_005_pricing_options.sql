-- PRG-005: Programme Pricing Options
-- Flexible localized tariff cards and vendor-neutral application URL fallback.

create table public.programme_pricing_options (
  id uuid primary key default extensions.gen_random_uuid(),
  programme_id uuid not null references public.programmes(id) on delete cascade,
  price numeric(12, 2) null,
  currency_code text null,
  application_url text null,
  sort_order integer not null default 0,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint programme_pricing_options_price_nonnegative check (
    price is null or price >= 0
  ),
  constraint programme_pricing_options_currency_with_price check (
    (price is null and currency_code is null)
    or (
      price is not null
      and currency_code ~ '^[A-Z]{3}$'
    )
  ),
  constraint programme_pricing_options_application_url_http check (
    application_url is null
    or application_url ~ '^https://'
  ),
  constraint programme_pricing_options_sort_order_nonnegative check (
    sort_order >= 0
  ),
  unique (programme_id, sort_order)
);

comment on table public.programme_pricing_options is
  'Optional reusable tariff cards for Nobel ITBS programme pages; partner-managed prices need not be duplicated.';
comment on column public.programme_pricing_options.price is
  'Current public price; null supports a non-priced option or consultation route.';
comment on column public.programme_pricing_options.application_url is
  'Optional tariff-specific external URL; null falls back to run, programme, then contact CTA.';

create table public.programme_pricing_option_translations (
  pricing_option_id uuid not null references public.programme_pricing_options(id) on delete cascade,
  language_code text not null references public.languages(code) on delete restrict,
  translation_status public.translation_status not null default 'missing',
  title text null,
  description text null,
  cta_label text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (pricing_option_id, language_code),
  constraint programme_pricing_option_translations_published_complete check (
    translation_status <> 'published'
    or (
      title is not null and btrim(title) <> ''
      and description is not null and btrim(description) <> ''
      and cta_label is not null and btrim(cta_label) <> ''
    )
  )
);

comment on table public.programme_pricing_option_translations is
  'Localized title, description, and CTA label for a stable programme tariff.';

create index programme_pricing_options_public_idx
  on public.programme_pricing_options (programme_id, is_active, sort_order);
create index programme_pricing_option_translations_public_idx
  on public.programme_pricing_option_translations (language_code, translation_status);

create trigger programme_pricing_options_set_updated_at
before update on public.programme_pricing_options
for each row
execute function internal.set_updated_at();

create trigger programme_pricing_option_translations_set_updated_at
before update on public.programme_pricing_option_translations
for each row
execute function internal.set_updated_at();

alter table public.programme_pricing_options enable row level security;
alter table public.programme_pricing_options force row level security;
alter table public.programme_pricing_option_translations enable row level security;
alter table public.programme_pricing_option_translations force row level security;

revoke all on table public.programme_pricing_options from public, anon, authenticated;
revoke all on table public.programme_pricing_option_translations from public, anon, authenticated;
grant select on table public.programme_pricing_options to anon;
grant select on table public.programme_pricing_option_translations to anon;
grant select, insert, update, delete on table public.programme_pricing_options to authenticated;
grant select, insert, update, delete on table public.programme_pricing_option_translations to authenticated;
grant select, insert, update, delete on table public.programme_pricing_options to postgres, service_role;
grant select, insert, update, delete on table public.programme_pricing_option_translations to postgres, service_role;

create policy programme_pricing_options_public_read
on public.programme_pricing_options for select to anon
using (
  is_active
  and exists (
    select 1
    from public.programmes programme_record
    where programme_record.id = programme_id
      and programme_record.publication_status = 'published'
  )
);

create policy programme_pricing_options_content_read
on public.programme_pricing_options for select to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programme_pricing_options_content_insert
on public.programme_pricing_options for insert to authenticated
with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programme_pricing_options_content_update
on public.programme_pricing_options for update to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]))
with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programme_pricing_options_content_delete
on public.programme_pricing_options for delete to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programme_pricing_option_translations_public_read
on public.programme_pricing_option_translations for select to anon
using (
  translation_status = 'published'
  and exists (
    select 1
    from public.programme_pricing_options pricing_record
    join public.programmes programme_record
      on programme_record.id = pricing_record.programme_id
    where pricing_record.id = pricing_option_id
      and pricing_record.is_active
      and programme_record.publication_status = 'published'
  )
);

create policy programme_pricing_option_translations_content_read
on public.programme_pricing_option_translations for select to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programme_pricing_option_translations_content_insert
on public.programme_pricing_option_translations for insert to authenticated
with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programme_pricing_option_translations_content_update
on public.programme_pricing_option_translations for update to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]))
with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programme_pricing_option_translations_content_delete
on public.programme_pricing_option_translations for delete to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create or replace function public.resolve_programme_application_url(
  p_programme_id uuid,
  p_pricing_option_id uuid default null,
  p_programme_run_id uuid default null,
  p_as_of date default current_date
)
returns text
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select coalesce(
    (
      select pricing_record.application_url
      from public.programme_pricing_options pricing_record
      where pricing_record.id = p_pricing_option_id
        and pricing_record.programme_id = p_programme_id
        and pricing_record.is_active
    ),
    (
      select run_record.application_url
      from public.programme_runs run_record
      where run_record.id = p_programme_run_id
        and run_record.programme_id = p_programme_id
        and run_record.status <> 'closed'
        and (run_record.ends_at is null or run_record.ends_at >= p_as_of)
    ),
    (
      select run_record.application_url
      from public.programme_runs run_record
      where p_programme_run_id is null
        and run_record.programme_id = p_programme_id
        and run_record.application_url is not null
        and run_record.status <> 'closed'
        and (run_record.ends_at is null or run_record.ends_at >= p_as_of)
      order by
        case run_record.status
          when 'open' then 1
          when 'ongoing' then 2
          when 'upcoming' then 3
          else 4
        end,
        run_record.starts_at nulls last,
        run_record.created_at
      limit 1
    ),
    (
      select programme_record.application_url
      from public.programmes programme_record
      where programme_record.id = p_programme_id
    )
  );
$$;

comment on function public.resolve_programme_application_url(uuid, uuid, uuid, date) is
  'Resolves external CTA URL in pricing-option, selected/current run, and programme order; null means contact fallback.';

revoke all on function public.resolve_programme_application_url(uuid, uuid, uuid, date) from public;
grant execute on function public.resolve_programme_application_url(uuid, uuid, uuid, date) to anon, authenticated, service_role;
