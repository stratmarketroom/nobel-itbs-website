begin;

select plan(8);

select has_function(
  'public',
  'create_admin_profile',
  array['uuid', 'text', 'public.app_role[]'],
  'create_admin_profile RPC exists'
);

select has_function(
  'public',
  'update_admin_profile',
  array['uuid', 'text', 'boolean', 'boolean', 'boolean', 'boolean', 'boolean'],
  'update_admin_profile RPC exists'
);

select has_function(
  'public',
  'assign_admin_roles',
  array['uuid', 'public.app_role[]'],
  'assign_admin_roles RPC exists'
);

select has_function(
  'public',
  'remove_admin_roles',
  array['uuid', 'public.app_role[]'],
  'remove_admin_roles RPC exists'
);

select function_privs_are(
  'public',
  'create_admin_profile',
  array['uuid', 'text', 'public.app_role[]'],
  'anon',
  array[]::text[],
  'anonymous users cannot call create_admin_profile'
);

select function_privs_are(
  'public',
  'assign_admin_roles',
  array['uuid', 'public.app_role[]'],
  'anon',
  array[]::text[],
  'anonymous users cannot call assign_admin_roles'
);

select function_privs_are(
  'public',
  'update_admin_profile',
  array['uuid', 'text', 'boolean', 'boolean', 'boolean', 'boolean', 'boolean'],
  'authenticated',
  array['EXECUTE'],
  'authenticated users can call update_admin_profile'
);

select function_privs_are(
  'public',
  'remove_admin_roles',
  array['uuid', 'public.app_role[]'],
  'authenticated',
  array['EXECUTE'],
  'authenticated users can call remove_admin_roles'
);

select * from finish();

rollback;
