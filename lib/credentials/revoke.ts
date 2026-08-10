import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { RevokeCredentialInput, RevokeCredentialResult } from '@/lib/credentials/revoke-types';
import {
  ApiError,
  assertCanManageCredentials,
  getSupabaseRequestClient,
  type AdminContext,
} from '@/lib/supabase/server';

type RevokeCredentialRow = {
  credential_id: string;
  credential_status: 'revoked';
  revoked_at: string;
};

function client(context: AdminContext): SupabaseClient {
  assertCanManageCredentials(context);
  return getSupabaseRequestClient(context.accessToken);
}

function revokeError(error: { code?: string } | null): ApiError {
  if (error?.code === '42501') {
    return new ApiError('forbidden', 403, 'Credential revocation is not permitted.');
  }
  if (error?.code === '23514') {
    return new ApiError('conflict', 409, 'Only a valid credential can be revoked.');
  }
  if (error?.code === '22023' || error?.code === '22P02') {
    return new ApiError('bad_request', 400, 'Credential revocation data is invalid.');
  }
  return new ApiError('server_error', 500, 'Credential could not be revoked.');
}

export async function revokeCredential(
  context: AdminContext,
  credentialId: string,
  input: RevokeCredentialInput,
): Promise<RevokeCredentialResult> {
  const db = client(context);
  const { data, error } = await db.rpc('revoke_credential', {
    p_credential_id: credentialId,
    p_reason: input.reason,
  });

  const row = (data as RevokeCredentialRow[] | null)?.[0];
  if (error || !row) throw revokeError(error);

  return {
    credentialId: row.credential_id,
    status: row.credential_status,
    revokedAt: row.revoked_at,
  };
}
