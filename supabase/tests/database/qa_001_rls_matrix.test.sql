begin;

select plan(38);

-- QA-001 is the aggregate Release 1 authorization contract. Focused ticket tests
-- continue to verify row shapes and workflows; this suite guards the complete
-- table/role boundary in one place.

select results_eq(
  $$
    select c.relname::text
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r'
    order by c.relname
  $$,
  $$ values
    ('audit_log'),
    ('contact_submissions'),
    ('content_page_translations'),
    ('content_pages'),
    ('credential_email_sends'),
    ('credential_file_types'),
    ('credential_files'),
    ('credential_history'),
    ('credential_notes'),
    ('credential_sets'),
    ('credential_type_translations'),
    ('credential_types'),
    ('credentials'),
    ('document_number_log'),
    ('email_templates'),
    ('expert_translations'),
    ('experts'),
    ('languages'),
    ('learner_emails'),
    ('learner_phones'),
    ('learners'),
    ('partner_translations'),
    ('partners'),
    ('programme_area_translations'),
    ('programme_areas'),
    ('programme_pricing_option_translations'),
    ('programme_pricing_options'),
    ('programme_runs'),
    ('programme_slug_redirects'),
    ('programme_translations'),
    ('programme_type_translations'),
    ('programme_types'),
    ('programmes'),
    ('site_settings'),
    ('user_profiles'),
    ('user_roles')
  $$,
  'the protected public table inventory should remain explicit'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
  $$,
  $$ values (36::bigint) $$,
  'every public table should enable RLS'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'r' and c.relforcerowsecurity
  $$,
  $$ values (36::bigint) $$,
  'every public table should force RLS'
);

select results_eq(
  $$
    select c.relname::text
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and (
        has_table_privilege('anon', c.oid, 'select')
        or has_any_column_privilege('anon', c.oid, 'select')
      )
    order by c.relname
  $$,
  $$ values
    ('content_page_translations'),
    ('content_pages'),
    ('expert_translations'),
    ('experts'),
    ('languages'),
    ('partner_translations'),
    ('partners'),
    ('programme_area_translations'),
    ('programme_areas'),
    ('programme_pricing_option_translations'),
    ('programme_pricing_options'),
    ('programme_runs'),
    ('programme_slug_redirects'),
    ('programme_translations'),
    ('programme_type_translations'),
    ('programme_types'),
    ('programmes'),
    ('site_settings')
  $$,
  'anonymous SELECT grants should be limited to approved public catalogue/content tables'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and (
        has_table_privilege('anon', c.oid, 'insert')
        or has_any_column_privilege('anon', c.oid, 'insert')
        or has_table_privilege('anon', c.oid, 'update')
        or has_any_column_privilege('anon', c.oid, 'update')
        or has_table_privilege('anon', c.oid, 'delete')
      )
  $$,
  $$ values (0::bigint) $$,
  'anonymous users should not mutate public-schema tables directly'
);

select results_eq(
  $$
    select c.relname::text
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and has_table_privilege('authenticated', c.oid, 'select')
      and c.relname in (
        'contact_submissions', 'credential_email_sends', 'credential_file_types',
        'credential_files', 'credential_history', 'credential_notes', 'credential_sets',
        'credential_type_translations', 'credential_types', 'credentials',
        'document_number_log', 'email_templates', 'learner_emails', 'learner_phones',
        'learners'
      )
    order by c.relname
  $$,
  $$ values
    ('contact_submissions'),
    ('credential_email_sends'),
    ('credential_file_types'),
    ('credential_files'),
    ('credential_history'),
    ('credential_notes'),
    ('credential_sets'),
    ('credential_type_translations'),
    ('credential_types'),
    ('credentials'),
    ('document_number_log'),
    ('email_templates'),
    ('learner_emails'),
    ('learner_phones'),
    ('learners')
  $$,
  'authenticated operational reads should be granted only through RLS-protected tables'
);

select results_eq(
  $$
    select count(*)::bigint
    from unnest(array[
      'audit_log', 'credentials', 'document_number_log', 'credential_files',
      'credential_history', 'credential_notes', 'email_templates',
      'credential_email_sends'
    ]) as protected_table(name)
    where has_table_privilege('authenticated', format('public.%I', protected_table.name), 'insert')
      or has_table_privilege('authenticated', format('public.%I', protected_table.name), 'update')
      or has_table_privilege('authenticated', format('public.%I', protected_table.name), 'delete')
  $$,
  $$ values (0::bigint) $$,
  'append-only and controlled workflow tables should reject direct authenticated mutation'
);

