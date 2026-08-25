import { ApiError } from '@/lib/supabase/server';
import { assertUuid } from '@/lib/learners/admin-input';
import { validateTemplatePdf, TemplatePdfValidationError } from '@/lib/credential-templates/pdf-validation';
import type { CredentialTemplatePdfUploadInput } from '@/lib/credential-templates/types';

const maximumPdfBytes = 20 * 1024 * 1024;

function requiredText(value: FormDataEntryValue | null, field: string, max: number): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ApiError('bad_request', 400, `${field} is required.`);
  }
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

function sortOrder(value: FormDataEntryValue | null): number {
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]{0,8})$/.test(value)) {
    throw new ApiError('bad_request', 400, 'Sort order must be a non-negative integer.');
  }
  return Number(value);
}

function outputFilenamePattern(value: FormDataEntryValue | null): string {
  const pattern = requiredText(value, 'Output filename pattern', 255);
  if (
    !pattern.toLowerCase().endsWith('.pdf')
    || pattern.includes('/')
    || pattern.includes('\\')
    || pattern.includes('\n')
    || pattern.includes('\r')
  ) {
    throw new ApiError('bad_request', 400, 'Output filename pattern must be a safe PDF filename.');
  }
  return pattern;
}

export async function readCredentialTemplatePdfUpload(request: Request): Promise<CredentialTemplatePdfUploadInput> {
  const contentType = request.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('multipart/form-data')) {
    throw new ApiError('bad_request', 400, 'Template PDF upload must use multipart/form-data.');
  }

  const form = await request.formData();
  const allowed = new Set([
    'file',
    'fileTypeId',
    'adminLabel',
    'outputFilenamePattern',
    'sortOrder',
    'isPrimary',
  ]);
  for (const key of form.keys()) {
    if (!allowed.has(key)) throw new ApiError('bad_request', 400, `Unexpected upload field: ${key}.`);
  }

  const file = form.get('file');
  if (!(file instanceof File)) throw new ApiError('bad_request', 400, 'Template PDF file is required.');
  if (file.type !== 'application/pdf') throw new ApiError('bad_request', 400, 'Only application/pdf files are accepted.');
  if (file.size < 1 || file.size > maximumPdfBytes) {
    throw new ApiError('bad_request', 400, 'Template PDF must be between 1 byte and 20 MB.');
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  let validated;
  try {
    validated = await validateTemplatePdf(bytes);
  } catch (error) {
    if (error instanceof TemplatePdfValidationError) {
      throw new ApiError('bad_request', 400, error.message);
    }
    throw error;
  }

  return {
    bytes,
    sizeBytes: file.size,
    sourceSha256: validated.sourceSha256,
    pages: validated.pages,
    fileTypeId: assertUuid(requiredText(form.get('fileTypeId'), 'Credential file type ID', 36), 'credential file type ID'),
    adminLabel: requiredText(form.get('adminLabel'), 'Admin label', 255),
    outputFilenamePattern: outputFilenamePattern(form.get('outputFilenamePattern')),
    sortOrder: sortOrder(form.get('sortOrder')),
    isPrimary: formBoolean(form.get('isPrimary'), 'Primary document'),
  };
}
