-- LRN-005: Atomic learner list import.
-- The server parses and previews XLSX/CSV. This function repeats critical
-- validation and persists only an explicitly confirmed, conflict-free batch.

create or replace function public.import_learners(p_rows jsonb)
returns jsonb
language plpgsql
security definer
set search_path = internal, public, extensions, pg_temp
as $$
declare
  v_actor_id uuid := auth.uid();
  v_row record;
  v_learner_id uuid;
  v_ids uuid[] := array[]::uuid[];
  v_count integer;
begin
  perform internal.assert_sensitive_action_allowed(
    array['owner'::public.app_role, 'super_admin'::public.app_role, 'credential_manager'::public.app_role],
    'learner list import'
  );

  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'Learner import rows must be a JSON array.' using errcode = '22023';
  end if;

  v_count := jsonb_array_length(p_rows);
  if v_count < 1 or v_count > 500 then
    raise exception 'Learner import must contain between 1 and 500 rows.' using errcode = '22023';
  end if;

  create temporary table lrn_005_import_rows (
    row_number integer not null,
    latin_first_name text not null,
    latin_last_name text not null,
    ukrainian_full_name text not null,
    email text null,
    phone text null,
    has_telegram boolean not null,
    telegram_username text null,
    has_viber boolean not null,
    has_whatsapp boolean not null,
    internal_note text null
  ) on commit drop;

  insert into lrn_005_import_rows
  select
    imported.row_number,
    btrim(imported.latin_first_name),
    btrim(imported.latin_last_name),
    btrim(imported.ukrainian_full_name),
    nullif(lower(btrim(imported.email)), ''),
    nullif(btrim(imported.phone), ''),
    coalesce(imported.has_telegram, false),
    nullif(regexp_replace(btrim(imported.telegram_username), '^@', ''), ''),
    coalesce(imported.has_viber, false),
    coalesce(imported.has_whatsapp, false),
    nullif(btrim(imported.internal_note), '')
  from jsonb_to_recordset(p_rows) as imported(
    row_number integer,
    latin_first_name text,
    latin_last_name text,
    ukrainian_full_name text,
    email text,
    phone text,
    has_telegram boolean,
    telegram_username text,
    has_viber boolean,
    has_whatsapp boolean,
    internal_note text
  );

  if (select count(*) from lrn_005_import_rows) <> v_count then
    raise exception 'Learner import rows could not be parsed.' using errcode = '22023';
  end if;

  if exists (
    select 1 from lrn_005_import_rows
    where row_number < 2
      or latin_first_name = '' or char_length(latin_first_name) > 160
      or latin_last_name = '' or char_length(latin_last_name) > 160
      or ukrainian_full_name = '' or char_length(ukrainian_full_name) > 320
      or char_length(coalesce(internal_note, '')) > 4000
      or (email is not null and (char_length(email) > 320 or email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'))
      or (phone is not null and phone !~ '^\+[1-9][0-9]{6,14}$')
      or char_length(coalesce(telegram_username, '')) > 64
      or (telegram_username is not null and not has_telegram)
  ) then
    raise exception 'Learner import contains invalid values.' using errcode = '22023';
  end if;

  if exists (
    select 1 from lrn_005_import_rows
    group by lower(latin_first_name), lower(latin_last_name), lower(ukrainian_full_name)
    having count(*) > 1
  ) or exists (
    select 1 from lrn_005_import_rows where email is not null group by email having count(*) > 1
  ) or exists (
    select 1 from lrn_005_import_rows where phone is not null group by phone having count(*) > 1
  ) then
    raise exception 'Learner import contains duplicate rows or contacts.' using errcode = '23505';
  end if;

  if exists (
    select 1
    from lrn_005_import_rows imported
    join public.learners existing
      on lower(existing.latin_first_name) = lower(imported.latin_first_name)
     and lower(existing.latin_last_name) = lower(imported.latin_last_name)
     and lower(existing.ukrainian_full_name) = lower(imported.ukrainian_full_name)
  ) or exists (
    select 1 from lrn_005_import_rows imported join public.learner_emails existing on existing.email = imported.email
  ) or exists (
    select 1 from lrn_005_import_rows imported join public.learner_phones existing on existing.phone = imported.phone
  ) then
    raise exception 'Learner import conflicts with an existing learner or contact.' using errcode = '23505';
  end if;

  for v_row in select * from lrn_005_import_rows order by row_number loop
    insert into public.learners (latin_first_name, latin_last_name, ukrainian_full_name, internal_note)
    values (v_row.latin_first_name, v_row.latin_last_name, v_row.ukrainian_full_name, v_row.internal_note)
    returning id into v_learner_id;

    if v_row.email is not null then
      insert into public.learner_emails (learner_id, email, is_primary)
      values (v_learner_id, v_row.email, true);
    end if;

    if v_row.phone is not null then
      insert into public.learner_phones (
        learner_id, phone, has_telegram, telegram_username,
        has_viber, has_whatsapp, is_primary
      ) values (
        v_learner_id, v_row.phone, v_row.has_telegram, v_row.telegram_username,
        v_row.has_viber, v_row.has_whatsapp, true
      );
    end if;

    v_ids := array_append(v_ids, v_learner_id);
  end loop;

  perform internal.write_audit_log(
    p_action => 'learners.imported',
    p_actor_id => v_actor_id,
    p_target_schema => 'public',
    p_target_table => 'learners',
    p_metadata => jsonb_build_object('count', v_count)
  );

  return jsonb_build_object('importedCount', v_count, 'learnerIds', to_jsonb(v_ids));
end;
$$;

comment on function public.import_learners(jsonb) is
  'Atomically imports a validated learner batch for an MFA-verified Owner, Super Admin, or Credential Manager. Audit metadata contains only the row count.';

revoke all on function public.import_learners(jsonb) from public, anon;
grant execute on function public.import_learners(jsonb) to authenticated, service_role;