select results_eq(
  $$
    select count(*)::bigint
    from unnest(array['audit_log', 'user_profiles', 'user_roles']) as controlled_table(name)
    where has_table_privilege('authenticated', format('public.%I', controlled_table.name), 'select')
      or has_table_privilege('authenticated', format('public.%I', controlled_table.name), 'insert')
      or has_table_privilege('authenticated', format('public.%I', controlled_table.name), 'update')
      or has_table_privilege('authenticated', format('public.%I', controlled_table.name), 'delete')
  $$,
  $$ values (0::bigint) $$,
  'identity and audit tables should expose no direct authenticated table privileges'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'contact_submissions', 'credential_email_sends', 'credential_file_types',
        'credential_files', 'credential_history', 'credential_notes', 'credential_sets',
        'credential_type_translations', 'credential_types', 'credentials',
        'document_number_log', 'email_templates', 'learner_emails', 'learner_phones',
        'learners'
      )
      and (coalesce(qual, '') || coalesce(with_check, '')) like '%content_manager%'
  $$,
  $$ values (0::bigint) $$,
  'Content Manager must not appear in learner/contact/credential policies'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'contact_submissions', 'credential_email_sends', 'credential_file_types',
        'credential_files', 'credential_history', 'credential_notes', 'credential_sets',
        'credential_type_translations', 'credential_types', 'credentials',
        'document_number_log', 'email_templates', 'learner_emails', 'learner_phones',
        'learners'
      )
      and (coalesce(qual, '') || coalesce(with_check, '')) not like '%is_mfa_requirement_satisfied%'
  $$,
  $$ values (0::bigint) $$,
  'every learner/contact/credential policy should enforce MFA'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'programme_areas', 'programme_area_translations', 'programme_types',
        'programme_type_translations', 'programmes', 'programme_translations',
        'programme_runs', 'programme_pricing_options',
        'programme_pricing_option_translations', 'partners', 'partner_translations',
        'experts', 'expert_translations', 'content_pages', 'content_page_translations'
      )
      and cmd in ('INSERT', 'UPDATE', 'DELETE')
  $$,
  $$ values (45::bigint) $$,
  'all fifteen content-managed tables should expose the three approved mutation policies'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'programme_areas', 'programme_area_translations', 'programme_types',
        'programme_type_translations', 'programmes', 'programme_translations',
        'programme_runs', 'programme_pricing_options',
        'programme_pricing_option_translations', 'partners', 'partner_translations',
        'experts', 'expert_translations', 'content_pages', 'content_page_translations'
      )
      and cmd in ('INSERT', 'UPDATE', 'DELETE')
      and (
        (coalesce(qual, '') || coalesce(with_check, '')) not like '%owner%'
        or (coalesce(qual, '') || coalesce(with_check, '')) not like '%super_admin%'
        or (coalesce(qual, '') || coalesce(with_check, '')) not like '%content_manager%'
      )
  $$,
  $$ values (0::bigint) $$,
  'Owner, Super Admin, and Content Manager should be authorized by every content mutation policy'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'programme_areas', 'programme_area_translations', 'programme_types',
        'programme_type_translations', 'programmes', 'programme_translations',
        'programme_runs', 'programme_pricing_options',
        'programme_pricing_option_translations', 'partners', 'partner_translations',
        'experts', 'expert_translations', 'content_pages', 'content_page_translations'
      )
      and cmd in ('INSERT', 'UPDATE', 'DELETE')
      and (coalesce(qual, '') || coalesce(with_check, '')) like '%credential_manager%'
  $$,
  $$ values (0::bigint) $$,
  'Credential Manager must not mutate programmes or content'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_policies
    where schemaname = 'public'
      and tablename = 'site_settings'
      and policyname = 'site_settings_admin_update'
      and (coalesce(qual, '') || coalesce(with_check, '')) like '%owner%'
      and (coalesce(qual, '') || coalesce(with_check, '')) like '%super_admin%'
      and (coalesce(qual, '') || coalesce(with_check, '')) like '%is_mfa_requirement_satisfied%'
      and (coalesce(qual, '') || coalesce(with_check, '')) not like '%content_manager%'
      and (coalesce(qual, '') || coalesce(with_check, '')) not like '%credential_manager%'
  $$,
  $$ values (1::bigint) $$,
  'site settings should be writable only by Owner or Super Admin after MFA'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_policies
    where schemaname = 'public'
      and tablename in ('credential_types', 'credential_type_translations', 'credential_file_types')
      and cmd in ('INSERT', 'UPDATE', 'DELETE')
      and (coalesce(qual, '') || coalesce(with_check, '')) like '%credential_manager%'
  $$,
  $$ values (0::bigint) $$,
  'Credential Manager should not configure credential types or file types'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_policies
    where schemaname = 'public'
      and tablename = 'contact_submissions'
      and (coalesce(qual, '') || coalesce(with_check, '')) like '%credential_manager%'
      and (coalesce(qual, '') || coalesce(with_check, '')) like '%is_mfa_requirement_satisfied%'
      and (coalesce(qual, '') || coalesce(with_check, '')) not like '%content_manager%'
  $$,
  $$ values (2::bigint) $$,
  'contact read/update should be available to credential roles after MFA and hidden from Content Manager'
);

