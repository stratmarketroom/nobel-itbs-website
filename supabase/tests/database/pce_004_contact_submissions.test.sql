begin;

select plan(12);

select enum_has_labels(
  'public',
  'contact_submission_status',
  array['new', 'processed', 'archived'],
  'contact submission statuses should remain limited to the approved Release 1 workflow'
);

select has_index(
  'public',
  'contact_submissions',
  'contact_submissions_type_created_idx',
  'contact submissions should support type and recency filtering'
);

select has_trigger(
  'public',
  'contact_submissions',
  'contact_submissions_audit_status_change',
  'status changes should be audited'
);

select policies_are(
  'public',
  'contact_submissions',
  array['contact_submissions_authorized_read', 'contact_submissions_authorized_update'],
  'contact submissions should expose only authorized read and status-update policies'
);

select results_eq(
  $$ select has_table_privilege('anon', 'public.contact_submissions', 'select') $$,
  $$ values (false) $$,
  'anonymous users must not read submissions'
);

select results_eq(
  $$ select has_table_privilege('anon', 'public.contact_submissions', 'update') $$,
  $$ values (false) $$,
  'anonymous users must not update submissions'
);

select results_eq(
  $$ select has_column_privilege('authenticated', 'public.contact_submissions', 'status', 'update') $$,
  $$ values (true) $$,
  'authenticated admins should receive status update privilege subject to RLS'
);

select results_eq(
  $$ select has_column_privilege('authenticated', 'public.contact_submissions', 'name', 'update') $$,
  $$ values (false) $$,
  'admin browser sessions must not change submitted names'
);

select results_eq(
  $$ select has_column_privilege('authenticated', 'public.contact_submissions', 'email', 'update') $$,
  $$ values (false) $$,
  'admin browser sessions must not change submitted emails'
);

select results_eq(
  $$ select has_column_privilege('authenticated', 'public.contact_submissions', 'message', 'update') $$,
  $$ values (false) $$,
  'admin browser sessions must not change submitted messages'
);

select results_eq(
  $$ select count(*)::bigint
     from pg_policies
     where schemaname = 'public'
       and tablename = 'contact_submissions'
       and policyname = 'contact_submissions_authorized_update'
       and coalesce(qual, '') like '%owner%'
       and coalesce(qual, '') like '%super_admin%'
       and coalesce(qual, '') like '%credential_manager%'
       and coalesce(qual, '') not like '%content_manager%'
       and coalesce(qual, '') like '%is_mfa_requirement_satisfied%' $$,
  $$ values (1::bigint) $$,
  'update policy should require an approved role and satisfied MFA without Content Manager access'
);

select results_eq(
  $$ select count(*)::bigint
     from information_schema.role_column_grants
     where table_schema = 'public'
       and table_name = 'contact_submissions'
       and grantee = 'authenticated'
       and privilege_type = 'UPDATE' $$,
  $$ values (1::bigint) $$,
  'authenticated browser sessions should receive update privilege for the status column only'
);

select * from finish();

rollback;
