-- PRG-009: Programme Question Form
-- Store validated programme-linked enquiries without exposing contact data to public roles.

create type public.contact_submission_type as enum (
  'general',
  'programme_question',
  'partner_enquiry',
  'organisation_enquiry'
);

create type public.contact_submission_status as enum (
  'new',
  'processed',
  'archived'
);

create table public.contact_submissions (
  id uuid primary key default extensions.gen_random_uuid(),
  type public.contact_submission_type not null,
  status public.contact_submission_status not null default 'new',
  programme_id uuid null references public.programmes(id) on delete restrict,
  name text not null,
  email text not null,
  phone text null,
  message text not null,
  language_code text not null references public.languages(code) on delete restrict,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contact_submissions_name_length check (char_length(name) between 2 and 120),
  constraint contact_submissions_email_length check (char_length(email) between 3 and 254),
  constraint contact_submissions_phone_length check (phone is null or char_length(phone) between 7 and 40),
  constraint contact_submissions_message_length check (char_length(message) between 10 and 4000),
  constraint contact_submissions_metadata_object check (jsonb_typeof(metadata) = 'object'),
  constraint contact_submissions_programme_context check (
    (type = 'programme_question' and programme_id is not null)
    or (type <> 'programme_question')
  )
);

comment on table public.contact_submissions is
  'Private inbound public-form submissions. Release 1 statuses are new, processed, and archived.';
comment on column public.contact_submissions.programme_id is
  'Server-resolved source programme for programme_question submissions; never selected by the visitor.';
comment on column public.contact_submissions.metadata is
  'Minimal form context such as privacy acknowledgement and source; no rate-limit key or raw IP address.';

create index contact_submissions_status_created_idx
  on public.contact_submissions (status, created_at desc);
create index contact_submissions_programme_created_idx
  on public.contact_submissions (programme_id, created_at desc)
  where programme_id is not null;

create trigger contact_submissions_set_updated_at
before update on public.contact_submissions
for each row execute function internal.set_updated_at();

alter table public.contact_submissions enable row level security;
alter table public.contact_submissions force row level security;

revoke all on table public.contact_submissions from public, anon, authenticated;
grant select on table public.contact_submissions to authenticated;
grant all on table public.contact_submissions to service_role;
grant usage on type public.contact_submission_type, public.contact_submission_status
  to authenticated, service_role;

create policy contact_submissions_authorized_read
on public.contact_submissions
for select
to authenticated
using (
  internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);

create table internal.contact_submission_rate_limits (
  rate_key text primary key,
  window_started_at timestamptz not null,
  request_count integer not null,
  constraint contact_submission_rate_limits_key_format check (rate_key ~ '^[a-f0-9]{64}$'),
  constraint contact_submission_rate_limits_count_positive check (request_count > 0)
);

comment on table internal.contact_submission_rate_limits is
  'Server-only keyed hashes used for an atomic five-submissions-per-fifteen-minutes limit.';

create index contact_submission_rate_limits_window_idx
  on internal.contact_submission_rate_limits (window_started_at);

revoke all on table internal.contact_submission_rate_limits from public, anon, authenticated;
grant all on table internal.contact_submission_rate_limits to service_role;

create or replace function public.create_programme_question_submission(
  p_programme_slug text,
  p_name text,
  p_email text,
  p_phone text,
  p_message text,
  p_language_code text,
  p_rate_key text,
  p_privacy_notice_path text
)
returns uuid
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_programme_id uuid;
  v_request_count integer;
  v_submission_id uuid;
begin
  if p_rate_key !~ '^[a-f0-9]{64}$' then
    raise exception using errcode = '22023', message = 'INVALID_RATE_KEY';
  end if;

  select id
  into v_programme_id
  from public.programmes
  where slug = p_programme_slug
    and publication_status = 'published';

  if v_programme_id is null then
    raise exception using errcode = 'P0002', message = 'PROGRAMME_NOT_FOUND';
  end if;

  insert into internal.contact_submission_rate_limits as rate_limit (
    rate_key,
    window_started_at,
    request_count
  ) values (
    p_rate_key,
    now(),
    1
  )
  on conflict (rate_key) do update
  set
    window_started_at = case
      when rate_limit.window_started_at <= now() - interval '15 minutes' then now()
      else rate_limit.window_started_at
    end,
    request_count = case
      when rate_limit.window_started_at <= now() - interval '15 minutes' then 1
      else rate_limit.request_count + 1
    end
  returning request_count into v_request_count;

  if v_request_count > 5 then
    raise exception using errcode = 'P0001', message = 'CONTACT_RATE_LIMITED';
  end if;

  insert into public.contact_submissions (
    type,
    programme_id,
    name,
    email,
    phone,
    message,
    language_code,
    metadata
  ) values (
    'programme_question',
    v_programme_id,
    btrim(p_name),
    lower(btrim(p_email)),
    nullif(btrim(p_phone), ''),
    btrim(p_message),
    p_language_code,
    jsonb_build_object(
      'source', 'programme_page',
      'privacy_acknowledged', true,
      'privacy_notice_path', p_privacy_notice_path
    )
  )
  returning id into v_submission_id;

  delete from internal.contact_submission_rate_limits
  where window_started_at < now() - interval '1 day';

  return v_submission_id;
end;
$$;

comment on function public.create_programme_question_submission(text, text, text, text, text, text, text, text) is
  'Server-only atomic programme-question creation with programme resolution and database-backed rate limiting.';

revoke all on function public.create_programme_question_submission(text, text, text, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.create_programme_question_submission(text, text, text, text, text, text, text, text)
  to service_role;
