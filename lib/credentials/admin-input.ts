import { ApiError } from '@/lib/supabase/server';
import { assertKeys, uuid } from '@/lib/programmes/admin-input';
import type { CreatePendingCredentialInput } from '@/lib/credentials/types';

type Payload = Record<string, unknown>;

const languageCodes = ['en', 'ua', 'cz'] as const;

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

function optionalText(value: unknown, field: string, max: number): string | null {
  if (value === undefined || value === null || value === '') return null;
  return requiredText(value, field, max);
}

function optionalUuid(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === '') return null;
  return uuid(value, field);
}

function dateValue(value: unknown, field: string, optional = false): string | null {
  if (optional && (value === undefined || value === null || value === '')) return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ApiError('bad_request', 400, `${field} must use YYYY-MM-DD.`);
  }
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year
    || parsed.getUTCMonth() !== month - 1
    || parsed.getUTCDate() !== day
  ) {
    throw new ApiError('bad_request', 400, `${field} must be a real calendar date.`);
  }
  return value;
}

export async function readCredentialObject(request: Request): Promise<Payload> {
  let value: unknown;
  try {
    value = await request.json();
  } catch {
    throw new ApiError('bad_request', 400, 'Request body must be valid JSON.');
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError('bad_request', 400, 'Request body must be a JSON object.');
  }
  return value as Payload;
}

export function createPendingCredentialPayload(body: Payload): CreatePendingCredentialInput {
  assertKeys(body, [
    'learnerId',
    'programmeId',
    'programmeRunId',
    'completionDate',
    'credentialTypeId',
    'languageCode',
    'issueDate',
    'publicHolderName',
    'publicProgrammeTitle',
    'publicCredentialType',
    'manualDocumentNumber',
    'manualReason',
  ]);

  const languageCode = requiredText(body.languageCode, 'Credential language', 2);
  if (!languageCodes.includes(languageCode as (typeof languageCodes)[number])) {
    throw new ApiError('bad_request', 400, 'Credential language must be en, ua, or cz.');
  }

  const manualDocumentNumber = optionalText(body.manualDocumentNumber, 'Manual document number', 32)?.toUpperCase() ?? null;
  const manualReason = optionalText(body.manualReason, 'Manual reservation reason', 1000);
  if ((manualDocumentNumber === null) !== (manualReason === null)) {
    throw new ApiError('bad_request', 400, 'Manual document number and reason must be provided together.');
  }

  return {
    learnerId: uuid(body.learnerId, 'Learner ID'),
    programmeId: uuid(body.programmeId, 'Programme ID'),
    programmeRunId: optionalUuid(body.programmeRunId, 'Programme run ID'),
    completionDate: dateValue(body.completionDate, 'Completion date', true),
    credentialTypeId: uuid(body.credentialTypeId, 'Credential type ID'),
    languageCode: languageCode as CreatePendingCredentialInput['languageCode'],
    issueDate: dateValue(body.issueDate, 'Issue date') as string,
    publicHolderName: requiredText(body.publicHolderName, 'Public holder name', 320),
    publicProgrammeTitle: requiredText(body.publicProgrammeTitle, 'Public programme title', 500),
    publicCredentialType: requiredText(body.publicCredentialType, 'Public credential type', 200),
    manualDocumentNumber,
    manualReason,
  };
}
