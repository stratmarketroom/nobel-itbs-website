-- ADM-EML-001: Email Template Admin Management
-- Adds one controlled MFA-protected update path and privacy-minimal audit.

create or replace function internal.audit_email_template_change()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
begin
  if old.subject is not distinct from new.subject
    and old.body is not distinct from new.body then
    return new;
  end if;

  perform internal.write_audit_log(
    p_action => 'email_template.updated',
    p_actor_id => auth.uid(),
    p_target_schema => 'public',
    p_target_table => 'email_templates',
    p_target_id => new.id,
    p_metadata => jsonb_build_object(
      'template_key', new.template_key,
      'language_code', new.language_code,
      'subject_changed', old.subject is distinct from new.subject,
      'body_changed', old.body is distinct from new.body
    )
  );

  return new;
end;
$$;

comment on function internal.audit_email_template_change() is
  'Audits email-template changes without copying the subject, body, recipient data, or rendered message content.';

revoke all on function internal.audit_email_template_change()
  from public, anon, authenticated;
grant execute on function internal.audit_email_template_change()
  to postgres, service_role;

create trigger email_templates_audit_change
after update of subject, body on public.email_templates
for each row execute function internal.audit_email_template_change();

create or replace function public.update_email_template(
  p_template_id uuid,
  p_subject text,
  p_body text
)
returns public.email_templates
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_template public.email_templates;
  v_subject text := btrim(p_subject);
  v_body text := btrim(p_body);
begin
  perform internal.assert_sensitive_action_allowed(
    array['owner', 'super_admin', 'credential_manager']::public.app_role[],
    'email template update'
  );

  if p_template_id is null
    or nullif(v_subject, '') is null
    or nullif(v_body, '') is null then
    raise exception 'Email template, subject, and body are required.'
      using errcode = '22023';
  end if;

  if char_length(v_subject) > 180 or char_length(v_body) > 20000 then
    raise exception 'Email template subject or body is too long.'
      using errcode = '22023';
  end if;

  if v_subject ~ E'[\r\n]' then
    raise exception 'Email template subject must stay on one line.'
      using errcode = '22023';
  end if;

  select template.*
    into v_template
  from public.email_templates template
  where template.id = p_template_id
  for update;

  if v_template.id is null then
    raise exception 'Email template was not found.'
      using errcode = 'P0002';
  end if;

  if v_template.template_key <> 'credential_delivery'
    or v_template.language_code not in ('en', 'ua') then
    raise exception 'Only Release 1 credential-delivery EN/UA templates can be updated.'
      using errcode = '22023';
  end if;

  if v_template.subject is not distinct from v_subject
    and v_template.body is not distinct from v_body then
    return v_template;
  end if;

  update public.email_templates template
  set
    subject = v_subject,
    body = v_body,
    updated_by = v_actor_id
  where template.id = p_template_id
  returning template.* into v_template;

  return v_template;
end;
$$;

comment on function public.update_email_template(uuid, text, text) is
  'Updates one existing Release 1 EN/UA credential-delivery template for an authorized MFA actor; the trigger records a content-free audit event.';

revoke all on function public.update_email_template(uuid, text, text)
  from public, anon, authenticated;
grant execute on function public.update_email_template(uuid, text, text)
  to authenticated, postgres, service_role;
