import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ApiError,
  assertCanManageCredentials,
  getSupabaseRequestClient,
  type AdminContext,
} from '@/lib/supabase/server';
import { createCredentialTokenMaterial } from '@/lib/credentials/token';
import type { CreatePendingCredentialInput, PendingCredentialAdminItem } from '@/lib/credentials/types';

type PendingCredentialRow = {
  credential_id: string;
  credential_set_id: string;
  document_number: string;
  status: 'pending';
  language_code: 'en' | 'ua' | 'cz';
  issue_date: string;
  public_holder_name: string;
  public_programme_title: string;
  public_credential_type: string;
  created_at: string;
};

function client(context: AdminContext): SupabaseClient {
  assertCanManageCredentials(context);
  return getSupabaseRequestClient(context.accessToken);
}

function credentialError(error: { code?: string } | null): ApiError {
  if (error?.code === '42501') return new ApiError('forbidden', 403, 'Pending credential creation is not permitted.');
  if (error?.code === '23505') return new ApiError('conflict', 409, 'Credential number or verification identity is already in use.');
  if (error?.code === '22023' || error?.code === '22P02' || error?.code === '23503' || error?.code === '23514') {
    return new ApiError('bad_request', 400, 'Pending credential data is invalid or inconsistent.');
  }
  return new ApiError('server_error', 500, 'Pending credential could not be created.');
}

export async function createPendingCredential(
  context: AdminContext,
  input: CreatePendingCredentialInput,
): Promise<PendingCredentialAdminItem> {
  const db = client(context);
  if (input.manualDocumentNumber && !context.roles.some((role) => role === 'owner' || role === 'super_admin')) {
    throw new ApiError('forbidden', 403, 'Only Owner or Super Admin can reserve a manual document number.');
  }

  const token = createCredentialTokenMaterial();
  const { data, error } = await db.rpc('create_pending_credential', {
    p_learner_id: input.learnerId,
    p_programme_id: input.programmeId,
    p_credential_type_id: input.credentialTypeId,
    p_language_code: input.languageCode,
    p_issue_date: input.issueDate,
    p_verification_token_lookup_hash: token.lookupHash,
    p_verification_token_encrypted: token.encryptedToken,
    p_token_encryption_key_version: token.keyVersion,
    p_public_holder_name: input.publicHolderName,
    p_public_programme_title: input.publicProgrammeTitle,
    p_public_credential_type: input.publicCredentialType,
    p_programme_run_id: input.programmeRunId,
    p_completion_date: input.completionDate,
    p_manual_document_number: input.manualDocumentNumber,
    p_manual_reason: input.manualReason,
  });

  const row = (data as PendingCredentialRow[] | null)?.[0];
  if (error || !row) throw credentialError(error);

  return {
    id: row.credential_id,
    credentialSetId: row.credential_set_id,
    documentNumber: row.document_number,
    status: row.status,
    languageCode: row.language_code,
    issueDate: row.issue_date,
    publicHolderName: row.public_holder_name,
    publicProgrammeTitle: row.public_programme_title,
    publicCredentialType: row.public_credential_type,
    createdAt: row.created_at,
    verificationUrl: token.verificationUrl,
  };
}
