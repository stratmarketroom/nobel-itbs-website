import { ApiError } from '@/lib/supabase/server';

export type AuditFilters = {
  action?: string;
  targetTable?: string;
  from?: string;
  to?: string;
  limit: number;
  offset: number;
};

const tablePattern = /^[a-z][a-z0-9_]{0,62}$/;

function dateBoundary(value: string | null, endOfDay: boolean): string | undefined {
  if (!value) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ApiError('bad_request', 400, 'Audit dates must use YYYY-MM-DD.');
  }
  const timestamp = `${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`;
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new ApiError('bad_request', 400, 'Audit date is invalid.');
  }
  return timestamp;
}

export function readAuditFilters(url: string): AuditFilters {
  const params = new URL(url).searchParams;
  const action = params.get('action')?.trim().slice(0, 120) || undefined;
  const targetTable = params.get('targetTable')?.trim() || undefined;
  const limitValue = Number(params.get('limit') ?? 50);
  const offsetValue = Number(params.get('offset') ?? 0);

  if (targetTable && !tablePattern.test(targetTable)) {
    throw new ApiError('bad_request', 400, 'Audit target table is invalid.');
  }
  if (!Number.isInteger(limitValue) || limitValue < 1 || limitValue > 100) {
    throw new ApiError('bad_request', 400, 'Audit page size must be between 1 and 100.');
  }
  if (!Number.isInteger(offsetValue) || offsetValue < 0 || offsetValue > 100000) {
    throw new ApiError('bad_request', 400, 'Audit offset is invalid.');
  }

  const from = dateBoundary(params.get('from'), false);
  const to = dateBoundary(params.get('to'), true);
  if (from && to && from > to) throw new ApiError('bad_request', 400, 'Audit start date must not be after end date.');

  return { action, targetTable, from, to, limit: limitValue, offset: offsetValue };
}

export function assertAuditId(value: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)) {
    throw new ApiError('bad_request', 400, 'Audit event ID is invalid.');
  }
  return value;
}
