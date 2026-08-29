begin;

select plan(19);

select has_function(
  'public',
  'update_email_template',
  array['uuid', 'text', 'text'],
  'controlled email-template update function should exist'
);

select results_eq(
  $$ select prosecdef from pg_proc where oid = 'public.update_email_template(uuid,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'email-template update should be SECURITY DEFINER'
);

select results_eq(
  $$ select proconfig @> array['search_path=internal, public, pg_temp'] from pg_proc where oid = 'public.update_email_template(uuid,text,text)'::regprocedure $$,
  $$ values (true) $$,
  'email-template update should use a fixed search path'
);

select results_eq(
  $$ select has_function_privilege('authenticated', 'public.update_email_template(uuid,text,text)', 'execute') $$,
  $$ values (true) $$,
  'authenticated admins can reach the protected workflow'
);

select results_eq(
  $$ select has_function_privilege('anon', 'public.update_email_template(uuid,text,text)', 'execute') $$,
  $$ values (false) $$,
  'anonymous users cannot update email templates'
);

select results_eq(
  $$ select has_function_privilege('public', 'public.update_email_template(uuid,text,text)', 'execute') $$,
  $$ values (false) $$,
  'PUBLIC has no implicit email-template update access'
);

select results_eq(
  $$
    select prosrc like '%assert_sensitive_action_allowed%'
      and prosrc like '%owner%super_admin%credential_manager%'
      and prosrc not like '%content_manager%'
    from pg_proc
    where oid = 'public.update_email_template(uuid,text,text)'::regprocedure
  $$,
  $$ values (true) $$,
  'only the approved roles with the shared MFA guard can update templates'
);

select has_function(
  'internal',
  'audit_email_template_change',
  array[]::text[],
  'privacy-minimal email-template audit trigger should exist'
);

select has_trigger(
  'public',
  'email_templates',
  'email_templates_audit_change',
  'email-template updates should always be audited'
);

select results_eq(
  $$
    select prosrc like '%email_template.updated%'
      and prosrc like '%subject_changed%'
      and prosrc like '%body_changed%'
      and prosrc not like '%recipient_email%'
    from pg_proc
    where oid = 'internal.audit_email_template_change()'::regprocedure
  $$,
  $$ values (true) $$,
  'audit should record change flags without recipient data'
);

insert into auth.users (id)
values
  ('33333333-3333-4333-8333-333333333331'),
  ('33333333-3333-4333-8333-333333333332');

insert into public.user_profiles (id, full_name, is_active, is_owner, mfa_required)
values
  ('33333333-3333-4333-8333-333333333331', 'ADM EML credential actor', true, false, true),
  ('33333333-3333-4333-8333-333333333332', 'ADM EML content actor', true, false, false);

insert into public.user_roles (user_id, role)
values
  ('33333333-3333-4333-8333-333333333331', 'credential_manager'),
  ('33333333-3333-4333-8333-333333333332', 'content_manager');

select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-4333-8333-333333333331","aal":"aal2","role":"authenticated"}',
  true
);

set local role authenticated;

select lives_ok(
  $$
    select public.update_email_template(
      '00000000-0000-4000-8000-000000000801',
      'Transactional ADM-EML-001 subject',
      E'Transactional ADM-EML-001 body\n\n{{document_number}}\n{{verification_url}}'
    )
  $$,
  'Credential Manager with AAL2 should update an EN template'
);

select lives_ok(
  $$
    select public.update_email_template(
      '00000000-0000-4000-8000-000000000801',
      'Transactional ADM-EML-001 subject',
      E'Transactional ADM-EML-001 body\n\n{{document_number}}\n{{verification_url}}'
    )
  $$,
  'an unchanged retry should be idempotent'
);

reset role;

select results_eq(
  $$
    select updated_by
    from public.email_templates
    where id = '00000000-0000-4000-8000-000000000801'
  $$,
  $$ values ('33333333-3333-4333-8333-333333333331'::uuid) $$,
  'the acting admin should be stored as updated_by'
);

select results_eq(
  $$
    select count(*)::bigint
    from public.audit_log
    where action = 'email_template.updated'
      and actor_id = '33333333-3333-4333-8333-333333333331'
      and target_id = '00000000-0000-4000-8000-000000000801'
  $$,
  $$ values (1::bigint) $$,
  'one changed update and one unchanged retry should create one audit event'
);

select results_eq(
  $$
    select metadata
    from public.audit_log
    where action = 'email_template.updated'
      and actor_id = '33333333-3333-4333-8333-333333333331'
      and target_id = '00000000-0000-4000-8000-000000000801'
  $$,
  $$
    values (
      '{"body_changed":true,"language_code":"en","subject_changed":true,"template_key":"credential_delivery"}'::jsonb
    )
  $$,
  'audit metadata should contain only template identity and change flags'
);

select results_eq(
  $$
    select count(*)::bigint
    from public.audit_log
    where action = 'email_template.updated'
      and metadata::text like '%Transactional ADM-EML-001%'
  $$,
  $$ values (0::bigint) $$,
  'audit should not copy email subject or body text'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-4333-8333-333333333332","aal":"aal2","role":"authenticated"}',
  true
);

set local role authenticated;

select throws_ok(
  $$
    select public.update_email_template(
      '00000000-0000-4000-8000-000000000802',
      'Forbidden subject',
      'Forbidden body'
    )
  $$,
  '42501',
  'Required role is missing for this action.',
  'Content Manager should be denied template updates'
);

select set_config(
  'request.jwt.claims',
  '{"sub":"33333333-3333-4333-8333-333333333331","aal":"aal1","role":"authenticated"}',
  true
);

select throws_ok(
  $$
    select public.update_email_template(
      '00000000-0000-4000-8000-000000000802',
      'AAL1 subject',
      'AAL1 body'
    )
  $$,
  '42501',
  'MFA/AAL2 is required for this action.',
  'Credential Manager at AAL1 should be denied template updates'
);

reset role;

select results_eq(
  $$
    select count(*)::bigint
    from public.audit_log
    where action = 'email_template.updated'
      and actor_id in (
        '33333333-3333-4333-8333-333333333331',
        '33333333-3333-4333-8333-333333333332'
      )
  $$,
  $$ values (1::bigint) $$,
  'denied calls should not write audit events'
);

select * from finish();

rollback;
