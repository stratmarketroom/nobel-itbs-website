-- PDFGEN-007: explicit reviewed-item batch activation with independent VEDOS
-- delivery outcomes. Credential lifecycle remains pending/valid/revoked/voided.

create type public.credential_batch_activation_request_status as enum (
  'processing',
  'completed',
  'partial'
);

create type public.credential_batch_activation_item_status as enum (
  'queued',
  'processing',
  'activation_failed',
  'delivery_retryable',
  'activated_sent',
  'activated_not_sent'
);

create table public.credential_generation_batch_activation_requests (
  id uuid primary key default extensions.gen_random_uuid(),
  batch_id uuid not null references public.credential_generation_batches(id) on delete restrict,
  idempotency_key uuid not null unique,
  status public.credential_batch_activation_request_status not null default 'processing',
  selected_count integer not null,
  activated_count integer not null default 0,
  sent_count integer not null default 0,
  not_sent_count integer not null default 0,
  failed_count integer not null default 0,
  requested_by uuid not null references public.user_profiles(id) on delete restrict,
  requested_at timestamptz not null default now(),
  completed_at timestamptz null,
  updated_at timestamptz not null default now(),
  constraint credential_generation_batch_activation_requests_counts check (
    selected_count > 0
    and activated_count between 0 and selected_count
    and sent_count between 0 and activated_count
    and not_sent_count between 0 and activated_count
    and failed_count between 0 and selected_count
    and sent_count + not_sent_count <= activated_count
  ),
  constraint credential_generation_batch_activation_requests_completion check (
    (status = 'processing' and completed_at is null)
    or (status in ('completed', 'partial') and completed_at is not null)
  )
);

comment on table public.credential_generation_batch_activation_requests is
  'Private idempotent explicit reviewed-item activation request. Counts contain no learner identity or contact data.';

create index credential_generation_batch_activation_requests_batch_created_idx
  on public.credential_generation_batch_activation_requests (batch_id, requested_at desc, id desc);

create trigger credential_generation_batch_activation_requests_set_updated_at
before update on public.credential_generation_batch_activation_requests
for each row execute function internal.set_updated_at();

create table public.credential_generation_batch_activation_items (
  id uuid primary key default extensions.gen_random_uuid(),
  activation_request_id uuid not null references public.credential_generation_batch_activation_requests(id) on delete restrict,
  batch_item_id uuid not null references public.credential_generation_batch_items(id) on delete restrict,
  position bigint not null,
  status public.credential_batch_activation_item_status not null default 'queued',
  attempt_count integer not null default 0,
  lease_token uuid null,
  lease_expires_at timestamptz null,
  last_error_code text null,
  email_send_id uuid null references public.credential_email_sends(id) on delete restrict,
  activated_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint credential_generation_batch_activation_items_position check (position > 0),
  constraint credential_generation_batch_activation_items_attempt check (attempt_count >= 0),
  constraint credential_generation_batch_activation_items_lease check (
    (
      status = 'processing'
      and lease_token is not null
      and lease_expires_at is not null
    )
    or (
      status <> 'processing'
      and lease_token is null
      and lease_expires_at is null
    )
  ),
  constraint credential_generation_batch_activation_items_error check (
    last_error_code is null
    or last_error_code ~ '^[a-z][a-z0-9_]{0,127}$'
  ),
  constraint credential_generation_batch_activation_items_outcome check (
    (
      status in ('delivery_retryable', 'activated_sent', 'activated_not_sent')
      and email_send_id is not null
      and activated_at is not null
    )
    or (
      status = 'activation_failed'
      and email_send_id is null
      and activated_at is null
    )
    or (
      status in ('queued', 'processing')
      and (
        (email_send_id is null and activated_at is null)
        or (email_send_id is not null and activated_at is not null)
      )
    )
  ),
  unique (activation_request_id, batch_item_id),
  unique (activation_request_id, position),
  unique (batch_item_id)
);

