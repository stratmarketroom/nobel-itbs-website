import { readCredentialObject } from '@/lib/credentials/admin-input';
import type { VoidPendingCredentialInput } from '@/lib/credentials/void-types';
import { assertKeys } from '@/lib/programmes/admin-input';
import { ApiError } from '@/lib/supabase/server';

export async function readVoidPendingCredentialInput(request: Request): Promise<VoidPendingCredentialInput> {
  const body = await readCredentialObject(request);
  assertKeys(body, ['reason']);

  if (typeof body.reason !== 'string' || !body.reason.trim()) {
    throw new ApiError('bad_request', 400, 'Void reason is required.');
  }

  const reason = body.reason.trim();
  if (reason.length > 4000) {
    throw new ApiError('bad_request', 400, 'Void reason is too long.');
  }

  return { reason };
}
