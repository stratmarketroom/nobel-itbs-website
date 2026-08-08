-- CRD-004: Credentials
-- Private verifiable document identities and lifecycle integrity foundation.

create type public.credential_status as enum (
  'pending',
  'valid',
  'revoked',
  'voided'
);

create table public.credentials (
  id uuid primary key default extensions.gen_random_uuid(),
  credential_set_id uuid not null references public.credential_sets(id) on delete restrict,
  learner_id uuid not null references public.learners(id) on delete restrict,
  programme_id uuid not null references public.programmes(id) on delete restrict,
  programme_run_id uuid null,
  credential_type_id uuid not null references public.credential_types(id) on delete restrict,
  language_code text not null references public.languages(code) on delete restrict,
  status public.credential_status not null default 'pending',
  issue_date date not null,
  document_number text not null unique references public.document_number_log(document_number) on delete restrict,
  verification_token_lookup_hash text not null unique,
  verification_token_encrypted text not null,
  token_encryption_key_version integer not null,
  public_holder_name text not null,
  public_programme_title text not null,
  public_credential_type text not null,
  activated_at timestamptz null,
  revoked_at timestamptz null,
  revoked_by uuid null references public.user_profiles(id) on delete restrict,
  revocation_reason text null,
  voided_at timestamptz null,
  voided_by uuid null references public.user_profiles(id) on delete restrict,
  void_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credentials_programme_run_context_fk
    foreign key (programme_id, programme_run_id)
    references public.programme_runs(programme_id, id)
    on delete restrict,
  constraint credentials_token_lookup_hash_format check (
    verification_token_lookup_hash ~ '^[0-9a-f]{64}$'
  ),
  constraint credentials_encrypted_token_not_blank check (
    verification_token_encrypted = btrim(verification_token_encrypted)
    and verification_token_encrypted <> ''
  ),
  constraint credentials_token_key_version_positive check (
    token_encryption_key_version > 0
  ),
  constraint credentials_public_holder_name_not_blank check (
    public_holder_name = btrim(public_holder_name)
    and public_holder_name <> ''
  ),
  constraint credentials_public_programme_title_not_blank check (
    public_programme_title = btrim(public_programme_title)
    and public_programme_title <> ''
  ),
  constraint credentials_public_credential_type_not_blank check (
    public_credential_type = btrim(public_credential_type)
    and public_credential_type <> ''
  ),
  constraint credentials_revocation_time_order check (
    revoked_at is null
    or activated_at is null
    or revoked_at >= activated_at
  ),
  constraint credentials_lifecycle_consistency check (
    (
      status = 'pending'
      and activated_at is null
      and revoked_at is null
      and revoked_by is null
      and revocation_reason is null
      and voided_at is null
      and voided_by is null
      and void_reason is null
    )
    or (
      status = 'valid'
      and activated_at is not null
      and revoked_at is null
      and revoked_by is null
      and revocation_reason is null
      and voided_at is null
      and voided_by is null
      and void_reason is null
    )
    or (
      status = 'revoked'
      and activated_at is not null
      and revoked_at is not null
      and revoked_by is not null
      and revocation_reason is not null
      and revocation_reason = btrim(revocation_reason)
      and revocation_reason <> ''
      and voided_at is null
      and voided_by is null
      and void_reason is null
    )
    or (
      status = 'voided'
      and activated_at is null
      and revoked_at is null
      and revoked_by is null
      and revocation_reason is null
      and voided_at is not null
      and voided_by is not null
      and void_reason is not null
      and void_reason = btrim(void_reason)
      and void_reason <> ''
    )
  )
);

comment on table public.credentials is
  'Private credential identities. Public verification must use a curated server route and never expose this table directly.';
comment on column public.credentials.verification_token_lookup_hash is
  'Lowercase hexadecimal HMAC-SHA-256 lookup value. The raw verification token is never stored here.';
