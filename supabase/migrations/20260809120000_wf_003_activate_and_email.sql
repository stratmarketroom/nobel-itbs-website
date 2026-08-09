-- WF-003: Activate and Email
-- Atomic credential activation plus failure-independent Google Workspace delivery tracking.

create type public.credential_email_send_status as enum (
  'pending',
  'sent',
  'failed',
  'skipped_empty_recipient',
  'not_configured'
);

create table public.email_templates (
  id uuid primary key default extensions.gen_random_uuid(),
  template_key text not null,
  language_code text not null references public.languages(code) on delete restrict,
  subject text not null,
  body text not null,
  updated_by uuid null references public.user_profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint email_templates_key_format check (template_key ~ '^[a-z][a-z0-9_]*$'),
  constraint email_templates_subject_not_blank check (
    subject = btrim(subject) and subject <> '' and char_length(subject) <= 180
  ),
  constraint email_templates_body_not_blank check (
    body = btrim(body) and body <> '' and char_length(body) <= 20000
  ),
  unique (template_key, language_code)
);

comment on table public.email_templates is
  'Private EN/UA credential email templates. Activation may edit the rendered subject/body without changing the stored template.';

create trigger email_templates_set_updated_at
before update on public.email_templates
for each row execute function internal.set_updated_at();

insert into public.email_templates (id, template_key, language_code, subject, body)
values
  (
    '00000000-0000-4000-8000-000000000801',
    'credential_delivery',
    'en',
    'Your Nobel ITBS document — {{document_number}}',
    E'Dear {{holder_name}},\n\nYour {{credential_type}} for “{{programme_title}}” has been issued by Nobel ITBS.\n\nDocument number: {{document_number}}\nVerification: {{verification_url}}\n\nThe current PDF document files are attached to this email.\n\nNobel ITBS'
  ),
  (
    '00000000-0000-4000-8000-000000000802',
    'credential_delivery',
    'ua',
    'Ваш документ Nobel ITBS — {{document_number}}',
    E'Вітаємо, {{holder_name}}!\n\nВаш документ «{{credential_type}}» за програмою «{{programme_title}}» видано Nobel ITBS.\n\nНомер документа: {{document_number}}\nПеревірка: {{verification_url}}\n\nАктуальні PDF-файли документа додано до цього листа.\n\nNobel ITBS'
  );

create table public.credential_email_sends (
  id uuid primary key default extensions.gen_random_uuid(),
  credential_id uuid not null references public.credentials(id) on delete restrict,
  recipient_email extensions.citext null,
  subject text not null,
  body text not null,
  status public.credential_email_send_status not null,
  technical_error text null,
  sent_by uuid not null references public.user_profiles(id) on delete restrict,
  sent_at timestamptz not null default now(),
  files jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint credential_email_sends_recipient_not_blank check (
    recipient_email is null or (recipient_email::text = btrim(recipient_email::text) and recipient_email::text <> '')
  ),
  constraint credential_email_sends_subject_not_blank check (
    subject = btrim(subject) and subject <> '' and char_length(subject) <= 180
  ),
  constraint credential_email_sends_body_not_blank check (
    body = btrim(body) and body <> '' and char_length(body) <= 20000
  ),
  constraint credential_email_sends_files_array check (jsonb_typeof(files) = 'array'),
  constraint credential_email_sends_status_consistency check (
    (status = 'sent' and technical_error is null and recipient_email is not null)
    or (status = 'pending' and technical_error is null and recipient_email is not null)
    or (status = 'skipped_empty_recipient' and recipient_email is null and technical_error is not null)
    or (status in ('failed', 'not_configured') and recipient_email is not null and technical_error is not null)
  )
);

comment on table public.credential_email_sends is
  'Private immutable-content delivery history. Stores the actual recipient, text, outcome, and file manifest, never PDF copies or private paths.';
comment on column public.credential_email_sends.files is
  'Array of current file IDs, safe names/types, sizes, and primary flags included in the delivery attempt. Never contains storage paths or bytes.';

create index credential_email_sends_credential_sent_idx
  on public.credential_email_sends (credential_id, sent_at desc, id desc);

create trigger credential_email_sends_set_updated_at
before update on public.credential_email_sends
for each row execute function internal.set_updated_at();

create or replace function internal.enforce_credential_email_send_mutation()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'credential email send history is permanent'
      using errcode = '23514';
  end if;

  if old.id is distinct from new.id
    or old.credential_id is distinct from new.credential_id
    or old.recipient_email is distinct from new.recipient_email
    or old.subject is distinct from new.subject
    or old.body is distinct from new.body
    or old.sent_by is distinct from new.sent_by
    or old.sent_at is distinct from new.sent_at
    or old.files is distinct from new.files then
    raise exception 'credential email send content is immutable'
      using errcode = '23514';
  end if;

  if old.status <> 'pending' or new.status not in ('sent', 'failed', 'not_configured') then
    raise exception 'invalid credential email send status transition'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function internal.enforce_credential_email_send_mutation() is
  'Keeps delivery content permanent and permits only one pending-to-final outcome transition.';

