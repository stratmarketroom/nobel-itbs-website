begin;

select plan(31);

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
  'Owner, Super Admin, and Credential Manager should require MFA; Content Manager should not'
);

select set_config('request.jwt.claims', '{"aal":"aal1"}', true);
select results_eq(
  $$ select internal.has_mfa_aal() $$,
  $$ values (false) $$,
  'an AAL1 JWT should not satisfy MFA'
);

select set_config('request.jwt.claims', '{"aal":"aal2"}', true);
select results_eq(
  $$ select internal.has_mfa_aal() $$,
  $$ values (true) $$,
  'an AAL2 JWT should satisfy MFA'
);

select set_config('request.jwt.claims', '{}', true);
select results_eq(
  $$ select internal.has_mfa_aal() $$,
  $$ values (false) $$,
  'a JWT without an AAL claim should not satisfy MFA'
);

select results_eq(
  $$
    select prosrc like '%auth.uid()%'
      and prosrc like '%profile.is_active%'
      and prosrc like '%role_requires_mfa%'
    from pg_proc
    where oid = 'internal.current_user_requires_mfa()'::regprocedure
  $$,
  $$ values (true) $$,
  'MFA requirement resolution should use the active database profile and roles for auth.uid()'
);

select results_eq(
  $$
    select prosrc like '%is_active_admin()%'
      and prosrc like '%current_user_requires_mfa()%'
      and prosrc like '%has_mfa_aal()%'
    from pg_proc
    where oid = 'internal.assert_mfa_requirement_satisfied()'::regprocedure
  $$,
  $$ values (true) $$,
  'the common MFA assertion should require an active admin and AAL2 when applicable'
);

select results_eq(
  $$
    select prosrc like '%has_any_role(p_required_roles)%'
      and prosrc like '%assert_mfa_requirement_satisfied()%'
    from pg_proc
    where oid = 'internal.assert_sensitive_action_allowed(public.app_role[],text)'::regprocedure
  $$,
  $$ values (true) $$,
  'sensitive-action guard should combine role and MFA checks'
);

select has_trigger(
  'public',
  'user_profiles',
  'user_profiles_enforce_mfa_rules',
  'profile changes should enforce MFA-required role consistency'
);

select has_trigger(
  'public',
  'user_roles',
  'user_roles_enforce_mfa_rules',
  'role assignment should automatically enforce mfa_required'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'create_admin_profile', 'update_admin_profile',
        'assign_admin_roles', 'remove_admin_roles', 'update_admin_user_atomic'
      )
      and p.prosrc like '%assert_sensitive_action_allowed%'
  $$,
  $$ values (5::bigint) $$,
  'every database user/role management function should use the sensitive-action guard'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'contact_submissions', 'credential_email_sends', 'credential_file_types',
        'credential_files', 'credential_generation_batch_activation_items',
        'credential_generation_batch_activation_requests',
        'credential_generation_batch_items', 'credential_generation_batches',
        'credential_file_generations', 'credential_history', 'credential_notes', 'credential_sets',
        'credential_template_document_pages', 'credential_template_documents',
        'credential_template_field_placements', 'credential_template_packages',
        'credential_template_versions',
        'credential_type_translations', 'credential_types', 'credentials',
        'document_number_log', 'email_templates', 'learner_emails', 'learner_phones',
        'learners'
      )
      and (coalesce(qual, '') || coalesce(with_check, '')) not like '%is_mfa_requirement_satisfied%'
      and (coalesce(qual, '') || coalesce(with_check, '')) not like '%can_manage_credential_templates%'
      and (coalesce(qual, '') || coalesce(with_check, '')) not like '%can_read_credential_template_package%'
      and (coalesce(qual, '') || coalesce(with_check, '')) not like '%can_read_credential_template_version%'
  $$,
  $$ values (0::bigint) $$,
  'every private operational RLS policy should require the MFA condition'
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
      and (coalesce(qual, '') || coalesce(with_check, '')) not like '%is_mfa_requirement_satisfied%'
  $$,
  $$ values (0::bigint) $$,
  'content mutations should enforce MFA only when the current profile requires it'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_policies
    where schemaname = 'public'
      and tablename = 'site_settings'
      and policyname = 'site_settings_admin_update'
      and (coalesce(qual, '') || coalesce(with_check, '')) like '%is_mfa_requirement_satisfied%'
  $$,
  $$ values (1::bigint) $$,
  'site-settings mutation should require MFA'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_policies
    where schemaname = 'public'
      and tablename in ('email_templates', 'credential_type_translations', 'credential_types', 'credential_file_types')
      and cmd in ('INSERT', 'UPDATE', 'DELETE')
      and (coalesce(qual, '') || coalesce(with_check, '')) not like '%is_mfa_requirement_satisfied%'
  $$,
  $$ values (0::bigint) $$,
  'credential configuration mutations should require MFA'
);

