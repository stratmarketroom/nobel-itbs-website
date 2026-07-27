begin;

select plan(6);

select has_function(
  'internal',
  'has_role',
  array['app_role']::name[],
  'internal.has_role should exist'
);

select has_function(
  'internal',
  'has_any_role',
  array['app_role[]']::name[],
  'internal.has_any_role should exist'
);

select has_function(
  'internal',
  'is_owner',
  array[]::name[],
  'internal.is_owner should exist'
);

select has_function(
  'internal',
  'is_active_admin',
  array[]::name[],
  'internal.is_active_admin should exist'
);

select has_function(
  'internal',
  'has_mfa_aal',
  array[]::name[],
  'internal.has_mfa_aal should exist'
);

select has_function(
  'internal',
  'is_mfa_requirement_satisfied',
  array[]::name[],
  'internal.is_mfa_requirement_satisfied should exist'
);

select * from finish();

rollback;
