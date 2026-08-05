-- PRG-008: Programme Slug Redirects
-- Reserve historical published slugs and resolve every old address directly to the current slug.

create table public.programme_slug_redirects (
  old_slug text primary key,
  new_slug text not null,
  entity_type text not null,
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  constraint programme_slug_redirects_old_slug_format check (
    old_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint programme_slug_redirects_new_slug_format check (
    new_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
  ),
  constraint programme_slug_redirects_entity_type check (
    entity_type in ('programme', 'area', 'type')
  ),
  constraint programme_slug_redirects_no_self_redirect check (old_slug <> new_slug)
);

comment on table public.programme_slug_redirects is
  'Historical published slugs in the shared /programmes namespace; each row points directly to an entity current slug.';
comment on column public.programme_slug_redirects.old_slug is
  'Permanently reserved historical slug; it cannot be reused by any programme namespace entity.';
comment on column public.programme_slug_redirects.new_slug is
  'Current final slug. Existing rows are collapsed when the same entity changes slug again.';

create index programme_slug_redirects_entity_idx
  on public.programme_slug_redirects (entity_type, entity_id);

alter table public.programme_slug_redirects enable row level security;
alter table public.programme_slug_redirects force row level security;

revoke all on table public.programme_slug_redirects from public, anon, authenticated;
grant select (old_slug, new_slug) on table public.programme_slug_redirects to anon;
grant select on table public.programme_slug_redirects to authenticated;
grant all on table public.programme_slug_redirects to service_role;

create policy programme_slug_redirects_public_read
on public.programme_slug_redirects
for select
to anon
using (
  (entity_type = 'programme' and exists (
    select 1 from public.programmes entity
    where entity.id = entity_id
      and entity.slug = new_slug
      and entity.publication_status = 'published'
  ))
  or (entity_type = 'area' and exists (
    select 1 from public.programme_areas entity
    where entity.id = entity_id
      and entity.slug = new_slug
      and entity.status = 'published'
  ))
  or (entity_type = 'type' and exists (
    select 1 from public.programme_types entity
    where entity.id = entity_id
      and entity.slug = new_slug
      and entity.status = 'published'
  ))
);

create policy programme_slug_redirects_content_read
on public.programme_slug_redirects
for select
to authenticated
using (internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[]));

create or replace function internal.assert_programme_slug_available(
  p_slug text,
  p_entity_type text,
  p_entity_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Serialize writes to the shared namespace so concurrent inserts in different
  -- tables cannot pass the collision checks at the same time.
  perform pg_advisory_xact_lock(hashtextextended('programme-shared-slug-namespace', 0));

  if exists (
    select 1 from public.programmes where slug = p_slug and (p_entity_type <> 'programme' or id <> p_entity_id)
    union all
    select 1 from public.programme_areas where slug = p_slug and (p_entity_type <> 'area' or id <> p_entity_id)
    union all
    select 1 from public.programme_types where slug = p_slug and (p_entity_type <> 'type' or id <> p_entity_id)
    union all
    select 1 from public.programme_slug_redirects where old_slug = p_slug
  ) then
    raise unique_violation using
      constraint = 'programme_shared_slug_unique',
      message = format('Programme namespace slug "%s" is already used.', p_slug);
  end if;
end;
$$;

comment on function internal.assert_programme_slug_available(text, text, uuid) is
  'Rejects active and historical slug collisions across programmes, programme areas, and programme types.';

revoke all on function internal.assert_programme_slug_available(text, text, uuid) from public;
grant execute on function internal.assert_programme_slug_available(text, text, uuid) to postgres, service_role;

create or replace function internal.capture_published_programme_slug_redirect()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  redirect_entity_type text;
  was_published boolean;
begin
  redirect_entity_type := case tg_table_name
    when 'programmes' then 'programme'
    when 'programme_areas' then 'area'
    when 'programme_types' then 'type'
    else null
  end;

  was_published := case tg_table_name
    when 'programmes' then old.publication_status = 'published'
    when 'programme_areas' then old.status = 'published'
    when 'programme_types' then old.status = 'published'
    else false
  end;

  if redirect_entity_type is null then
    raise exception 'Unsupported programme namespace table: %', tg_table_name;
  end if;

  if old.slug is distinct from new.slug and was_published then
    -- Point every older address for this entity straight to the latest slug.
    update public.programme_slug_redirects
    set new_slug = new.slug
    where entity_type = redirect_entity_type
      and entity_id = new.id;

    insert into public.programme_slug_redirects (
      old_slug,
      new_slug,
      entity_type,
      entity_id
    ) values (
      old.slug,
      new.slug,
      redirect_entity_type,
      new.id
    );
  end if;

  return new;
end;
$$;

comment on function internal.capture_published_programme_slug_redirect() is
  'Reserves a changed published slug and collapses all redirects for the entity to one hop.';

revoke all on function internal.capture_published_programme_slug_redirect() from public;
grant execute on function internal.capture_published_programme_slug_redirect() to postgres, service_role;

create trigger programmes_capture_slug_redirect
after update of slug on public.programmes
for each row execute function internal.capture_published_programme_slug_redirect();

create trigger programme_areas_capture_slug_redirect
after update of slug on public.programme_areas
for each row execute function internal.capture_published_programme_slug_redirect();

create trigger programme_types_capture_slug_redirect
after update of slug on public.programme_types
for each row execute function internal.capture_published_programme_slug_redirect();
