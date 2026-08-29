import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const pageSize = 1000;
const rotationBatchSize = 100;
const applyChanges = process.argv.includes('--apply');
const expectedProjectRef = process.argv
  .find((argument) => argument.startsWith('--expected-project-ref='))
  ?.slice('--expected-project-ref='.length);

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`missing_${name.toLowerCase()}`);
  return value;
}

function positiveVersion(name) {
  const value = Number(required(name));
  if (!Number.isSafeInteger(value) || value < 1) throw new Error(`invalid_${name.toLowerCase()}`);
  return value;
}

function encryptionKey(name) {
  const value = Buffer.from(required(name), 'base64');
  if (value.length !== 32) throw new Error(`invalid_${name.toLowerCase()}`);
  return value;
}

function decryptToken(encryptedMaterial, key) {
  const [algorithm, ivValue, tagValue, ciphertextValue, ...extra] = encryptedMaterial.split('.');
  if (algorithm !== 'aes-256-gcm' || !ivValue || !tagValue || !ciphertextValue || extra.length) {
    throw new Error('invalid_encrypted_material');
  }
  const initializationVector = Buffer.from(ivValue, 'base64url');
  const authenticationTag = Buffer.from(tagValue, 'base64url');
  const ciphertext = Buffer.from(ciphertextValue, 'base64url');
  if (initializationVector.length !== 12 || authenticationTag.length !== 16 || ciphertext.length < 1) {
    throw new Error('invalid_encrypted_material');
  }
  const decipher = createDecipheriv('aes-256-gcm', key, initializationVector);
  decipher.setAuthTag(authenticationTag);
  const token = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new Error('invalid_decrypted_material');
  return token;
}

function encryptToken(token, key) {
  const initializationVector = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, initializationVector);
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return [
    'aes-256-gcm',
    initializationVector.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    ciphertext.toString('base64url'),
  ].join('.');
}

function lookupHash(token, secret) {
  return createHmac('sha256', secret).update(token, 'utf8').digest('hex');
}

async function paginatedCredentials(client) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await client
      .from('credentials')
      .select('id, verification_token_lookup_hash, verification_token_encrypted, token_encryption_key_version')
      .order('id', { ascending: true })
      .range(from, from + pageSize - 1);
    if (error) throw new Error('credential_read_failed');
    rows.push(...(data ?? []));
    if ((data?.length ?? 0) < pageSize) break;
  }
  return rows;
}

function materialFor(row, configuration) {
  const token = decryptToken(row.verification_token_encrypted, configuration.legacyEncryptionKey);
  const storedHash = Buffer.from(row.verification_token_lookup_hash, 'hex');
  const expectedHash = Buffer.from(lookupHash(token, configuration.legacyHmacSecret), 'hex');
  if (storedHash.length !== expectedHash.length || !timingSafeEqual(storedHash, expectedHash)) {
    throw new Error('legacy_lookup_hash_mismatch');
  }
  return {
    credential_id: row.id,
    lookup_hash: lookupHash(token, configuration.currentHmacSecret),
    encrypted_material: encryptToken(token, configuration.currentEncryptionKey),
  };
}

async function main() {
  const url = required('NEXT_PUBLIC_SUPABASE_URL').replace(/\/$/u, '');
  const serviceKey = required('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceKey.startsWith('sb_secret_')) throw new Error('modern_service_key_required');
  const projectRef = new URL(url).hostname.split('.')[0];
  if (!expectedProjectRef || projectRef !== expectedProjectRef) throw new Error('unexpected_supabase_project');

  const configuration = {
    currentHmacSecret: required('CREDENTIAL_TOKEN_HMAC_SECRET'),
    currentEncryptionKey: encryptionKey('CREDENTIAL_TOKEN_ENCRYPTION_KEY'),
    currentKeyVersion: positiveVersion('CREDENTIAL_TOKEN_ENCRYPTION_KEY_VERSION'),
    legacyHmacSecret: required('CREDENTIAL_TOKEN_HMAC_SECRET_LEGACY'),
    legacyEncryptionKey: encryptionKey('CREDENTIAL_TOKEN_ENCRYPTION_KEY_LEGACY'),
    legacyKeyVersion: positiveVersion('CREDENTIAL_TOKEN_ENCRYPTION_KEY_LEGACY_VERSION'),
  };
  if (
    Buffer.byteLength(configuration.currentHmacSecret, 'utf8') < 32
    || Buffer.byteLength(configuration.legacyHmacSecret, 'utf8') < 32
    || configuration.currentHmacSecret === configuration.legacyHmacSecret
    || configuration.currentEncryptionKey.equals(configuration.legacyEncryptionKey)
    || configuration.currentKeyVersion <= configuration.legacyKeyVersion
  ) throw new Error('invalid_rotation_configuration');

  const client = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const credentials = await paginatedCredentials(client);
  const legacyRows = credentials.filter((row) => row.token_encryption_key_version === configuration.legacyKeyVersion);
  const currentRows = credentials.filter((row) => row.token_encryption_key_version === configuration.currentKeyVersion);
  const unexpectedRows = credentials.length - legacyRows.length - currentRows.length;
  if (unexpectedRows) throw new Error('unexpected_stored_key_version');

  const prepared = legacyRows.map((row) => materialFor(row, configuration));
  if (!applyChanges) {
    console.log(JSON.stringify({
      mode: 'dry-run',
      credentials: credentials.length,
      prepared: prepared.length,
      alreadyCurrent: currentRows.length,
      fromKeyVersion: configuration.legacyKeyVersion,
      toKeyVersion: configuration.currentKeyVersion,
    }));
    return;
  }

  let rotated = 0;
  let alreadyRotated = 0;
  for (let index = 0; index < prepared.length; index += rotationBatchSize) {
    const items = prepared.slice(index, index + rotationBatchSize);
    const { data, error } = await client.rpc('rotate_credential_token_material_batch', {
      p_expected_key_version: configuration.legacyKeyVersion,
      p_new_key_version: configuration.currentKeyVersion,
      p_items: items,
    });
    if (error) throw new Error('credential_rotation_rpc_failed');
    const result = Array.isArray(data) ? data[0] : null;
    rotated += Number(result?.rotated_count ?? 0);
    alreadyRotated += Number(result?.already_rotated_count ?? 0);
  }

  const verified = await paginatedCredentials(client);
  const remainingLegacy = verified.filter((row) => row.token_encryption_key_version === configuration.legacyKeyVersion).length;
  const currentVersion = verified.filter((row) => row.token_encryption_key_version === configuration.currentKeyVersion).length;
  if (remainingLegacy || currentVersion !== verified.length) throw new Error('post_rotation_verification_failed');

  console.log(JSON.stringify({
    mode: 'apply',
    credentials: verified.length,
    rotated,
    alreadyRotated,
    remainingLegacy,
    currentVersion,
    fromKeyVersion: configuration.legacyKeyVersion,
    toKeyVersion: configuration.currentKeyVersion,
  }));
}

main().catch((error) => {
  const reason = error instanceof Error ? error.message.replace(/[^a-z0-9_]/giu, '').slice(0, 80) : 'unknown_error';
  console.error(`Credential token rotation failed: ${reason || 'unknown_error'}.`);
  process.exit(1);
});
