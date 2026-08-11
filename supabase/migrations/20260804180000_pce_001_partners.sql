-- PCE-001: Partners
-- Extensible partner cards with approved EN/UA/CZ translations and official links.

create table if not exists public.partners (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  partner_type text not null,
  status public.record_status not null default 'draft',
  official_url text not null,
  logo_path text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint partners_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint partners_type_allowed check (
    partner_type in ('exclusive_academic_partner', 'partner_organisation')
  ),
  constraint partners_official_url_https check (official_url ~ '^https://'),
  constraint partners_logo_path_public check (logo_path ~ '^/partners/[a-z0-9-]+\.webp$'),
  constraint partners_sort_order_nonnegative check (sort_order >= 0)
);

comment on table public.partners is
  'Public partner-card identity, classification, official destination, logo, ordering, and publication lifecycle.';
comment on column public.partners.partner_type is
  'Partner-card classification only; partners are never connected to credential verification.';

create table if not exists public.partner_translations (
  partner_id uuid not null references public.partners(id) on delete cascade,
  language_code text not null references public.languages(code) on delete restrict,
  translation_status public.translation_status not null default 'missing',
  name text null,
  role_label text null,
  location text null,
  logo_alt text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (partner_id, language_code),
  constraint partner_translations_published_complete check (
    translation_status <> 'published'
    or (
      name is not null and btrim(name) <> ''
      and role_label is not null and btrim(role_label) <> ''
      and logo_alt is not null and btrim(logo_alt) <> ''
    )
  )
);

comment on table public.partner_translations is
  'Localized public partner-card labels. Location is optional when no approved location is available.';

create index if not exists partners_status_order_idx
  on public.partners (status, sort_order);
create index if not exists partner_translations_language_status_idx
  on public.partner_translations (language_code, translation_status);

create trigger partners_set_updated_at
before update on public.partners
for each row execute function internal.set_updated_at();

create trigger partner_translations_set_updated_at
before update on public.partner_translations
for each row execute function internal.set_updated_at();

insert into public.partners (id, slug, partner_type, status, official_url, logo_path, sort_order)
values
  ('00000000-0000-4000-8000-000000000401', 'alfred-nobel-university', 'exclusive_academic_partner', 'published', 'https://duan.edu.ua', '/partners/alfred-nobel-university.webp', 10),
  ('00000000-0000-4000-8000-000000000402', 'riga-nordic-university', 'partner_organisation', 'published', 'https://rnu.lv/en/', '/partners/riga-nordic-university.webp', 20),
  ('00000000-0000-4000-8000-000000000403', 'nataliia-kholodenko-psychology-centre', 'partner_organisation', 'published', 'https://school.kholodenko.net/', '/partners/nataliia-kholodenko-psychology-centre.webp', 30),
  ('00000000-0000-4000-8000-000000000404', 'e-launch-online-school', 'partner_organisation', 'published', 'https://e-launch.net/', '/partners/e-launch-online-school.webp', 40),
  ('00000000-0000-4000-8000-000000000405', 'nobel-mental-health', 'partner_organisation', 'published', 'https://duan.edu.ua/pro-nas/departamenty-ta-strukturni-pidrozdily/klinika-psyhichnogo-zdorov-ja/', '/partners/nobel-mental-health.webp', 50)
on conflict (slug) do update set
  partner_type = excluded.partner_type,
  status = excluded.status,
  official_url = excluded.official_url,
  logo_path = excluded.logo_path,
  sort_order = excluded.sort_order;

