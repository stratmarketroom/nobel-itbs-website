begin;

select plan(64);

select has_table('public', 'credential_history', 'credential history table should exist');
select col_is_pk('public', 'credential_history', 'id', 'credential history ID should be the primary key');
select has_column('public', 'credential_history', 'credential_id', 'history should reference a credential');
select has_column('public', 'credential_history', 'event_type', 'history event type should exist');
select has_column('public', 'credential_history', 'actor_id', 'history actor should exist');
select has_column('public', 'credential_history', 'reason', 'optional history reason should exist');
select has_column('public', 'credential_history', 'before_data', 'minimal before state should exist');
select has_column('public', 'credential_history', 'after_data', 'minimal after state should exist');
select has_column('public', 'credential_history', 'created_at', 'history creation timestamp should exist');
select results_eq(
  $$ select count(*)::bigint from pg_constraint where conrelid = 'public.credential_history'::regclass and contype = 'f' $$,
  $$ values (2::bigint) $$,
  'history should reference credentials and user profiles'
);
select results_eq(
  $$ select count(*)::bigint from pg_constraint where conrelid = 'public.credential_history'::regclass and contype = 'c' and conname in ('credential_history_event_type_format', 'credential_history_reason_not_blank', 'credential_history_before_data_object', 'credential_history_after_data_object', 'credential_history_forbidden_data_keys') $$,
  $$ values (5::bigint) $$,
  'history should constrain event names, reason, JSON shape, and forbidden sensitive keys'
);
select has_index('public', 'credential_history', 'credential_history_credential_created_idx', 'credential timeline should be indexed');
select has_index('public', 'credential_history', 'credential_history_event_created_idx', 'history event searches should be indexed');
select has_trigger('public', 'credential_history', 'credential_history_prevent_mutation', 'history rows should be append-only');
select has_trigger('public', 'credential_history', 'credential_history_prevent_truncate', 'history truncation should be denied');
select is((select relrowsecurity from pg_class where oid = 'public.credential_history'::regclass), true, 'credential history should enable RLS');
select is((select relforcerowsecurity from pg_class where oid = 'public.credential_history'::regclass), true, 'credential history should force RLS');
select policies_are('public', 'credential_history', array['credential_history_authorized_read'], 'history should expose only authorized private read');
select results_eq($$ select has_table_privilege('anon', 'public.credential_history', 'select') $$, $$ values (false) $$, 'anonymous users cannot read credential history');
select results_eq($$ select has_table_privilege('authenticated', 'public.credential_history', 'select') $$, $$ values (true) $$, 'credential actors can read history subject to RLS');
select results_eq($$ select has_table_privilege('authenticated', 'public.credential_history', 'insert') $$, $$ values (false) $$, 'authenticated users cannot append history directly');
select results_eq($$ select has_table_privilege('authenticated', 'public.credential_history', 'update') $$, $$ values (false) $$, 'authenticated users cannot edit history');
select results_eq($$ select has_table_privilege('authenticated', 'public.credential_history', 'delete') $$, $$ values (false) $$, 'authenticated users cannot delete history');
select results_eq($$ select has_table_privilege('service_role', 'public.credential_history', 'insert') $$, $$ values (false) $$, 'service role cannot bypass the controlled history writer with direct insert');

select has_function('internal', 'write_credential_history', array['uuid', 'text', 'text', 'jsonb', 'jsonb'], 'controlled internal history writer should exist');
select function_returns('internal', 'write_credential_history', array['uuid', 'text', 'text', 'jsonb', 'jsonb'], 'uuid', 'history writer should return its event ID');
select has_trigger('public', 'credentials', 'credentials_record_core_history', 'credential creation, moves, and statuses should record history');
select has_trigger('public', 'document_number_log', 'document_number_log_record_history', 'linked document-number changes should record history');
select has_trigger('public', 'credential_files', 'credential_files_record_history', 'PDF metadata events should record history');

