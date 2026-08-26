begin;
select plan(20);

select has_table('internal', 'credential_single_generation_locks', 'private single-generation lease table should exist');
select results_eq(
  $$select relrowsecurity and relforcerowsecurity from pg_class where oid='internal.credential_single_generation_locks'::regclass$$,
  $$values(true)$$,
  'single-generation leases should enable and force RLS'
);
select results_eq(
  $$select count(*)::bigint from information_schema.role_table_grants where table_schema='internal' and table_name='credential_single_generation_locks' and grantee in ('anon','authenticated','service_role')$$,
  $$values(0::bigint)$$,
  'browser and service roles should have no direct lease-table privileges'
);
select results_eq(
  $$select count(*)::bigint from pg_policies where schemaname='internal' and tablename='credential_single_generation_locks'$$,
  $$values(0::bigint)$$,
  'lease table should remain deny-by-default without RLS policies'
);

select has_function('public','begin_single_credential_generation',array['uuid','uuid','uuid'],'guarded generation begin function should exist');
select has_function('public','refresh_single_credential_generation',array['uuid','uuid'],'guarded generation lease refresh should exist');
select has_function('public','complete_single_credential_generation',array['uuid','uuid','jsonb'],'atomic generation completion should exist');
select has_function('public','fail_single_credential_generation',array['uuid','uuid','text'],'privacy-minimal generation failure function should exist');

select results_eq(
  $$select has_function_privilege('anon','public.begin_single_credential_generation(uuid,uuid,uuid)'::regprocedure,'execute')$$,
  $$values(false)$$,
  'anonymous generation begin should be denied'
);
select results_eq(
  $$select has_function_privilege('authenticated','public.begin_single_credential_generation(uuid,uuid,uuid)'::regprocedure,'execute')$$,
  $$values(true)$$,
  'authenticated generation begin should reach the role/MFA guard'
);
select results_eq(
  $$select has_function_privilege('anon','public.complete_single_credential_generation(uuid,uuid,jsonb)'::regprocedure,'execute')$$,
  $$values(false)$$,
  'anonymous generation completion should be denied'
);
select results_eq(
  $$select has_function_privilege('authenticated','public.complete_single_credential_generation(uuid,uuid,jsonb)'::regprocedure,'execute')$$,
  $$values(true)$$,
  'authenticated generation completion should reach the role/MFA guard'
);

select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('begin_single_credential_generation','refresh_single_credential_generation','complete_single_credential_generation','fail_single_credential_generation') and pg_get_functiondef(p.oid) like '%assert_single_generation_actor%'$$,
  $$values(4::bigint)$$,
  'all single-generation mutations should invoke the shared actor/MFA guard'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='begin_single_credential_generation' and pg_get_functiondef(p.oid) like '%only a pending credential%' and pg_get_functiondef(p.oid) like '%programme_run_id%' and pg_get_functiondef(p.oid) like '%same immutable template version%'$$,
  $$values(1::bigint)$$,
  'generation begin should enforce pending lifecycle, issuing context, and fixed regeneration provenance'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='complete_single_credential_generation' and pg_get_functiondef(p.oid) like '%credential_file_generations%' and pg_get_functiondef(p.oid) like '%exactly one primary PDF%' and pg_get_functiondef(p.oid) like '%generation_batch_item_id%'$$,
  $$values(1::bigint)$$,
  'generation completion should persist one complete package and append single-item provenance'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='fail_single_credential_generation' and pg_get_functiondef(p.oid) like '%error_code%' and pg_get_functiondef(p.oid) not like '%storage_path%' and pg_get_functiondef(p.oid) not like '%verification_token%'$$,
  $$values(1::bigint)$$,
  'generation failure should persist only a bounded non-sensitive error code'
);

select results_eq(
  $$select enumlabel::text from pg_enum where enumtypid='public.credential_status'::regtype order by enumsortorder$$,
  $$values('pending'),('valid'),('revoked'),('voided')$$,
  'credential lifecycle should remain unchanged'
);
select results_eq(
  $$select count(*)::bigint from pg_policies where schemaname='storage' and tablename='objects' and (qual ilike '%private-credentials%' or with_check ilike '%private-credentials%')$$,
  $$values(0::bigint)$$,
  'single generation should not add direct browser access to private credential objects'
);
select results_eq(
  $$select count(*)::bigint from information_schema.columns where table_schema='internal' and table_name='credential_single_generation_locks' and column_name in ('raw_token','verification_token_encrypted','storage_path','pdf_bytes','learner_email')$$,
  $$values(0::bigint)$$,
  'lease state should contain no token, path, bytes, or learner contact data'
);
select results_eq(
  $$select count(*)::bigint from pg_trigger where tgrelid='public.credential_file_generations'::regclass and tgname in ('credential_file_generations_prevent_mutation','credential_file_generations_prevent_truncate') and not tgisinternal$$,
  $$values(2::bigint)$$,
  'generated-file provenance should remain append-only across regeneration'
);

select * from finish();
rollback;
