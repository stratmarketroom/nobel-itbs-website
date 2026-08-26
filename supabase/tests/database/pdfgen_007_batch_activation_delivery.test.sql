begin;
select plan(30);

select has_table('public', 'credential_generation_batch_activation_requests', 'private aggregate activation request ledger should exist');
select has_table('public', 'credential_generation_batch_activation_items', 'private per-credential activation outcome ledger should exist');
select has_function('public', 'prepare_credential_generation_batch_activation', array['uuid','uuid','uuid[]'], 'exact reviewed selection preparation should exist');
select has_function('public', 'claim_credential_generation_batch_activation_item', array['uuid','uuid'], 'bounded activation lease claim should exist');
select has_function('public', 'bind_credential_generation_batch_activation_email_send', array['uuid','uuid','uuid'], 'delivery history should bind before SMTP processing');
select has_function('public', 'complete_credential_generation_batch_activation_item', array['uuid','uuid','uuid'], 'independent activation outcome completion should exist');
select has_function('public', 'fail_credential_generation_batch_activation_item', array['uuid','uuid','text'], 'safe per-item activation failure should exist');
select has_function('public', 'complete_credential_generation_batch_email_send', array['uuid','uuid','credential_email_send_status','text'], 'lease-bound batch delivery finalization should exist');
select has_function('public', 'requeue_credential_generation_batch_activation_item', array['uuid'], 'per-item activation or delivery retry should exist');

select results_eq(
  $$select count(*)::bigint from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ('credential_generation_batch_activation_requests','credential_generation_batch_activation_items') and c.relrowsecurity and c.relforcerowsecurity$$,
  $$values(2::bigint)$$,
  'both private activation ledgers should force RLS'
);
select results_eq(
  $$select count(*)::bigint from information_schema.role_table_grants where table_schema='public' and table_name in ('credential_generation_batch_activation_requests','credential_generation_batch_activation_items') and grantee='authenticated' and privilege_type in ('INSERT','UPDATE','DELETE')$$,
  $$values(0::bigint)$$,
  'browser roles should have no direct activation-ledger DML'
);
select results_eq(
  $$select count(*)::bigint from pg_policies where schemaname='public' and tablename in ('credential_generation_batch_activation_requests','credential_generation_batch_activation_items') and roles @> array['authenticated'::name] and qual ilike '%is_active_admin%' and qual ilike '%is_mfa_requirement_satisfied%'$$,
  $$values(2::bigint)$$,
  'private activation reads should require active admin role and MFA'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('prepare_credential_generation_batch_activation','claim_credential_generation_batch_activation_item','bind_credential_generation_batch_activation_email_send','complete_credential_generation_batch_activation_item','fail_credential_generation_batch_activation_item','complete_credential_generation_batch_email_send','requeue_credential_generation_batch_activation_item') and p.prosecdef and pg_get_functiondef(p.oid) like '%assert_batch_generation_actor%'$$,
  $$values(7::bigint)$$,
  'every batch activation mutation should use the shared role/MFA guard'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('prepare_credential_generation_batch_activation','claim_credential_generation_batch_activation_item','bind_credential_generation_batch_activation_email_send','complete_credential_generation_batch_activation_item','fail_credential_generation_batch_activation_item','complete_credential_generation_batch_email_send','requeue_credential_generation_batch_activation_item') and pg_get_functiondef(p.oid) like '%SET search_path TO %'$$,
  $$values(7::bigint)$$,
  'every security-definer batch activation function should pin its search path'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('prepare_credential_generation_batch_activation','claim_credential_generation_batch_activation_item','bind_credential_generation_batch_activation_email_send','complete_credential_generation_batch_activation_item','fail_credential_generation_batch_activation_item','complete_credential_generation_batch_email_send','requeue_credential_generation_batch_activation_item') and has_function_privilege('anon',p.oid,'execute')$$,
  $$values(0::bigint)$$,
  'anonymous users should execute no batch activation function'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('prepare_credential_generation_batch_activation','claim_credential_generation_batch_activation_item','bind_credential_generation_batch_activation_email_send','complete_credential_generation_batch_activation_item','fail_credential_generation_batch_activation_item','complete_credential_generation_batch_email_send','requeue_credential_generation_batch_activation_item') and has_function_privilege('authenticated',p.oid,'execute')$$,
  $$values(7::bigint)$$,
  'authenticated admins should reach the shared role/MFA guard'
);

