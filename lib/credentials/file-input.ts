import { ApiError } from '@/lib/supabase/server';
import { assertKeys, assertNonempty, uuid } from '@/lib/programmes/admin-input';
import type { CredentialFilePatch, PdfUploadInput } from '@/lib/credentials/file-types';

const maximumPdfBytes = 20 * 1024 * 1024;

function optionalText(value: FormDataEntryValue | unknown, field: string, max: number): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !value.trim()) throw new ApiError('bad_request', 400, `${field} is invalid.`);
  const normalized = value.trim();
  if (normalized.length > max) throw new ApiError('bad_request', 400, `${field} is too long.`);
  return normalized;
}

function formBoolean(value: FormDataEntryValue | null, field: string): boolean {
  if (value === null || value === '') return false;
  if (value === 'true') return true;
  if (value === 'false') return false;
  throw new ApiError('bad_request', 400, `${field} must be true or false.`);
}

function pdfHeaderIsValid(bytes: Buffer): boolean {
  return bytes.subarray(0, Math.min(bytes.length, 1024)).includes(Buffer.from('%PDF-', 'ascii'));
}

export async function readPdfUpload(request: Request, includeMetadata: boolean): Promise<PdfUploadInput> {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
    throw new ApiError('bad_request', 400, 'PDF upload must use multipart/form-data.');
  }

  const form = await request.formData();
  const allowed = new Set(includeMetadata
    ? ['file', 'fileTypeId', 'adminLabel', 'isPrimary', 'reason']
    : ['file', 'reason']);
  for (const key of form.keys()) {
    if (!allowed.has(key)) throw new ApiError('bad_request', 400, `Unexpected upload field: ${key}.`);
  }

  const file = form.get('file');
  if (!(file instanceof File)) throw new ApiError('bad_request', 400, 'PDF file is required.');
  if (file.type !== 'application/pdf') throw new ApiError('bad_request', 400, 'Only application/pdf files are accepted.');
  if (file.size < 1 || file.size > maximumPdfBytes) throw new ApiError('bad_request', 400, 'PDF must be between 1 byte and 20 MB.');

  const bytes = Buffer.from(await file.arrayBuffer());
  if (!pdfHeaderIsValid(bytes)) throw new ApiError('bad_request', 400, 'The uploaded file is not a valid PDF.');

  const fileTypeValue = includeMetadata ? form.get('fileTypeId') : null;
  if (includeMetadata && typeof fileTypeValue !== 'string') {
    throw new ApiError('bad_request', 400, 'Credential file type is required.');
  }

  return {
    bytes,
    sizeBytes: file.size,
    fileTypeId: includeMetadata ? uuid(fileTypeValue as string, 'credential file type ID') : null,
    adminLabel: includeMetadata ? optionalText(form.get('adminLabel'), 'Admin label', 255) : null,
    isPrimary: includeMetadata ? formBoolean(form.get('isPrimary'), 'Primary file') : false,
    reason: optionalText(form.get('reason'), 'Change reason', 1000),
  };
}

export async function readFilePatch(request: Request): Promise<CredentialFilePatch> {
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    throw new ApiError('bad_request', 400, 'Request body must be valid JSON.');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError('bad_request', 400, 'Request body must be a JSON object.');
  }

  const body = value as Record<string, unknown>;
  assertKeys(body, ['fileTypeId', 'adminLabel', 'isPrimary', 'reason']);
  const patch: CredentialFilePatch = {};
  if ('fileTypeId' in body) patch.fileTypeId = uuid(body.fileTypeId, 'credential file type ID');
  if ('adminLabel' in body) patch.adminLabel = optionalText(body.adminLabel, 'Admin label', 255);
  if ('isPrimary' in body) {
    if (typeof body.isPrimary !== 'boolean') throw new ApiError('bad_request', 400, 'Primary file must be true or false.');
    patch.isPrimary = body.isPrimary;
  }
  if ('reason' in body) patch.reason = optionalText(body.reason, 'Change reason', 1000);
  assertNonempty(patch);
  return patch;
}
