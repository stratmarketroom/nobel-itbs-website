-- CNT-002: Structured Content Pages
-- Controlled page identities, localized structured sections, RLS, and audit history.

create table public.content_pages (
  id uuid primary key default extensions.gen_random_uuid(),
  page_key text not null unique,
  page_type text not null,
  status public.record_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_pages_key_format check (page_key ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  constraint content_pages_type_not_blank check (btrim(page_type) <> '')
);

create table public.content_page_translations (
  page_id uuid not null references public.content_pages(id) on delete cascade,
  language_code text not null references public.languages(code) on delete restrict,
  translation_status public.translation_status not null default 'missing',
  seo_title text null,
  seo_description text null,
  h1 text null,
  sections jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (page_id, language_code),
  constraint content_page_translations_sections_object check (jsonb_typeof(sections) = 'object'),
  constraint content_page_translations_published_complete check (
    translation_status <> 'published'
    or (
      seo_title is not null and btrim(seo_title) <> ''
      and seo_description is not null and btrim(seo_description) <> ''
      and h1 is not null and btrim(h1) <> ''
      and sections <> '{}'::jsonb
    )
  )
);

create index content_page_translations_language_status_idx
  on public.content_page_translations (language_code, translation_status);

create trigger content_pages_set_updated_at
before update on public.content_pages
for each row execute function internal.set_updated_at();

create trigger content_page_translations_set_updated_at
before update on public.content_page_translations
for each row execute function internal.set_updated_at();

insert into public.content_pages (id, page_key, page_type, status)
values
  ('00000000-0000-4000-8000-000000000201', 'home', 'home', 'draft'),
  ('00000000-0000-4000-8000-000000000202', 'about', 'editorial', 'draft'),
  ('00000000-0000-4000-8000-000000000203', 'partnerships', 'partnerships', 'draft'),
  ('00000000-0000-4000-8000-000000000204', 'for_organisations', 'b2b', 'draft')
on conflict (page_key) do update set page_type = excluded.page_type;

insert into public.content_page_translations (page_id, language_code, translation_status)
select page_record.id, language_record.code, 'missing'::public.translation_status
from public.content_pages page_record
cross join public.languages language_record
where page_record.page_key in ('home', 'about', 'partnerships', 'for_organisations')
on conflict (page_id, language_code) do nothing;

alter table public.content_pages enable row level security;
alter table public.content_pages force row level security;
alter table public.content_page_translations enable row level security;
alter table public.content_page_translations force row level security;

revoke all on table public.content_pages from public, anon, authenticated;
revoke all on table public.content_page_translations from public, anon, authenticated;
grant select on table public.content_pages, public.content_page_translations to anon;
grant select, insert, update, delete on table public.content_pages, public.content_page_translations to authenticated;
grant select, insert, update, delete on table public.content_pages, public.content_page_translations to postgres, service_role;

create policy content_pages_public_read on public.content_pages
for select to anon using (status = 'published');

create policy content_pages_content_read on public.content_pages
for select to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy content_pages_content_insert on public.content_pages
for insert to authenticated
with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy content_pages_content_update on public.content_pages
for update to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]))
with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy content_pages_content_delete on public.content_pages
for delete to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy content_page_translations_public_read on public.content_page_translations
for select to anon
using (
  translation_status = 'published'
  and exists (
    select 1 from public.content_pages page_record
    where page_record.id = page_id and page_record.status = 'published'
  )
);

create policy content_page_translations_content_read on public.content_page_translations
for select to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy content_page_translations_content_insert on public.content_page_translations
for insert to authenticated
with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy content_page_translations_content_update on public.content_page_translations
for update to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]))
with check (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create policy content_page_translations_content_delete on public.content_page_translations
for delete to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create or replace function internal.audit_content_translation_change()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  target_page_id uuid;
  target_language text;
begin
  if tg_op = 'DELETE' then
    target_page_id := old.page_id;
    target_language := old.language_code;
  else
    target_page_id := new.page_id;
    target_language := new.language_code;
  end if;

  perform internal.write_audit_log(
    p_action => 'content_page.translation_' || lower(tg_op),
    p_actor_id => auth.uid(),
    p_target_schema => 'public',
    p_target_table => 'content_page_translations',
    p_target_id => target_page_id,
    p_metadata => jsonb_build_object('language_code', target_language)
  );
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function internal.audit_content_translation_change() from public, anon, authenticated;
grant execute on function internal.audit_content_translation_change() to authenticated, postgres, service_role;

create trigger content_page_translations_audit_change
after insert or update or delete on public.content_page_translations
for each row execute function internal.audit_content_translation_change();
