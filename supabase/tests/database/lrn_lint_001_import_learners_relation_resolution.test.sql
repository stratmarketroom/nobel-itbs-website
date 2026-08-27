begin;

select plan(13);

select results_eq(
  $$
    select prosrc not like '%create temporary table%'
      and prosrc not like '%lrn_005_import_rows%'
    from pg_proc
    where oid = 'public.import_learners(jsonb)'::regprocedure
  $$,
  $$ values (true) $$,
  'learner import should not depend on a transaction-scoped temporary relation'
);

select results_eq(
  $$
    select prosrc like '%v_normalized_rows jsonb%'
      and prosrc like '%jsonb_agg(%'
      and prosrc like '%jsonb_to_recordset(v_normalized_rows)%'
    from pg_proc
    where oid = 'public.import_learners(jsonb)'::regprocedure
  $$,
  $$ values (true) $$,
  'learner import should reuse normalized rows through typed JSONB recordsets'
);

select results_eq(
  $$
    select prosecdef
      and 'search_path=internal, public, extensions, pg_temp' = any(proconfig)
    from pg_proc
    where oid = 'public.import_learners(jsonb)'::regprocedure
  $$,
  $$ values (true) $$,
  'the corrected function should preserve SECURITY DEFINER and its fixed search path'
);

select results_eq(
  $$
    select not has_function_privilege('anon', 'public.import_learners(jsonb)', 'execute')
      and not has_function_privilege('public', 'public.import_learners(jsonb)', 'execute')
      and has_function_privilege('authenticated', 'public.import_learners(jsonb)', 'execute')
  $$,
  $$ values (true) $$,
  'the corrected function should preserve its guarded execution boundary'
);

insert into auth.users (id)
values ('22222222-2222-4222-8222-222222222222');

insert into public.user_profiles (id, full_name, is_active, is_owner, mfa_required)
values (
  '22222222-2222-4222-8222-222222222222',
  'LRN lint rollback actor',
  true,
  false,
  true
);

insert into public.user_roles (user_id, role)
values ('22222222-2222-4222-8222-222222222222', 'credential_manager');

select set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","aal":"aal2","role":"authenticated"}',
  true
);

set local role authenticated;

select lives_ok(
  $$
    select public.import_learners(
      '[{"row_number":2,"latin_first_name":"Lintone","latin_last_name":"Rollback","ukrainian_full_name":"Лінт Один","email":"lint-one@example.invalid","phone":"+420700000001","has_telegram":false,"telegram_username":null,"has_viber":false,"has_whatsapp":false,"internal_note":null}]'::jsonb
    )
  $$,
  'the first learner import call should succeed'
);

select lives_ok(
  $$
    select public.import_learners(
      '[{"row_number":3,"latin_first_name":"Linttwo","latin_last_name":"Rollback","ukrainian_full_name":"Лінт Два","email":"lint-two@example.invalid","phone":"+420700000002","has_telegram":false,"telegram_username":null,"has_viber":false,"has_whatsapp":false,"internal_note":null}]'::jsonb
    )
  $$,
  'a second learner import call in the same transaction should also succeed'
);

select throws_ok(
  $$
    select public.import_learners(
      '[{"row_number":4,"latin_first_name":"Duplicate","latin_last_name":"Batch","ukrainian_full_name":"Дублікат Пакета","email":"duplicate-one@example.invalid","phone":"+420700000003","has_telegram":false,"telegram_username":null,"has_viber":false,"has_whatsapp":false,"internal_note":null},{"row_number":5,"latin_first_name":"Duplicate","latin_last_name":"Batch","ukrainian_full_name":"Дублікат Пакета","email":"duplicate-two@example.invalid","phone":"+420700000004","has_telegram":false,"telegram_username":null,"has_viber":false,"has_whatsapp":false,"internal_note":null}]'::jsonb
    )
  $$,
  '23505',
  'Learner import contains duplicate rows or contacts.',
  'the corrected function should retain duplicate rejection inside one batch'
);

select throws_ok(
  $$
    select public.import_learners(
      '[{"row_number":6,"latin_first_name":"Existing","latin_last_name":"Conflict","ukrainian_full_name":"Існуючий Конфлікт","email":"lint-one@example.invalid","phone":"+420700000005","has_telegram":false,"telegram_username":null,"has_viber":false,"has_whatsapp":false,"internal_note":null}]'::jsonb
    )
  $$,
  '23505',
  'Learner import conflicts with an existing learner or contact.',
  'the corrected function should retain existing-contact conflict rejection'
);

select throws_ok(
  $$
    select public.import_learners(
      '[{"row_number":null,"latin_first_name":"Invalid","latin_last_name":"Required","ukrainian_full_name":"Невалідне Поле","email":"invalid-required@example.invalid","phone":"+420700000006","has_telegram":false,"telegram_username":null,"has_viber":false,"has_whatsapp":false,"internal_note":null}]'::jsonb
    )
  $$,
  '22023',
  'Learner import contains invalid values.',
  'the corrected function should reject missing required normalized values explicitly'
);

reset role;

select results_eq(
  $$
    select count(*)::bigint
    from public.learners
    where lower(latin_last_name) = 'rollback'
  $$,
  $$ values (2::bigint) $$,
  'both same-transaction imports should persist their learner rows atomically'
);

select results_eq(
  $$
    select
      (select count(*) from public.learner_emails where email in ('lint-one@example.invalid', 'lint-two@example.invalid'))::bigint,
      (select count(*) from public.learner_phones where phone in ('+420700000001', '+420700000002'))::bigint
  $$,
  $$ values (2::bigint, 2::bigint) $$,
  'both same-transaction imports should preserve their normalized contacts'
);

select results_eq(
  $$
    select count(*)::bigint
    from public.audit_log
    where action = 'learners.imported'
      and actor_id = '22222222-2222-4222-8222-222222222222'
      and metadata = '{"count":1}'::jsonb
  $$,
  $$ values (2::bigint) $$,
  'each import should retain a separate count-only audit event'
);

select results_eq(
  $$ select to_regclass('pg_temp.lrn_005_import_rows') is null $$,
  $$ values (true) $$,
  'learner import should leave no temporary relation in the transaction'
);

select * from finish();

rollback;
