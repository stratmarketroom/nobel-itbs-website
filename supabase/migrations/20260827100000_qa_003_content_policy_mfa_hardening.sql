-- QA-003-MFA-RLS-001: enforce the shared profile-aware MFA boundary on
-- editorial content mutations. Content Manager remains MFA-optional unless
-- user_profiles.mfa_required is enabled; Owner and Super Admin require AAL2
-- through the existing AUTH-006 role/profile invariants.

do $migration$
declare
  target_table text;
begin
  foreach target_table in array array[
    'programme_areas',
    'programme_area_translations',
    'programme_types',
    'programme_type_translations',
    'programmes',
    'programme_translations',
    'programme_runs',
    'programme_pricing_options',
    'programme_pricing_option_translations',
    'partners',
    'partner_translations',
    'experts',
    'expert_translations',
    'content_pages',
    'content_page_translations'
  ]
  loop
    execute format(
      $policy$
        alter policy %I
        on public.%I
        with check (
          internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[])
          and internal.is_mfa_requirement_satisfied()
        )
      $policy$,
      target_table || '_content_insert',
      target_table
    );

    execute format(
      $policy$
        alter policy %I
        on public.%I
        using (
          internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[])
          and internal.is_mfa_requirement_satisfied()
        )
        with check (
          internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[])
          and internal.is_mfa_requirement_satisfied()
        )
      $policy$,
      target_table || '_content_update',
      target_table
    );

    execute format(
      $policy$
        alter policy %I
        on public.%I
        using (
          internal.has_any_role(array['owner', 'super_admin', 'content_manager']::public.app_role[])
          and internal.is_mfa_requirement_satisfied()
        )
      $policy$,
      target_table || '_content_delete',
      target_table
    );
  end loop;
end
$migration$;