comment on table public.credential_generation_batch_activation_items is
  'Private per-credential activation/delivery outcome. Delivery content remains in immutable credential_email_sends.';

create index credential_generation_batch_activation_items_request_status_idx
  on public.credential_generation_batch_activation_items (
    activation_request_id, status, position, id
  );

create index credential_generation_batch_activation_items_lease_idx
  on public.credential_generation_batch_activation_items (
    status, lease_expires_at, activation_request_id, position
  ) where status = 'processing';

create trigger credential_generation_batch_activation_items_set_updated_at
before update on public.credential_generation_batch_activation_items
for each row execute function internal.set_updated_at();

create or replace function internal.enforce_credential_batch_activation_identity()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'credential batch activation records are not hard-deleted'
      using errcode = '23514';
  end if;

  if tg_table_name = 'credential_generation_batch_activation_requests' then
    if old.id is distinct from new.id
      or old.batch_id is distinct from new.batch_id
      or old.idempotency_key is distinct from new.idempotency_key
      or old.selected_count is distinct from new.selected_count
      or old.requested_by is distinct from new.requested_by
      or old.requested_at is distinct from new.requested_at then
      raise exception 'credential batch activation request identity is immutable'
        using errcode = '23514';
    end if;
  elsif old.id is distinct from new.id
    or old.activation_request_id is distinct from new.activation_request_id
    or old.batch_item_id is distinct from new.batch_item_id
    or old.position is distinct from new.position
    or old.created_at is distinct from new.created_at
    or (old.email_send_id is not null and old.email_send_id is distinct from new.email_send_id)
    or (old.activated_at is not null and old.activated_at is distinct from new.activated_at) then
    raise exception 'credential batch activation item identity and completed outcome are immutable'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function internal.enforce_credential_batch_activation_identity()
  from public, anon, authenticated;
grant execute on function internal.enforce_credential_batch_activation_identity()
  to postgres, service_role;

create trigger credential_generation_batch_activation_requests_enforce_identity
before update or delete on public.credential_generation_batch_activation_requests
for each row execute function internal.enforce_credential_batch_activation_identity();

create trigger credential_generation_batch_activation_items_enforce_identity
before update or delete on public.credential_generation_batch_activation_items
for each row execute function internal.enforce_credential_batch_activation_identity();

create or replace function internal.refresh_credential_batch_activation_state(
  p_activation_request_id uuid
)
returns void
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_batch_id uuid;
  v_activated integer;
  v_sent integer;
  v_not_sent integer;
  v_failed integer;
  v_open integer;
begin
  select request.batch_id
    into v_batch_id
  from public.credential_generation_batch_activation_requests request
  where request.id = p_activation_request_id
  for update;

  if v_batch_id is null then
    raise exception 'credential batch activation request not found' using errcode = 'P0002';
  end if;

  select
    count(*) filter (where item.status in ('delivery_retryable', 'activated_sent', 'activated_not_sent')),
    count(*) filter (where item.status = 'activated_sent'),
    count(*) filter (where item.status = 'activated_not_sent'),
    count(*) filter (where item.status in ('activation_failed', 'delivery_retryable')),
    count(*) filter (where item.status in ('queued', 'processing'))
  into v_activated, v_sent, v_not_sent, v_failed, v_open
  from public.credential_generation_batch_activation_items item
  where item.activation_request_id = p_activation_request_id;

  update public.credential_generation_batch_activation_requests request
  set activated_count = v_activated,
      sent_count = v_sent,
      not_sent_count = v_not_sent,
      failed_count = v_failed,
      status = case
        when v_open > 0 then 'processing'::public.credential_batch_activation_request_status
        when v_failed > 0 then 'partial'::public.credential_batch_activation_request_status
        else 'completed'::public.credential_batch_activation_request_status
      end,
      completed_at = case when v_open > 0 then null else coalesce(request.completed_at, now()) end
  where request.id = p_activation_request_id;

  if exists (
    select 1 from public.credential_generation_batch_items item
    where item.batch_id = v_batch_id and item.status = 'activating'
  ) then
    update public.credential_generation_batches
    set status = 'activating', finished_at = null
    where id = v_batch_id;
  elsif exists (
    select 1 from public.credential_generation_batch_items item
    where item.batch_id = v_batch_id
      and item.status in ('queued', 'processing', 'generated', 'retryable', 'reviewed', 'failed')
  ) then
    update public.credential_generation_batches
    set status = 'review', finished_at = null
    where id = v_batch_id;
  else
    update public.credential_generation_batches
    set status = 'completed', finished_at = coalesce(finished_at, now())
    where id = v_batch_id;
  end if;
