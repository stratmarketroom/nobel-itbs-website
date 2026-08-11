import 'server-only';
import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ApiError,
  assertCanManageCredentials,
  getSupabaseAdminClient,
  getSupabaseRequestClient,
  type AdminContext,
} from '@/lib/supabase/server';
import type {
  CredentialFileAdminItem,
  CredentialFilePatch,
  CredentialFileTypeAdminItem,
  PdfUploadInput,
} from '@/lib/credentials/file-types';

const bucket = 'private-credentials';
const signedUrlLifetimeSeconds = 60;

type FileRow = {
  id?: string;
  file_id?: string;
  credential_id: string;
  file_type_id: string;
  admin_label: string | null;
  mime_type: 'application/pdf';
  size_bytes: number;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
};

type FileTypeRow = { id: string; code: string; default_label: string };
type CredentialStatus = 'pending' | 'valid' | 'revoked' | 'voided';

function requestClient(context: AdminContext): SupabaseClient {
  assertCanManageCredentials(context);
  return getSupabaseRequestClient(context.accessToken);
}

function filePath(credentialId: string, fileId: string): string {
  return `${credentialId}/${fileId}.pdf`;
}

function toItem(row: FileRow): CredentialFileAdminItem {
  return {
    id: row.file_id ?? row.id ?? '',
    credentialId: row.credential_id,
    fileTypeId: row.file_type_id,
    adminLabel: row.admin_label,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    isPrimary: row.is_primary,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function databaseError(error: { code?: string } | null, fallback: string): ApiError {
  if (error?.code === '42501') return new ApiError('forbidden', 403, 'Credential file operation is not permitted.');
  if (error?.code === '22023' || error?.code === '22P02' || error?.code === '23503' || error?.code === '23514') {
    return new ApiError('bad_request', 400, fallback);
  }
  if (error?.code === '23505') return new ApiError('conflict', 409, 'Credential file state conflicts with another current file.');
  return new ApiError('server_error', 500, fallback);
}

async function credentialStatus(db: SupabaseClient, credentialId: string): Promise<CredentialStatus> {
  const { data, error } = await db.from('credentials').select('status').eq('id', credentialId).maybeSingle();
  if (error) throw databaseError(error, 'Credential could not be loaded.');
  if (!data) throw new ApiError('not_found', 404, 'Credential was not found.');
  return data.status as CredentialStatus;
}

async function fileRow(db: SupabaseClient, credentialId: string, fileId: string): Promise<FileRow> {
  const { data, error } = await db
    .from('credential_files')
    .select('id, credential_id, file_type_id, admin_label, mime_type, size_bytes, is_primary, created_at, updated_at')
    .eq('id', fileId)
    .eq('credential_id', credentialId)
    .maybeSingle();
  if (error) throw databaseError(error, 'Credential file could not be loaded.');
  if (!data) throw new ApiError('not_found', 404, 'Credential file was not found.');
  return data as FileRow;
}

async function removeUploadedObject(path: string): Promise<void> {
  const { error } = await getSupabaseAdminClient().storage.from(bucket).remove([path]);
  if (error) throw new ApiError('server_error', 500, 'Private PDF cleanup failed.');
}

async function restoreObject(path: string, bytes: ArrayBuffer): Promise<void> {
  const { error } = await getSupabaseAdminClient().storage.from(bucket).upload(path, bytes, {
    contentType: 'application/pdf',
    upsert: true,
  });
  if (error) throw new ApiError('server_error', 500, 'Private PDF rollback failed.');
}

export async function listCredentialFiles(
  context: AdminContext,
  credentialId: string,
): Promise<{ files: CredentialFileAdminItem[]; fileTypes: CredentialFileTypeAdminItem[] }> {
  const db = requestClient(context);
  await credentialStatus(db, credentialId);
  const [filesResult, typesResult] = await Promise.all([
    db.from('credential_files')
      .select('id, credential_id, file_type_id, admin_label, mime_type, size_bytes, is_primary, created_at, updated_at')
      .eq('credential_id', credentialId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true }),
    db.from('credential_file_types')
      .select('id, code, default_label')
      .eq('is_active', true)
      .order('default_label'),
  ]);
  if (filesResult.error) throw databaseError(filesResult.error, 'Credential files could not be loaded.');
  if (typesResult.error) throw databaseError(typesResult.error, 'Credential file types could not be loaded.');
  return {
    files: ((filesResult.data ?? []) as FileRow[]).map(toItem),
    fileTypes: ((typesResult.data ?? []) as FileTypeRow[]).map((row) => ({
      id: row.id,
      code: row.code,
      defaultLabel: row.default_label,
    })),
  };
}

export async function uploadCredentialFile(
  context: AdminContext,
  credentialId: string,
  input: PdfUploadInput,
): Promise<CredentialFileAdminItem> {
  const db = requestClient(context);
  await credentialStatus(db, credentialId);
  if (!input.fileTypeId) throw new ApiError('bad_request', 400, 'Credential file type is required.');
  const fileId = randomUUID();
  const path = filePath(credentialId, fileId);
  const storage = getSupabaseAdminClient().storage.from(bucket);
  const upload = await storage.upload(path, input.bytes, { contentType: 'application/pdf', upsert: false });
  if (upload.error) throw new ApiError('server_error', 500, 'Private PDF could not be uploaded.');

  const result = await db.rpc('attach_credential_file', {
    p_file_id: fileId,
    p_credential_id: credentialId,
    p_file_type_id: input.fileTypeId,
    p_admin_label: input.adminLabel,
    p_size_bytes: input.sizeBytes,
    p_is_primary: input.isPrimary,
    p_reason: input.reason,
  });
  const row = (result.data as FileRow[] | null)?.[0];
  if (result.error || !row) {
    try { await removeUploadedObject(path); } catch { throw new ApiError('server_error', 500, 'PDF metadata failed and private upload cleanup also failed.'); }
    throw databaseError(result.error, 'Credential file metadata could not be attached.');
  }
  return toItem(row);
}

export async function replaceCredentialFile(
  context: AdminContext,
  credentialId: string,
  fileId: string,
  input: PdfUploadInput,
): Promise<CredentialFileAdminItem> {
  const db = requestClient(context);
  await credentialStatus(db, credentialId);
  await fileRow(db, credentialId, fileId);
  const path = filePath(credentialId, fileId);
  const storage = getSupabaseAdminClient().storage.from(bucket);
  const previous = await storage.download(path);
  if (previous.error || !previous.data) throw new ApiError('server_error', 500, 'Current private PDF could not be loaded for safe replacement.');
  const previousBytes = await previous.data.arrayBuffer();
  const upload = await storage.upload(path, input.bytes, { contentType: 'application/pdf', upsert: true });
  if (upload.error) throw new ApiError('server_error', 500, 'Replacement PDF could not be uploaded.');

  const result = await db.rpc('replace_credential_file', {
    p_file_id: fileId,
    p_size_bytes: input.sizeBytes,
    p_reason: input.reason,
  });
  const row = (result.data as FileRow[] | null)?.[0];
  if (result.error || !row) {
    try { await restoreObject(path, previousBytes); } catch { throw new ApiError('server_error', 500, 'PDF metadata failed and the previous private PDF could not be restored.'); }
    throw databaseError(result.error, 'Credential PDF could not be replaced.');
  }
  return toItem(row);
}

export async function updateCredentialFile(
  context: AdminContext,
  credentialId: string,
  fileId: string,
  patch: CredentialFilePatch,
): Promise<CredentialFileAdminItem> {
  const db = requestClient(context);
  await credentialStatus(db, credentialId);
  const current = await fileRow(db, credentialId, fileId);
  const result = await db.rpc('update_credential_file', {
    p_file_id: fileId,
    p_file_type_id: patch.fileTypeId ?? current.file_type_id,
    p_admin_label: patch.adminLabel === undefined ? current.admin_label : patch.adminLabel,
    p_is_primary: patch.isPrimary ?? current.is_primary,
    p_reason: patch.reason ?? null,
  });
  const row = (result.data as FileRow[] | null)?.[0];
  if (result.error || !row) throw databaseError(result.error, 'Credential file metadata could not be updated.');
  return toItem(row);
}

export async function deleteCredentialFile(
  context: AdminContext,
  credentialId: string,
  fileId: string,
): Promise<void> {
  const db = requestClient(context);
  await credentialStatus(db, credentialId);
  await fileRow(db, credentialId, fileId);
  const path = filePath(credentialId, fileId);
  const storage = getSupabaseAdminClient().storage.from(bucket);
  const previous = await storage.download(path);
  if (previous.error || !previous.data) throw new ApiError('server_error', 500, 'Current private PDF could not be loaded for safe deletion.');
  const previousBytes = await previous.data.arrayBuffer();
  const removal = await storage.remove([path]);
  if (removal.error) throw new ApiError('server_error', 500, 'Private PDF could not be deleted.');

  const result = await db.rpc('delete_credential_file', { p_file_id: fileId, p_reason: null });
  if (result.error) {
    try { await restoreObject(path, previousBytes); } catch { throw new ApiError('server_error', 500, 'PDF metadata deletion failed and the private PDF could not be restored.'); }
    throw databaseError(result.error, 'Credential file could not be deleted.');
  }
}

function downloadName(file: FileRow): string {
  const base = (file.admin_label ?? 'credential-document')
    .replace(/[\r\n/\\]/g, '-')
    .trim()
    .slice(0, 180) || 'credential-document';
  return base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`;
}

export async function createCredentialFileSignedUrl(
  context: AdminContext,
  credentialId: string,
  fileId: string,
): Promise<{ signedUrl: string; expiresIn: number }> {
  const db = requestClient(context);
  await credentialStatus(db, credentialId);
  const current = await fileRow(db, credentialId, fileId);
  const { data, error } = await getSupabaseAdminClient().storage
    .from(bucket)
    .createSignedUrl(filePath(credentialId, fileId), signedUrlLifetimeSeconds, { download: downloadName(current) });
  if (error || !data?.signedUrl) throw new ApiError('server_error', 500, 'Private PDF access link could not be created.');
  return { signedUrl: data.signedUrl, expiresIn: signedUrlLifetimeSeconds };
}
