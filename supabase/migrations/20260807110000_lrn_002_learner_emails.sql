-- LRN-002: Learner Emails
-- Multiple private, globally unique email addresses with at most one primary per learner.

create table public.learner_emails (
  id uuid primary key default extensions.gen_random_uuid(),
  learner_id uuid not null references public.learners(id) on delete cascade,
  email extensions.citext not null unique,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learner_emails_email_normalized check (
    email::text = btrim(email::text)
    and email::text <> ''
  )
);

comment on table public.learner_emails is
  'Private learner email addresses. Values are case-insensitively unique across all learners.';
comment on column public.learner_emails.email is
  'Trimmed case-insensitive email value; duplicate values cannot belong to another learner.';
comment on column public.learner_emails.is_primary is
  'Marks the optional primary recipient address. At most one primary address is allowed per learner.';

create index learner_emails_learner_id_idx
  on public.learner_emails (learner_id);

create unique index learner_emails_one_primary_idx
  on public.learner_emails (learner_id)
  where is_primary;

create trigger learner_emails_set_updated_at
before update on public.learner_emails
for each row execute function internal.set_updated_at();

alter table public.learner_emails enable row level security;
alter table public.learner_emails force row level security;

revoke all on table public.learner_emails from public, anon, authenticated;

grant select on table public.learner_emails to authenticated;
grant insert (learner_id, email, is_primary)
  on table public.learner_emails to authenticated;
grant update (email, is_primary)
  on table public.learner_emails to authenticated;
grant delete on table public.learner_emails to authenticated;

grant select, insert, update, delete on table public.learner_emails to postgres, service_role;

create policy learner_emails_authorized_read
on public.learner_emails
for select
to authenticated
using (
  internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);

create policy learner_emails_authorized_insert
on public.learner_emails
for insert
to authenticated
with check (
  internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);

create policy learner_emails_authorized_update
on public.learner_emails
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

create policy learner_emails_authorized_delete
on public.learner_emails
for delete
to authenticated
using (
  internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);
