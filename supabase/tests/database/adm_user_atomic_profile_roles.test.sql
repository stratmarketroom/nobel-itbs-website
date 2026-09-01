begin;

select plan(22);

select has_function(
  'public',
  'update_admin_user_atomic',
  array['uuid', 'text', 'boolean', 'boolean', 'public.app_role[]'],
  'atomic admin-user update function should exist'
);

select results_eq(
  $$ select prosecdef from pg_proc where oid = 'public.update_admin_user_atomic(uuid,text,boolean,boolean,public.app_role[])'::regprocedure $$,
  $$ values (true) $$,
  'atomic admin-user update should be SECURITY DEFINER'
);

select results_eq(
  $$ select proconfig @> array['search_path=internal, public, pg_temp'] from pg_proc where oid = 'public.update_admin_user_atomic(uuid,text,boolean,boolean,public.app_role[])'::regprocedure $$,
  $$ values (true) $$,
  'atomic admin-user update should use a fixed search path'
);

select results_eq(
  $$ select has_function_privilege('authenticated', 'public.update_admin_user_atomic(uuid,text,boolean,boolean,public.app_role[])', 'execute') $$,
  $$ values (true) $$,
  'authenticated admins can reach the protected atomic workflow'
);

select results_eq(
  $$ select has_function_privilege('anon', 'public.update_admin_user_atomic(uuid,text,boolean,boolean,public.app_role[])', 'execute') $$,
  $$ values (false) $$,
  'anonymous users cannot call the atomic workflow'
);

select results_eq(
  $$ select has_function_privilege('public', 'public.update_admin_user_atomic(uuid,text,boolean,boolean,public.app_role[])', 'execute') $$,
  $$ values (false) $$,
  'PUBLIC has no implicit atomic workflow access'
);

select results_eq(
  $delim$
    select prosrc like '%for update%'
      and prosrc like '%assert_sensitive_action_allowed%'
      and prosrc like '%delete from public.user_roles%'
      and prosrc like '%insert into public.user_roles%'
    from pg_proc
    where oid = 'public.update_admin_user_atomic(uuid,text,boolean,boolean,public.app_role[])'::regprocedure
  $delim$,
  $$ values (true) $$,
  'atomic workflow should lock the profile, enforce role/MFA policy, and replace the role set'
);

select results_eq(
  $delim$
    select count(*)::bigint
    from pg_proc
    where oid in (
      'public.assign_admin_roles(uuid,public.app_role[])'::regprocedure,
      'public.remove_admin_roles(uuid,public.app_role[])'::regprocedure
    )
      and prosrc like '%for update%'
  $delim$,
  $$ values (2::bigint) $$,
  'legacy role-only workflows should serialize on the same profile row'
);

create temporary table adm_user_atomic_owner_fixture (
  id uuid primary key
) on commit drop;

grant select on table adm_user_atomic_owner_fixture to authenticated;

insert into adm_user_atomic_owner_fixture (id)
select profile.id
from public.user_profiles profile
join public.user_roles role_assignment on role_assignment.user_id = profile.id
where profile.is_active
  and profile.is_owner
  and profile.mfa_required
  and role_assignment.role = 'owner'::public.app_role
limit 1;

insert into auth.users (id)
select '55555555-5555-4555-8555-555555555551'
where not exists (select 1 from adm_user_atomic_owner_fixture);

insert into auth.users (id)
values
  ('55555555-5555-4555-8555-555555555552'),
  ('55555555-5555-4555-8555-555555555553'),
  ('55555555-5555-4555-8555-555555555554');

insert into public.user_profiles (id, full_name, is_active, is_owner, mfa_required)
select '55555555-5555-4555-8555-555555555551', 'ADM atomic Owner', true, true, true
where not exists (select 1 from adm_user_atomic_owner_fixture);

insert into adm_user_atomic_owner_fixture (id)
select '55555555-5555-4555-8555-555555555551'
where not exists (select 1 from adm_user_atomic_owner_fixture);

insert into public.user_roles (user_id, role)
select fixture.id, 'owner'::public.app_role
from adm_user_atomic_owner_fixture fixture
where not exists (
  select 1
  from public.user_roles role_assignment
  where role_assignment.user_id = fixture.id
    and role_assignment.role = 'owner'::public.app_role
);

insert into public.user_profiles (id, full_name, is_active, is_owner, mfa_required)
values
  ('55555555-5555-4555-8555-555555555552', 'Atomic target before', true, false, false),
  ('55555555-5555-4555-8555-555555555553', 'Atomic Super Admin', true, false, true),
  ('55555555-5555-4555-8555-555555555554', 'Atomic Content Manager', true, false, false);

insert into public.user_roles (user_id, role)
values
  ('55555555-5555-4555-8555-555555555552', 'content_manager'),
  ('55555555-5555-4555-8555-555555555554', 'content_manager');

select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', (select id::text from adm_user_atomic_owner_fixture),
    'aal', 'aal2',
    'role', 'authenticated'
  )::text,
  true
);

insert into public.user_roles (user_id, role, assigned_by)
select
  '55555555-5555-4555-8555-555555555553',
  'super_admin'::public.app_role,
  fixture.id
from adm_user_atomic_owner_fixture fixture;

set local role authenticated;

select lives_ok(
  $$
    select public.update_admin_user_atomic(
      '55555555-5555-4555-8555-555555555552',
      '  Atomic target after  ',
      false,
      false,
      array['content_manager'::public.app_role, 'credential_manager'::public.app_role]
    )
  $$,
  'Owner with AAL2 should atomically update a normal profile and its exact role set'
);