comment on column public.credentials.verification_token_encrypted is
  'Server-encrypted token material used only by controlled credential workflows; never returned publicly or logged.';
comment on column public.credentials.public_holder_name is
  'Current holder name approved for the curated valid-credential verification response.';
comment on column public.credentials.public_programme_title is
  'Current programme title approved for the curated valid-credential verification response.';
comment on column public.credentials.public_credential_type is
  'Current localized document-type label approved for the curated valid-credential verification response.';

create index credentials_learner_status_created_idx
  on public.credentials (learner_id, status, created_at desc);

create index credentials_set_created_idx
  on public.credentials (credential_set_id, created_at desc);

create index credentials_programme_status_idx
  on public.credentials (programme_id, status, issue_date desc);

create index credentials_status_updated_idx
  on public.credentials (status, updated_at desc);

create trigger credentials_set_updated_at
before update on public.credentials
for each row execute function internal.set_updated_at();

alter table public.document_number_log
  add constraint document_number_log_credential_id_fk
  foreign key (credential_id)
  references public.credentials(id)
  on delete restrict;

drop index public.document_number_log_credential_id_idx;

create unique index document_number_log_credential_id_idx
  on public.document_number_log (credential_id)
  where credential_id is not null;

create or replace function internal.validate_credential_context()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_document_letter text;
  v_number_type_id uuid;
begin
  if not exists (
    select 1
    from public.credential_sets credential_set
    where credential_set.id = new.credential_set_id
      and credential_set.learner_id = new.learner_id
      and credential_set.programme_id = new.programme_id
      and credential_set.programme_run_id is not distinct from new.programme_run_id
  ) then
    raise exception 'credential must match its learner/programme/run set context'
      using errcode = '23514';
  end if;

  select credential_type.document_letter
    into v_document_letter
  from public.credential_types credential_type
  where credential_type.id = new.credential_type_id;

  select number_log.credential_type_id
    into v_number_type_id
  from public.document_number_log number_log
  where number_log.document_number = new.document_number;

  if v_number_type_id is distinct from new.credential_type_id then
    raise exception 'credential type must match the reserved document number'
      using errcode = '23514';
  end if;

  if split_part(new.document_number, '-', 2) <> v_document_letter
    or split_part(new.document_number, '-', 3) <> to_char(new.issue_date, 'YYYY') then
    raise exception 'document number must match credential type and issue year'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function internal.validate_credential_context() is
  'Enforces set context and reserved-number type/year consistency without exposing private records.';

revoke all on function internal.validate_credential_context()
  from public, anon, authenticated;
grant execute on function internal.validate_credential_context()
  to postgres, service_role;

create trigger credentials_validate_context
before insert or update on public.credentials
for each row execute function internal.validate_credential_context();

create or replace function internal.enforce_credential_lifecycle()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'credentials are not hard-deleted'
      using errcode = '23514';
  end if;

  if old.id is distinct from new.id
    or old.learner_id is distinct from new.learner_id
    or old.programme_id is distinct from new.programme_id
    or old.programme_run_id is distinct from new.programme_run_id
    or old.credential_type_id is distinct from new.credential_type_id
    or old.language_code is distinct from new.language_code
    or old.issue_date is distinct from new.issue_date
    or old.document_number is distinct from new.document_number
    or old.verification_token_lookup_hash is distinct from new.verification_token_lookup_hash
    or old.verification_token_encrypted is distinct from new.verification_token_encrypted
    or old.token_encryption_key_version is distinct from new.token_encryption_key_version
    or old.created_at is distinct from new.created_at then
    raise exception 'credential identity fields are immutable'
      using errcode = '23514';
  end if;

  if old.status <> new.status and not (
    (old.status = 'pending' and new.status in ('valid', 'voided'))
    or (old.status = 'valid' and new.status = 'revoked')
  ) then
    raise exception 'invalid credential status transition'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function internal.enforce_credential_lifecycle() is
  'Prevents hard delete, credential identity rewrites, and reverse or unsupported lifecycle transitions.';

