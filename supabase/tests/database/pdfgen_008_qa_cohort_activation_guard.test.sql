begin;
select plan(27);

select has_column(
  'public', 'credential_generation_batches', 'activation_blocked',
  'generation batches should expose a server-owned activation block'
);
select has_column(
  'public', 'credential_generation_batches', 'activation_block_reason',
  'generation batches should expose a privacy-minimal block reason'
);
select results_eq(
  $$select count(*)::bigint from information_schema.columns where table_schema='public' and table_name='credential_generation_batches' and column_name='activation_blocked' and data_type='boolean' and is_nullable='NO' and column_default='false'$$,
  $$ values (1::bigint)$$,
  'the activation block should fail open only for ordinary batches by an explicit false default'
);
select results_eq(
  $$select count(*)::bigint from pg_constraint where conrelid='public.credential_generation_batches'::regclass and conname='credential_generation_batches_activation_block_consistency' and pg_get_constraintdef(oid) like '%synthetic_qa%'$$,
  $$ values (1::bigint)$$,
  'blocked state and the synthetic QA reason should be paired by a database constraint'
);

select has_function(
  'internal', 'mark_synthetic_qa_generation_batch', array[]::text[],
  'synthetic learner membership should permanently mark its generation batch'
);
select has_function(
  'internal', 'block_synthetic_qa_activation_or_delivery', array[]::text[],
  'one fail-closed database guard should cover activation and delivery boundaries'
);
select has_trigger(
  'public', 'credential_generation_batch_items', 'credential_generation_batch_items_mark_synthetic_qa',
  'new synthetic cohort items should mark their batch'
);
select has_trigger(
  'public', 'credential_generation_batch_activation_requests', 'credential_generation_batch_activation_requests_block_synthetic_qa',
  'blocked batches should reject activation request creation'
);
select has_trigger(
  'public', 'credential_generation_batch_activation_items', 'credential_generation_batch_activation_items_block_synthetic_qa',
  'blocked activation work should reject claim transitions'
);
select has_trigger(
  'public', 'credentials', 'credentials_block_synthetic_qa_activation',
  'blocked batch credentials should reject pending-to-valid transitions'
);
select has_trigger(
  'public', 'credential_email_sends', 'credential_email_sends_block_synthetic_qa_delivery',
  'blocked batch credentials should reject email-ledger creation'
);

select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='internal' and p.proname='mark_synthetic_qa_generation_batch' and pg_get_functiondef(p.oid) like '%PDFGEN-008 synthetic Development-only cohort A%' and pg_get_functiondef(p.oid) like '%PDFGEN-008 synthetic Development-only cohort B%' and pg_get_functiondef(p.oid) like '%PDFGEN-008 synthetic Development-only cohort C%' and pg_get_functiondef(p.oid) like '%activation_blocked = true%'$$,
  $$ values (1::bigint)$$,
  'only the three approved PDFGEN-008 synthetic cohort markers should auto-lock a batch'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='internal' and p.proname='enforce_generation_batch_identity' and pg_get_functiondef(p.oid) like '%activation block is permanent%' and pg_get_functiondef(p.oid) like '%not new.activation_blocked%'$$,
  $$ values (1::bigint)$$,
  'an established batch activation block should be irreversible'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='internal' and p.proname='audit_credential_generation_batch_change' and pg_get_functiondef(p.oid) like '%credential_generation.batch_activation_blocked%' and pg_get_functiondef(p.oid) like '%jsonb_build_object(''reason'', new.activation_block_reason)%'$$,
  $$ values (1::bigint)$$,
  'activation blocking should be audited with only its machine reason'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='internal' and p.proname in ('mark_synthetic_qa_generation_batch','block_synthetic_qa_activation_or_delivery') and p.prosecdef$$,
  $$ values (2::bigint)$$,
  'both QA guard trigger functions should be security definers'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='internal' and p.proname in ('mark_synthetic_qa_generation_batch','block_synthetic_qa_activation_or_delivery') and pg_get_functiondef(p.oid) like '%SET search_path TO ''internal'', ''public'', ''pg_temp''%'$$,
  $$ values (2::bigint)$$,
  'both QA guard trigger functions should pin their search path'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='internal' and p.proname in ('mark_synthetic_qa_generation_batch','block_synthetic_qa_activation_or_delivery') and has_function_privilege('authenticated',p.oid,'execute')$$,
  $$ values (0::bigint)$$,
  'browser users should not call QA guard internals directly'
);
select results_eq(
  $$select count(*)::bigint from information_schema.role_table_grants where table_schema='public' and table_name='credential_generation_batches' and grantee='authenticated' and privilege_type in ('INSERT','UPDATE','DELETE')$$,
  $$ values (0::bigint)$$,
  'browser users should retain no direct batch-state mutation privilege'
);

select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='internal' and p.proname='block_synthetic_qa_activation_or_delivery' and pg_get_functiondef(p.oid) like '%credential_generation_batch_activation_requests%' and pg_get_functiondef(p.oid) like '%v_batch_id := new.batch_id%'$$,
  $$ values (1::bigint)$$,
  'the guard should stop a blocked batch before an activation request is recorded'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='internal' and p.proname='block_synthetic_qa_activation_or_delivery' and pg_get_functiondef(p.oid) like '%credential_generation_batch_activation_items%' and pg_get_functiondef(p.oid) like '%new.status <> ''processing''%'$$,
  $$ values (1::bigint)$$,
  'the guard should stop pre-existing or forged activation work before processing'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='internal' and p.proname='block_synthetic_qa_activation_or_delivery' and pg_get_functiondef(p.oid) like '%tg_table_name = ''credentials''%' and pg_get_functiondef(p.oid) like '%new.status <> ''valid''%'$$,
  $$ values (1::bigint)$$,
  'the guard should independently reject the credential lifecycle activation boundary'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='internal' and p.proname='block_synthetic_qa_activation_or_delivery' and pg_get_functiondef(p.oid) like '%credential_email_sends%' and pg_get_functiondef(p.oid) like '%new.credential_id%'$$,
  $$ values (1::bigint)$$,
  'the guard should independently reject the delivery-ledger boundary'
);

select has_column(
  'public', 'credential_generation_batch_items', 'reviewed_by',
  'each reviewed package should retain its reviewer separately'
);
select has_column(
  'public', 'credential_generation_batch_activation_requests', 'requested_by',
  'each activation request should retain its acting activator separately'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='internal' and p.proname='assert_batch_generation_actor' and pg_get_functiondef(p.oid) like '%array[''owner'', ''super_admin'', ''credential_manager'']%' and pg_get_functiondef(p.oid) like '%assert_sensitive_action_allowed%'$$,
  $$ values (1::bigint)$$,
  'Owner, Super Admin, and Credential Manager with the sensitive-action MFA guard should share batch responsibility'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('review_credential_generation_batch_item','prepare_credential_generation_batch_activation') and pg_get_functiondef(p.oid) like '%internal.assert_batch_generation_actor()%'$$,
  $$ values (2::bigint)$$,
  'review and activation should independently apply the same role and MFA authorization gate'
);
select results_eq(
  $$select count(*)::bigint from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='prepare_credential_generation_batch_activation' and pg_get_functiondef(p.oid) not like '%reviewed_by%' and pg_get_functiondef(p.oid) like '%requested_by%'$$,
  $$ values (1::bigint)$$,
  'activation should record its actor without requiring that actor to equal the reviewer'
);

select * from finish();
rollback;
