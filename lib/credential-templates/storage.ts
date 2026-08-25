import 'server-only';
import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  ApiError,
  assertCanManageCredentialTemplates,
  getSupabaseAdminClient,
  getSupabaseRequestClient,
  type AdminContext,
} from '@/lib/supabase/server';
import type {
  CredentialTemplateDocumentAdminItem,
  CredentialTemplatePdfUploadInput,
} from '@/lib/credential-templates/types';

const bucket = 'credential-templates';

type TemplateDocumentRow = {
  id?: string;
  document_id?: string;
  template_version_id: string;
  file_type_id: string;
  admin_label: string;
  output_filename_pattern: string;
  sort_order: number;
  is_primary: boolean;
  mime_type: 'application/pdf';
  size_bytes: number;
  page_count: number;
  created_at: string;
  updated_at: string;
};

function requestClient(context: AdminContext): SupabaseClient {
  assertCanManageCredentialTemplates(context);
  return getSupabaseRequestClient(context.accessToken);
}

function objectPath(templateVersionId: string, documentId: string): string {
  return `${templateVersionId}/${documentId}.pdf`;
}

function toItem(row: TemplateDocumentRow): CredentialTemplateDocumentAdminItem {
  return {
    id: row.document_id ?? row.id ?? '',
    templateVersionId: row.template_version_id,
    fileTypeId: row.file_type_id,
    adminLabel: row.admin_label,
    outputFilenamePattern: row.output_filename_pattern,
    sortOrder: row.sort_order,
    isPrimary: row.is_primary,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    pageCount: row.page_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function databaseError(error: { code?: string } | null, fallback: string): ApiError {
  if (error?.code === '42501') return new ApiError('forbidden', 403, 'Credential template operation is not permitted.');
  if (error?.code === 'P0002') return new ApiError('not_found', 404, fallback);
  if (error?.code === '22023' || error?.code === '22P02' || error?.code === '23503' || error?.code === '23514') {
    return new ApiError('bad_request', 400, fallback);
  }
  if (error?.code === '23505') return new ApiError('conflict', 409, 'Credential template document conflicts with the current draft.');
  return new ApiError('server_error', 500, fallback);
}

async function assertDraftVersion(db: SupabaseClient, templateVersionId: string): Promise<void> {
  const { data, error } = await db
    .from('credential_template_versions')
    .select('status')
    .eq('id', templateVersionId)
    .maybeSingle();
  if (error) throw databaseError(error, 'Credential template version could not be loaded.');
  if (!data) throw new ApiError('not_found', 404, 'Credential template version was not found.');
  if (data.status !== 'draft') throw new ApiError('bad_request', 400, 'Template sources can be changed only on a draft version.');
}

async function documentRow(
  db: SupabaseClient,
  templateVersionId: string,
  documentId: string,
): Promise<TemplateDocumentRow> {
  const { data, error } = await db
    .from('credential_template_documents')
    .select('id, template_version_id, file_type_id, admin_label, output_filename_pattern, sort_order, is_primary, mime_type, size_bytes, page_count, created_at, updated_at')
    .eq('id', documentId)
    .eq('template_version_id', templateVersionId)
    .maybeSingle();
  if (error) throw databaseError(error, 'Credential template document could not be loaded.');
  if (!data) throw new ApiError('not_found', 404, 'Credential template document was not found.');
  return data as TemplateDocumentRow;
}

async function removeObject(path: string): Promise<void> {
  const { error } = await getSupabaseAdminClient().storage.from(bucket).remove([path]);
  if (error) throw new ApiError('server_error', 500, 'Private template PDF cleanup failed.');
}

async function restoreObject(path: string, bytes: ArrayBuffer): Promise<void> {
  const { error } = await getSupabaseAdminClient().storage.from(bucket).upload(path, bytes, {
    contentType: 'application/pdf',
    upsert: true,
  });
  if (error) throw new ApiError('server_error', 500, 'Private template PDF rollback failed.');
}

export async function uploadCredentialTemplateDocument(
  context: AdminContext,
  templateVersionId: string,
  input: CredentialTemplatePdfUploadInput,
): Promise<CredentialTemplateDocumentAdminItem> {
  const db = requestClient(context);
  await assertDraftVersion(db, templateVersionId);
  const documentId = randomUUID();
  const path = objectPath(templateVersionId, documentId);
  const storage = getSupabaseAdminClient().storage.from(bucket);
  const upload = await storage.upload(path, input.bytes, {
    contentType: 'application/pdf',
    upsert: false,
  });
  if (upload.error) throw new ApiError('server_error', 500, 'Private template PDF could not be uploaded.');

  const result = await db.rpc('attach_credential_template_document', {
    p_document_id: documentId,
    p_template_version_id: templateVersionId,
    p_file_type_id: input.fileTypeId,
    p_admin_label: input.adminLabel,
    p_output_filename_pattern: input.outputFilenamePattern,
    p_sort_order: input.sortOrder,
    p_is_primary: input.isPrimary,
    p_size_bytes: input.sizeBytes,
    p_page_count: input.pages.length,
    p_source_sha256: input.sourceSha256,
    p_pages: input.pages.map((page) => ({
      page_number: page.pageNumber,
      width_points: page.widthPoints,
      height_points: page.heightPoints,
    })),
  });
  const row = (result.data as TemplateDocumentRow[] | null)?.[0];
  if (result.error || !row) {
    try {
      await removeObject(path);
    } catch {
      throw new ApiError('server_error', 500, 'Template metadata failed and private upload cleanup also failed.');
    }
    throw databaseError(result.error, 'Credential template document metadata could not be attached.');
  }

  return toItem(row);
}

export async function previewCredentialTemplateDocument(
  context: AdminContext,
  templateVersionId: string,
  documentId: string,
): Promise<ArrayBuffer> {
  const db = requestClient(context);
  await documentRow(db, templateVersionId, documentId);
  const download = await getSupabaseAdminClient().storage
    .from(bucket)
    .download(objectPath(templateVersionId, documentId));
  if (download.error || !download.data) {
    throw new ApiError('server_error', 500, 'Private template PDF could not be loaded for preview.');
  }
  return download.data.arrayBuffer();
}

export async function deleteCredentialTemplateDocument(
  context: AdminContext,
  templateVersionId: string,
  documentId: string,
): Promise<void> {
  const db = requestClient(context);
  await assertDraftVersion(db, templateVersionId);
  await documentRow(db, templateVersionId, documentId);
  const path = objectPath(templateVersionId, documentId);
  const storage = getSupabaseAdminClient().storage.from(bucket);
  const previous = await storage.download(path);
  if (previous.error || !previous.data) {
    throw new ApiError('server_error', 500, 'Private template PDF could not be loaded for safe deletion.');
  }
  const previousBytes = await previous.data.arrayBuffer();
  const removal = await storage.remove([path]);
  if (removal.error) throw new ApiError('server_error', 500, 'Private template PDF could not be deleted.');

  const result = await db.rpc('delete_credential_template_document', {
    p_template_version_id: templateVersionId,
    p_document_id: documentId,
  });
  if (result.error) {
    const probe = await db
      .from('credential_template_documents')
      .select('id')
      .eq('id', documentId)
      .eq('template_version_id', templateVersionId)
      .maybeSingle();
    if (!probe.error && !probe.data) return;

    try {
      await restoreObject(path, previousBytes);
    } catch {
      throw new ApiError('server_error', 500, 'Template metadata deletion failed and the private PDF could not be restored.');
    }
    throw databaseError(result.error, 'Credential template document could not be deleted.');
  }
}