select results_eq(
  $$
    select tablename::text
    from pg_policies
    where schemaname = 'public' and policyname like '%reference_read'
      and tablename like 'programme%'
    order by tablename
  $$,
  $$ values
    ('programme_area_translations'),
    ('programme_areas'),
    ('programme_runs'),
    ('programme_translations'),
    ('programme_type_translations'),
    ('programme_types'),
    ('programmes')
  $$,
  'credential workflows should have read-only programme reference access'
);

select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' and tablename in ('audit_log', 'user_profiles', 'user_roles') $$,
  $$ values (0::bigint) $$,
  'audit and identity tables should be reachable only through controlled server functions'
);

select results_eq(
  $$
    select count(*)::bigint
    from unnest(array['contact_submission_rate_limits', 'credential_verification_rate_limits']) rate_table(name)
    cross join unnest(array['anon', 'authenticated']) browser_role(name)
    where has_table_privilege(browser_role.name, format('internal.%I', rate_table.name), 'select')
      or has_table_privilege(browser_role.name, format('internal.%I', rate_table.name), 'insert')
      or has_table_privilege(browser_role.name, format('internal.%I', rate_table.name), 'update')
      or has_table_privilege(browser_role.name, format('internal.%I', rate_table.name), 'delete')
  $$,
  $$ values (0::bigint) $$,
  'browser roles should have no internal rate-limit table grants'
);

select results_eq(
  $$
    select count(*)::bigint
    from unnest(array['contact_submission_rate_limits', 'credential_verification_rate_limits']) rate_table(name)
    where has_table_privilege('service_role', format('internal.%I', rate_table.name), 'select')
      and has_table_privilege('service_role', format('internal.%I', rate_table.name), 'insert')
      and has_table_privilege('service_role', format('internal.%I', rate_table.name), 'update')
      and has_table_privilege('service_role', format('internal.%I', rate_table.name), 'delete')
  $$,
  $$ values (2::bigint) $$,
  'service role should own both server-side rate-limit paths'
);

select results_eq(
  $$ select has_function_privilege('anon', 'public.verify_public_credential(text,text,text)'::regprocedure, 'execute') $$,
  $$ values (false) $$,
  'anonymous browser clients must not call the verification database function directly'
);

select results_eq(
  $$ select has_function_privilege('service_role', 'public.verify_public_credential(text,text,text)'::regprocedure, 'execute') $$,
  $$ values (true) $$,
  'public verification should be mediated by the service-only server function'
);

select results_eq(
  $$ select has_function_privilege('anon', 'public.create_public_contact_submission(public.contact_submission_type,text,text,text,text,text,text,text)'::regprocedure, 'execute') $$,
  $$ values (false) $$,
  'anonymous browser clients must not call contact persistence directly'
);

select results_eq(
  $$ select has_function_privilege('service_role', 'public.create_public_contact_submission(public.contact_submission_type,text,text,text,text,text,text,text)'::regprocedure, 'execute') $$,
  $$ values (true) $$,
  'contact persistence should be mediated by the service-only server function'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'create_pending_credential', 'attach_credential_file', 'replace_credential_file',
        'update_credential_file', 'delete_credential_file', 'activate_credential',
        'revoke_credential', 'void_pending_credential', 'update_valid_credential_public_data'
      )
      and has_function_privilege('anon', p.oid, 'execute')
  $$,
  $$ values (0::bigint) $$,
  'anonymous users should not execute credential workflow functions'
);

