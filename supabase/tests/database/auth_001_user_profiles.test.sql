begin;

select plan(11);

select has_table('public', 'user_profiles', 'user_profiles table should exist');
select col_is_pk('public', 'user_profiles', 'id', 'user_profiles.id should be the primary key');
select has_column('public', 'user_profiles', 'full_name', 'user_profiles.full_name should exist');
select has_column('public', 'user_profiles', 'is_active', 'user_profiles.is_active should exist');
select has_column('public', 'user_profiles', 'is_owner', 'user_profiles.is_owner should exist');
select has_column('public', 'user_profiles', 'mfa_required', 'user_profiles.mfa_required should exist');
select has_column('public', 'user_profiles', 'created_at', 'user_profiles.created_at should exist');
select has_column('public', 'user_profiles', 'updated_at', 'user_profiles.updated_at should exist');

select has_index(
  'public',
  'user_profiles',
  'user_profiles_one_active_owner_idx',
  'user_profiles should enforce only one active Owner'
);

select has_trigger(
  'public',
  'user_profiles',
  'user_profiles_set_updated_at',
  'user_profiles should maintain updated_at'
);

select has_trigger(
  'public',
  'user_profiles',
  'user_profiles_audit_changes',
  'user_profiles should audit create/update events'
);

select * from finish();

rollback;