revoke all on function internal.enforce_credential_lifecycle()
  from public, anon, authenticated;
grant execute on function internal.enforce_credential_lifecycle()
  to postgres, service_role;

create trigger credentials_enforce_lifecycle
before update or delete on public.credentials
for each row execute function internal.enforce_credential_lifecycle();

create or replace function internal.audit_credential_change()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    perform internal.write_audit_log(
      p_action => 'credential.created_pending',
      p_actor_id => auth.uid(),
      p_target_schema => 'public',
      p_target_table => 'credentials',
      p_target_id => new.id,
      p_metadata => jsonb_build_object(
        'status', new.status,
        'credential_type_id', new.credential_type_id,
        'language_code', new.language_code
      )
    );

    return new;
  end if;

  if old.credential_set_id is distinct from new.credential_set_id then
    perform internal.write_audit_log(
      p_action => 'credential.set_moved',
      p_actor_id => auth.uid(),
      p_target_schema => 'public',
      p_target_table => 'credentials',
      p_target_id => new.id,
      p_metadata => jsonb_build_object(
        'from_set_id', old.credential_set_id,
        'to_set_id', new.credential_set_id
      )
    );
  end if;

  return new;
end;
$$;

comment on function internal.audit_credential_change() is
  'Audits pending credential creation and credential-set moves without logging document numbers, tokens, or learner identity.';

revoke all on function internal.audit_credential_change()
  from public, anon, authenticated;
grant execute on function internal.audit_credential_change()
  to postgres, service_role;

create trigger credentials_audit_change
after insert or update on public.credentials
for each row execute function internal.audit_credential_change();

create or replace function internal.validate_credential_number_link()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_expected_number_status public.document_number_status;
begin
  if tg_table_name = 'document_number_log' then
    if new.credential_id is null then
      return new;
    end if;

    if not exists (
      select 1
      from public.credentials credential
      where credential.id = new.credential_id
        and credential.document_number = new.document_number
        and credential.credential_type_id = new.credential_type_id
        and (
          (credential.status = 'pending' and new.status = 'reserved')
          or (credential.status in ('valid', 'revoked') and new.status = 'issued')
          or (credential.status = 'voided' and new.status = 'voided')
        )
    ) then
      raise exception 'document number log must match its credential and lifecycle'
        using errcode = '23514';
    end if;

    return new;
  end if;

  v_expected_number_status := case
    when new.status = 'pending' then 'reserved'::public.document_number_status
    when new.status in ('valid', 'revoked') then 'issued'::public.document_number_status
    else 'voided'::public.document_number_status
  end;

  if not exists (
    select 1
    from public.document_number_log number_log
    where number_log.document_number = new.document_number
      and number_log.credential_id = new.id
      and number_log.credential_type_id = new.credential_type_id
      and number_log.status = v_expected_number_status
  ) then
    raise exception 'credential must be linked to the matching document number log state'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function internal.validate_credential_number_link() is
  'Deferred two-way integrity check between credential lifecycle and its permanent document-number log row.';

revoke all on function internal.validate_credential_number_link()
  from public, anon, authenticated;
grant execute on function internal.validate_credential_number_link()
  to postgres, service_role;

create constraint trigger credentials_validate_number_link
after insert or update on public.credentials
deferrable initially deferred
for each row execute function internal.validate_credential_number_link();

create constraint trigger document_number_log_validate_credential_link
after insert or update on public.document_number_log
deferrable initially deferred
for each row execute function internal.validate_credential_number_link();

alter table public.credentials enable row level security;
alter table public.credentials force row level security;

revoke all on table public.credentials from public, anon, authenticated, service_role;
grant select on table public.credentials to authenticated, service_role;
grant select, insert, update on table public.credentials to postgres;
grant usage on type public.credential_status to authenticated, service_role;

create policy credentials_authorized_read
on public.credentials
for select
to authenticated
using (
  internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);