select results_eq(
  $$
    select has_table_privilege('authenticated', 'public.email_templates', 'insert')
      or has_table_privilege('authenticated', 'public.email_templates', 'update')
      or has_table_privilege('authenticated', 'public.email_templates', 'delete')
  $$,
  $$ values (false) $$,
  'email templates should have no direct browser mutation path until a controlled MFA workflow exists'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'reserve_document_number', 'reserve_manual_document_number',
        'void_reserved_document_number', 'move_credential_to_set',
        'add_credential_note', 'update_credential_note', 'delete_credential_note',
        'create_pending_credential', 'activate_credential', 'resend_credential',
        'complete_credential_email_send', 'revoke_credential',
        'void_pending_credential', 'update_valid_credential_public_data'
      )
      and p.prosrc like '%is_mfa_requirement_satisfied%'
  $$,
  $$ values (14::bigint) $$,
  'credential lifecycle functions should enforce MFA inside the database function'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'attach_credential_file', 'replace_credential_file',
        'update_credential_file', 'delete_credential_file'
      )
      and p.prosrc like '%require_credential_file_mutation%'
  $$,
  $$ values (4::bigint) $$,
  'every PDF metadata mutation should use the common protected file guard'
);

select results_eq(
  $$
    select count(distinct p.proname)::bigint
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'create_credential_template_package', 'create_credential_template_version',
        'publish_credential_template_version', 'retire_credential_template_version',
        'attach_credential_template_document', 'delete_credential_template_document',
        'validate_credential_template_version', 'update_credential_template_document',
        'replace_credential_template_document_placements', 'record_credential_template_preview'
      )
      and p.prosrc like '%assert_sensitive_action_allowed%'
      and p.prosrc like '%owner%'
      and p.prosrc like '%super_admin%'
      and p.prosrc not like '%content_manager%'
      and p.prosrc not like '%credential_manager%'
  $$,
  $$ values (10::bigint) $$,
  'all template definition mutations should require Owner or Super Admin plus MFA'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'begin_single_credential_generation', 'refresh_single_credential_generation',
        'complete_single_credential_generation', 'fail_single_credential_generation'
      )
      and p.prosrc like '%assert_single_generation_actor%'
  $$,
  $$ values (4::bigint) $$,
  'all single-generation functions should use the Owner/Super Admin/Credential Manager MFA guard'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'preview_credential_generation_batch', 'confirm_credential_generation_batch',
        'begin_credential_generation_batch_item', 'prepare_credential_generation_batch_item',
        'refresh_credential_generation_batch_item', 'complete_credential_generation_batch_item',
        'fail_credential_generation_batch_item', 'queue_credential_generation_batch_item',
        'review_credential_generation_batch_item',
        'prepare_credential_generation_batch_activation',
        'claim_credential_generation_batch_activation_item',
        'complete_credential_generation_batch_activation_item',
        'bind_credential_generation_batch_activation_email_send',
        'fail_credential_generation_batch_activation_item',
        'complete_credential_generation_batch_email_send',
        'requeue_credential_generation_batch_activation_item'
      )
      and p.prosrc like '%assert_batch_generation_actor%'
  $$,
  $$ values (16::bigint) $$,
  'all batch generation, review, activation, retry, and delivery functions should use the shared MFA guard'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_proc
    where oid in (
      'internal.can_manage_credential_templates()'::regprocedure,
      'internal.can_read_credential_template_package(uuid)'::regprocedure,
      'internal.can_read_credential_template_version(uuid)'::regprocedure,
      'internal.assert_single_generation_actor()'::regprocedure,
      'internal.assert_batch_generation_actor()'::regprocedure
    )
      and (
        prosrc like '%is_mfa_requirement_satisfied%'
        or prosrc like '%assert_sensitive_action_allowed%'
      )
  $$,
  $$ values (5::bigint) $$,
  'every template and generation authorization helper should enforce the common MFA condition'
);

select results_eq(
  $$
    select prosrc like '%is_mfa_requirement_satisfied%'
    from pg_proc
    where oid = 'internal.require_credential_file_mutation(uuid,text,boolean)'::regprocedure
  $$,
  $$ values (true) $$,
  'the common PDF mutation guard should enforce MFA'
);

