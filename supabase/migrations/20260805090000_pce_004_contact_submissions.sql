-- PCE-004: Contact Submissions
-- Complete the private manager workflow without exposing submissions to public or Content Manager roles.

grant update (status) on table public.contact_submissions to authenticated;

create policy contact_submissions_authorized_update
on public.contact_submissions
for update
to authenticated
using (
  internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
)
with check (
  internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);

create index contact_submissions_type_created_idx
  on public.contact_submissions (type, created_at desc);

create or replace function internal.audit_contact_submission_status_change()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
begin
  if old.status is distinct from new.status then
    perform internal.write_audit_log(
      p_action => 'contact_submission.status_changed',
      p_actor_id => auth.uid(),
      p_target_schema => 'public',
      p_target_table => 'contact_submissions',
      p_target_id => new.id,
      p_metadata => jsonb_build_object(
        'from_status', old.status,
        'to_status', new.status
      )
    );
  end if;

  return new;
end;
$$;

comment on function internal.audit_contact_submission_status_change() is
  'Audits contact-submission status transitions without copying contact PII into the audit log.';

revoke all on function internal.audit_contact_submission_status_change()
  from public, anon, authenticated;
grant execute on function internal.audit_contact_submission_status_change()
  to postgres, service_role;

create trigger contact_submissions_audit_status_change
after update of status on public.contact_submissions
for each row execute function internal.audit_contact_submission_status_change();
