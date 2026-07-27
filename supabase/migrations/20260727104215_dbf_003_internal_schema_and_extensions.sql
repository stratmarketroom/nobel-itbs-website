-- DBF-003: Internal Schema and Extensions
-- Foundation-only migration. Do not add business tables in this ticket.

create schema if not exists extensions;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;
create extension if not exists pg_trgm with schema extensions;

create schema if not exists internal;

comment on schema internal is
  'Private application schema for helper functions and security/audit internals.';

revoke all on schema internal from public, anon, authenticated;
grant usage on schema internal to postgres, service_role;

create or replace function internal.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function internal.set_updated_at() is
  'Shared trigger helper for mutable tables with an updated_at column.';

revoke all on function internal.set_updated_at() from public, anon, authenticated;
grant execute on function internal.set_updated_at() to postgres, service_role;

revoke create on schema public from public;

alter default privileges for role postgres in schema internal
  revoke all on tables from public, anon, authenticated;

alter default privileges for role postgres in schema internal
  revoke all on sequences from public, anon, authenticated;

alter default privileges for role postgres in schema internal
  revoke execute on functions from public, anon, authenticated;

alter default privileges for role postgres in schema public
  revoke all on tables from public, anon, authenticated;

alter default privileges for role postgres in schema public
  revoke all on sequences from public, anon, authenticated;

alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
