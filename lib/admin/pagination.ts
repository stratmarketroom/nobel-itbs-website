import 'server-only';

import { ApiError } from '@/lib/supabase/server';

export type AdminPagination = {
  limit: number;
  offset: number;
};

export const defaultAdminPageSize = 50;
export const maximumAdminPageSize = 100;

function integerParameter(value: string | null, field: string, fallback: number): number {
  if (value === null) return fallback;
  if (!/^\d+$/.test(value)) throw new ApiError('bad_request', 400, `${field} must be a whole number.`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) throw new ApiError('bad_request', 400, `${field} is too large.`);
  return parsed;
}

export function adminPagination(searchParams: URLSearchParams): AdminPagination {
  const limit = integerParameter(searchParams.get('limit'), 'Limit', defaultAdminPageSize);
  const offset = integerParameter(searchParams.get('offset'), 'Offset', 0);
  if (limit < 1 || limit > maximumAdminPageSize) {
    throw new ApiError('bad_request', 400, `Limit must be between 1 and ${maximumAdminPageSize}.`);
  }
  return { limit, offset };
}

export function adminSearch(searchParams: URLSearchParams, field = 'query'): string | undefined {
  const value = searchParams.get(field)?.trim();
  if (!value) return undefined;
  if (value.length > 200) throw new ApiError('bad_request', 400, 'Search query must not exceed 200 characters.');
  return value;
}
