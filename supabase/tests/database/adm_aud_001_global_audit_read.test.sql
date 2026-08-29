begin;

select plan(15);

select results_eq(
  $$ select relrowsecurity, relforcerowsecurity from pg_class where oid = 'public.audit_log'::regclass $$,
  $$ values (true, true) $$,
  'audit_log should remain forced-RLS'
);

select results_eq(
  $$ select has_table_privilege('authenticated', 'public.audit_log', 'select') $$,
  $$ values (true) $$,
  'authenticated admins can reach the RLS-protected audit read boundary'
);

select results_eq(
  $$ select has_table_privilege('authenticated', 'public.audit_log', 'insert') $$,
  $$ values (false) $$,
  'authenticated users cannot insert audit entries directly'
);

select results_eq(
  $$ select has_table_privilege('authenticated', 'public.audit_log', 'update') $$,
  $$ values (false) $$,
  'authenticated users cannot update audit entries'
);

select results_eq(
  $$ select has_table_privilege('authenticated', 'public.audit_log', 'delete') $$,
  $$ values (false) $$,
  'authenticated users cannot delete audit entries'
);

select results_eq(
  $body$
    select count(*)::bigint
    from pg_policies
    where schemaname = 'public'
      and tablename = 'audit_log'
      and policyname = 'audit_log_owner_super_admin_read'
      and cmd = 'SELECT'
      and roles = array['authenticated']::name[]
      and qual like '%owner%super_admin%'
      and qual not like '%content_manager%'
      and qual not like '%credential_manager%'
      and qual like '%is_mfa_requirement_satisfied%'
  $body$,
  $$ values (1::bigint) $$,
  'audit read policy should be Owner/Super Admin-only and MFA-protected'
);

select results_eq(
  $$ select has_column_privilege('authenticated', 'public.user_profiles', 'id', 'select') $$,
  $$ values (true) $$,
  'audit viewers can read actor IDs'
);

select results_eq(
  $$ select has_column_privilege('authenticated', 'public.user_profiles', 'full_name', 'select') $$,
  $$ values (true) $$,
  'audit viewers can read actor display names'
);

select results_eq(
  $$ select has_column_privilege('authenticated', 'public.user_profiles', 'is_active', 'select') $$,
  $$ values (false) $$,
  'audit actor lookup does not broaden access to other profile columns'
);

create temporary table adm_aud_owner_fixture (
  id uuid primary key
) on commit drop;

grant select on table adm_aud_owner_fixture to authenticated;

insert into adm_aud_owner_fixture (id)
select profile.id
from public.user_profiles profile
join public.user_roles role_assignment on role_assignment.user_id = profile.id
where profile.is_active
  and profile.is_owner
  and profile.mfa_required
  and role_assignment.role = 'owner'::public.app_role
limit 1;

insert into auth.users (id)
values
  ('44444444-4444-4444-8444-444444444442'),
  ('44444444-4444-4444-8444-444444444443'),
  ('44444444-4444-4444-8444-444444444444');

insert into auth.users (id)
select '44444444-4444-4444-8444-444444444441'
where not exists (select 1 from adm_aud_owner_fixture);

insert into public.user_profiles (id, full_name, is_active, is_owner, mfa_required)
values
  ('44444444-4444-4444-8444-444444444442', 'ADM AUD Super Admin', true, false, true),
  ('44444444-4444-4444-8444-444444444443', 'ADM AUD Content Manager', true, false, false),
  ('44444444-4444-4444-8444-444444444444', 'ADM AUD Credential Manager', true, false, true);

insert into public.user_profiles (id, full_name, is_active, is_owner, mfa_required)
select '44444444-4444-4444-8444-444444444441', 'ADM AUD Owner', true, true, true
where not exists (select 1 from adm_aud_owner_fixture);

insert into adm_aud_owner_fixture (id)
select '44444444-4444-4444-8444-444444444441'
where not exists (select 1 from adm_aud_owner_fixture);

insert into public.user_roles (user_id, role)
select fixture.id, 'owner'::public.app_role
from adm_aud_owner_fixture fixture
where not exists (
  select 1 from public.user_roles role_assignment
  where role_assignment.user_id = fixture.id
    and role_assignment.role = 'owner'::public.app_role
);

select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', (select id::text from adm_aud_owner_fixture),
    'aal', 'aal2',
    'role', 'authenticated'
  )::text,
  true
);

insert into public.user_roles (user_id, role)
values
  ('44444444-4444-4444-8444-444444444442', 'super_admin'),
  ('44444444-4444-4444-8444-444444444443', 'content_manager'),
  ('44444444-4444-4444-8444-444444444444', 'credential_manager');

insert into public.audit_log (id, actor_id, action, target_schema, target_table, target_id, metadata)
select
  '44444444-4444-4444-9444-444444444441',
  fixture.id,
  'adm_aud_001.test',
  'public',
  'user_profiles',
  '44444444-4444-4444-8444-444444444442',
  '{"role":"super_admin","full_name_changed":false}'::jsonb
from adm_aud_owner_fixture fixture;

select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', (select id::text from adm_aud_owner_fixture),
    'aal', 'aal2',
    'role', 'authenticated'
  )::text,
  true
);
set local role authenticated;

select results_eq(
  $$ select count(*)::bigint from public.audit_log where id = '44444444-4444-4444-9444-444444444441' $$,
  $$ values (1::bigint) $$,
  'Owner with AAL2 can read the global audit log'
);

select results_eq(
  $$
    select count(*)::bigint
    from public.user_profiles
    where id = (select id from adm_aud_owner_fixture)
      and full_name is not null
  $$,
  $$ values (1::bigint) $$,
  'Owner with AAL2 can resolve an audit actor display name'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"44444444-4444-4444-8444-444444444442","aal":"aal2","role":"authenticated"}',
  true
);

select results_eq(
  $$ select count(*)::bigint from public.audit_log where id = '44444444-4444-4444-9444-444444444441' $$,
  $$ values (1::bigint) $$,
  'Super Admin with AAL2 can read the global audit log'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"44444444-4444-4444-8444-444444444443","aal":"aal2","role":"authenticated"}',
  true
);

select results_eq(
  $$ select count(*)::bigint from public.audit_log where id = '44444444-4444-4444-9444-444444444441' $$,
  $$ values (0::bigint) $$,
  'Content Manager cannot read the global audit log'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"44444444-4444-4444-8444-444444444444","aal":"aal2","role":"authenticated"}',
  true
);

select results_eq(
  $$ select count(*)::bigint from public.audit_log where id = '44444444-4444-4444-9444-444444444441' $$,
  $$ values (0::bigint) $$,
  'Credential Manager cannot read the global audit log'
);

select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', (select id::text from adm_aud_owner_fixture),
    'aal', 'aal1',
    'role', 'authenticated'
  )::text,
  true
);

select results_eq(
  $$ select count(*)::bigint from public.audit_log where id = '44444444-4444-4444-9444-444444444441' $$,
  $$ values (0::bigint) $$,
  'Owner at AAL1 cannot read the global audit log'
);

reset role;

select * from finish();

rollback;