revoke all on function internal.enforce_credential_email_send_mutation()
  from public, anon, authenticated;
grant execute on function internal.enforce_credential_email_send_mutation()
  to postgres, service_role;

create trigger credential_email_sends_enforce_mutation
before update or delete on public.credential_email_sends
for each row execute function internal.enforce_credential_email_send_mutation();

create or replace function public.activate_credential(
  p_credential_id uuid,
  p_recipient_email text,
  p_subject text,
  p_body text,
  p_files jsonb
)
returns table (
  credential_id uuid,
  credential_status public.credential_status,
  activated_at timestamptz,
  email_send_id uuid,
  email_status public.credential_email_send_status
)
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_credential public.credentials;
  v_send_id uuid;
  v_email_status public.credential_email_send_status;
  v_email extensions.citext := nullif(lower(btrim(p_recipient_email)), '')::extensions.citext;
  v_activated_at timestamptz := now();
  v_file_count integer;
begin
  if not internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
    or not internal.is_mfa_requirement_satisfied() then
    raise exception 'credential role with MFA is required'
      using errcode = '42501';
  end if;

  if p_credential_id is null
    or nullif(btrim(p_subject), '') is null
    or nullif(btrim(p_body), '') is null then
    raise exception 'credential, email subject, and email body are required'
      using errcode = '22023';
  end if;

  if char_length(btrim(p_subject)) > 180 or char_length(btrim(p_body)) > 20000 then
    raise exception 'email subject or body is too long'
      using errcode = '22023';
  end if;

  if v_email is not null and v_email::text !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'recipient email is invalid'
      using errcode = '22023';
  end if;

  if p_files is null or jsonb_typeof(p_files) <> 'array' or jsonb_array_length(p_files) < 1 then
    raise exception 'current credential file manifest is required'
      using errcode = '22023';
  end if;

  if p_files::text ~* '(storage_path|storage_bucket|file_content|bytes)' then
    raise exception 'file manifest contains forbidden private data'
      using errcode = '22023';
  end if;

  select credential.*
    into v_credential
  from public.credentials credential
  where credential.id = p_credential_id
  for update;

  if v_credential.id is null then
    raise exception 'credential not found'
      using errcode = '22023';
  end if;

  if v_credential.status <> 'pending' then
    raise exception 'only a pending credential can be activated'
      using errcode = '23514';
  end if;

  if not exists (
    select 1 from public.credential_files credential_file
    where credential_file.credential_id = p_credential_id
      and credential_file.is_primary
  ) then
    raise exception 'a primary PDF is required for activation'
      using errcode = '23514';
  end if;

  select count(*)::integer
    into v_file_count
  from public.credential_files credential_file
  where credential_file.credential_id = p_credential_id;

  if v_file_count <> jsonb_array_length(p_files) then
    raise exception 'file manifest must include every current credential file'
      using errcode = '23514';
  end if;

  if (
    select count(distinct manifest_file ->> 'file_id')
    from jsonb_array_elements(p_files) manifest_file
  ) <> v_file_count then
    raise exception 'file manifest must contain each current credential file exactly once'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_files) manifest_file
    where not exists (
      select 1
      from public.credential_files credential_file
      where credential_file.credential_id = p_credential_id
        and credential_file.id = (manifest_file ->> 'file_id')::uuid
        and credential_file.file_type_id = (manifest_file ->> 'file_type_id')::uuid
        and credential_file.size_bytes = (manifest_file ->> 'size_bytes')::bigint
        and credential_file.is_primary = (manifest_file ->> 'is_primary')::boolean
    )
  ) then
    raise exception 'file manifest does not match current credential files'
      using errcode = '23514';
  end if;

  update public.document_number_log number_log
  set status = 'issued'
  where number_log.credential_id = p_credential_id
    and number_log.document_number = v_credential.document_number
    and number_log.status = 'reserved';

  if not found then
    raise exception 'reserved document number could not be issued'
      using errcode = '23514';
  end if;

  update public.credentials credential
  set status = 'valid', activated_at = v_activated_at
  where credential.id = p_credential_id;

  v_email_status := case
    when v_email is null then 'skipped_empty_recipient'::public.credential_email_send_status
    else 'pending'::public.credential_email_send_status
  end;

  insert into public.credential_email_sends (
    credential_id,
    recipient_email,
    subject,
    body,
    status,
    technical_error,
    sent_by,
    files
  )
  values (
    p_credential_id,
    v_email,
    btrim(p_subject),
    btrim(p_body),
    v_email_status,
    case when v_email is null then 'Recipient email is empty; no delivery was attempted.' else null end,
    v_actor_id,
    p_files
  )
  returning id into v_send_id;

  perform internal.write_credential_history(
    p_credential_id => p_credential_id,
    p_event_type => 'credential.activated',
    p_before_data => jsonb_build_object('status', 'pending'),
    p_after_data => jsonb_build_object('status', 'valid', 'file_count', v_file_count)
  );

  perform internal.write_credential_history(
    p_credential_id => p_credential_id,
    p_event_type => case when v_email is null then 'credential_email.skipped' else 'credential_email.queued' end,
    p_after_data => jsonb_build_object(
      'email_send_id', v_send_id,
      'status', v_email_status,
      'file_count', v_file_count
    )
  );

  perform internal.write_audit_log(
    p_action => 'credential.activated',
    p_actor_id => v_actor_id,
    p_target_schema => 'public',
    p_target_table => 'credentials',
    p_target_id => p_credential_id,
    p_metadata => jsonb_build_object(
      'status', 'valid',
      'delivery_status', v_email_status,
      'file_count', v_file_count
    )
  );

  return query
  select p_credential_id, 'valid'::public.credential_status, v_activated_at, v_send_id, v_email_status;
