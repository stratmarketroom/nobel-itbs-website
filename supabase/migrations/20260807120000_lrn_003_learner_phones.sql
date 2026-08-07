-- LRN-003: Learner Phones
-- Multiple globally unique canonical phone numbers with messenger and primary flags.

create table public.learner_phones (
  id uuid primary key default extensions.gen_random_uuid(),
  learner_id uuid not null references public.learners(id) on delete cascade,
  phone text not null unique,
  has_telegram boolean not null default false,
  telegram_username text null,
  has_viber boolean not null default false,
  has_whatsapp boolean not null default false,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learner_phones_phone_canonical check (phone ~ '^\+[1-9][0-9]{6,14}$'),
  constraint learner_phones_telegram_username_trimmed check (
    telegram_username is null
    or (
      telegram_username = btrim(telegram_username)
      and telegram_username <> ''
    )
  ),
  constraint learner_phones_telegram_username_requires_flag check (
    telegram_username is null or has_telegram
  )
);

comment on table public.learner_phones is
  'Private learner phone numbers with messenger availability. Phone values are globally unique.';
comment on column public.learner_phones.phone is
  'Canonical international phone number: plus sign followed by 7 to 15 digits.';
comment on column public.learner_phones.telegram_username is
  'Optional Telegram username for a phone marked as Telegram-enabled.';
comment on column public.learner_phones.is_primary is
  'Marks the optional primary phone. At most one primary phone is allowed per learner.';

create index learner_phones_learner_id_idx
  on public.learner_phones (learner_id);

create unique index learner_phones_one_primary_idx
  on public.learner_phones (learner_id)
  where is_primary;

create trigger learner_phones_set_updated_at
before update on public.learner_phones
for each row execute function internal.set_updated_at();

alter table public.learner_phones enable row level security;
alter table public.learner_phones force row level security;

revoke all on table public.learner_phones from public, anon, authenticated;

grant select on table public.learner_phones to authenticated;
grant insert (learner_id, phone, has_telegram, telegram_username, has_viber, has_whatsapp, is_primary)
  on table public.learner_phones to authenticated;
grant update (phone, has_telegram, telegram_username, has_viber, has_whatsapp, is_primary)
  on table public.learner_phones to authenticated;
grant delete on table public.learner_phones to authenticated;

grant select, insert, update, delete on table public.learner_phones to postgres, service_role;

create policy learner_phones_authorized_read
on public.learner_phones
for select
to authenticated
using (
  internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);

create policy learner_phones_authorized_insert
on public.learner_phones
for insert
to authenticated
with check (
  internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);

create policy learner_phones_authorized_update
on public.learner_phones
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

create policy learner_phones_authorized_delete
on public.learner_phones
for delete
to authenticated
using (
  internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);
