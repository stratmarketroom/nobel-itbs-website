import { NextResponse } from 'next/server';
import { ApiError } from '@/lib/supabase/server';

export function jsonOk<T>(body: T, init?: ResponseInit) {
  return NextResponse.json(body, init);
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      },
      { status: error.status },
    );
  }

  return NextResponse.json(
    {
      error: {
        code: 'server_error',
        message: 'Unexpected server error.',
      },
    },
    { status: 500 },
  );
}
