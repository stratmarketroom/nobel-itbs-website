import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { VoidPendingCredentialInput, VoidPendingCredentialResult } from '@/lib/credentials/void-types';
import {
  ApiError,
  assertCanManageCredentials,
  getSupabaseRequestClient,
  type AdminContext,
} from '@/lib/supabase/server';

type VoidPendingCredentialRow = {
  credential_id: string;
  credential_status: 'voided';
  voided_at: string;
  document_number_status: 'voided';
};

function client(context: AdminContext): SupabaseClient {
  assertCanManageCredentials(context);
  return getSupabaseRequestClient(context.accessToken);
}

function voidError(error: { code?: string } | null): ApiError {
  if (error?.code === '42501') {
    return new ApiError('forbidden', 403, 'Pending credential voiding is not permitted.');
  }
  if (error?.code === '23514') {
    return new ApiError('conflict', 409, 'Only a pending credential with its reserved number can be voided.');
  }
  if (error?.code === '22023' || error?.code === '22P02') {
    return new ApiError('bad_request', 400, 'Pending credential void data is invalid.');
  }
  return new ApiError('server_error', 500, 'Pending credential could not be voided.');
}

export async function voidPendingCredential(
  context: AdminContext,
  credentialId: string,
  input: VoidPendingCredentialInput,
): Promise<VoidPendingCredentialResult> {
  const db = client(context);
  const { data, error } = await db.rpc('void_pending_credential', {
    p_credential_id: credentialId,
    p_reason: input.reason,
  });

  const row = (data as VoidPendingCredentialRow[] | null)?.[0];
  if (error || !row) throw voidError(error);

  return {
    credentialId: row.credential_id,
    status: row.credential_status,
    voidedAt: row.voided_at,
    documentNumberStatus: row.document_number_status,
  };
}
