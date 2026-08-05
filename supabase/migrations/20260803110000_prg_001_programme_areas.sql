-- PRG-001: Programme Areas
-- Structured programme area records, localized landing-page content, and role-scoped access.

do $$
begin
  if not exists (
    select 1
    from pg_type type_record
    join pg_namespace namespace_record
      on namespace_record.oid = type_record.typnamespace
    where namespace_record.nspname = 'public'
      and type_record.typname = 'record_status'
  ) then
    create type public.record_status as enum (
      'draft',
      'published',
      'archived'
    );
  end if;
end
$$;

comment on type public.record_status is
  'Lifecycle state for structured public reference records: draft, published, or archived.';

create table if not exists public.programme_areas (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  status public.record_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint programme_areas_slug_format check (
    slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint programme_areas_sort_order_nonnegative check (sort_order >= 0)
);

comment on table public.programme_areas is
  'Stable programme-area identity, ordering, and publication lifecycle.';
comment on column public.programme_areas.slug is
  'Locale-independent slug in the shared /programmes namespace.';

create table if not exists public.programme_area_translations (
  area_id uuid not null references public.programme_areas(id) on delete cascade,
  language_code text not null references public.languages(code) on delete restrict,
  translation_status public.translation_status not null default 'missing',
  title text null,
  short_description text null,
  intro_content text null,
  seo_title text null,
  seo_description text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (area_id, language_code),
  constraint programme_area_translations_published_complete check (
    translation_status <> 'published'
    or (
      title is not null and btrim(title) <> ''
      and short_description is not null and btrim(short_description) <> ''
      and intro_content is not null and btrim(intro_content) <> ''
      and seo_title is not null and btrim(seo_title) <> ''
      and seo_description is not null and btrim(seo_description) <> ''
    )
  )
);

comment on table public.programme_area_translations is
  'Localized editable content for programme-area landing pages.';
comment on column public.programme_area_translations.translation_status is
  'Only published translations are publicly readable; missing or draft locales fall back to published English.';

create index if not exists programme_area_translations_language_status_idx
  on public.programme_area_translations (language_code, translation_status);

create trigger programme_areas_set_updated_at
before update on public.programme_areas
for each row
execute function internal.set_updated_at();

create trigger programme_area_translations_set_updated_at
before update on public.programme_area_translations
for each row
execute function internal.set_updated_at();

insert into public.programme_areas (id, slug, status, sort_order)
values
  ('00000000-0000-4000-8000-000000000101', 'business-management', 'published', 10),
  ('00000000-0000-4000-8000-000000000102', 'technology-innovation', 'published', 20),
  ('00000000-0000-4000-8000-000000000103', 'psychology-human', 'published', 30)
on conflict (slug) do update
set
  status = excluded.status,
  sort_order = excluded.sort_order;

insert into public.programme_area_translations (
  area_id,
  language_code,
  translation_status,
  title,
  short_description,
  intro_content,
  seo_title,
  seo_description
)
values
  (
    '00000000-0000-4000-8000-000000000101',
    'en',
    'published',
    'Business & Management',
    'Strong businesses begin with decisions that can be explained and put into practice.',
    'Business & Management focuses on turning ideas into structured products and manageable processes. Participants consider business as a connected system in which strategy, finance, marketing, sales, people, and operations need to work together.',
    'Business & Management Programmes | Nobel ITBS',
    'Professional programmes in business, management, strategic decision-making, and product development for specialists, managers, and entrepreneurs.'
  ),
  (
    '00000000-0000-4000-8000-000000000101',
    'ua',
    'published',
    'Business & Management',
    'Сильний бізнес починається з рішень, які можна обґрунтувати й реалізувати.',
    'Business & Management зосереджується на тому, як перетворювати ідеї на структуровані продукти й керовані процеси. Учасники розглядають бізнес як систему, у якій стратегія, фінанси, маркетинг, продажі, команда й операційні рішення мають працювати узгоджено.',
    'Business & Management | Професійні програми Nobel ITBS',
    'Професійні програми з бізнесу, управління, стратегічних рішень і запуску продуктів для фахівців, менеджерів та підприємців.'
  ),
  (
    '00000000-0000-4000-8000-000000000101',
    'cz',
    'draft',
    'Business & Management',
    'Silné firmy začínají rozhodnutími, která lze vysvětlit a uvést do praxe.',
    'Business & Management se zaměřuje na přeměnu nápadů ve strukturované produkty a řiditelné procesy. Účastníci vnímají firmu jako propojený systém, v němž musí společně fungovat strategie, finance, marketing, prodej, lidé a provoz.',
    'Programy Business & Management | Nobel ITBS',
    'Profesní programy v oblasti byznysu, managementu, strategického rozhodování a vývoje produktů pro specialisty, manažery a podnikatele.'
  ),
  (
    '00000000-0000-4000-8000-000000000102',
    'en',
    'published',
    'Technology & Innovation',
    'Technology creates value when we understand how to apply it.',
    'Technology & Innovation helps participants navigate an environment in which technology is rapidly changing markets, professions, and product development. Programmes connect technological context with business, economics, management, and international cooperation.',
    'Technology & Innovation Programmes | Nobel ITBS',
    'Professional programmes in technology, innovation, and emerging industries for specialists, managers, and entrepreneurs.'
  ),
  (
    '00000000-0000-4000-8000-000000000102',
    'ua',
    'published',
    'Technology & Innovation',
    'Технології створюють цінність тоді, коли ми розуміємо, як їх застосувати.',
    'Technology & Innovation допомагає орієнтуватися у середовищі, де технології швидко змінюють ринки, професії та способи створення продуктів. Програми напряму поєднують технологічний контекст із бізнесом, економікою, управлінням і міжнародною співпрацею.',
    'Technology & Innovation | Програми Nobel ITBS',
    'Професійні програми про технології, інновації та нові індустрії для фахівців, менеджерів і підприємців.'
  ),
  (
    '00000000-0000-4000-8000-000000000102',
    'cz',
    'draft',
    'Technology & Innovation',
    'Technologie vytváří hodnotu, když rozumíme tomu, jak ji využít.',
    'Technology & Innovation pomáhá účastníkům orientovat se v prostředí, kde technologie rychle mění trhy, profese a vývoj produktů. Programy propojují technologický kontext s byznysem, ekonomikou, managementem a mezinárodní spoluprací.',
    'Programy Technology & Innovation | Nobel ITBS',
    'Profesní programy v oblasti technologií, inovací a nových odvětví pro specialisty, manažery a podnikatele.'
  ),
  (
    '00000000-0000-4000-8000-000000000103',
    'en',
    'published',
    'Psychology & Human',
    'Understanding people helps us act with greater care, professionalism, and responsibility.',
    'Psychology & Human considers people from different perspectives, from basic mental processes and age-related development to behavioural patterns, inner states, and the capacity for self-regulation. Completing an individual programme is not equivalent to qualifying as a psychologist, psychotherapist, or medical professional.',
    'Psychology & Human Programmes | Nobel ITBS',
    'Programmes in psychology, human development, behaviour, and self-regulation for professional learning and deeper subject knowledge.'
  ),
  (
    '00000000-0000-4000-8000-000000000103',
    'ua',
    'published',
    'Psychology & Human',
    'Розуміння людини допомагає діяти уважніше, професійніше й відповідальніше.',
    'Psychology & Human розглядає людину в різних вимірах: від базових психічних процесів і вікового розвитку до поведінкових патернів, внутрішніх станів і здатності до саморегуляції. Завершення окремої програми не прирівнюється до отримання професії психолога, психотерапевта або медичного фахівця.',
    'Psychology & Human | Програми з психології Nobel ITBS',
    'Програми із психології, розвитку людини, поведінки та саморегуляції для професійного навчання й поглиблення знань.'
  ),
  (
    '00000000-0000-4000-8000-000000000103',
    'cz',
    'draft',
    'Psychology & Human',
    'Porozumění lidem nám pomáhá jednat ohleduplněji, profesionálněji a odpovědněji.',
    'Psychology & Human nahlíží na člověka z různých perspektiv, od základních psychických procesů a vývoje v jednotlivých věkových obdobích až po behaviorální vzorce, vnitřní stavy a schopnost seberegulace. Dokončení jednotlivého programu není rovnocenné získání kvalifikace psychologa, psychoterapeuta nebo zdravotnického pracovníka.',
    'Programy Psychology & Human | Nobel ITBS',
    'Programy v oblasti psychologie, lidského rozvoje, chování a seberegulace pro profesní vzdělávání a hlubší oborové znalosti.'
  )
on conflict (area_id, language_code) do update
set
  translation_status = excluded.translation_status,
  title = excluded.title,
  short_description = excluded.short_description,
  intro_content = excluded.intro_content,
  seo_title = excluded.seo_title,
  seo_description = excluded.seo_description;

alter table public.programme_areas enable row level security;
alter table public.programme_areas force row level security;
alter table public.programme_area_translations enable row level security;
alter table public.programme_area_translations force row level security;

revoke all on table public.programme_areas from public, anon, authenticated;
revoke all on table public.programme_area_translations from public, anon, authenticated;

grant select on table public.programme_areas to anon;
grant select on table public.programme_area_translations to anon;
grant select, insert, update, delete on table public.programme_areas to authenticated;
grant select, insert, update, delete on table public.programme_area_translations to authenticated;
grant select, insert, update, delete on table public.programme_areas to postgres, service_role;
grant select, insert, update, delete on table public.programme_area_translations to postgres, service_role;
grant usage on type public.record_status to anon, authenticated, service_role;

create policy programme_areas_public_read
on public.programme_areas
for select
to anon
using (status = 'published');

create policy programme_areas_reference_read
on public.programme_areas
for select
to authenticated
using (
  status = 'published'
  and internal.is_active_admin()
);

create policy programme_areas_content_read
on public.programme_areas
for select
to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programme_areas_content_insert
on public.programme_areas
for insert
to authenticated
with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programme_areas_content_update
on public.programme_areas
for update
to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]))
with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programme_areas_content_delete
on public.programme_areas
for delete
to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programme_area_translations_public_read
on public.programme_area_translations
for select
to anon
using (
  translation_status = 'published'
  and exists (
    select 1
    from public.programme_areas area_record
    where area_record.id = area_id
      and area_record.status = 'published'
  )
);

create policy programme_area_translations_reference_read
on public.programme_area_translations
for select
to authenticated
using (
  translation_status = 'published'
  and internal.is_active_admin()
  and exists (
    select 1
    from public.programme_areas area_record
    where area_record.id = area_id
      and area_record.status = 'published'
  )
);

create policy programme_area_translations_content_read
on public.programme_area_translations
for select
to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programme_area_translations_content_insert
on public.programme_area_translations
for insert
to authenticated
with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programme_area_translations_content_update
on public.programme_area_translations
for update
to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]))
with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy programme_area_translations_content_delete
on public.programme_area_translations
for delete
to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));
