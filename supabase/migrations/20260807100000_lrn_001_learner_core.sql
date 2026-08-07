-- LRN-001: Learner Core
-- Private learner identity data with role- and MFA-protected access.

create table public.learners (
  id uuid primary key default extensions.gen_random_uuid(),
  latin_first_name text not null,
  latin_last_name text not null,
  ukrainian_full_name text not null,
  internal_note text null,
  archived_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learners_latin_first_name_not_blank check (btrim(latin_first_name) <> ''),
  constraint learners_latin_last_name_not_blank check (btrim(latin_last_name) <> ''),
  constraint learners_ukrainian_full_name_not_blank check (btrim(ukrainian_full_name) <> '')
);

comment on table public.learners is
  'Private learner identity records used by the credential registry; never exposed publicly.';
comment on column public.learners.latin_first_name is
  'Learner first name for credentials issued in Latin-script document languages.';
comment on column public.learners.latin_last_name is
  'Learner last name for credentials issued in Latin-script document languages.';
comment on column public.learners.ukrainian_full_name is
  'Learner full name for Ukrainian-language credentials.';
comment on column public.learners.internal_note is
  'Optional private administrative note; never included in public verification.';
comment on column public.learners.archived_at is
  'Soft-archive timestamp. Learner records are not hard-deleted by authenticated admins.';

create index learners_archived_at_idx
  on public.learners (archived_at);

create trigger learners_set_updated_at
before update on public.learners
for each row execute function internal.set_updated_at();

alter table public.learners enable row level security;
alter table public.learners force row level security;

revoke all on table public.learners from public, anon, authenticated;

grant select on table public.learners to authenticated;
grant insert (latin_first_name, latin_last_name, ukrainian_full_name, internal_note, archived_at)
  on table public.learners to authenticated;
grant update (latin_first_name, latin_last_name, ukrainian_full_name, internal_note, archived_at)
  on table public.learners to authenticated;

grant select, insert, update, delete on table public.learners to postgres, service_role;

create policy learners_authorized_read
on public.learners
for select
to authenticated
using (
  internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);

create policy learners_authorized_insert
on public.learners
for insert
to authenticated
with check (
  internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);

create policy learners_authorized_update
on public.learners
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
