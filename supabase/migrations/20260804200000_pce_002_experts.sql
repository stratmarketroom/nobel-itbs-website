-- PCE-002: Experts
-- Extensible expert cards with approved EN/UA/CZ translations and optional portraits.

create table if not exists public.experts (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  status public.record_status not null default 'draft',
  photo_path text null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint experts_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint experts_photo_path_public check (
    photo_path is null or photo_path ~ '^/experts/[a-z0-9-]+\.webp$'
  ),
  constraint experts_sort_order_nonnegative check (sort_order >= 0)
);

comment on table public.experts is
  'Public expert-card identity, optional approved portrait, ordering, and publication lifecycle. No public expert profile pages exist in Release 1.';

create table if not exists public.expert_translations (
  expert_id uuid not null references public.experts(id) on delete cascade,
  language_code text not null references public.languages(code) on delete restrict,
  translation_status public.translation_status not null default 'missing',
  name text null,
  public_category text null,
  expert_role text null,
  photo_alt text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (expert_id, language_code),
  constraint expert_translations_published_complete check (
    translation_status <> 'published'
    or (
      name is not null and btrim(name) <> ''
      and public_category is not null and btrim(public_category) <> ''
      and expert_role is not null and btrim(expert_role) <> ''
    )
  )
);

comment on table public.expert_translations is
  'Localized concise expert-card copy. Extended biographies and uncontrolled rich profiles are outside Release 1.';

create index if not exists experts_status_order_idx on public.experts (status, sort_order);
create index if not exists expert_translations_language_status_idx
  on public.expert_translations (language_code, translation_status);

create trigger experts_set_updated_at
before update on public.experts
for each row execute function internal.set_updated_at();

create trigger expert_translations_set_updated_at
before update on public.expert_translations
for each row execute function internal.set_updated_at();

insert into public.experts (id, slug, status, photo_path, sort_order)
values
  ('00000000-0000-4000-8000-000000000501', 'nataliia-kholodenko', 'published', '/experts/nataliia-kholodenko.webp', 10),
  ('00000000-0000-4000-8000-000000000502', 'dmytro-shevchuk', 'published', '/experts/dmytro-shevchuk.webp', 20),
  ('00000000-0000-4000-8000-000000000503', 'alina-yudina', 'published', '/experts/alina-yudina.webp', 30)
on conflict (slug) do update set
  status = excluded.status,
  photo_path = excluded.photo_path,
  sort_order = excluded.sort_order;

insert into public.expert_translations (
  expert_id, language_code, translation_status, name, public_category, expert_role, photo_alt
)
values
  ('00000000-0000-4000-8000-000000000501', 'en', 'published', 'Nataliia Kholodenko', 'Psychologist, Candidate of Sciences', 'Expert and educational programme author', 'Nataliia Kholodenko'),
  ('00000000-0000-4000-8000-000000000501', 'ua', 'published', 'Наталія Холоденко', 'Психологиня, кандидат наук', 'Експертка та авторка освітніх програм', 'Наталія Холоденко'),
  ('00000000-0000-4000-8000-000000000501', 'cz', 'published', 'Nataliia Kholodenko', 'Psycholožka, kandidátka věd', 'Expertka a autorka vzdělávacích programů', 'Nataliia Kholodenko'),
  ('00000000-0000-4000-8000-000000000502', 'en', 'published', 'Dmytro Shevchuk', 'Practitioner in marketing and educational project production', 'AI Production programme expert', 'Dmytro Shevchuk'),
  ('00000000-0000-4000-8000-000000000502', 'ua', 'published', 'Дмитро Шевчук', 'Експерт-практик з маркетингу та продюсування освітніх проєктів', 'Експерт програми AI Production', 'Дмитро Шевчук'),
  ('00000000-0000-4000-8000-000000000502', 'cz', 'published', 'Dmytro Shevchuk', 'Praktický odborník na marketing a produkci vzdělávacích projektů', 'Expert programu AI Production', 'Dmytro Shevchuk'),
  ('00000000-0000-4000-8000-000000000503', 'en', 'published', 'Alina Yudina', 'Psychologist, Head of Nobel Mental Health, Candidate of Sciences', 'General Psychology lecturer', 'Alina Yudina'),
  ('00000000-0000-4000-8000-000000000503', 'ua', 'published', 'Аліна Юдіна', 'Психологиня, керівниця Клініки психічного здоров’я, кандидат наук', 'Викладачка програми «Загальна психологія»', 'Аліна Юдіна'),
  ('00000000-0000-4000-8000-000000000503', 'cz', 'published', 'Alina Yudina', 'Psycholožka, vedoucí Nobel Mental Health, kandidátka věd', 'Lektorka programu General Psychology', 'Alina Yudina')
on conflict (expert_id, language_code) do update set
  translation_status = excluded.translation_status,
  name = excluded.name,
  public_category = excluded.public_category,
  expert_role = excluded.expert_role,
  photo_alt = excluded.photo_alt;

alter table public.experts enable row level security;
alter table public.experts force row level security;
alter table public.expert_translations enable row level security;
alter table public.expert_translations force row level security;

create policy experts_public_read on public.experts
for select to anon using (status = 'published');

create policy experts_reference_read on public.experts
for select to authenticated using (status = 'published' and internal.is_active_admin());

create policy experts_content_read on public.experts
for select to authenticated using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));
create policy experts_content_insert on public.experts
for insert to authenticated with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));
create policy experts_content_update on public.experts
for update to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]))
with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));
create policy experts_content_delete on public.experts
for delete to authenticated using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy expert_translations_public_read on public.expert_translations
for select to anon using (
  translation_status = 'published'
  and exists (
    select 1 from public.experts e
    where e.id = expert_id and e.status = 'published'
  )
);

create policy expert_translations_reference_read on public.expert_translations
for select to authenticated using (
  translation_status = 'published'
  and internal.is_active_admin()
  and exists (
    select 1 from public.experts e
    where e.id = expert_id and e.status = 'published'
  )
);

create policy expert_translations_content_read on public.expert_translations
for select to authenticated using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));
create policy expert_translations_content_insert on public.expert_translations
for insert to authenticated with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));
create policy expert_translations_content_update on public.expert_translations
for update to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]))
with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));
create policy expert_translations_content_delete on public.expert_translations
for delete to authenticated using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

grant select on public.experts, public.expert_translations to anon;
grant select, insert, update, delete on public.experts, public.expert_translations to authenticated;
