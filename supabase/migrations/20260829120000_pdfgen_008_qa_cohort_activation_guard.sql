-- PDFGEN-008: Permanent activation and delivery guard for synthetic QA cohorts.
-- Review and private PDF inspection remain available; issuance and email do not.

alter table public.credential_generation_batches
  add column activation_blocked boolean not null default false,
  add column activation_block_reason text null,
  add constraint credential_generation_batches_activation_block_consistency check (
    (not activation_blocked and activation_block_reason is null)
    or (activation_blocked and activation_block_reason = 'synthetic_qa')
  );

comment on column public.credential_generation_batches.activation_blocked is
  'Permanent server-enforced prohibition on activating or delivering credentials from this batch.';
comment on column public.credential_generation_batches.activation_block_reason is
  'Privacy-minimal machine reason for a permanent activation block; synthetic_qa is the only Release 1 value.';

create or replace function internal.enforce_generation_batch_identity()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'credential generation batches are not hard-deleted'
      using errcode = '23514';
  end if;

  if old.id is distinct from new.id
    or old.idempotency_key is distinct from new.idempotency_key
    or old.template_version_id is distinct from new.template_version_id
    or old.programme_id is distinct from new.programme_id
    or old.programme_run_id is distinct from new.programme_run_id
    or old.credential_type_id is distinct from new.credential_type_id
    or old.language_code is distinct from new.language_code
    or old.issue_date is distinct from new.issue_date
    or old.completion_date is distinct from new.completion_date
    or old.created_by is distinct from new.created_by
    or old.created_at is distinct from new.created_at then
    raise exception 'credential generation batch identity and issuing context are immutable'
      using errcode = '23514';
  end if;

  if old.activation_blocked and (
    not new.activation_blocked
    or old.activation_block_reason is distinct from new.activation_block_reason
  ) then
    raise exception 'credential generation batch activation block is permanent'
      using errcode = '23514';
  end if;

  if old.status = 'completed' and old is distinct from new and not (
    not old.activation_blocked
    and new.activation_blocked
    and old.activation_block_reason is null
    and new.activation_block_reason = 'synthetic_qa'
    and (to_jsonb(old) - 'activation_blocked' - 'activation_block_reason')
      is not distinct from
      (to_jsonb(new) - 'activation_blocked' - 'activation_block_reason')
  ) then
    raise exception 'completed credential generation batches are immutable'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function internal.enforce_generation_batch_identity() is
  'Prevents batch deletion/context mutation, makes completed batches terminal, and makes an activation block irreversible.';

revoke all on function internal.enforce_generation_batch_identity()
  from public, anon, authenticated;
grant execute on function internal.enforce_generation_batch_identity()
  to postgres, service_role;

create or replace function internal.audit_credential_generation_batch_change()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
begin
  if tg_op = 'INSERT' or old.status is distinct from new.status then
    perform internal.write_audit_log(
      p_action => case when tg_op = 'INSERT'
        then 'credential_generation.batch_created'
        else 'credential_generation.batch_status_changed'
      end,
      p_actor_id => auth.uid(),
      p_target_schema => 'public',
      p_target_table => 'credential_generation_batches',
      p_target_id => new.id,
      p_metadata => case when tg_op = 'INSERT'
        then jsonb_build_object(
          'template_version_id', new.template_version_id,
          'status', new.status,
          'processing_chunk_size', new.processing_chunk_size
        )
        else jsonb_build_object('from_status', old.status, 'to_status', new.status)
      end
    );
  end if;

  if tg_op = 'UPDATE'
    and not old.activation_blocked
    and new.activation_blocked then
    perform internal.write_audit_log(
      p_action => 'credential_generation.batch_activation_blocked',
      p_actor_id => auth.uid(),
      p_target_schema => 'public',
      p_target_table => 'credential_generation_batches',
      p_target_id => new.id,
      p_metadata => jsonb_build_object('reason', new.activation_block_reason)
    );
  end if;

  return new;
end;
$$;

comment on function internal.audit_credential_generation_batch_change() is
  'Audits aggregate batch creation, status, and permanent activation blocking without learner identity, contact, token, error, or file data.';

revoke all on function internal.audit_credential_generation_batch_change()
  from public, anon, authenticated;
