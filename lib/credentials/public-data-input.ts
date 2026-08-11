import { readCredentialObject } from '@/lib/credentials/admin-input';
import type { UpdateValidPublicDataInput } from '@/lib/credentials/public-data-types';
import { assertKeys } from '@/lib/programmes/admin-input';
import { ApiError } from '@/lib/supabase/server';

function requiredText(value: unknown, field: string, max: number): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ApiError('bad_request', 400, `${field} is required.`);
  }
  const normalized = value.trim();
  if (normalized.length > max) {
    throw new ApiError('bad_request', 400, `${field} is too long.`);
  }
  return normalized;
}

export async function readUpdateValidPublicDataInput(request: Request): Promise<UpdateValidPublicDataInput> {
  const body = await readCredentialObject(request);
  assertKeys(body, ['publicHolderName', 'publicProgrammeTitle', 'publicCredentialType', 'reason']);

  return {
    publicHolderName: requiredText(body.publicHolderName, 'Public holder name', 320),
    publicProgrammeTitle: requiredText(body.publicProgrammeTitle, 'Public programme title', 500),
    publicCredentialType: requiredText(body.publicCredentialType, 'Public credential type', 200),
    reason: requiredText(body.reason, 'Change reason', 4000),
  };
}
