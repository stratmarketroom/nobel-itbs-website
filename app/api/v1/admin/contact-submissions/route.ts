import {
  contactSubmissionStatuses,
  contactSubmissionTypes,
  listContactSubmissions,
  type ContactSubmissionStatus,
  type ContactSubmissionType,
} from '@/lib/contact/admin';
import { jsonError, jsonOk } from '@/lib/api/responses';
import { adminPagination } from '@/lib/admin/pagination';
import { ApiError, getAdminContext } from '@/lib/supabase/server';

function optionalEnum<T extends string>(value: string | null, allowed: readonly T[], field: string): T | undefined {
  if (!value) return undefined;
  if (!allowed.includes(value as T)) throw new ApiError('bad_request', 400, `Invalid ${field}.`);
  return value as T;
}

export async function GET(request: Request) {
  try {
    const context = await getAdminContext(request);
    const url = new URL(request.url);
    const pagination = adminPagination(url.searchParams);
    const status = optionalEnum<ContactSubmissionStatus>(url.searchParams.get('status'), contactSubmissionStatuses, 'status');
    const type = optionalEnum<ContactSubmissionType>(url.searchParams.get('type'), contactSubmissionTypes, 'type');
    return jsonOk(await listContactSubmissions(context, { status, type, ...pagination }));
  } catch (error) {
    return jsonError(error);
  }
}
