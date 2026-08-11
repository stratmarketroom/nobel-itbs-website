begin;

select plan(27);

select has_table('public', 'learner_emails', 'learner_emails table should exist');
select col_is_pk('public', 'learner_emails', 'id', 'learner_emails.id should be the primary key');
select has_column('public', 'learner_emails', 'learner_id', 'learner reference should exist');
select has_column('public', 'learner_emails', 'email', 'email should exist');
select has_column('public', 'learner_emails', 'is_primary', 'primary flag should exist');
select has_column('public', 'learner_emails', 'created_at', 'created timestamp should exist');
select has_column('public', 'learner_emails', 'updated_at', 'updated timestamp should exist');
select col_not_null('public', 'learner_emails', 'learner_id', 'learner reference should be required');
select col_not_null('public', 'learner_emails', 'email', 'email should be required');
select col_not_null('public', 'learner_emails', 'is_primary', 'primary flag should be required');

select results_eq(
  $$ select udt_schema || '.' || udt_name
     from information_schema.columns
     where table_schema = 'public' and table_name = 'learner_emails' and column_name = 'email' $$,
  $$ values ('extensions.citext'::text) $$,
  'email should use case-insensitive citext'
);

select results_eq(
  $$ select column_default
     from information_schema.columns
     where table_schema = 'public' and table_name = 'learner_emails' and column_name = 'is_primary' $$,
  $$ values ('false'::text) $$,
  'primary flag should default to false'
);

select results_eq(
  $$ select count(*)::bigint
     from pg_constraint
     where conrelid = 'public.learner_emails'::regclass
       and contype = 'f'
       and confrelid = 'public.learners'::regclass $$,
  $$ values (1::bigint) $$,
  'learner email should reference learners'
);

select results_eq(
  $$ select count(*)::bigint
     from pg_constraint
     where conrelid = 'public.learner_emails'::regclass
       and contype = 'u' $$,
  $$ values (1::bigint) $$,
  'email should have one global unique constraint'
);

select has_index('public', 'learner_emails', 'learner_emails_learner_id_idx', 'learner lookup index should exist');
select has_index('public', 'learner_emails', 'learner_emails_one_primary_idx', 'one-primary partial index should exist');
select has_trigger('public', 'learner_emails', 'learner_emails_set_updated_at', 'learner emails should maintain updated_at');

select is(
  (select relrowsecurity from pg_class where oid = 'public.learner_emails'::regclass),
  true,
  'learner emails should have RLS enabled'
);

select is(
  (select relforcerowsecurity from pg_class where oid = 'public.learner_emails'::regclass),
  true,
  'learner emails should force RLS'
);

select policies_are(
  'public',
  'learner_emails',
  array[
    'learner_emails_authorized_delete',
    'learner_emails_authorized_insert',
    'learner_emails_authorized_read',
    'learner_emails_authorized_update'
  ],
  'learner emails should expose only authorized CRUD policies'
);

select results_eq(
  $$ select has_table_privilege('anon', 'public.learner_emails', 'select') $$,
  $$ values (false) $$,
  'anonymous users must not read learner emails'
);

select results_eq(
  $$ select has_table_privilege('authenticated', 'public.learner_emails', 'select') $$,
  $$ values (true) $$,
  'authenticated admins receive select privilege subject to RLS'
);

select results_eq(
  $$ select has_column_privilege('authenticated', 'public.learner_emails', 'email', 'insert') $$,
  $$ values (true) $$,
  'authenticated admins may insert controlled email fields subject to RLS'
);

select results_eq(
  $$ select has_column_privilege('authenticated', 'public.learner_emails', 'id', 'insert') $$,
  $$ values (false) $$,
  'authenticated admins cannot supply internal email IDs'
);

select results_eq(
  $$ select has_column_privilege('authenticated', 'public.learner_emails', 'learner_id', 'update') $$,
  $$ values (false) $$,
  'authenticated admins cannot move an email between learners'
);

select results_eq(
  $$ select has_table_privilege('authenticated', 'public.learner_emails', 'delete') $$,
  $$ values (true) $$,
  'authorized admins may remove learner email entries subject to RLS'
);

select results_eq(
  $$ select count(*)::bigint
     from pg_policies
     where schemaname = 'public'
       and tablename = 'learner_emails'
       and coalesce(qual, with_check, '') like '%owner%'
       and coalesce(qual, with_check, '') like '%super_admin%'
       and coalesce(qual, with_check, '') like '%credential_manager%'
       and coalesce(qual, with_check, '') not like '%content_manager%'
       and coalesce(qual, with_check, '') like '%is_mfa_requirement_satisfied%' $$,
  $$ values (4::bigint) $$,
  'every email policy should require an approved role and satisfied MFA without Content Manager access'
);

select * from finish();

rollback;
