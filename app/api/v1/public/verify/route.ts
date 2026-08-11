import { NextResponse } from 'next/server';
import {
  PublicVerificationError,
  verifyCredentialByDocumentNumber,
} from '@/lib/credentials/public-verification';

type VerifyBody = { documentNumber?: unknown };

function response(body: unknown, status = 200, headers?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', ...headers },
  });
}

export async function POST(request: Request) {
  let body: VerifyBody;
  try {
    body = await request.json() as VerifyBody;
  } catch {
    return response({ error: { code: 'invalid_request' } }, 400);
  }

  const keys = Object.keys(body);
  if (
    keys.length !== 1
    || keys[0] !== 'documentNumber'
    || typeof body.documentNumber !== 'string'
    || body.documentNumber.trim().length < 1
    || body.documentNumber.length > 100
  ) {
    return response({ error: { code: 'invalid_request' } }, 400);
  }

  try {
    return response(await verifyCredentialByDocumentNumber(body.documentNumber, request));
  } catch (error) {
    if (error instanceof PublicVerificationError && error.code === 'rate_limited') {
      return response({ error: { code: 'rate_limited' } }, 429, { 'Retry-After': '900' });
    }
    return response({ error: { code: 'temporary_error' } }, 503);
  }
}