select results_eq(
  $$
    select count(distinct p.proname)::bigint
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'create_pending_credential', 'attach_credential_file', 'replace_credential_file',
        'update_credential_file', 'delete_credential_file', 'activate_credential',
        'revoke_credential', 'void_pending_credential', 'update_valid_credential_public_data'
      )
      and has_function_privilege('authenticated', p.oid, 'execute')
  $$,
  $$ values (9::bigint) $$,
  'credential workflows should be callable by authenticated users and enforce role/MFA inside the function'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'internal')
      and p.prosecdef
      and not exists (
        select 1
        from unnest(coalesce(p.proconfig, array[]::text[])) setting
        where setting like 'search_path=%'
      )
  $$,
  $$ values (0::bigint) $$,
  'every security-definer function should pin search_path'
);

select results_eq(
  $$ select public from storage.buckets where id = 'private-credentials' $$,
  $$ values (false) $$,
  'credential Storage should remain private'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and (coalesce(qual, '') || coalesce(with_check, '')) like '%private-credentials%'
  $$,
  $$ values (0::bigint) $$,
  'browser JWTs should have no direct private credential object policy'
);

select has_index('public', 'user_roles', 'user_roles_one_owner_role_idx', 'only one Owner role assignment should be possible');
select has_index('public', 'user_profiles', 'user_profiles_one_active_owner_idx', 'only one active Owner profile should be possible');

select results_eq(
  $$
    select a.attname::text
    from pg_index i
    join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any(i.indkey)
    where i.indrelid = 'public.user_roles'::regclass and i.indisprimary
    order by array_position(i.indkey::smallint[], a.attnum)
  $$,
  $$ values ('user_id'), ('role') $$,
  'user roles should support multiple simultaneous roles per user'
);

select results_eq(
  $$ select enumlabel::text from pg_enum where enumtypid = 'public.app_role'::regtype order by enumsortorder $$,
  $$ values ('owner'), ('super_admin'), ('content_manager'), ('credential_manager') $$,
  'the Release 1 role model should contain exactly four roles'
);

select results_eq(
  $$
    select internal.role_requires_mfa(role_value)
    from unnest(array[
      'owner'::public.app_role,
      'super_admin'::public.app_role,
      'content_manager'::public.app_role,
      'credential_manager'::public.app_role
    ]) role_value
  $$,
  $$ values (true), (true), (false), (true) $$,
  'MFA should be required for Owner, Super Admin, and Credential Manager only'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_policies
    where schemaname = 'public'
      and tablename in ('learners', 'learner_emails', 'learner_phones')
      and (coalesce(qual, '') || coalesce(with_check, '')) like '%credential_manager%'
      and (coalesce(qual, '') || coalesce(with_check, '')) like '%is_mfa_requirement_satisfied%'
  $$,
  $$ values (11::bigint) $$,
  'learner policies should authorize credential roles only after MFA'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_policies
    where schemaname = 'public'
      and tablename in ('content_pages', 'content_page_translations')
      and (coalesce(qual, '') || coalesce(with_check, '')) like '%credential_manager%'
  $$,
  $$ values (0::bigint) $$,
  'Credential Manager should have no editorial page policy'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_policies
    where schemaname = 'public'
      and tablename in ('credentials', 'credential_files', 'document_number_log')
      and (coalesce(qual, '') || coalesce(with_check, '')) like '%owner%'
      and (coalesce(qual, '') || coalesce(with_check, '')) like '%super_admin%'
      and (coalesce(qual, '') || coalesce(with_check, '')) like '%credential_manager%'
      and (coalesce(qual, '') || coalesce(with_check, '')) like '%is_mfa_requirement_satisfied%'
  $$,
  $$ values (3::bigint) $$,
  'core credential reads should require an authorized credential role and MFA'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_policies
    where schemaname = 'public'
      and tablename in ('programme_areas', 'programme_types', 'programmes', 'programme_runs')
      and policyname like '%reference_read'
      and (coalesce(qual, '') || coalesce(with_check, '')) like '%is_active_admin%'
  $$,
  $$ values (4::bigint) $$,
  'programme reference reads should be available to every active admin role'
);

select * from finish();

rollback;
