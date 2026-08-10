const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('QA-001 live verification requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.');
  process.exit(1);
}

const publicTables = [
  'content_page_translations',
  'content_pages',
  'expert_translations',
  'experts',
  'languages',
  'partner_translations',
  'partners',
  'programme_area_translations',
  'programme_areas',
  'programme_pricing_option_translations',
  'programme_pricing_options',
  'programme_runs',
  'programme_slug_redirects',
  'programme_translations',
  'programme_type_translations',
  'programme_types',
  'programmes',
  'site_settings',
];

const privateTables = [
  'audit_log',
  'contact_submissions',
  'credential_email_sends',
  'credential_file_types',
  'credential_files',
  'credential_history',
  'credential_notes',
  'credential_sets',
  'credential_type_translations',
  'credential_types',
  'credentials',
  'document_number_log',
  'email_templates',
  'learner_emails',
  'learner_phones',
  'learners',
  'user_profiles',
  'user_roles',
];

const headers = {
  apikey: anonKey,
  authorization: `Bearer ${anonKey}`,
};
const errors = [];

async function request(path, init) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: { ...headers, ...init?.headers },
    signal: AbortSignal.timeout(15_000),
  });
  return response;
}

for (const table of publicTables) {
  const columns = table === 'languages'
    ? 'code'
    : table === 'programme_slug_redirects'
      ? 'old_slug,new_slug'
      : '*';
  const response = await request(`${table}?select=${encodeURIComponent(columns)}&limit=1`);
  if (!response.ok) errors.push(`Anon public read failed for ${table}: HTTP ${response.status}.`);
}

for (const table of privateTables) {
  const response = await request(`${table}?select=*&limit=1`);
  if (response.ok) errors.push(`Anon unexpectedly received direct read access to ${table}.`);
}

for (const [name, body] of [
  ['verify_public_credential', {
    p_lookup_kind: 'document_number',
    p_lookup_value: 'QA-001-NOT-A-REAL-NUMBER',
    p_rate_key: '0'.repeat(64),
  }],
  ['create_public_contact_submission', {
    p_type: 'general',
    p_name: 'QA-001',
    p_email: 'qa-001@example.invalid',
    p_phone: null,
    p_message: 'This request must be rejected before persistence.',
    p_language_code: 'en',
    p_rate_key: '0'.repeat(64),
    p_privacy_notice_path: '/privacy',
  }],
]) {
  const response = await request(`rpc/${name}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (response.ok) errors.push(`Anon unexpectedly executed service-only RPC ${name}.`);
}

if (errors.length) {
  console.error('QA-001 live anonymous-boundary verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`QA-001 live anonymous-boundary verification passed: ${publicTables.length} public reads, ${privateTables.length} private denials, 2 service-only RPC denials.`);
