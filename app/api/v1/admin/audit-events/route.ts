import { jsonError, jsonOk } from '@/lib/api/responses';
import { listAuditEvents } from '@/lib/audit/admin';
import { readAuditFilters } from '@/lib/audit/input';
import { getAdminContext } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const context = await getAdminContext(request);
    return jsonOk(await listAuditEvents(context, readAuditFilters(request.url)));
  } catch (error) {
    return jsonError(error);
  }
}
