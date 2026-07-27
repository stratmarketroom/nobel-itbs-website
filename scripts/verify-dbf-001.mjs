import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';

const requiredPaths = [
  'supabase/config.toml',
  'supabase/migrations',
  'supabase/tests',
  'docs/development/SUPABASE_LOCAL_SETUP.md',
  '.env.example',
  'package.json',
];

const errors = [];

for (const path of requiredPaths) {
  if (!existsSync(path)) {
    errors.push(`Missing required path: ${path}`);
  }
}

if (existsSync('supabase/config.toml')) {
  const config = readFileSync('supabase/config.toml', 'utf8');

  const requiredSnippets = [
    'project_id = "nobel-itbs-website"',
    '[api]',
    '[db]',
    '[auth]',
    '[storage]',
  ];

  for (const snippet of requiredSnippets) {
    if (!config.includes(snippet)) {
      errors.push(`supabase/config.toml missing expected snippet: ${snippet}`);
    }
  }

  const suspiciousAssignments = config
    .split('\n')
    .map((line, index) => ({ index: index + 1, line: line.trim() }))
    .filter(({ line }) => /^[a-z0-9_.-]+\s*=\s*["']?(?:sbp_|eyJ|sk_|postgres:\/\/|[A-Za-z0-9+/=]{48,})/i.test(line));

  if (suspiciousAssignments.length > 0) {
    errors.push(
      `supabase/config.toml appears to contain secret-like assigned values on lines: ${suspiciousAssignments
        .map(({ index }) => index)
        .join(', ')}`,
    );
  }
}

for (const dir of ['supabase/migrations', 'supabase/tests']) {
  if (existsSync(dir) && !statSync(dir).isDirectory()) {
    errors.push(`${dir} must be a directory.`);
  }
}

if (existsSync('supabase/migrations')) {
  const sqlFiles = readdirSync('supabase/migrations').filter((name) => name.endsWith('.sql'));
  if (sqlFiles.length > 0) {
    errors.push(`DBF-001 must not add SQL migrations yet. Found: ${sqlFiles.join(', ')}`);
  }
}

if (existsSync('.env.example')) {
  const envExample = readFileSync('.env.example', 'utf8');
  if (!envExample.includes('SUPABASE_SERVICE_ROLE_KEY')) {
    errors.push('.env.example must document server-only service role handling.');
  }
}

if (errors.length > 0) {
  console.error('DBF-001 verification failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log('DBF-001 verification passed.');
