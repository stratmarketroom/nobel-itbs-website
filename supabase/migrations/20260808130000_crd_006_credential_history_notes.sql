-- CRD-006: Credential History and Notes
-- Private append-only credential history and controlled internal comments.

create table public.credential_history (
  id uuid primary key default extensions.gen_random_uuid(),
  credential_id uuid not null references public.credentials(id) on delete restrict,
  event_type text not null,
  actor_id uuid null references public.user_profiles(id) on delete set null,
  reason text null,
  before_data jsonb null,
  after_data jsonb null,
  created_at timestamptz not null default now(),
  constraint credential_history_event_type_format check (
    event_type ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'
  ),
  constraint credential_history_reason_not_blank check (
    reason is null
    or (
      reason = btrim(reason)
      and reason <> ''
    )
  ),
  constraint credential_history_before_data_object check (
    before_data is null or jsonb_typeof(before_data) = 'object'
  ),
  constraint credential_history_after_data_object check (
    after_data is null or jsonb_typeof(after_data) = 'object'
  ),
  constraint credential_history_forbidden_data_keys check (
    not (
      coalesce(before_data, '{}'::jsonb) ?| array[
        'raw_token',
        'token',
        'verification_token_encrypted',
        'verification_token_lookup_hash',
        'storage_path',
        'file_content',
        'body',
        'email',
        'phone'
      ]
      or coalesce(after_data, '{}'::jsonb) ?| array[
        'raw_token',
        'token',
        'verification_token_encrypted',
        'verification_token_lookup_hash',
        'storage_path',
        'file_content',
        'body',
        'email',
        'phone'
      ]
    )
  )
);

comment on table public.credential_history is
  'Private append-only timeline for credential status, public-data, PDF, email, number, set, note, and important administrative events.';
comment on column public.credential_history.before_data is
  'Minimal non-sensitive state before an event. Never stores token material, private paths/content, contact data, or note text.';
comment on column public.credential_history.after_data is
  'Minimal non-sensitive state after an event. Never stores token material, private paths/content, contact data, or note text.';

create index credential_history_credential_created_idx
  on public.credential_history (credential_id, created_at desc, id desc);

create index credential_history_event_created_idx
  on public.credential_history (event_type, created_at desc);

create or replace function internal.prevent_credential_history_mutation()
returns trigger
language plpgsql
set search_path = pg_catalog, pg_temp
as $$
begin
  raise exception 'credential history is append-only'
    using errcode = '42501';
end;
$$;

comment on function internal.prevent_credential_history_mutation() is
  'Blocks update, delete, and truncate operations on credential history.';

revoke all on function internal.prevent_credential_history_mutation()
  from public, anon, authenticated;
grant execute on function internal.prevent_credential_history_mutation()
  to postgres, service_role;

create trigger credential_history_prevent_mutation
before update or delete on public.credential_history
for each row execute function internal.prevent_credential_history_mutation();

create trigger credential_history_prevent_truncate
before truncate on public.credential_history
for each statement execute function internal.prevent_credential_history_mutation();

