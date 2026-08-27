begin;
select plan(28);

select has_function('public','preview_credential_generation_batch',array['uuid','uuid','uuid','uuid','text','date','uuid[]'],'read-only batch preview should exist');
select has_function('public','confirm_credential_generation_batch',array['uuid','uuid','uuid','uuid','uuid','text','date','date','uuid[]'],'idempotent batch confirmation should exist');
select has_function('public','begin_credential_generation_batch_item',array['uuid','uuid'],'batch item lease begin should exist');
select has_function('public','prepare_credential_generation_batch_item',array['uuid','uuid','text','text','integer'],'atomic pending credential preparation should exist');
select has_function('public','refresh_credential_generation_batch_item',array['uuid','uuid'],'batch item lease refresh should exist');
select has_function('public','complete_credential_generation_batch_item',array['uuid','uuid','jsonb'],'atomic batch item completion should exist');
select has_function('public','fail_credential_generation_batch_item',array['uuid','uuid','text'],'retryable batch failure should exist');
select has_function('public','queue_credential_generation_batch_item',array['uuid'],'per-item retry queue should exist');
select has_function('public','review_credential_generation_batch_item',array['uuid'],'private human review should exist');

select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('preview_credential_generation_batch','confirm_credential_generation_batch','begin_credential_generation_batch_item','prepare_credential_generation_batch_item','refresh_credential_generation_batch_item','complete_credential_generation_batch_item','fail_credential_generation_batch_item','queue_credential_generation_batch_item','review_credential_generation_batch_item') and pg_get_functiondef(p.oid) like '%assert_batch_generation_actor%'$$,
  $$ values (9::bigint)$$,
  'all batch operations should invoke the shared role/MFA guard'
);
select results_eq(
  $$select has_function_privilege('anon','public.confirm_credential_generation_batch(uuid,uuid,uuid,uuid,uuid,text,date,date,uuid[])'::regprocedure,'execute')$$,
  $$ values (false)$$,
  'anonymous batch confirmation should be denied'
);
select results_eq(
  $$select has_function_privilege('authenticated','public.confirm_credential_generation_batch(uuid,uuid,uuid,uuid,uuid,text,date,date,uuid[])'::regprocedure,'execute')$$,
  $$ values (true)$$,
  'authenticated confirmation should reach the role/MFA guard'
);
select results_eq(
  $$select has_function_privilege('anon','public.complete_credential_generation_batch_item(uuid,uuid,jsonb)'::regprocedure,'execute')$$,
  $$ values (false)$$,
  'anonymous batch completion should be denied'
);
select results_eq(
  $$select has_function_privilege('authenticated','public.complete_credential_generation_batch_item(uuid,uuid,jsonb)'::regprocedure,'execute')$$,
  $$ values (true)$$,
  'authenticated completion should reach the role/MFA guard'
);

select results_eq(
  $$select count(*)::bigint from information_schema.role_table_grants where table_schema='public' and table_name in ('credential_generation_batches','credential_generation_batch_items','credential_file_generations') and grantee='authenticated' and privilege_type in ('INSERT','UPDATE','DELETE')$$,
  $$ values (0::bigint)$$,
  'browser roles should retain no direct batch or provenance DML'
);
select results_eq(
  $$select count(*)::bigint from pg_policies where schemaname='storage' and tablename='objects' and (qual ilike '%private-credentials%' or with_check ilike '%private-credentials%')$$,
  $$ values (0::bigint)$$,
  'batch generation should not add direct browser access to private PDFs'
);
select results_eq(
  $$select enumlabel::text collate "default" from pg_enum where enumtypid='public.credential_status'::regtype order by enumsortorder$$,
  $$ values ('pending'),('valid'),('revoked'),('voided')$$,
  'credential lifecycle should remain unchanged'
);
select results_eq(
  $$select count(*)::bigint from information_schema.columns where table_schema='public' and table_name in ('credential_generation_batches','credential_generation_batch_items') and column_name in ('raw_token','verification_token_encrypted','verification_token_lookup_hash','storage_path','pdf_bytes','learner_email')$$,
  $$ values (0::bigint)$$,
  'batch state should contain no token, path, bytes, or learner contact data'
);

select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='preview_credential_generation_batch' and pg_get_functiondef(p.oid) like '%cardinality(p_learner_ids)%' and pg_get_functiondef(p.oid) not like '%500%'$$,
  $$ values (1::bigint)$$,
  'preview should accept the complete explicit array without a fixed 500-item cap'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='confirm_credential_generation_batch' and pg_get_functiondef(p.oid) like '%archived learners cannot be included%' and pg_get_functiondef(p.oid) like '%existing_non_voided_credential%'$$,
  $$ values (1::bigint)$$,
  'confirmation should reject archived learners and record exact-context conflicts'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='confirm_credential_generation_batch' and pg_get_functiondef(p.oid) like '%''queued''::public.credential_generation_item_status%' and pg_get_functiondef(p.oid) like '%''conflict''::public.credential_generation_item_status%'$$,
  $$ values (1::bigint)$$,
  'confirmation should resolve queued and conflict states as the batch item enum'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='confirm_credential_generation_batch' and pg_get_functiondef(p.oid) like '%idempotency_key%' and pg_get_functiondef(p.oid) like '%array_agg(learner_id order by position)%'$$,
  $$ values (1::bigint)$$,
  'confirmation idempotency should bind the exact ordered cohort and issuing context'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='prepare_credential_generation_batch_item' and pg_get_functiondef(p.oid) like '%create_pending_credential%' and pg_get_functiondef(p.oid) like '%credential_id = v_credential_id%'$$,
  $$ values (1::bigint)$$,
  'credential creation and permanent batch-item link should share one transaction'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='complete_credential_generation_batch_item' and pg_get_functiondef(p.oid) like '%generation_batch_item_id%' and pg_get_functiondef(p.oid) like '%exactly one primary PDF%'$$,
  $$ values (1::bigint)$$,
  'completion should attach one complete package with batch provenance'
);
select results_eq(
  $query$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='fail_credential_generation_batch_item' and pg_get_functiondef(p.oid) like '%status = ''retryable''%' and pg_get_functiondef(p.oid) not like '%delete from public.credentials%'$query$,
  $$ values (1::bigint)$$,
  'item failure should remain retryable without deleting its pending credential or number'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='review_credential_generation_batch_item' and pg_get_functiondef(p.oid) like '%status = ''pending''%' and pg_get_functiondef(p.oid) like '%v_primary <> 1%'$$,
  $$ values (1::bigint)$$,
  'human review should require a pending complete package with one primary PDF'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('confirm_credential_generation_batch','begin_credential_generation_batch_item','prepare_credential_generation_batch_item','complete_credential_generation_batch_item','fail_credential_generation_batch_item','queue_credential_generation_batch_item','review_credential_generation_batch_item') and pg_get_functiondef(p.oid) ilike '%delete from public.credential_generation%'$$,
  $$ values (0::bigint)$$,
  'batch workflow should never hard-delete batch records or items'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('confirm_credential_generation_batch','begin_credential_generation_batch_item','prepare_credential_generation_batch_item','complete_credential_generation_batch_item','fail_credential_generation_batch_item','queue_credential_generation_batch_item','review_credential_generation_batch_item') and pg_get_functiondef(p.oid) ilike '%status = ''valid''%'$$,
  $$ values (0::bigint)$$,
  'PDFGEN-006 should not activate credentials'
);

select * from finish();
rollback;
