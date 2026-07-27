begin;

select plan(8);

select has_function(
  'internal',
  'role_requires_mfa',
  array['app_role']::name[],
  'internal.role_requires_mfa should exist'
);

select has_function(
  'internal',
  'current_user_requires_mfa',
  array[]::name[],
  'internal.current_user_requires_mfa should exist'
);

select has_function(
  'internal',
  'assert_mfa_requirement_satisfied',
  array[]::name[],
  'internal.assert_mfa_requirement_satisfied should exist'
);

select has_function(
  'internal',
  'assert_sensitive_action_allowed',
  array['app_role[]', 'text']::name[],
  'internal.assert_sensitive_action_allowed should exist'
);

select has_function(
  'internal',
  'enforce_user_profiles_mfa_rules',
  array[]::name[],
  'internal.enforce_user_profiles_mfa_rules should exist'
);

select has_function(
  'internal',
  'enforce_user_roles_mfa_rules',
  array[]::name[],
  'internal.enforce_user_roles_mfa_rules should exist'
);

select has_trigger(
  'public',
  'user_profiles',
  'user_profiles_enforce_mfa_rules',
  'user_profiles should enforce MFA-required profile rules'
);

select has_trigger(
  'public',
  'user_roles',
  'user_roles_enforce_mfa_rules',
  'user_roles should enforce MFA-required role rules'
);

select * from finish();

rollback;
