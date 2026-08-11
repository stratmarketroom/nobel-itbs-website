import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  console.error(
    'QA-005 live verification requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
  );
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const checks = [
  { table: 'partners', column: 'id' },
  { table: 'partner_translations', column: 'partner_id' },
  { table: 'experts', column: 'id' },
  { table: 'expert_translations', column: 'expert_id' },
];
const errors = [];

for (const { table, column } of checks) {
  const { error } = await supabase
    .from(table)
    .select(column, { count: 'exact', head: true });

  if (error) {
    errors.push(
      `${table}: ${error.code ?? 'unknown database error'} ${error.message ?? ''}`.trim(),
    );
  }
}

if (errors.length) {
  console.error('QA-005 live production-grants verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  'QA-005 live production-grants verification passed for four partnership tables.',
);
