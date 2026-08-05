begin;

select plan(29);

select has_type('public', 'contact_submission_type', 'contact submission type enum should exist');
select has_type('public', 'contact_submission_status', 'contact submission status enum should exist');
select has_table('public', 'contact_submissions', 'private contact submission table should exist');
select has_column('public', 'contact_submissions', 'id', 'submission id should exist');
select has_column('public', 'contact_submissions', 'type', 'submission type should exist');
select has_column('public', 'contact_submissions', 'status', 'submission status should exist');
select has_column('public', 'contact_submissions', 'programme_id', 'source programme should exist');
select has_column('public', 'contact_submissions', 'name', 'contact name should exist');
select has_column('public', 'contact_submissions', 'email', 'contact email should exist');
select has_column('public', 'contact_submissions', 'phone', 'optional phone should exist');
select has_column('public', 'contact_submissions', 'message', 'message should exist');
select has_column('public', 'contact_submissions', 'language_code', 'website locale should exist');
select has_column('public', 'contact_submissions', 'metadata', 'minimal form metadata should exist');
select has_column('public', 'contact_submissions', 'created_at', 'creation timestamp should exist');
select has_column('public', 'contact_submissions', 'updated_at', 'update timestamp should exist');

select has_function(
  'public',
  'create_programme_question_submission',
  array['text', 'text', 'text', 'text', 'text', 'text', 'text', 'text'],
  'server-only programme question function should exist'
);
select has_trigger('public', 'contact_submissions', 'contact_submissions_set_updated_at', 'contact submissions should maintain updated_at');
select results_eq(
  $$ select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.contact_submissions'::regclass $$,
  $$ values (true) $$,
  'contact submissions should use forced RLS'
);
select policies_are(
  'public',
  'contact_submissions',
  array['contact_submissions_authorized_read', 'contact_submissions_authorized_update'],
  'only explicitly authorized admin roles should have read and status-update policies'
);
select results_eq(
  $$ select has_table_privilege('anon', 'public.contact_submissions', 'select') $$,
  $$ values (false) $$,
  'anonymous users must not read contact submissions'
);
select results_eq(
  $$ select has_table_privilege('authenticated', 'public.contact_submissions', 'select') $$,
  $$ values (true) $$,
  'authenticated admins should receive select privilege subject to RLS'
);
select results_eq(
  $$ select has_function_privilege('anon', 'public.create_programme_question_submission(text,text,text,text,text,text,text,text)', 'execute') $$,
  $$ values (false) $$,
  'anonymous users must not execute the insertion function directly'
);

select lives_ok(
  $$ select public.create_programme_question_submission(
       'general-psychology', '  Test Person  ', '  PERSON@EXAMPLE.COM ', '',
       'A sufficiently detailed programme question.', 'ua', repeat('a', 64), '/ua/privacy-policy'
     ) $$,
  'server workflow should create a valid programme-linked question'
);
select results_eq(
  $$ select submission.type::text, submission.status::text, programme.slug, submission.name, submission.email, submission.language_code
     from public.contact_submissions submission
     join public.programmes programme on programme.id = submission.programme_id
     where submission.email = 'person@example.com' $$,
  $$ values ('programme_question'::text, 'new'::text, 'general-psychology'::text, 'Test Person'::text, 'person@example.com'::text, 'ua'::text) $$,
  'programme context, normalized contact data, locale, type, and new status should be stored'
);
select results_eq(
  $$ select metadata ->> 'privacy_notice_path', metadata ->> 'privacy_acknowledged'
     from public.contact_submissions where email = 'person@example.com' $$,
  $$ values ('/ua/privacy-policy'::text, 'true'::text) $$,
  'privacy acknowledgement context should be retained without raw IP data'
);
select throws_ok(
  $$ select public.create_programme_question_submission(
       'missing-programme', 'Test Person', 'person2@example.com', '',
       'A sufficiently detailed programme question.', 'en', repeat('b', 64), '/privacy-policy'
     ) $$,
  'P0002', 'PROGRAMME_NOT_FOUND',
  'unknown or unpublished programme slugs should not create submissions'
);

select results_eq(
  $$ select count(*)::bigint from (
       select public.create_programme_question_submission('general-psychology', 'Test Person', 'person3@example.com', '', 'A sufficiently detailed programme question.', 'en', repeat('a', 64), '/privacy-policy')
       union all
       select public.create_programme_question_submission('general-psychology', 'Test Person', 'person4@example.com', '', 'A sufficiently detailed programme question.', 'en', repeat('a', 64), '/privacy-policy')
       union all
       select public.create_programme_question_submission('general-psychology', 'Test Person', 'person5@example.com', '', 'A sufficiently detailed programme question.', 'en', repeat('a', 64), '/privacy-policy')
       union all
       select public.create_programme_question_submission('general-psychology', 'Test Person', 'person6@example.com', '', 'A sufficiently detailed programme question.', 'en', repeat('a', 64), '/privacy-policy')
     ) accepted $$,
  $$ values (4::bigint) $$,
  'five requests in one rate window should be accepted in total'
);
select throws_ok(
  $$ select public.create_programme_question_submission(
       'general-psychology', 'Test Person', 'person7@example.com', '',
       'A sufficiently detailed programme question.', 'en', repeat('a', 64), '/privacy-policy'
     ) $$,
  'P0001', 'CONTACT_RATE_LIMITED',
  'the sixth request in fifteen minutes should be rate limited'
);

select results_eq(
  $$ select count(*)::bigint from information_schema.routine_privileges
     where routine_schema = 'public'
       and routine_name = 'create_programme_question_submission'
       and grantee in ('PUBLIC', 'anon', 'authenticated') $$,
  $$ values (0::bigint) $$,
  'public and browser roles should have no insertion-function grant'
);

select * from finish();

rollback;
