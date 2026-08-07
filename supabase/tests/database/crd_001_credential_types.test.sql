begin;

select plan(38);

select has_table('public', 'credential_types', 'credential_types table should exist');
select col_is_pk('public', 'credential_types', 'id', 'credential type ID should be the primary key');
select has_column('public', 'credential_types', 'code', 'credential type code should exist');
select has_column('public', 'credential_types', 'document_letter', 'document number letter should exist');
select has_column('public', 'credential_types', 'is_active', 'active flag should exist');
select col_not_null('public', 'credential_types', 'code', 'credential type code should be required');
select col_not_null('public', 'credential_types', 'document_letter', 'document letter should be required');
select col_not_null('public', 'credential_types', 'is_active', 'active flag should be required');

select results_eq(
  $$ select column_default from information_schema.columns where table_schema = 'public' and table_name = 'credential_types' and column_name = 'is_active' $$,
  $$ values ('true'::text) $$,
  'credential types should be active by default'
);

select results_eq(
  $$ select count(*)::bigint from pg_constraint where conrelid = 'public.credential_types'::regclass and contype = 'u' $$,
  $$ values (1::bigint) $$,
  'credential type code should be unique'
);

select results_eq(
  $$ select count(*)::bigint from pg_constraint where conrelid = 'public.credential_types'::regclass and contype = 'c' and conname in ('credential_types_code_format', 'credential_types_document_letter_format') $$,
  $$ values (2::bigint) $$,
  'credential type code and document letter formats should be constrained'
);

select results_eq(
  $$ select code, document_letter, is_active from public.credential_types order by code $$,
  $$ values ('certificate'::text, 'C'::text, true), ('diploma'::text, 'D'::text, true) $$,
  'Certificate and Diploma should be seeded with approved letters'
);

select has_table('public', 'credential_type_translations', 'credential type translations should exist');
select col_is_pk('public', 'credential_type_translations', array['credential_type_id', 'language_code'], 'type and language should form the primary key');
select col_not_null('public', 'credential_type_translations', 'display_name', 'localized display name should be required');

select results_eq(
  $$ select count(*)::bigint from pg_constraint where conrelid = 'public.credential_type_translations'::regclass and contype = 'f' $$,
  $$ values (2::bigint) $$,
  'translations should reference credential types and languages'
);

select results_eq(
  $$ select count(*)::bigint from pg_constraint where conrelid = 'public.credential_type_translations'::regclass and contype = 'c' and conname = 'credential_type_translations_display_name_not_blank' $$,
  $$ values (1::bigint) $$,
  'localized labels should be trimmed and non-empty'
);

select results_eq(
  $$ select type_record.code, translation.language_code, translation.display_name
     from public.credential_types type_record
     join public.credential_type_translations translation on translation.credential_type_id = type_record.id
     order by type_record.code, translation.language_code $$,
  $$ values
    ('certificate'::text, 'cz'::text, 'Certifikát'::text),
    ('certificate'::text, 'en'::text, 'Certificate'::text),
    ('certificate'::text, 'ua'::text, 'Сертифікат'::text),
    ('diploma'::text, 'cz'::text, 'Diplom'::text),
    ('diploma'::text, 'en'::text, 'Diploma'::text),
    ('diploma'::text, 'ua'::text, 'Диплом'::text) $$,
  'EN, UA, and CZ labels should be seeded'
);

select has_index('public', 'credential_type_translations', 'credential_type_translations_language_idx', 'language lookup index should exist');
select has_trigger('public', 'credential_types', 'credential_types_set_updated_at', 'credential types should maintain updated_at');
select has_trigger('public', 'credential_type_translations', 'credential_type_translations_set_updated_at', 'translations should maintain updated_at');

select is((select relrowsecurity from pg_class where oid = 'public.credential_types'::regclass), true, 'credential types should enable RLS');
select is((select relforcerowsecurity from pg_class where oid = 'public.credential_types'::regclass), true, 'credential types should force RLS');
select is((select relrowsecurity from pg_class where oid = 'public.credential_type_translations'::regclass), true, 'credential type translations should enable RLS');
select is((select relforcerowsecurity from pg_class where oid = 'public.credential_type_translations'::regclass), true, 'credential type translations should force RLS');

select policies_are('public', 'credential_types', array['credential_types_admin_insert', 'credential_types_admin_update', 'credential_types_authorized_read'], 'credential types should expose only approved policies');
select policies_are('public', 'credential_type_translations', array['credential_type_translations_admin_insert', 'credential_type_translations_admin_update', 'credential_type_translations_authorized_read'], 'translations should expose only approved policies');

select results_eq($$ select has_table_privilege('anon', 'public.credential_types', 'select') $$, $$ values (false) $$, 'anonymous clients must not read credential types directly');
select results_eq($$ select has_table_privilege('authenticated', 'public.credential_types', 'select') $$, $$ values (true) $$, 'authenticated admins receive select privilege subject to RLS');
select results_eq($$ select has_table_privilege('authenticated', 'public.credential_types', 'delete') $$, $$ values (false) $$, 'authenticated admins must deactivate instead of deleting types');
select results_eq($$ select has_column_privilege('authenticated', 'public.credential_types', 'code', 'insert') $$, $$ values (true) $$, 'authorized admins may insert controlled type fields');
select results_eq($$ select has_column_privilege('authenticated', 'public.credential_types', 'id', 'insert') $$, $$ values (false) $$, 'authenticated admins cannot supply internal type IDs');
select results_eq($$ select has_column_privilege('authenticated', 'public.credential_type_translations', 'display_name', 'update') $$, $$ values (true) $$, 'authorized admins may update localized labels');
select results_eq($$ select has_column_privilege('authenticated', 'public.credential_type_translations', 'language_code', 'update') $$, $$ values (false) $$, 'translation language cannot be changed in place');

select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' and tablename in ('credential_types', 'credential_type_translations') and coalesce(qual, with_check, '') like '%is_mfa_requirement_satisfied%' $$,
  $$ values (6::bigint) $$,
  'every credential type policy should enforce MFA'
);

select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' and tablename in ('credential_types', 'credential_type_translations') and coalesce(qual, with_check, '') like '%content_manager%' $$,
  $$ values (0::bigint) $$,
  'Content Manager must not appear in credential type policies'
);

select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' and tablename in ('credential_types', 'credential_type_translations') and policyname like '%authorized_read' and coalesce(qual, '') like '%credential_manager%' $$,
  $$ values (2::bigint) $$,
  'Credential Manager should read both reference tables after MFA'
);

select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' and tablename in ('credential_types', 'credential_type_translations') and policyname like '%admin_%' and coalesce(qual, with_check, '') like '%credential_manager%' $$,
  $$ values (0::bigint) $$,
  'Credential Manager should not mutate the credential type configuration'
);

select * from finish();

rollback;