reset role;

select results_eq(
  $$
    select full_name, is_active, mfa_required
    from public.user_profiles
    where id = '55555555-5555-4555-8555-555555555552'
  $$,
  $$ values ('Atomic target after'::text, false, true) $$,
  'profile values should be saved together and an MFA-required role should force MFA on'
);

select results_eq(
  $$
    select role::text
    from public.user_roles
    where user_id = '55555555-5555-4555-8555-555555555552'
    order by role
  $$,
  $$ values ('content_manager'::text), ('credential_manager'::text) $$,
  'the target should have exactly the requested roles'
);

select results_eq(
  $$
    select count(*)::bigint
    from public.audit_log
    where actor_id = (select id from adm_user_atomic_owner_fixture)
      and target_id = '55555555-5555-4555-8555-555555555552'
      and action in ('user_profile.updated', 'user_role.assigned', 'user_role.removed')
  $$,
  $$ values (2::bigint) $$,
  'the committed profile and role changes should retain their privacy-minimal audit events'
);

select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', (select id::text from adm_user_atomic_owner_fixture),
    'aal', 'aal2',
    'role', 'authenticated'
  )::text,
  true
);

set local role authenticated;

select lives_ok(
  $$
    select public.update_admin_user_atomic(
      '55555555-5555-4555-8555-555555555552',
      'Atomic target after',
      false,
      true,
      array['credential_manager'::public.app_role, 'content_manager'::public.app_role]
    )
  $$,
  'an unchanged retry with reordered roles should be idempotent'
);

reset role;

select results_eq(
  $$
    select count(*)::bigint
    from public.audit_log
    where actor_id = (select id from adm_user_atomic_owner_fixture)
      and target_id = '55555555-5555-4555-8555-555555555552'
      and action in ('user_profile.updated', 'user_role.assigned', 'user_role.removed')
  $$,
  $$ values (2::bigint) $$,
  'an unchanged retry should not add audit noise'
);

insert into public.user_roles (user_id, role, assigned_by)
select fixture.id, 'content_manager'::public.app_role, fixture.id
from adm_user_atomic_owner_fixture fixture
on conflict (user_id, role) do nothing;

select set_config(
  'request.jwt.claims',
  jsonb_build_object(
    'sub', (select id::text from adm_user_atomic_owner_fixture),
    'aal', 'aal2',
    'role', 'authenticated'
  )::text,
  true
);

set local role authenticated;

select throws_ok(
  $$
    select public.update_admin_user_atomic(
      (select id from adm_user_atomic_owner_fixture),
      'Atomic Owner',
      false,
      true,
      array['owner'::public.app_role]
    )
  $$,
  '23514',
  'At least one active Owner is required.',
  'a failed Owner deactivation should reject the whole atomic statement'
);

reset role;

select results_eq(
  $$
    select count(*)::bigint
    from public.user_roles
    where user_id = (select id from adm_user_atomic_owner_fixture)
      and role = 'content_manager'::public.app_role
  $$,
  $$ values (1::bigint) $$,
  'a failure after role deletion begins should roll the deleted role back'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"55555555-5555-4555-8555-555555555553","aal":"aal2","role":"authenticated"}',
  true
);

set local role authenticated;

select lives_ok(
  $$
    select public.update_admin_user_atomic(
      '55555555-5555-4555-8555-555555555552',
      'Updated by Super Admin',
      true,
      false,
      array['content_manager'::public.app_role]
    )
  $$,
  'Super Admin with AAL2 should manage a non-governed admin account'
);

select throws_ok(
  $$
    select public.update_admin_user_atomic(
      '55555555-5555-4555-8555-555555555553',
      'Atomic Super Admin',
      true,
      true,
      array['super_admin'::public.app_role]
    )
  $$,
  '42501',
  'Required role is missing for this action.',
  'Super Admin should not change a Super Admin account'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"55555555-5555-4555-8555-555555555553","aal":"aal1","role":"authenticated"}',
  true
);

select throws_ok(
  $$
    select public.update_admin_user_atomic(
      '55555555-5555-4555-8555-555555555552',
      'Forbidden AAL1 update',
      true,
      false,
      array['content_manager'::public.app_role]
    )
  $$,
  '42501',
  'MFA/AAL2 is required for this action.',
  'Super Admin at AAL1 should be denied the atomic update'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"55555555-5555-4555-8555-555555555554","aal":"aal2","role":"authenticated"}',
  true
);

select throws_ok(
  $$
    select public.update_admin_user_atomic(
      '55555555-5555-4555-8555-555555555552',
      'Forbidden Content Manager update',
      true,
      false,
      array['content_manager'::public.app_role]
    )
  $$,
  '42501',
  'Required role is missing for this action.',
  'Content Manager should be denied user management'
);

reset role;

select results_eq(
  $$
    select full_name
    from public.user_profiles
    where id = '55555555-5555-4555-8555-555555555552'
  $$,
  $$ values ('Updated by Super Admin'::text) $$,
  'denied calls should leave the last authorized profile state unchanged'
);

select results_eq(
  $$
    select role::text
    from public.user_roles
    where user_id = '55555555-5555-4555-8555-555555555552'
    order by role
  $$,
  $$ values ('content_manager'::text) $$,
  'denied calls should leave the last authorized role set unchanged'
);

select * from finish();

rollback;