insert into public.partner_translations (
  partner_id, language_code, translation_status, name, role_label, location, logo_alt
)
values
  ('00000000-0000-4000-8000-000000000401', 'en', 'published', 'Alfred Nobel University', 'Exclusive academic partner of Nobel ITBS', 'Dnipro, Ukraine', 'Alfred Nobel University logo'),
  ('00000000-0000-4000-8000-000000000401', 'ua', 'published', 'Університет імені Альфреда Нобеля', 'Ексклюзивний академічний партнер Nobel ITBS', 'м. Дніпро, Україна', 'Логотип Університету імені Альфреда Нобеля'),
  ('00000000-0000-4000-8000-000000000401', 'cz', 'published', 'Alfred Nobel University', 'Exkluzivní akademický partner Nobel ITBS', 'Dnipro, Ukrajina', 'Logo Alfred Nobel University'),
  ('00000000-0000-4000-8000-000000000402', 'en', 'published', 'Riga Nordic University', 'Partner organisation', 'Riga, Latvia', 'Riga Nordic University logo'),
  ('00000000-0000-4000-8000-000000000402', 'ua', 'published', 'Рижський нордичний університет', 'Організація-партнер', 'м. Рига, Латвія', 'Логотип Рижського нордичного університету'),
  ('00000000-0000-4000-8000-000000000402', 'cz', 'published', 'Riga Nordic University', 'Partnerská organizace', 'Riga, Lotyšsko', 'Logo Riga Nordic University'),
  ('00000000-0000-4000-8000-000000000403', 'en', 'published', 'Nataliia Kholodenko Psychology Centre', 'Partner organisation', null, 'Nataliia Kholodenko Psychology Centre logo'),
  ('00000000-0000-4000-8000-000000000403', 'ua', 'published', 'Центр Психології Наталії Холоденко', 'Організація-партнер', null, 'Логотип Центру Психології Наталії Холоденко'),
  ('00000000-0000-4000-8000-000000000403', 'cz', 'published', 'Nataliia Kholodenko Psychology Centre', 'Partnerská organizace', null, 'Logo Nataliia Kholodenko Psychology Centre'),
  ('00000000-0000-4000-8000-000000000404', 'en', 'published', 'e-launch Online School', 'Partner organisation', null, 'e-launch Online School logo'),
  ('00000000-0000-4000-8000-000000000404', 'ua', 'published', 'Онлайн-школа e-launch', 'Організація-партнер', null, 'Логотип онлайн-школи e-launch'),
  ('00000000-0000-4000-8000-000000000404', 'cz', 'published', 'e-launch Online School', 'Partnerská organizace', null, 'Logo e-launch Online School'),
  ('00000000-0000-4000-8000-000000000405', 'en', 'published', 'Nobel Mental Health', 'Partner organisation', null, 'Nobel Mental Health logo'),
  ('00000000-0000-4000-8000-000000000405', 'ua', 'published', 'Клініка психічного здоров’я', 'Організація-партнер', null, 'Логотип Клініки психічного здоров’я'),
  ('00000000-0000-4000-8000-000000000405', 'cz', 'published', 'Nobel Mental Health', 'Partnerská organizace', null, 'Logo Nobel Mental Health')
on conflict (partner_id, language_code) do update set
  translation_status = excluded.translation_status,
  name = excluded.name,
  role_label = excluded.role_label,
  location = excluded.location,
  logo_alt = excluded.logo_alt;

alter table public.partners enable row level security;
alter table public.partners force row level security;
alter table public.partner_translations enable row level security;
alter table public.partner_translations force row level security;

create policy partners_public_read on public.partners
for select to anon using (status = 'published');

create policy partners_reference_read on public.partners
for select to authenticated using (status = 'published' and internal.is_active_admin());

create policy partners_content_read on public.partners
for select to authenticated using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));
create policy partners_content_insert on public.partners
for insert to authenticated with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));
create policy partners_content_update on public.partners
for update to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]))
with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));
create policy partners_content_delete on public.partners
for delete to authenticated using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy partner_translations_public_read on public.partner_translations
for select to anon using (
  translation_status = 'published'
  and exists (
    select 1 from public.partners p
    where p.id = partner_id and p.status = 'published'
  )
);

create policy partner_translations_reference_read on public.partner_translations
for select to authenticated using (
  translation_status = 'published'
  and internal.is_active_admin()
  and exists (
    select 1 from public.partners p
    where p.id = partner_id and p.status = 'published'
  )
);

create policy partner_translations_content_read on public.partner_translations
for select to authenticated using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));
create policy partner_translations_content_insert on public.partner_translations
for insert to authenticated with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));
create policy partner_translations_content_update on public.partner_translations
for update to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]))
with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));
create policy partner_translations_content_delete on public.partner_translations
for delete to authenticated using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

grant select on public.partners, public.partner_translations to anon;
grant select, insert, update, delete on public.partners, public.partner_translations to authenticated;

