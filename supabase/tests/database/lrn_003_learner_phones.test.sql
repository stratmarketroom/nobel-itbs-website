begin;

select plan(32);

select has_table('public', 'learner_phones', 'learner_phones table should exist');
select col_is_pk('public', 'learner_phones', 'id', 'learner_phones.id should be the primary key');
select has_column('public', 'learner_phones', 'learner_id', 'learner reference should exist');
select has_column('public', 'learner_phones', 'phone', 'phone should exist');
select has_column('public', 'learner_phones', 'has_telegram', 'Telegram flag should exist');
select has_column('public', 'learner_phones', 'telegram_username', 'Telegram username should exist');
select has_column('public', 'learner_phones', 'has_viber', 'Viber flag should exist');
select has_column('public', 'learner_phones', 'has_whatsapp', 'WhatsApp flag should exist');
select has_column('public', 'learner_phones', 'is_primary', 'primary flag should exist');
select col_not_null('public', 'learner_phones', 'learner_id', 'learner reference should be required');
select col_not_null('public', 'learner_phones', 'phone', 'phone should be required');
select col_not_null('public', 'learner_phones', 'has_telegram', 'Telegram flag should be required');
select col_not_null('public', 'learner_phones', 'has_viber', 'Viber flag should be required');
select col_not_null('public', 'learner_phones', 'has_whatsapp', 'WhatsApp flag should be required');
select col_not_null('public', 'learner_phones', 'is_primary', 'primary flag should be required');

select results_eq(
  $$
    select column_name, column_default
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'learner_phones'
      and column_name in ('has_telegram', 'has_viber', 'has_whatsapp', 'is_primary')
    order by column_name
  $$,
  $$
    values
      ('has_telegram'::text, 'false'::text),
      ('has_viber'::text, 'false'::text),
      ('has_whatsapp'::text, 'false'::text),
      ('is_primary'::text, 'false'::text)
  $$,
  'messenger and primary flags should default to false'
);

select results_eq(
  $$ select count(*)::bigint
     from pg_constraint
     where conrelid = 'public.learner_phones'::regclass
       and contype = 'f'
       and confrelid = 'public.learners'::regclass $$,
  $$ values (1::bigint) $$,
  'learner phone should reference learners'
);

select results_eq(
  $$ select count(*)::bigint
     from pg_constraint
     where conrelid = 'public.learner_phones'::regclass
       and contype = 'u' $$,
  $$ values (1::bigint) $$,
  'phone should have one global unique constraint'
);

select results_eq(
  $$ select count(*)::bigint
     from pg_constraint
     where conrelid = 'public.learner_phones'::regclass
       and contype = 'c'
       and conname in (
         'learner_phones_phone_canonical',
         'learner_phones_telegram_username_trimmed',
         'learner_phones_telegram_username_requires_flag'
       ) $$,
  $$ values (3::bigint) $$,
  'canonical phone and Telegram consistency checks should exist'
);

select has_index('public', 'learner_phones', 'learner_phones_learner_id_idx', 'learner lookup index should exist');
select has_index('public', 'learner_phones', 'learner_phones_one_primary_idx', 'one-primary partial index should exist');
select has_trigger('public', 'learner_phones', 'learner_phones_set_updated_at', 'learner phones should maintain updated_at');

select is(
  (select relrowsecurity from pg_class where oid = 'public.learner_phones'::regclass),
  true,
  'learner phones should have RLS enabled'
);

select is(
  (select relforcerowsecurity from pg_class where oid = 'public.learner_phones'::regclass),
  true,
  'learner phones should force RLS'
);

select policies_are(
  'public',
  'learner_phones',
  array[
    'learner_phones_authorized_delete',
    'learner_phones_authorized_insert',
    'learner_phones_authorized_read',
    'learner_phones_authorized_update'
  ],
  'learner phones should expose only authorized CRUD policies'
);

select results_eq(
  $$ select has_table_privilege('anon', 'public.learner_phones', 'select') $$,
  $$ values (false) $$,
  'anonymous users must not read learner phones'
);

select results_eq(
  $$ select has_table_privilege('authenticated', 'public.learner_phones', 'select') $$,
  $$ values (true) $$,
  'authenticated admins receive select privilege subject to RLS'
);

select results_eq(
  $$ select has_column_privilege('authenticated', 'public.learner_phones', 'phone', 'insert') $$,
  $$ values (true) $$,
  'authenticated admins may insert controlled phone fields subject to RLS'
);

select results_eq(
  $$ select has_column_privilege('authenticated', 'public.learner_phones', 'id', 'insert') $$,
  $$ values (false) $$,
  'authenticated admins cannot supply internal phone IDs'
);

select results_eq(
  $$ select has_column_privilege('authenticated', 'public.learner_phones', 'learner_id', 'update') $$,
  $$ values (false) $$,
  'authenticated admins cannot move a phone between learners'
);

select results_eq(
  $$ select has_table_privilege('authenticated', 'public.learner_phones', 'delete') $$,
  $$ values (true) $$,
  'authorized admins may remove learner phone entries subject to RLS'
);

select results_eq(
  $$ select count(*)::bigint
     from pg_policies
     where schemaname = 'public'
       and tablename = 'learner_phones'
       and coalesce(qual, with_check, '') like '%owner%'
       and coalesce(qual, with_check, '') like '%super_admin%'
       and coalesce(qual, with_check, '') like '%credential_manager%'
       and coalesce(qual, with_check, '') not like '%content_manager%'
       and coalesce(qual, with_check, '') like '%is_mfa_requirement_satisfied%' $$,
  $$ values (4::bigint) $$,
  'every phone policy should require an approved role and satisfied MFA without Content Manager access'
);

select * from finish();

rollback;
