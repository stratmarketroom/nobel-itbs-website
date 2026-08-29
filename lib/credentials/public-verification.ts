import 'server-only';
import { createHmac } from 'node:crypto';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import type { PublicCredentialVerification } from './verification-types';

const notFoundResult: PublicCredentialVerification = {
  result: 'not_found',
  message: 'За цим кодом/номером документ не знайдено.',
};

type VerificationRow = {
  verification_result: unknown;
  public_status: unknown;
  document_number: unknown;
  holder_name: unknown;
  programme_title: unknown;
  credential_type: unknown;
  issue_date: unknown;
};

export class PublicVerificationError extends Error {
  code: 'rate_limited' | 'temporary_error';

  constructor(code: PublicVerificationError['code']) {
    super(code);
    this.code = code;
  }
}

function requiredSecret(name: 'CREDENTIAL_TOKEN_HMAC_SECRET' | 'CREDENTIAL_VERIFICATION_RATE_LIMIT_SECRET'): string {
  const fallback = name === 'CREDENTIAL_VERIFICATION_RATE_LIMIT_SECRET'
    ? process.env.CONTACT_RATE_LIMIT_SECRET
    : undefined;
  const value = process.env[name] || fallback;
  if (!value || Buffer.byteLength(value, 'utf8') < 32) throw new PublicVerificationError('temporary_error');
  return value;
}

function credentialTokenHmacSecrets(): string[] {
  const current = requiredSecret('CREDENTIAL_TOKEN_HMAC_SECRET');
  const legacy = process.env.CREDENTIAL_TOKEN_HMAC_SECRET_LEGACY;
  if (!legacy) return [current];
  if (Buffer.byteLength(legacy, 'utf8') < 32 || legacy === current) {
    throw new PublicVerificationError('temporary_error');
  }
  return [current, legacy];
}

function clientAddress(request: Request): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')?.trim()
    || 'unavailable';
}

export function verificationRateKey(request: Request): string {
  const secret = requiredSecret('CREDENTIAL_VERIFICATION_RATE_LIMIT_SECRET');
  return createHmac('sha256', secret)
    .update(`credential-verification:${clientAddress(request)}`, 'utf8')
    .digest('hex');
}

export function credentialTokenLookupHash(rawToken: string): string {
  return credentialTokenLookupHashes(rawToken)[0];
}

export function credentialTokenLookupHashes(rawToken: string): string[] {
  const token = rawToken.trim();
  return credentialTokenHmacSecrets().map((secret) => (
    createHmac('sha256', secret).update(token, 'utf8').digest('hex')
  ));
}

export function normalizeDocumentNumber(value: string): string {
  return value.trim().toUpperCase();
}

function mapRow(row: VerificationRow | null): PublicCredentialVerification {
  if (!row || row.verification_result === 'not_found') return notFoundResult;
  if (row.verification_result === 'revoked') {
    return { result: 'revoked', publicStatus: 'Відкликаний' };
  }

  if (
    row.verification_result !== 'valid'
    || typeof row.document_number !== 'string'
    || typeof row.holder_name !== 'string'
    || typeof row.programme_title !== 'string'
    || typeof row.credential_type !== 'string'
    || typeof row.issue_date !== 'string'
  ) throw new PublicVerificationError('temporary_error');

  return {
    result: 'valid',
    publicStatus: 'Дійсний',
    document: {
      documentNumber: row.document_number,
      holderName: row.holder_name,
      programmeTitle: row.programme_title,
      credentialType: row.credential_type,
      issueDate: row.issue_date,
    },
  };
}

async function lookup(kind: 'token_hash' | 'document_number', value: string, request: Request) {
  try {
    const { data, error } = await getSupabaseAdminClient().rpc('verify_public_credential', {
      p_lookup_kind: kind,
      p_lookup_value: value,
      p_rate_key: verificationRateKey(request),
    });

    if (error) {
      if (error.message.includes('CREDENTIAL_VERIFICATION_RATE_LIMITED')) {
        throw new PublicVerificationError('rate_limited');
      }
      throw new PublicVerificationError('temporary_error');
    }

    const row = Array.isArray(data) ? data[0] as VerificationRow | undefined : null;
    return mapRow(row ?? null);
  } catch (error) {
    if (error instanceof PublicVerificationError) throw error;
    throw new PublicVerificationError('temporary_error');
  }
}

export async function verifyCredentialByToken(rawToken: string, request: Request) {
  for (const lookupHash of credentialTokenLookupHashes(rawToken)) {
    const result = await lookup('token_hash', lookupHash, request);
    if (result.result !== 'not_found') return result;
  }
  return notFoundResult;
}

export function verifyCredentialByDocumentNumber(documentNumber: string, request: Request) {
  return lookup('document_number', normalizeDocumentNumber(documentNumber), request);
}
