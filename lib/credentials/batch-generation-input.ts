import { ApiError } from '@/lib/supabase/server';
import { assertKeys, uuid } from '@/lib/programmes/admin-input';
import type { BatchActivationInput, BatchIssuingContextInput, BatchReviewInput } from '@/lib/credentials/batch-generation-types';

type Payload = Record<string, unknown>;
const languages = ['en', 'ua', 'cz'] as const;

function dateValue(value: unknown, field: string, optional = false): string | null {
  if (optional && (value === null || value === undefined || value === '')) return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ApiError('bad_request', 400, `${field} must use YYYY-MM-DD.`);
  }
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) {
    throw new ApiError('bad_request', 400, `${field} must be a real calendar date.`);
  }
  return value;
}

function nullableUuid(value: unknown, field: string): string | null {
  if (value === null || value === undefined || value === '') return null;
  return uuid(value, field);
}

export async function readBatchObject(request: Request): Promise<Payload> {
  let value: unknown;
  try { value = await request.json(); }
  catch { throw new ApiError('bad_request', 400, 'Request body must be valid JSON.'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError('bad_request', 400, 'Request body must be a JSON object.');
  }
  return value as Payload;
}

export function batchContextPayload(body: Payload): BatchIssuingContextInput {
  assertKeys(body, [
    'idempotencyKey', 'templateVersionId', 'programmeId', 'programmeRunId',
    'credentialTypeId', 'languageCode', 'issueDate', 'completionDate', 'learnerIds',
  ]);
  const languageCode = typeof body.languageCode === 'string' ? body.languageCode : '';
  if (!languages.includes(languageCode as (typeof languages)[number])) {
    throw new ApiError('bad_request', 400, 'Credential language must be en, ua, or cz.');
  }
  if (!Array.isArray(body.learnerIds) || body.learnerIds.length === 0) {
    throw new ApiError('bad_request', 400, 'Select at least one learner.');
  }
  const learnerIds = body.learnerIds.map((value) => uuid(value, 'learner ID'));
  if (new Set(learnerIds).size !== learnerIds.length) {
    throw new ApiError('bad_request', 400, 'Each learner may be selected only once.');
  }
  return {
    idempotencyKey: uuid(body.idempotencyKey, 'idempotency key'),
    templateVersionId: uuid(body.templateVersionId, 'template version ID'),
    programmeId: uuid(body.programmeId, 'programme ID'),
    programmeRunId: nullableUuid(body.programmeRunId, 'programme run ID'),
    credentialTypeId: uuid(body.credentialTypeId, 'credential type ID'),
    languageCode: languageCode as BatchIssuingContextInput['languageCode'],
    issueDate: dateValue(body.issueDate, 'Issue date') as string,
    completionDate: dateValue(body.completionDate, 'Completion date', true),
    learnerIds,
  };
}

export function batchActivationPayload(body: Payload): BatchActivationInput {
  assertKeys(body, ['idempotencyKey', 'itemIds']);
  if (!Array.isArray(body.itemIds) || body.itemIds.length === 0) {
    throw new ApiError('bad_request', 400, 'Select at least one reviewed batch item.');
  }
  const itemIds = body.itemIds.map((value) => uuid(value, 'batch item ID'));
  if (new Set(itemIds).size !== itemIds.length) {
    throw new ApiError('bad_request', 400, 'Each reviewed batch item may be selected only once.');
  }
  return {
    idempotencyKey: uuid(body.idempotencyKey, 'activation idempotency key'),
    itemIds,
  };
}

export function batchReviewPayload(body: Payload): BatchReviewInput {
  assertKeys(body, ['itemIds']);
  if (!Array.isArray(body.itemIds) || body.itemIds.length === 0) {
    throw new ApiError('bad_request', 400, 'Select at least one generated batch item.');
  }
  if (body.itemIds.length > 25) {
    throw new ApiError('bad_request', 400, 'Review at most one 25-item page at a time.');
  }
  const itemIds = body.itemIds.map((value) => uuid(value, 'batch item ID'));
  if (new Set(itemIds).size !== itemIds.length) {
    throw new ApiError('bad_request', 400, 'Each generated batch item may be selected only once.');
  }
  return { itemIds };
}