select has_table('public', 'credential_notes', 'credential notes table should exist');
select col_is_pk('public', 'credential_notes', 'id', 'credential note ID should be the primary key');
select has_column('public', 'credential_notes', 'credential_id', 'note should reference a credential');
select has_column('public', 'credential_notes', 'author_id', 'note author should exist');
select has_column('public', 'credential_notes', 'body', 'current note text should exist');
select has_column('public', 'credential_notes', 'deleted_at', 'soft-delete timestamp should exist');
select has_column('public', 'credential_notes', 'deleted_by', 'soft-delete actor should exist');
select has_column('public', 'credential_notes', 'created_at', 'note creation timestamp should exist');
select has_column('public', 'credential_notes', 'updated_at', 'note update timestamp should exist');
select results_eq(
  $$ select count(*)::bigint from pg_constraint where conrelid = 'public.credential_notes'::regclass and contype = 'f' $$,
  $$ values (3::bigint) $$,
  'notes should reference credential, author, and deletion actor'
);
select results_eq(
  $$ select count(*)::bigint from pg_constraint where conrelid = 'public.credential_notes'::regclass and contype = 'c' and conname in ('credential_notes_body_not_blank', 'credential_notes_delete_consistency') $$,
  $$ values (2::bigint) $$,
  'notes should constrain current text and soft-delete consistency'
);
select has_index('public', 'credential_notes', 'credential_notes_credential_created_idx', 'credential note listing should be indexed');
select has_index('public', 'credential_notes', 'credential_notes_author_idx', 'note authorship should be indexed');
select has_trigger('public', 'credential_notes', 'credential_notes_set_updated_at', 'notes should maintain updated_at');
select has_trigger('public', 'credential_notes', 'credential_notes_enforce_mutation', 'note identity and soft deletion should be enforced');
select has_trigger('public', 'credential_notes', 'credential_notes_record_event', 'note create/edit/delete should record history and audit');
select is((select relrowsecurity from pg_class where oid = 'public.credential_notes'::regclass), true, 'credential notes should enable RLS');
select is((select relforcerowsecurity from pg_class where oid = 'public.credential_notes'::regclass), true, 'credential notes should force RLS');
select policies_are('public', 'credential_notes', array['credential_notes_authorized_read'], 'notes should expose only authorized private read');
select results_eq($$ select has_table_privilege('anon', 'public.credential_notes', 'select') $$, $$ values (false) $$, 'anonymous users cannot read credential notes');
select results_eq($$ select has_table_privilege('authenticated', 'public.credential_notes', 'select') $$, $$ values (true) $$, 'credential actors can read notes subject to RLS');
select results_eq($$ select has_table_privilege('authenticated', 'public.credential_notes', 'insert') $$, $$ values (false) $$, 'authenticated users cannot insert notes directly');
select results_eq($$ select has_table_privilege('authenticated', 'public.credential_notes', 'update') $$, $$ values (false) $$, 'authenticated users cannot update notes directly');
select results_eq($$ select has_table_privilege('authenticated', 'public.credential_notes', 'delete') $$, $$ values (false) $$, 'authenticated users cannot hard-delete notes');
select results_eq($$ select has_table_privilege('service_role', 'public.credential_notes', 'insert') $$, $$ values (false) $$, 'service role cannot bypass controlled note functions with direct insert');

select has_function('public', 'add_credential_note', array['uuid', 'text'], 'controlled note creation function should exist');
select has_function('public', 'update_credential_note', array['uuid', 'text'], 'author-only note edit function should exist');
select has_function('public', 'delete_credential_note', array['uuid'], 'controlled soft-delete function should exist');
select function_returns('public', 'add_credential_note', array['uuid', 'text'], 'public.credential_notes', 'note creation should return the note');
select function_returns('public', 'update_credential_note', array['uuid', 'text'], 'public.credential_notes', 'note update should return the note');
select function_returns('public', 'delete_credential_note', array['uuid'], 'public.credential_notes', 'note deletion should return the soft-deleted note');
select results_eq(
  $$ select count(*)::bigint from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname in ('add_credential_note', 'update_credential_note', 'delete_credential_note') and has_function_privilege('authenticated', p.oid, 'execute') $$,
  $$ values (3::bigint) $$,
  'authenticated actors should call all three controlled note functions'
);
select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' and tablename in ('credential_history', 'credential_notes') and coalesce(qual, with_check, '') like '%is_mfa_requirement_satisfied%' $$,
  $$ values (2::bigint) $$,
  'every history and note read policy should enforce MFA'
);
select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' and tablename in ('credential_history', 'credential_notes') and coalesce(qual, with_check, '') like '%credential_manager%' $$,
  $$ values (2::bigint) $$,
  'Credential Manager should read history and notes after MFA'
);
select results_eq(
  $$ select count(*)::bigint from pg_policies where schemaname = 'public' and tablename in ('credential_history', 'credential_notes') and coalesce(qual, with_check, '') like '%content_manager%' $$,
  $$ values (0::bigint) $$,
  'Content Manager must not appear in history or note policies'
);

select * from finish();

rollback;
