begin;

select plan(7);

select has_extension('pgcrypto', 'pgcrypto extension should be enabled');
select has_extension('citext', 'citext extension should be enabled');
select has_extension('pg_trgm', 'pg_trgm extension should be enabled');

select has_schema('internal', 'internal schema should exist');

select has_function(
  'internal',
  'set_updated_at',
  array[]::name[],
  'internal.set_updated_at trigger helper should exist'
);

select function_lang_is(
  'internal',
  'set_updated_at',
  array[]::name[],
  'plpgsql',
  'internal.set_updated_at should use plpgsql'
);

select function_returns(
  'internal',
  'set_updated_at',
  array[]::name[],
  'trigger',
  'internal.set_updated_at should return trigger'
);

select * from finish();

rollback;
