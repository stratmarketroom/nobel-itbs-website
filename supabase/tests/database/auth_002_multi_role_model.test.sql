begin;

select plan(10);

select has_type('public', 'app_role', 'app_role enum should exist');
select has_table('public', 'user_roles', 'user_roles table should exist');
select col_is_pk(
  'public',
  'user_roles',
  array['user_id', 'role'],
  'user_roles should allow multiple roles per user through a composite key'
);

select has_column('public', 'user_roles', 'user_id', 'user_roles.user_id should exist');
select has_column('public', 'user_roles', 'role', 'user_roles.role should exist');
select has_column('public', 'user_roles', 'assigned_by', 'user_roles.assigned_by should exist');
select has_column('public', 'user_roles', 'assigned_at', 'user_roles.assigned_at should exist');

select has_index('public', 'user_roles', 'user_roles_role_idx', 'user_roles.role index should exist');
select has_index('public', 'user_roles', 'user_roles_assigned_by_idx', 'user_roles.assigned_by index should exist');

select has_trigger(
  'public',
  'user_roles',
  'user_roles_audit_changes',
  'user_roles should audit role assignment changes'
);

select * from finish();

rollback;
