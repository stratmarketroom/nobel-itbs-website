begin;

select plan(6);

select results_eq(
  $$
    select pg_get_functiondef(
      'public.begin_single_credential_generation(uuid,uuid,uuid)'::regprocedure
    ) like '%select template_package.*%'
  $$,
  $$ values (true) $$,
  'single generation should expand the Template Package composite before assignment'
);

select results_eq(
  $$
    select pg_get_functiondef(
      'public.begin_single_credential_generation(uuid,uuid,uuid)'::regprocedure
    ) not like E'%select template_package\n%into v_package%'
  $$,
  $$ values (true) $$,
  'single generation should not assign a nested composite value to the package row variable'
);

select results_eq(
  $$
    select prosecdef
      and 'search_path=public, internal, pg_temp' = any(proconfig)
    from pg_proc
    where oid = 'public.begin_single_credential_generation(uuid,uuid,uuid)'::regprocedure
  $$,
  $$ values (true) $$,
  'the corrected function should preserve SECURITY DEFINER with a fixed search path'
);

select results_eq(
  $$
    select prosrc like '%internal.assert_single_generation_actor()%'
      and prosrc like '%only a pending credential%'
      and prosrc like '%same immutable template version%'
      and prosrc like '%credential_single_generation_locks%'
    from pg_proc
    where oid = 'public.begin_single_credential_generation(uuid,uuid,uuid)'::regprocedure
  $$,
  $$ values (true) $$,
  'the correction should preserve authorization, lifecycle, provenance, and lease guards'
);

select results_eq(
  $$
    select not has_function_privilege(
        'anon',
        'public.begin_single_credential_generation(uuid,uuid,uuid)'::regprocedure,
        'execute'
      )
      and has_function_privilege(
        'authenticated',
        'public.begin_single_credential_generation(uuid,uuid,uuid)'::regprocedure,
        'execute'
      )
  $$,
  $$ values (true) $$,
  'the corrected function should preserve anonymous denial and guarded authenticated execution'
);

select results_eq(
  $$
    select pg_get_function_result(
      'public.begin_single_credential_generation(uuid,uuid,uuid)'::regprocedure
    )::text collate "default"
  $$,
  $$ values ('TABLE(generation_attempt integer, is_regeneration boolean)') $$,
  'the corrected function should preserve its return contract'
);

select * from finish();

rollback;
