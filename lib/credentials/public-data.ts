import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { UpdateValidPublicDataInput, UpdateValidPublicDataResult } from '@/lib/credentials/public-data-types';
import {
  ApiError,
  assertCanManageCredentials,
  getSupabaseRequestClient,
  type AdminContext,
} from '@/lib/supabase/server';

type UpdateValidPublicDataRow = {
  credential_id: string;
  credential_status: 'valid';
  public_holder_name: string;
  public_programme_title: string;
  public_credential_type: string;
  updated_at: string;
};

function client(context: AdminContext): SupabaseClient {
  assertCanManageCredentials(context);
  return getSupabaseRequestClient(context.accessToken);
}

function updateError(error: { code?: string } | null): ApiError {
  if (error?.code === '42501') {
    return new ApiError('forbidden', 403, 'Valid credential public-data editing is not permitted.');
  }
  if (error?.code === '23514') {
    return new ApiError('conflict', 409, 'Only a valid credential can have its public data corrected.');
  }
  if (error?.code === '22023' || error?.code === '22P02') {
    return new ApiError('bad_request', 400, 'Public credential data is invalid or unchanged.');
  }
  return new ApiError('server_error', 500, 'Public credential data could not be updated.');
}

export async function updateValidPublicData(
  context: AdminContext,
  credentialId: string,
  input: UpdateValidPublicDataInput,
): Promise<UpdateValidPublicDataResult> {
  const db = client(context);
  const { data, error } = await db.rpc('update_valid_credential_public_data', {
    p_credential_id: credentialId,
    p_public_holder_name: input.publicHolderName,
    p_public_programme_title: input.publicProgrammeTitle,
    p_public_credential_type: input.publicCredentialType,
    p_reason: input.reason,
  });

  const row = (data as UpdateValidPublicDataRow[] | null)?.[0];
  if (error || !row) throw updateError(error);

  return {
    credentialId: row.credential_id,
    status: row.credential_status,
    publicHolderName: row.public_holder_name,
    publicProgrammeTitle: row.public_programme_title,
    publicCredentialType: row.public_credential_type,
    updatedAt: row.updated_at,
  };
}
