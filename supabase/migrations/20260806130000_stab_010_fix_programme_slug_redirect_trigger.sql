-- STAB-010: Fix PRG-008 redirect capture for heterogeneous parent tables.
-- PostgreSQL RECORD fields must be accessed only inside the matching table branch.

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
  if tg_table_name = 'programmes' then
    redirect_entity_type := 'programme';
    was_published := old.publication_status = 'published';
  elsif tg_table_name = 'programme_areas' then
    redirect_entity_type := 'area';
    was_published := old.status = 'published';
  elsif tg_table_name = 'programme_types' then
    redirect_entity_type := 'type';
    was_published := old.status = 'published';
  else
    raise exception 'Unsupported programme namespace table: %', tg_table_name;
  end if;

  if old.slug is distinct from new.slug and was_published then
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
