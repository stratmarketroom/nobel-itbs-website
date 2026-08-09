import 'server-only';
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'node:crypto';
import { ApiError } from '@/lib/supabase/server';

const hmacSecretEnvName = 'CREDENTIAL_TOKEN_HMAC_SECRET';
const encryptionKeyEnvName = 'CREDENTIAL_TOKEN_ENCRYPTION_KEY';
const encryptionKeyVersionEnvName = 'CREDENTIAL_TOKEN_ENCRYPTION_KEY_VERSION';

function tokenConfiguration(): { hmacSecret: Buffer; encryptionKey: Buffer; keyVersion: number } {
  const hmacValue = process.env[hmacSecretEnvName];
  const encryptionValue = process.env[encryptionKeyEnvName];
  const keyVersionValue = process.env[encryptionKeyVersionEnvName] ?? '1';
  const keyVersion = Number(keyVersionValue);

  if (!hmacValue || Buffer.byteLength(hmacValue, 'utf8') < 32) {
    throw new ApiError('server_error', 500, 'Credential token HMAC configuration is missing or invalid.');
  }

  let encryptionKey: Buffer;
  try {
    encryptionKey = Buffer.from(encryptionValue ?? '', 'base64');
  } catch {
    throw new ApiError('server_error', 500, 'Credential token encryption configuration is invalid.');
  }

  if (
    encryptionKey.length !== 32
    || hmacValue === encryptionValue
    || !Number.isSafeInteger(keyVersion)
    || keyVersion < 1
  ) {
    throw new ApiError('server_error', 500, 'Credential token encryption configuration is missing or invalid.');
  }

  return { hmacSecret: Buffer.from(hmacValue, 'utf8'), encryptionKey, keyVersion };
}

export type CredentialTokenMaterial = {
  lookupHash: string;
  encryptedToken: string;
  keyVersion: number;
  verificationUrl: string;
};

export function createCredentialTokenMaterial(): CredentialTokenMaterial {
  const { hmacSecret, encryptionKey, keyVersion } = tokenConfiguration();
  const token = randomBytes(32).toString('base64url');
  const lookupHash = createHmac('sha256', hmacSecret).update(token, 'utf8').digest('hex');
  const initializationVector = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey, initializationVector);
  const ciphertext = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  const authenticationTag = cipher.getAuthTag();
  const encryptedToken = [
    'aes-256-gcm',
    initializationVector.toString('base64url'),
    authenticationTag.toString('base64url'),
    ciphertext.toString('base64url'),
  ].join('.');

  return {
    lookupHash,
    encryptedToken,
    keyVersion,
    verificationUrl: `/verify/${encodeURIComponent(token)}`,
  };
}

export function decryptCredentialVerificationUrl(encryptedToken: string, storedKeyVersion: number): string {
  const { encryptionKey, keyVersion } = tokenConfiguration();
  if (storedKeyVersion !== keyVersion) {
    throw new ApiError('server_error', 500, 'Credential token encryption key version is unavailable.');
  }

  const [algorithm, ivValue, tagValue, ciphertextValue, ...extra] = encryptedToken.split('.');
  if (algorithm !== 'aes-256-gcm' || !ivValue || !tagValue || !ciphertextValue || extra.length) {
    throw new ApiError('server_error', 500, 'Credential token material is invalid.');
  }

  try {
    const initializationVector = Buffer.from(ivValue, 'base64url');
    const authenticationTag = Buffer.from(tagValue, 'base64url');
    const ciphertext = Buffer.from(ciphertextValue, 'base64url');
    if (initializationVector.length !== 12 || authenticationTag.length !== 16 || ciphertext.length < 1) throw new Error('invalid token envelope');
    const decipher = createDecipheriv('aes-256-gcm', encryptionKey, initializationVector);
    decipher.setAuthTag(authenticationTag);
    const token = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw new Error('invalid token');
    return `/verify/${encodeURIComponent(token)}`;
  } catch {
    throw new ApiError('server_error', 500, 'Credential token material could not be decrypted.');
  }
}