select results_eq(
  $$select enumlabel::text from pg_enum where enumtypid='public.credential_status'::regtype order by enumsortorder$$,
  $$values('pending'),('valid'),('revoked'),('voided')$$,
  'batch activation should not expand the credential lifecycle'
);
select results_eq(
  $$select enumlabel::text from pg_enum where enumtypid='public.credential_batch_activation_item_status'::regtype order by enumsortorder$$,
  $$values('queued'),('processing'),('activation_failed'),('delivery_retryable'),('activated_sent'),('activated_not_sent')$$,
  'private workflow outcomes should separate sent, not-sent, and failed items'
);
select results_eq(
  $$select count(*)::bigint from information_schema.columns where table_schema='public' and table_name in ('credential_generation_batch_activation_requests','credential_generation_batch_activation_items') and column_name in ('recipient_email','subject','body','files','raw_token','verification_token_encrypted','verification_token_lookup_hash','storage_path','pdf_bytes')$$,
  $$values(0::bigint)$$,
  'activation ledgers should contain no contact, content, token, path, or PDF data'
);
select results_eq(
  $$select count(*)::bigint from pg_indexes where schemaname='public' and tablename='credential_generation_batch_activation_requests' and indexdef ilike '%idempotency_key%' and indexdef ilike '%unique%'$$,
  $$values(1::bigint)$$,
  'activation requests should have a unique idempotency key'
);
select results_eq(
  $$select count(*)::bigint from pg_indexes where schemaname='public' and tablename='credential_generation_batch_activation_items' and indexdef ilike '%batch_item_id%' and indexdef ilike '%unique%'$$,
  $$values(2::bigint)$$,
  'a selected batch item should have immutable exact-request and global uniqueness constraints'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='prepare_credential_generation_batch_activation' and pg_get_functiondef(p.oid) like '%array_agg(item.id order by item.position)%' and pg_get_functiondef(p.oid) like '%idempotency key is already bound to another exact selection%'$$,
  $$values(1::bigint)$$,
  'idempotency should bind the exact ordered reviewed-item selection'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='prepare_credential_generation_batch_activation' and pg_get_functiondef(p.oid) like '%item.status <> ''reviewed''%' and pg_get_functiondef(p.oid) like '%credential.status = ''pending''%' and pg_get_functiondef(p.oid) like '%file.is_primary%'$$,
  $$values(1::bigint)$$,
  'selection should remain human-reviewed, pending, and primary-PDF gated'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='claim_credential_generation_batch_activation_item' and pg_get_functiondef(p.oid) like '%interval ''15 minutes''%' and pg_get_functiondef(p.oid) like '%lease_expires_at <= now()%'$$,
  $$values(1::bigint)$$,
  'activation claims should use bounded expiring leases for safe resume'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='complete_credential_generation_batch_activation_item' and pg_get_functiondef(p.oid) like '%v_credential.status <> ''valid''%' and pg_get_functiondef(p.oid) like '%v_send.status = ''sent''%' and pg_get_functiondef(p.oid) like '%v_send.status = ''pending''%'$$,
  $$values(1::bigint)$$,
  'completion should derive an independent delivery outcome for an already-valid credential'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='fail_credential_generation_batch_activation_item' and pg_get_functiondef(p.oid) like '%credential.status = ''pending''%' and pg_get_functiondef(p.oid) like '%set status = ''reviewed''%'$$,
  $$values(1::bigint)$$,
  'only pending credential activation failures should return to explicit review'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='complete_credential_generation_batch_email_send' and pg_get_functiondef(p.oid) like '%lease_token = p_lease_token%' and pg_get_functiondef(p.oid) like '%email_send.status = ''pending''%'$$,
  $$values(1::bigint)$$,
  'delivery finalization should be lease-bound and update only the pending immutable send entry'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('prepare_credential_generation_batch_activation','complete_credential_generation_batch_activation_item','fail_credential_generation_batch_activation_item') and pg_get_functiondef(p.oid) like '%write_audit_log%'$$,
  $$values(3::bigint)$$,
  'request and every per-credential activation result should be audited'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('prepare_credential_generation_batch_activation','claim_credential_generation_batch_activation_item','bind_credential_generation_batch_activation_email_send','complete_credential_generation_batch_activation_item','fail_credential_generation_batch_activation_item','complete_credential_generation_batch_email_send','requeue_credential_generation_batch_activation_item') and pg_get_functiondef(p.oid) ilike '%delete from public.%'$$,
  $$values(0::bigint)$$,
  'batch activation should never hard-delete operational records'
);
select results_eq(
  $$select count(*)::bigint from pg_policies where schemaname='storage' and tablename='objects' and (qual ilike '%private-credentials%' or with_check ilike '%private-credentials%')$$,
  $$values(0::bigint)$$,
  'batch delivery should not add direct browser access to private PDFs'
);

select * from finish();
rollback;
