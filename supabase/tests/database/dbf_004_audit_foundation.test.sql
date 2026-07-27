begin;

select plan(9);

select has_table('public', 'audit_log', 'audit_log table should exist');
select has_column('public', 'audit_log', 'actor_id', 'audit_log.actor_id should exist');
select has_column('public', 'audit_log', 'action', 'audit_log.action should exist');
select has_column('public', 'audit_log', 'metadata', 'audit_log.metadata should exist');

select has_function(
  'internal',
  'prevent_audit_log_mutation',
  array[]::name[],
  'internal.prevent_audit_log_mutation should exist'
);

select has_function(
  'internal',
  'write_audit_log',
  array[
    'text',
    'uuid',
    'text',
    'text',
    'uuid',
    'text',
    'text',
    'text',
    'jsonb'
  ]::name[],
  'internal.write_audit_log should exist'
);

select lives_ok(
  $$select internal.write_audit_log('dbf_004.test')$$,
  'internal.write_audit_log should insert an audit entry'
);

select throws_ok(
  $$update public.audit_log set metadata = '{"changed": true}'::jsonb where action = 'dbf_004.test'$$,
  '42501',
  'audit_log is append-only',
  'audit_log should reject updates'
);

select throws_ok(
  $$truncate public.audit_log$$,
  '42501',
  'audit_log is append-only',
  'audit_log should reject truncation'
);

select * from finish();

rollback;
