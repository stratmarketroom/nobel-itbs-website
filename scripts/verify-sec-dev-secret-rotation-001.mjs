import { existsSync, readFileSync } from 'node:fs';

const files = {
  migration: 'supabase/migrations/20260829100000_sec_001_credential_token_rotation.sql',
  test: 'supabase/tests/database/sec_001_credential_token_rotation.test.sql',
  token: 'lib/credentials/token.ts',
  verification: 'lib/credentials/public-verification.ts',
  rotation: 'scripts/rotate-credential-token-secrets.mjs',
  env: '.env.example',
};
const errors = [];
for (const path of Object.values(files)) if (!existsSync(path)) errors.push(`Missing ${path}`);

if (!errors.length) {
  const source = Object.fromEntries(Object.entries(files).map(([name, path]) => [name, readFileSync(path, 'utf8')]));
  for (const snippet of [
    'public.rotate_credential_token_material_batch',
    "set_config('app.credential_token_rotation', 'allowed', true)",
    'jsonb_array_length(p_items) > 100',
    'p_new_key_version <= p_expected_key_version',
    "p_action => 'credential.token_material_rotated'",
    "'rotated_count', v_rotated_count",
    "'already_rotated_count', v_already_rotated_count",
    'from public, anon, authenticated',
    'to postgres, service_role',
  ]) if (!source.migration.includes(snippet)) errors.push(`Rotation migration missing ${snippet}`);

  for (const forbidden of [
    /grant\s+execute[^;]*\b(?:anon|authenticated)\b/isu,
    /p_metadata\s*=>[\s\S]*?(?:lookup_hash|encrypted_material|verification_token)/iu,
    /p_actor_id\s*=>\s*auth\.uid\(\)/iu,
  ]) if (forbidden.test(source.migration)) errors.push(`Unsafe rotation migration pattern: ${forbidden}`);

  for (const snippet of [
    'CREDENTIAL_TOKEN_ENCRYPTION_KEY_LEGACY',
    'CREDENTIAL_TOKEN_ENCRYPTION_KEY_LEGACY_VERSION',
    'encryptionKeys.get(storedKeyVersion)',
  ]) if (!source.token.includes(snippet)) errors.push(`Token keyring missing ${snippet}`);

  for (const snippet of [
    'CREDENTIAL_TOKEN_HMAC_SECRET_LEGACY',
    'credentialTokenLookupHashes(rawToken)',
    "result.result !== 'not_found'",
  ]) if (!source.verification.includes(snippet)) errors.push(`Verification keyring missing ${snippet}`);

  for (const snippet of [
    "process.argv.includes('--apply')",
    '--expected-project-ref=',
    "serviceKey.startsWith('sb_secret_')",
    'timingSafeEqual',
    "client.rpc('rotate_credential_token_material_batch'",
    'remainingLegacy',
    "mode: 'dry-run'",
    "mode: 'apply'",
  ]) if (!source.rotation.includes(snippet)) errors.push(`Rotation runner missing ${snippet}`);

  if (/console\.(?:log|error)\([^)]*(?:lookup_hash|encrypted_material|verification_token|p_items)/isu.test(source.rotation)) {
    errors.push('Rotation runner must never print token material or RPC items.');
  }
  if (/writeFile|appendFile|createWriteStream/u.test(source.rotation)) {
    errors.push('Rotation runner must keep transformed token material in memory only.');
  }

  for (const snippet of [
    'CREDENTIAL_TOKEN_HMAC_SECRET_LEGACY=',
    'CREDENTIAL_TOKEN_ENCRYPTION_KEY_LEGACY=',
    'CREDENTIAL_TOKEN_ENCRYPTION_KEY_LEGACY_VERSION=',
  ]) if (!source.env.includes(snippet)) errors.push(`Environment contract missing ${snippet}`);

  const planned = Number(source.test.match(/select\s+plan\((\d+)\)/iu)?.[1] ?? 0);
  const assertions = [...source.test.matchAll(/select\s+(?:has_function|has_trigger|results_eq)\s*\(/giu)].length;
  if (planned !== assertions) errors.push(`SEC-001 pgTAP plans ${planned} assertions but defines ${assertions}.`);
}

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (pkg.scripts?.['verify:sec-dev-secret-rotation-001'] !== 'node scripts/verify-sec-dev-secret-rotation-001.mjs') {
  errors.push('Missing SEC-001 static verification script.');
}
if (pkg.scripts?.['rotate:credential-token-secrets'] !== 'node scripts/rotate-credential-token-secrets.mjs') {
  errors.push('Missing credential-token rotation runner.');
}

if (errors.length) {
  console.error('SEC-DEV-SECRET-ROTATION-001 verification failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('SEC-DEV-SECRET-ROTATION-001 static verification passed.');