create or replace function internal.write_credential_history(
  p_credential_id uuid,
  p_event_type text,
  p_reason text default null,
  p_before_data jsonb default null,
  p_after_data jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_history_id uuid;
begin
  insert into public.credential_history (
    credential_id,
    event_type,
    actor_id,
    reason,
    before_data,
    after_data
  )
  values (
    p_credential_id,
    p_event_type,
    auth.uid(),
    nullif(btrim(p_reason), ''),
    p_before_data,
    p_after_data
  )
  returning id into v_history_id;

  return v_history_id;
end;
$$;

comment on function internal.write_credential_history(uuid, text, text, jsonb, jsonb) is
  'Writes one private credential-history event and derives the actor from auth.uid(). Inputs must contain only minimal non-sensitive context.';

revoke all on function internal.write_credential_history(uuid, text, text, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function internal.write_credential_history(uuid, text, text, jsonb, jsonb)
  to postgres, service_role;

create or replace function internal.record_credential_core_history()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    perform internal.write_credential_history(
      p_credential_id => new.id,
      p_event_type => 'credential.created_pending',
      p_after_data => jsonb_build_object(
        'status', new.status,
        'credential_type_id', new.credential_type_id,
        'language_code', new.language_code
      )
    );

    return new;
  end if;

  if old.credential_set_id is distinct from new.credential_set_id then
    perform internal.write_credential_history(
      p_credential_id => new.id,
      p_event_type => 'credential.set_moved',
      p_before_data => jsonb_build_object('credential_set_id', old.credential_set_id),
      p_after_data => jsonb_build_object('credential_set_id', new.credential_set_id)
    );
  end if;

  if old.status is distinct from new.status then
    perform internal.write_credential_history(
      p_credential_id => new.id,
      p_event_type => 'credential.status_changed',
      p_reason => coalesce(new.revocation_reason, new.void_reason),
      p_before_data => jsonb_build_object('status', old.status),
      p_after_data => jsonb_build_object('status', new.status)
    );
  end if;

  return new;
end;
$$;

comment on function internal.record_credential_core_history() is
  'Automatically records pending creation, set moves, and lifecycle status changes without token or learner data.';

revoke all on function internal.record_credential_core_history()
  from public, anon, authenticated;
grant execute on function internal.record_credential_core_history()
  to postgres, service_role;

create trigger credentials_record_core_history
after insert or update on public.credentials
for each row execute function internal.record_credential_core_history();

create or replace function internal.record_document_number_history()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
begin
  if old.status is distinct from new.status and new.credential_id is not null then
    perform internal.write_credential_history(
      p_credential_id => new.credential_id,
      p_event_type => case new.status
        when 'issued' then 'document_number.issued'
        when 'voided' then 'document_number.voided'
        else 'document_number.updated'
      end,
      p_reason => new.void_reason,
      p_before_data => jsonb_build_object('status', old.status),
      p_after_data => jsonb_build_object('status', new.status)
    );
  end if;

  return new;
end;
$$;

comment on function internal.record_document_number_history() is
  'Records linked document-number lifecycle events without copying the document number into credential history.';

revoke all on function internal.record_document_number_history()
  from public, anon, authenticated;
grant execute on function internal.record_document_number_history()
  to postgres, service_role;

create trigger document_number_log_record_history
after update on public.document_number_log
for each row execute function internal.record_document_number_history();

create or replace function internal.record_credential_file_history()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_event_type text;
begin
  if tg_op = 'INSERT' then
    v_event_type := 'credential_file.attached';

    perform internal.write_credential_history(
      p_credential_id => new.credential_id,
      p_event_type => v_event_type,
      p_after_data => jsonb_build_object(
        'credential_file_id', new.id,
        'file_type_id', new.file_type_id,
        'is_primary', new.is_primary,
        'size_bytes', new.size_bytes
      )
    );

    return new;
  end if;

  if tg_op = 'DELETE' then
    perform internal.write_credential_history(
      p_credential_id => old.credential_id,
      p_event_type => 'credential_file.deleted',
      p_before_data => jsonb_build_object(
        'credential_file_id', old.id,
        'file_type_id', old.file_type_id,
        'is_primary', old.is_primary,
        'size_bytes', old.size_bytes
      )
    );

    return old;
  end if;

  v_event_type := case
    when old.size_bytes is distinct from new.size_bytes
      or old.mime_type is distinct from new.mime_type
      or old.uploaded_by is distinct from new.uploaded_by
    then 'credential_file.replaced'
    else 'credential_file.updated'
  end;

  perform internal.write_credential_history(
    p_credential_id => new.credential_id,
    p_event_type => v_event_type,
    p_before_data => jsonb_build_object(
      'credential_file_id', old.id,
      'file_type_id', old.file_type_id,
      'is_primary', old.is_primary,
      'size_bytes', old.size_bytes
    ),
    p_after_data => jsonb_build_object(
      'credential_file_id', new.id,
      'file_type_id', new.file_type_id,
      'is_primary', new.is_primary,
      'size_bytes', new.size_bytes
    )
  );

  return new;
end;
$$;

comment on function internal.record_credential_file_history() is
  'Records private PDF metadata events without storing file paths, labels, or file content.';

revoke all on function internal.record_credential_file_history()
  from public, anon, authenticated;
grant execute on function internal.record_credential_file_history()
  to postgres, service_role;

create trigger credential_files_record_history
after insert or update or delete on public.credential_files
for each row execute function internal.record_credential_file_history();

create table public.credential_notes (
  id uuid primary key default extensions.gen_random_uuid(),
  credential_id uuid not null references public.credentials(id) on delete restrict,
  author_id uuid not null references public.user_profiles(id) on delete restrict,
  body text not null,
  deleted_at timestamptz null,
  deleted_by uuid null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credential_notes_body_not_blank check (
    body = btrim(body)
    and body <> ''
  ),
  constraint credential_notes_delete_consistency check (
    (deleted_at is null and deleted_by is null)
    or (deleted_at is not null and deleted_by is not null)
  )
);

comment on table public.credential_notes is
  'Private internal credential comments. Current text is retained; edit/delete events are recorded without full text version history.';

create index credential_notes_credential_created_idx
  on public.credential_notes (credential_id, created_at desc, id desc);

create index credential_notes_author_idx
  on public.credential_notes (author_id, created_at desc);

create trigger credential_notes_set_updated_at
before update on public.credential_notes
for each row execute function internal.set_updated_at();

create or replace function internal.enforce_credential_note_mutation()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'credential notes use controlled soft deletion'
      using errcode = '23514';
  end if;

  if old.id is distinct from new.id
    or old.credential_id is distinct from new.credential_id
    or old.author_id is distinct from new.author_id
    or old.created_at is distinct from new.created_at then
    raise exception 'credential note identity fields are immutable'
      using errcode = '23514';
  end if;

  if old.deleted_at is not null then
    raise exception 'deleted credential notes are immutable'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function internal.enforce_credential_note_mutation() is
  'Prevents hard deletion, identity rewrites, and edits after a credential note is soft-deleted.';

revoke all on function internal.enforce_credential_note_mutation()
  from public, anon, authenticated;
grant execute on function internal.enforce_credential_note_mutation()
  to postgres, service_role;

create trigger credential_notes_enforce_mutation
before update or delete on public.credential_notes
for each row execute function internal.enforce_credential_note_mutation();

create or replace function internal.record_credential_note_event()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_event_type text;
begin
  v_event_type := case
    when tg_op = 'INSERT' then 'credential_note.created'
    when old.deleted_at is null and new.deleted_at is not null then 'credential_note.deleted'
    else 'credential_note.edited'
  end;

  perform internal.write_credential_history(
    p_credential_id => new.credential_id,
    p_event_type => v_event_type,
    p_after_data => jsonb_build_object('credential_note_id', new.id)
  );

  perform internal.write_audit_log(
    p_action => v_event_type,
    p_actor_id => auth.uid(),
    p_target_schema => 'public',
    p_target_table => 'credential_notes',
    p_target_id => new.id,
    p_metadata => jsonb_build_object('credential_id', new.credential_id)
  );

  return new;
end;
$$;

comment on function internal.record_credential_note_event() is
  'Records note create/edit/delete events in private history and global audit without copying note text.';

revoke all on function internal.record_credential_note_event()
  from public, anon, authenticated;
grant execute on function internal.record_credential_note_event()
  to postgres, service_role;

create trigger credential_notes_record_event
after insert or update on public.credential_notes
for each row execute function internal.record_credential_note_event();

alter table public.credential_history enable row level security;
alter table public.credential_history force row level security;
alter table public.credential_notes enable row level security;
alter table public.credential_notes force row level security;

revoke all on table public.credential_history from public, anon, authenticated, service_role;
revoke all on table public.credential_notes from public, anon, authenticated, service_role;

grant select on table public.credential_history to authenticated, service_role;
grant select on table public.credential_notes to authenticated, service_role;
grant select, insert on table public.credential_history to postgres;
grant select, insert, update on table public.credential_notes to postgres;

create policy credential_history_authorized_read
on public.credential_history
for select
to authenticated
using (
  internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);

create policy credential_notes_authorized_read
on public.credential_notes
for select
to authenticated
using (
  internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);

create or replace function public.add_credential_note(
  p_credential_id uuid,
  p_body text
)
returns public.credential_notes
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_note public.credential_notes;
begin
  if not internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
    or not internal.is_mfa_requirement_satisfied() then
    raise exception 'credential role with MFA is required'
      using errcode = '42501';
  end if;

  if p_credential_id is null or nullif(btrim(p_body), '') is null then
    raise exception 'credential and note body are required'
      using errcode = '22023';
  end if;

  insert into public.credential_notes (credential_id, author_id, body)
  values (p_credential_id, auth.uid(), btrim(p_body))
  returning * into v_note;

  return v_note;
end;
$$;

comment on function public.add_credential_note(uuid, text) is
  'Adds a private credential note for an authorized MFA-verified credential actor; author is always auth.uid().';

revoke all on function public.add_credential_note(uuid, text)
  from public, anon, authenticated;
grant execute on function public.add_credential_note(uuid, text)
  to authenticated, postgres, service_role;

create or replace function public.update_credential_note(
  p_note_id uuid,
  p_body text
)
returns public.credential_notes
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_note public.credential_notes;
begin
  if not internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
    or not internal.is_mfa_requirement_satisfied() then
    raise exception 'credential role with MFA is required'
      using errcode = '42501';
  end if;

  if p_note_id is null or nullif(btrim(p_body), '') is null then
    raise exception 'note and note body are required'
      using errcode = '22023';
  end if;

  select note.*
    into v_note
  from public.credential_notes note
  where note.id = p_note_id
  for update;

  if v_note.id is null or v_note.deleted_at is not null then
    raise exception 'active credential note not found'
      using errcode = '22023';
  end if;

  if v_note.author_id <> auth.uid() then
    raise exception 'only the note author can edit this credential note'
      using errcode = '42501';
  end if;

  update public.credential_notes note
  set body = btrim(p_body)
  where note.id = p_note_id
  returning note.* into v_note;

  return v_note;
end;
$$;

comment on function public.update_credential_note(uuid, text) is
  'Edits the current text of an active private note only when auth.uid() is its author.';

revoke all on function public.update_credential_note(uuid, text)
  from public, anon, authenticated;
grant execute on function public.update_credential_note(uuid, text)
  to authenticated, postgres, service_role;

create or replace function public.delete_credential_note(p_note_id uuid)
returns public.credential_notes
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_note public.credential_notes;
begin
  if not internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
    or not internal.is_mfa_requirement_satisfied() then
    raise exception 'credential role with MFA is required'
      using errcode = '42501';
  end if;

  select note.*
    into v_note
  from public.credential_notes note
  where note.id = p_note_id
  for update;

  if v_note.id is null or v_note.deleted_at is not null then
    raise exception 'active credential note not found'
      using errcode = '22023';
  end if;

  if v_note.author_id <> auth.uid()
    and not internal.has_any_role(array['owner', 'super_admin']::public.app_role[]) then
    raise exception 'only the author, Owner, or Super Admin can delete this credential note'
      using errcode = '42501';
  end if;

  update public.credential_notes note
  set
    deleted_at = now(),
    deleted_by = auth.uid()
  where note.id = p_note_id
  returning note.* into v_note;

  return v_note;
end;
$$;

comment on function public.delete_credential_note(uuid) is
  'Soft-deletes a private note for its author or for Owner/Super Admin; deleted notes cannot be restored or edited.';

revoke all on function public.delete_credential_note(uuid)
  from public, anon, authenticated;
grant execute on function public.delete_credential_note(uuid)
  to authenticated, postgres, service_role;