select results_eq(
  $$
    select prosecdef = false
    from pg_proc
    where oid = 'public.find_or_create_credential_set(uuid,uuid,uuid,date)'::regprocedure
  $$,
  $$ values (true) $$,
  'credential-set helper should remain security invoker so MFA-protected RLS is authoritative'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'create_admin_profile', 'update_admin_profile',
        'assign_admin_roles', 'remove_admin_roles', 'update_admin_user_atomic',
        'find_or_create_credential_set', 'reserve_document_number',
        'reserve_manual_document_number', 'void_reserved_document_number',
        'move_credential_to_set', 'add_credential_note', 'update_credential_note',
        'delete_credential_note', 'create_pending_credential',
        'attach_credential_file', 'replace_credential_file',
        'update_credential_file', 'delete_credential_file',
        'activate_credential', 'resend_credential', 'complete_credential_email_send',
        'revoke_credential', 'void_pending_credential',
        'update_valid_credential_public_data'
      )
      and has_function_privilege('anon', p.oid, 'execute')
  $$,
  $$ values (0::bigint) $$,
  'anonymous clients should not execute MFA-protected admin functions'
);

select results_eq(
  $$
    select count(distinct p.proname)::bigint
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'create_admin_profile', 'update_admin_profile',
        'assign_admin_roles', 'remove_admin_roles', 'update_admin_user_atomic',
        'find_or_create_credential_set', 'reserve_document_number',
        'reserve_manual_document_number', 'void_reserved_document_number',
        'move_credential_to_set', 'add_credential_note', 'update_credential_note',
        'delete_credential_note', 'create_pending_credential',
        'attach_credential_file', 'replace_credential_file',
        'update_credential_file', 'delete_credential_file',
        'activate_credential', 'resend_credential', 'complete_credential_email_send',
        'revoke_credential', 'void_pending_credential',
        'update_valid_credential_public_data'
      )
      and has_function_privilege('authenticated', p.oid, 'execute')
  $$,
  $$ values (24::bigint) $$,
  'authenticated admin functions should remain callable only behind their role/MFA checks'
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
  'all security-definer MFA paths should pin search_path'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_policies
    where schemaname = 'public'
      and tablename in ('learners', 'learner_emails', 'learner_phones')
      and (coalesce(qual, '') || coalesce(with_check, '')) not like '%is_mfa_requirement_satisfied%'
  $$,
  $$ values (0::bigint) $$,
  'learner reads and writes should all require MFA for sensitive roles'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'credentials', 'credential_files', 'credential_history', 'credential_notes',
        'document_number_log', 'credential_file_generations',
        'credential_generation_batches', 'credential_generation_batch_items',
        'credential_generation_batch_activation_requests',
        'credential_generation_batch_activation_items',
        'credential_template_packages', 'credential_template_versions',
        'credential_template_documents', 'credential_template_document_pages',
        'credential_template_field_placements'
      )
      and (coalesce(qual, '') || coalesce(with_check, '')) not like '%is_mfa_requirement_satisfied%'
      and (coalesce(qual, '') || coalesce(with_check, '')) not like '%can_manage_credential_templates%'
      and (coalesce(qual, '') || coalesce(with_check, '')) not like '%can_read_credential_template_package%'
      and (coalesce(qual, '') || coalesce(with_check, '')) not like '%can_read_credential_template_version%'
  $$,
  $$ values (0::bigint) $$,
  'credential reads should all require MFA for sensitive roles'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_policies
    where schemaname = 'public'
      and tablename = 'contact_submissions'
      and (coalesce(qual, '') || coalesce(with_check, '')) not like '%is_mfa_requirement_satisfied%'
  $$,
  $$ values (0::bigint) $$,
  'contact-submission reads and status updates should require MFA'
);

select results_eq(
  $$
    select prosrc like '%profile.mfa_required%'
      and prosrc like '%role_requires_mfa(role_assignment.role)%'
    from pg_proc
    where oid = 'internal.current_user_requires_mfa()'::regprocedure
  $$,
  $$ values (true) $$,
  'explicit profile MFA and every assigned sensitive role should make the session MFA-required'
);

select results_eq(
  $$
    select count(*)::bigint
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'internal'
      and p.proname in ('has_mfa_aal', 'is_mfa_requirement_satisfied')
      and has_function_privilege('anon', p.oid, 'execute')
  $$,
  $$ values (0::bigint) $$,
  'anonymous clients should not execute internal MFA helpers'
);

select * from finish();

rollback;
