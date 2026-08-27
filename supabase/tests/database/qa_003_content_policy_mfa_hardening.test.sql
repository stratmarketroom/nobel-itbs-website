begin;

select plan(10);

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
  'the editorial mutation boundary should contain exactly 45 policies'
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
  'every editorial mutation policy should use the shared MFA helper'
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
      and (coalesce(qual, '') || coalesce(with_check, '')) not like '%has_any_role%'
  $$,
  $$ values (0::bigint) $$,
  'every editorial mutation policy should preserve role authorization'
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
  'Credential Manager should remain excluded from editorial mutations'
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
      and cmd = 'UPDATE'
      and coalesce(qual, '') like '%is_mfa_requirement_satisfied%'
      and coalesce(with_check, '') like '%is_mfa_requirement_satisfied%'
  $$,
  $$ values (15::bigint) $$,
  'every editorial update should enforce MFA before and after the row change'
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
      and roles <> array['authenticated']::name[]
  $$,
  $$ values (0::bigint) $$,
  'editorial mutation policies should remain scoped to authenticated users'
);

select results_eq(
  $$
    select internal.role_requires_mfa('content_manager'::public.app_role)
  $$,
  $$ values (false) $$,
  'Content Manager should remain MFA-optional by role'
);

select results_eq(
  $$
    select internal.role_requires_mfa(role_value)
    from unnest(array[
      'owner'::public.app_role,
      'super_admin'::public.app_role
    ]) role_value
  $$,
  $$ values (true), (true) $$,
  'Owner and Super Admin should continue to require MFA'
);

select results_eq(
  $$
    select prosrc like '%profile.is_active%'
      and prosrc like '%not profile.mfa_required%'
      and prosrc like '%has_mfa_aal()%'
    from pg_proc
    where oid = 'internal.is_mfa_requirement_satisfied()'::regprocedure
  $$,
  $$ values (true) $$,
  'the shared helper should preserve active-profile and profile-aware MFA semantics'
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
      and cmd = 'SELECT'
      and (coalesce(qual, '') || coalesce(with_check, '')) like '%is_mfa_requirement_satisfied%'
  $$,
  $$ values (0::bigint) $$,
  'the hardening should not add MFA to editorial read policies'
);

select * from finish();

rollback;