end;
$$;

revoke all on function internal.refresh_credential_batch_activation_state(uuid)
  from public, anon, authenticated;
grant execute on function internal.refresh_credential_batch_activation_state(uuid)
  to postgres, service_role;

create or replace function public.prepare_credential_generation_batch_activation(
  p_batch_id uuid,
  p_idempotency_key uuid,
  p_batch_item_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_request_id uuid;
  v_existing_batch_id uuid;
  v_existing_items uuid[];
  v_selected_items uuid[];
  v_batch public.credential_generation_batches;
begin
  perform internal.assert_batch_generation_actor();

  if p_batch_id is null or p_idempotency_key is null
    or p_batch_item_ids is null or cardinality(p_batch_item_ids) = 0 then
    raise exception 'batch, idempotency key, and reviewed item selection are required'
      using errcode = '22023';
  end if;

  if cardinality(p_batch_item_ids) <> (
    select count(distinct selected_id) from unnest(p_batch_item_ids) selected_id
  ) then
    raise exception 'each batch item may be selected only once' using errcode = '22023';
  end if;

  select array_agg(item.id order by item.position)
    into v_selected_items
  from public.credential_generation_batch_items item
  where item.batch_id = p_batch_id and item.id = any(p_batch_item_ids);

  if cardinality(v_selected_items) is distinct from cardinality(p_batch_item_ids) then
    raise exception 'activation selection must contain only items from the requested batch'
      using errcode = '23514';
  end if;

  select request.id, request.batch_id
    into v_request_id, v_existing_batch_id
  from public.credential_generation_batch_activation_requests request
  where request.idempotency_key = p_idempotency_key;

  if v_request_id is not null then
    select array_agg(item.batch_item_id order by item.position)
      into v_existing_items
    from public.credential_generation_batch_activation_items item
    where item.activation_request_id = v_request_id;

    if v_existing_batch_id is distinct from p_batch_id
      or v_existing_items is distinct from v_selected_items then
      raise exception 'activation idempotency key is already bound to another exact selection'
        using errcode = '23514';
    end if;
    return v_request_id;
  end if;

  select batch.* into v_batch
  from public.credential_generation_batches batch
  where batch.id = p_batch_id
  for update;

  if v_batch.id is null then
    raise exception 'credential generation batch not found' using errcode = 'P0002';
  end if;
  if v_batch.status not in ('review', 'activating') then
    raise exception 'batch activation requires the private review stage' using errcode = '23514';
  end if;

  if exists (
    select 1
    from public.credential_generation_batch_items item
    where item.id = any(v_selected_items)
      and (
        item.status <> 'reviewed'
        or item.credential_id is null
        or not exists (
          select 1 from public.credentials credential
          where credential.id = item.credential_id and credential.status = 'pending'
        )
        or (select count(*) from public.credential_files file where file.credential_id = item.credential_id and file.is_primary) <> 1
        or (select count(*) from public.credential_files file where file.credential_id = item.credential_id) < 1
      )
  ) then
    raise exception 'every selected batch item must remain reviewed and activation-eligible'
      using errcode = '23514';
  end if;

  insert into public.credential_generation_batch_activation_requests (
    batch_id, idempotency_key, selected_count, requested_by
  ) values (
    p_batch_id, p_idempotency_key, cardinality(v_selected_items), v_actor_id
  ) returning id into v_request_id;

  insert into public.credential_generation_batch_activation_items (
    activation_request_id, batch_item_id, position
  )
  select v_request_id, item.id, item.position
  from public.credential_generation_batch_items item
  where item.id = any(v_selected_items)
  order by item.position;

  update public.credential_generation_batch_items
  set status = 'activating'
  where id = any(v_selected_items) and status = 'reviewed';

  update public.credential_generation_batches
  set status = 'activating', started_at = coalesce(started_at, now()), finished_at = null
  where id = p_batch_id;

  perform internal.write_audit_log(
    p_action => 'credential_generation.batch_activation_requested',
    p_actor_id => v_actor_id,
    p_target_schema => 'public',
    p_target_table => 'credential_generation_batch_activation_requests',
    p_target_id => v_request_id,
    p_metadata => jsonb_build_object('batch_id', p_batch_id, 'selected_count', cardinality(v_selected_items))
  );

  return v_request_id;
end;
$$;

create or replace function public.claim_credential_generation_batch_activation_item(
  p_activation_request_item_id uuid,
  p_lease_token uuid
)
returns table (
  activation_request_id uuid,
  batch_item_id uuid,
  credential_id uuid,
  email_send_id uuid
)
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
begin
  perform internal.assert_batch_generation_actor();
  if p_activation_request_item_id is null or p_lease_token is null then
    raise exception 'activation request item and lease token are required' using errcode = '22023';
  end if;

  return query
  update public.credential_generation_batch_activation_items activation_item
  set status = 'processing',
      attempt_count = activation_item.attempt_count + 1,
      lease_token = p_lease_token,
      lease_expires_at = now() + interval '15 minutes',
      last_error_code = null
  from public.credential_generation_batch_items batch_item
  where activation_item.id = p_activation_request_item_id
    and batch_item.id = activation_item.batch_item_id
    and (
      activation_item.status = 'queued'
      or (activation_item.status = 'processing' and activation_item.lease_expires_at <= now())
    )
  returning activation_item.activation_request_id, batch_item.id, batch_item.credential_id, activation_item.email_send_id;

  if not found then
    raise exception 'activation request item is not queued or its lease is active' using errcode = '55P03';
  end if;
end;
$$;

create or replace function public.complete_credential_generation_batch_activation_item(
  p_activation_request_item_id uuid,
  p_lease_token uuid,
  p_email_send_id uuid
)
returns public.credential_batch_activation_item_status
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_activation_item public.credential_generation_batch_activation_items;
  v_batch_item public.credential_generation_batch_items;
  v_send public.credential_email_sends;
  v_credential public.credentials;
  v_outcome public.credential_batch_activation_item_status;
begin
  perform internal.assert_batch_generation_actor();

  select activation_item.* into v_activation_item
  from public.credential_generation_batch_activation_items activation_item
  where activation_item.id = p_activation_request_item_id
  for update;

  if v_activation_item.id is null or v_activation_item.status <> 'processing'
    or v_activation_item.lease_token is distinct from p_lease_token
    or v_activation_item.lease_expires_at <= now() then
    raise exception 'activation request item lease is missing or expired' using errcode = '55P03';
  end if;

  select item.* into v_batch_item
  from public.credential_generation_batch_items item
  where item.id = v_activation_item.batch_item_id
  for update;
  select credential.* into v_credential
  from public.credentials credential
  where credential.id = v_batch_item.credential_id;
  select email_send.* into v_send
  from public.credential_email_sends email_send
  where email_send.id = p_email_send_id and email_send.credential_id = v_batch_item.credential_id;

  if v_batch_item.id is null or v_batch_item.status not in ('activating', 'activated')
    or v_credential.status <> 'valid' or v_send.id is null
    or v_activation_item.email_send_id is distinct from v_send.id then
    raise exception 'completed activation requires the valid selected credential and its delivery record'
      using errcode = '23514';
  end if;

  v_outcome := case
    when v_send.status = 'sent' then 'activated_sent'::public.credential_batch_activation_item_status
    when v_send.status = 'pending' then 'delivery_retryable'::public.credential_batch_activation_item_status
    else 'activated_not_sent'::public.credential_batch_activation_item_status
  end;

  update public.credential_generation_batch_activation_items
  set status = v_outcome,
      email_send_id = v_send.id,
      activated_at = v_credential.activated_at,
      lease_token = null,
      lease_expires_at = null,
      last_error_code = case when v_send.status = 'pending' then 'delivery_result_pending' else null end
  where id = v_activation_item.id;

  if v_batch_item.status <> 'activated' then
    update public.credential_generation_batch_items
    set status = 'activated', activated_at = v_credential.activated_at
    where id = v_batch_item.id;
  end if;

  perform internal.write_audit_log(
    p_action => 'credential_generation.batch_item_activated',
    p_actor_id => auth.uid(),
    p_target_schema => 'public',
    p_target_table => 'credential_generation_batch_activation_items',
    p_target_id => v_activation_item.id,
    p_metadata => jsonb_build_object(
      'batch_item_id', v_batch_item.id,
      'credential_id', v_batch_item.credential_id,
      'delivery_status', v_send.status,
      'activation_attempt', v_activation_item.attempt_count
    )
  );

  perform internal.refresh_credential_batch_activation_state(v_activation_item.activation_request_id);
  return v_outcome;
end;
$$;

create or replace function public.bind_credential_generation_batch_activation_email_send(
  p_activation_request_item_id uuid,
  p_lease_token uuid,
  p_email_send_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_activation_item public.credential_generation_batch_activation_items;
  v_batch_item public.credential_generation_batch_items;
begin
  perform internal.assert_batch_generation_actor();

  select activation_item.* into v_activation_item
  from public.credential_generation_batch_activation_items activation_item
  where activation_item.id = p_activation_request_item_id
  for update;
  select item.* into v_batch_item
  from public.credential_generation_batch_items item
  where item.id = v_activation_item.batch_item_id;

  if v_activation_item.id is null or v_activation_item.status <> 'processing'
    or v_activation_item.lease_token is distinct from p_lease_token
    or v_activation_item.lease_expires_at <= now() then
    raise exception 'activation request item lease is missing or expired' using errcode = '55P03';
  end if;
  if not exists (
    select 1 from public.credential_email_sends email_send
    where email_send.id = p_email_send_id
      and email_send.credential_id = v_batch_item.credential_id
  ) then
    raise exception 'batch email send must belong to the selected credential'
      using errcode = '23514';
  end if;
  if v_activation_item.email_send_id is not null
    and v_activation_item.email_send_id is distinct from p_email_send_id then
    raise exception 'batch activation delivery record is immutable'
      using errcode = '23514';
  end if;

  update public.credential_generation_batch_activation_items
  set email_send_id = p_email_send_id,
      activated_at = coalesce(activated_at, (
        select credential.activated_at from public.credentials credential
        where credential.id = v_batch_item.credential_id
      ))
  where id = v_activation_item.id;
  return true;
end;
$$;

create or replace function public.fail_credential_generation_batch_activation_item(
  p_activation_request_item_id uuid,
  p_lease_token uuid,
  p_error_code text
)
returns boolean
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_activation_item public.credential_generation_batch_activation_items;
  v_batch_item public.credential_generation_batch_items;
  v_error_code text := lower(nullif(btrim(p_error_code), ''));
begin
  perform internal.assert_batch_generation_actor();
  if v_error_code is null or v_error_code !~ '^[a-z][a-z0-9_]{0,127}$' then
    raise exception 'safe activation error code is required' using errcode = '22023';
  end if;

  select activation_item.* into v_activation_item
  from public.credential_generation_batch_activation_items activation_item
  where activation_item.id = p_activation_request_item_id
  for update;
  select item.* into v_batch_item
  from public.credential_generation_batch_items item
  where item.id = v_activation_item.batch_item_id
  for update;

  if v_activation_item.id is null or v_activation_item.status <> 'processing'
    or v_activation_item.lease_token is distinct from p_lease_token
    or v_activation_item.lease_expires_at <= now() then
    raise exception 'activation request item lease is missing or expired' using errcode = '55P03';
  end if;
  if not exists (
    select 1 from public.credentials credential
    where credential.id = v_batch_item.credential_id and credential.status = 'pending'
  ) then
    raise exception 'a valid credential must be reconciled, not marked activation-failed'
      using errcode = '23514';
  end if;

  update public.credential_generation_batch_activation_items
  set status = 'activation_failed', last_error_code = v_error_code,
      lease_token = null, lease_expires_at = null
  where id = v_activation_item.id;
  update public.credential_generation_batch_items
  set status = 'reviewed'
  where id = v_batch_item.id and status = 'activating';

  perform internal.write_audit_log(
    p_action => 'credential_generation.batch_item_activation_failed',
    p_actor_id => auth.uid(), p_target_schema => 'public',
    p_target_table => 'credential_generation_batch_activation_items',
    p_target_id => v_activation_item.id,
    p_metadata => jsonb_build_object(
      'batch_item_id', v_batch_item.id,
      'activation_attempt', v_activation_item.attempt_count,
      'error_code', v_error_code
    )
  );
  perform internal.refresh_credential_batch_activation_state(v_activation_item.activation_request_id);
  return true;
end;
$$;

create or replace function public.complete_credential_generation_batch_email_send(
  p_activation_request_item_id uuid,
  p_lease_token uuid,
  p_status public.credential_email_send_status,
  p_technical_error text default null
)
returns public.credential_email_sends
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_activation_item public.credential_generation_batch_activation_items;
  v_send public.credential_email_sends;
  v_error text := nullif(btrim(p_technical_error), '');
begin
  perform internal.assert_batch_generation_actor();

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
    raise exception 'technical error is too long' using errcode = '22023';
  end if;

  select activation_item.* into v_activation_item
  from public.credential_generation_batch_activation_items activation_item
  where activation_item.id = p_activation_request_item_id
    and activation_item.status = 'processing'
    and activation_item.lease_token = p_lease_token
    and activation_item.lease_expires_at > now()
    and activation_item.email_send_id is not null;

  if v_activation_item.id is null then
    raise exception 'processing batch delivery item was not found' using errcode = 'P0002';
  end if;

  update public.credential_email_sends email_send
  set status = p_status, technical_error = v_error
  where email_send.id = v_activation_item.email_send_id
    and email_send.status = 'pending'
  returning email_send.* into v_send;

  if v_send.id is null then
    raise exception 'pending batch email send was not found' using errcode = '23514';
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
      'file_count', jsonb_array_length(v_send.files),
      'batch_activation_item_id', v_activation_item.id
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
      'file_count', jsonb_array_length(v_send.files),
      'batch_activation_item_id', v_activation_item.id
    )
  );

  return v_send;
