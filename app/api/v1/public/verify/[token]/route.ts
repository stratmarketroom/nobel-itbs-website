import { NextResponse } from 'next/server';
import {
  PublicVerificationError,
  verifyCredentialByToken,
} from '@/lib/credentials/public-verification';

type TokenRouteProps = { params: Promise<{ token: string }> };

function response(body: unknown, status = 200, headers?: HeadersInit) {
  return NextResponse.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      ...headers,
    },
  });
}

export async function GET(request: Request, { params }: TokenRouteProps) {
  const { token } = await params;
  if (!token || token.length > 100) {
    return response({
      result: 'not_found',
      message: 'За цим кодом/номером документ не знайдено.',
    });
  }

  try {
    return response(await verifyCredentialByToken(token, request));
  } catch (error) {
    if (error instanceof PublicVerificationError && error.code === 'rate_limited') {
      return response({ error: { code: 'rate_limited' } }, 429, { 'Retry-After': '900' });
    }
    return response({ error: { code: 'temporary_error' } }, 503);
  }
}