grant execute on function internal.audit_credential_generation_batch_change()
  to postgres, service_role;

create or replace function internal.mark_synthetic_qa_generation_batch()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
begin
  if exists (
    select 1
    from public.learners learner
    where learner.id = new.learner_id
      and learner.internal_note in (
        'PDFGEN-008 synthetic Development-only cohort A',
        'PDFGEN-008 synthetic Development-only cohort B',
        'PDFGEN-008 synthetic Development-only cohort C'
      )
  ) then
    update public.credential_generation_batches batch
    set activation_blocked = true,
        activation_block_reason = 'synthetic_qa'
    where batch.id = new.batch_id
      and not batch.activation_blocked;
  end if;

  return new;
end;
$$;

comment on function internal.mark_synthetic_qa_generation_batch() is
  'Permanently marks a generation batch when its cohort contains a known PDFGEN-008 synthetic Development learner.';

revoke all on function internal.mark_synthetic_qa_generation_batch()
  from public, anon, authenticated;
grant execute on function internal.mark_synthetic_qa_generation_batch()
  to postgres, service_role;

create trigger credential_generation_batch_items_mark_synthetic_qa
after insert on public.credential_generation_batch_items
for each row execute function internal.mark_synthetic_qa_generation_batch();

update public.credential_generation_batches batch
set activation_blocked = true,
    activation_block_reason = 'synthetic_qa'
where not batch.activation_blocked
  and exists (
    select 1
    from public.credential_generation_batch_items item
    join public.learners learner on learner.id = item.learner_id
    where item.batch_id = batch.id
      and learner.internal_note in (
        'PDFGEN-008 synthetic Development-only cohort A',
        'PDFGEN-008 synthetic Development-only cohort B',
        'PDFGEN-008 synthetic Development-only cohort C'
      )
  );

create or replace function internal.block_synthetic_qa_activation_or_delivery()
returns trigger
language plpgsql
security definer
set search_path = internal, public, pg_temp
as $$
declare
  v_batch_id uuid;
begin
  if tg_table_name = 'credential_generation_batch_activation_requests' then
    v_batch_id := new.batch_id;
  elsif tg_table_name = 'credential_generation_batch_activation_items' then
    if new.status <> 'processing' then
      return new;
    end if;

    select batch_item.batch_id into v_batch_id
    from public.credential_generation_batch_items batch_item
    where batch_item.id = new.batch_item_id;
  elsif tg_table_name = 'credentials' then
    if old.status is not distinct from new.status or new.status <> 'valid' then
      return new;
    end if;

    select batch_item.batch_id into v_batch_id
    from public.credential_generation_batch_items batch_item
    where batch_item.credential_id = new.id;
  elsif tg_table_name = 'credential_email_sends' then
    select batch_item.batch_id into v_batch_id
    from public.credential_generation_batch_items batch_item
    where batch_item.credential_id = new.credential_id;
  end if;

  if exists (
    select 1
    from public.credential_generation_batches batch
    where batch.id = v_batch_id
      and batch.activation_blocked
  ) then
    raise exception 'synthetic QA batch activation and email delivery are permanently blocked'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

comment on function internal.block_synthetic_qa_activation_or_delivery() is
  'Fail-closed database guard at request, claim, credential activation, and email-ledger boundaries for permanently blocked QA batches.';

revoke all on function internal.block_synthetic_qa_activation_or_delivery()
  from public, anon, authenticated;
grant execute on function internal.block_synthetic_qa_activation_or_delivery()
  to postgres, service_role;

create trigger credential_generation_batch_activation_requests_block_synthetic_qa
before insert on public.credential_generation_batch_activation_requests
for each row execute function internal.block_synthetic_qa_activation_or_delivery();

create trigger credential_generation_batch_activation_items_block_synthetic_qa
before update of status on public.credential_generation_batch_activation_items
for each row execute function internal.block_synthetic_qa_activation_or_delivery();

create trigger credentials_block_synthetic_qa_activation
before update of status on public.credentials
for each row execute function internal.block_synthetic_qa_activation_or_delivery();

create trigger credential_email_sends_block_synthetic_qa_delivery
before insert on public.credential_email_sends
for each row execute function internal.block_synthetic_qa_activation_or_delivery();