end;
$$;

create or replace function public.requeue_credential_generation_batch_activation_item(
  p_activation_request_item_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, internal, pg_temp
as $$
declare
  v_activation_item public.credential_generation_batch_activation_items;
  v_batch_item public.credential_generation_batch_items;
  v_batch_id uuid;
begin
  perform internal.assert_batch_generation_actor();
  select activation_item.* into v_activation_item
  from public.credential_generation_batch_activation_items activation_item
  where activation_item.id = p_activation_request_item_id
  for update;
  select item.* into v_batch_item
  from public.credential_generation_batch_items item
  where item.id = v_activation_item.batch_item_id
  for update;

  if v_activation_item.status = 'activation_failed' then
    if v_batch_item.status <> 'reviewed' then
      raise exception 'activation retry requires a reviewed pending batch item' using errcode = '23514';
    end if;
    update public.credential_generation_batch_items set status = 'activating'
    where id = v_batch_item.id;
  elsif v_activation_item.status <> 'delivery_retryable' then
    raise exception 'only activation or delivery failures can be retried' using errcode = '23514';
  end if;

  update public.credential_generation_batch_activation_items
  set status = 'queued', last_error_code = null,
      lease_token = null, lease_expires_at = null
  where id = v_activation_item.id;
  update public.credential_generation_batch_activation_requests
  set status = 'processing', completed_at = null
  where id = v_activation_item.activation_request_id;
  select request.batch_id into v_batch_id
  from public.credential_generation_batch_activation_requests request
  where request.id = v_activation_item.activation_request_id;
  update public.credential_generation_batches
  set status = 'activating', finished_at = null
  where id = v_batch_id;
  return true;
end;
$$;

alter table public.credential_generation_batch_activation_requests enable row level security;
alter table public.credential_generation_batch_activation_requests force row level security;
alter table public.credential_generation_batch_activation_items enable row level security;
alter table public.credential_generation_batch_activation_items force row level security;

revoke all on table public.credential_generation_batch_activation_requests from public, anon, authenticated, service_role;
revoke all on table public.credential_generation_batch_activation_items from public, anon, authenticated, service_role;
grant select on table public.credential_generation_batch_activation_requests,
  public.credential_generation_batch_activation_items to authenticated, service_role;
grant select, insert, update on table public.credential_generation_batch_activation_requests,
  public.credential_generation_batch_activation_items to postgres;

create policy credential_generation_batch_activation_requests_authorized_read
on public.credential_generation_batch_activation_requests
for select to authenticated
using (
  internal.is_active_admin()
  and internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);

create policy credential_generation_batch_activation_items_authorized_read
on public.credential_generation_batch_activation_items
for select to authenticated
using (
  internal.is_active_admin()
  and internal.has_any_role(array['owner', 'super_admin', 'credential_manager']::public.app_role[])
  and internal.is_mfa_requirement_satisfied()
);

revoke all on function public.prepare_credential_generation_batch_activation(uuid, uuid, uuid[]) from public, anon;
revoke all on function public.claim_credential_generation_batch_activation_item(uuid, uuid) from public, anon;
revoke all on function public.complete_credential_generation_batch_activation_item(uuid, uuid, uuid) from public, anon;
revoke all on function public.bind_credential_generation_batch_activation_email_send(uuid, uuid, uuid) from public, anon;
revoke all on function public.fail_credential_generation_batch_activation_item(uuid, uuid, text) from public, anon;
revoke all on function public.complete_credential_generation_batch_email_send(uuid, uuid, public.credential_email_send_status, text) from public, anon;
revoke all on function public.requeue_credential_generation_batch_activation_item(uuid) from public, anon;

grant execute on function public.prepare_credential_generation_batch_activation(uuid, uuid, uuid[]) to authenticated, service_role;
grant execute on function public.claim_credential_generation_batch_activation_item(uuid, uuid) to authenticated, service_role;
grant execute on function public.complete_credential_generation_batch_activation_item(uuid, uuid, uuid) to authenticated, service_role;
grant execute on function public.bind_credential_generation_batch_activation_email_send(uuid, uuid, uuid) to authenticated, service_role;
grant execute on function public.fail_credential_generation_batch_activation_item(uuid, uuid, text) to authenticated, service_role;
grant execute on function public.complete_credential_generation_batch_email_send(uuid, uuid, public.credential_email_send_status, text) to authenticated, service_role;
grant execute on function public.requeue_credential_generation_batch_activation_item(uuid) to authenticated, service_role;

-- Browser roles retain no direct DML on activation request/items, credentials,
-- number logs, email sends, or private Storage. External SMTP remains server-only.
