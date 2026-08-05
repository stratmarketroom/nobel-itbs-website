-- CNT-004: Site Settings

create table public.site_settings (
  setting_key text primary key,
  value_text text null,
  is_public boolean not null default false,
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint site_settings_key_format check (setting_key ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  constraint site_settings_description_not_blank check (btrim(description) <> ''),
  constraint site_settings_for_organisations_url check (
    setting_key <> 'for_organisations_application_url'
    or value_text is null
    or value_text ~ '^https://[^[:space:]]+$'
  )
);

create trigger site_settings_set_updated_at before update on public.site_settings
for each row execute function internal.set_updated_at();

insert into public.site_settings (setting_key, value_text, is_public, description)
values ('for_organisations_application_url', null, true, 'Dedicated Leeloo application URL for the For Organisations B2B page.')
on conflict (setting_key) do nothing;

alter table public.site_settings enable row level security;
alter table public.site_settings force row level security;
revoke all on table public.site_settings from public, anon, authenticated;
grant select on table public.site_settings to anon;
grant select, update on table public.site_settings to authenticated;
grant select, insert, update, delete on table public.site_settings to postgres, service_role;

create policy site_settings_public_read on public.site_settings
for select to anon using (is_public);

create policy site_settings_admin_read on public.site_settings
for select to authenticated
using (internal.has_any_role(array['owner', 'super_admin']::public.app_role[]));

create policy site_settings_admin_update on public.site_settings
for update to authenticated
using (
  internal.has_any_role(array['owner', 'super_admin']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
)
with check (
  internal.has_any_role(array['owner', 'super_admin']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);

create or replace function internal.audit_site_setting_change()
returns trigger language plpgsql security definer
set search_path = internal, public, pg_temp
as $$
begin
  if old.value_text is distinct from new.value_text then
    perform internal.write_audit_log(
      p_action => 'site_setting.updated', p_actor_id => auth.uid(),
      p_target_schema => 'public', p_target_table => 'site_settings',
      p_metadata => jsonb_build_object('setting_key', new.setting_key)
    );
  end if;
  return new;
end;
$$;
revoke all on function internal.audit_site_setting_change() from public, anon, authenticated;
grant execute on function internal.audit_site_setting_change() to authenticated, postgres, service_role;
create trigger site_settings_audit_change after update on public.site_settings
for each row execute function internal.audit_site_setting_change();