end;
$$;

comment on function public.activate_credential(uuid, text, text, text, jsonb) is
  'Atomically activates one pending credential, issues its permanent number, and creates a delivery-history row before any external provider call.';

create or replace function public.complete_credential_email_send(
  p_email_send_id uuid,
  p_status public.credential_email_send_status,
  p_technical_error text default null
)
returns public.credential_email_sends
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_send public.credential_email_sends;
  v_error text := nullif(btrim(p_technical_error), '');
begin
  if not internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
    or not internal.is_mfa_requirement_satisfied() then
    raise exception 'credential role with MFA is required'
      using errcode = '42501';
  end if;

  if p_status not in ('sent', 'failed', 'not_configured') then
    raise exception 'final email status must be sent, failed, or not_configured'
      using errcode = '22023';
  end if;

  if (p_status = 'sent' and v_error is not null)
    or (p_status in ('failed', 'not_configured') and v_error is null) then
    raise exception 'technical error must match the final delivery status'
      using errcode = '22023';
  end if;

  if v_error is not null and char_length(v_error) > 1000 then
    raise exception 'technical error is too long'
      using errcode = '22023';
  end if;

  update public.credential_email_sends email_send
  set status = p_status, technical_error = v_error
  where email_send.id = p_email_send_id
    and email_send.status = 'pending'
    and email_send.sent_by = auth.uid()
  returning email_send.* into v_send;

  if v_send.id is null then
    raise exception 'pending email send owned by the current actor was not found'
      using errcode = '22023';
  end if;

  perform internal.write_credential_history(
    p_credential_id => v_send.credential_id,
    p_event_type => case p_status
      when 'sent' then 'credential_email.sent'
      when 'not_configured' then 'credential_email.not_configured'
      else 'credential_email.failed'
    end,
    p_after_data => jsonb_build_object(
      'email_send_id', v_send.id,
      'status', v_send.status,
      'file_count', jsonb_array_length(v_send.files)
    )
  );

  perform internal.write_audit_log(
    p_action => case p_status
      when 'sent' then 'credential_email.sent'
      when 'not_configured' then 'credential_email.not_configured'
      else 'credential_email.failed'
    end,
    p_actor_id => auth.uid(),
    p_target_schema => 'public',
    p_target_table => 'credential_email_sends',
    p_target_id => v_send.id,
    p_metadata => jsonb_build_object(
      'credential_id', v_send.credential_id,
      'status', v_send.status,
      'file_count', jsonb_array_length(v_send.files)
    )
  );

  return v_send;
end;
$$;

comment on function public.complete_credential_email_send(uuid, public.credential_email_send_status, text) is
  'Finalizes one actor-owned pending delivery result without changing the already-valid credential.';

alter table public.email_templates enable row level security;
alter table public.email_templates force row level security;
alter table public.credential_email_sends enable row level security;
alter table public.credential_email_sends force row level security;

revoke all on table public.email_templates from public, anon, authenticated, service_role;
revoke all on table public.credential_email_sends from public, anon, authenticated, service_role;

grant select on table public.email_templates, public.credential_email_sends to authenticated, service_role;
grant select, insert, update on table public.email_templates to postgres;
grant select, insert, update on table public.credential_email_sends to postgres;
grant usage on type public.credential_email_send_status to authenticated, service_role;

create policy email_templates_authorized_read
on public.email_templates
for select
to authenticated
using (
  internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);

create policy credential_email_sends_authorized_read
on public.credential_email_sends
for select
to authenticated
using (
  internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);

revoke all on function public.activate_credential(uuid, text, text, text, jsonb)
  from public, anon, authenticated;
revoke all on function public.complete_credential_email_send(uuid, public.credential_email_send_status, text)
  from public, anon, authenticated;

grant execute on function public.activate_credential(uuid, text, text, text, jsonb)
  to authenticated, postgres, service_role;
grant execute on function public.complete_credential_email_send(uuid, public.credential_email_send_status, text)
  to authenticated, postgres, service_role;
