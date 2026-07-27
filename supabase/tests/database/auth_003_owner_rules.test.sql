begin;

select plan(5);

select has_function(
  'internal',
  'enforce_user_profiles_owner_rules',
  array[]::name[],
  'internal.enforce_user_profiles_owner_rules should exist'
);

select has_function(
  'internal',
  'enforce_user_roles_owner_rules',
  array[]::name[],
  'internal.enforce_user_roles_owner_rules should exist'
);

select has_trigger(
  'public',
  'user_profiles',
  'user_profiles_enforce_owner_rules',
  'user_profiles should enforce Owner profile rules'
);

select has_trigger(
  'public',
  'user_roles',
  'user_roles_enforce_owner_rules',
  'user_roles should enforce Owner-only role governance'
);

select has_index(
  'public',
  'user_roles',
  'user_roles_one_owner_role_idx',
  'user_roles should enforce a single Owner role assignment'
);

select * from finish();

rollback;
