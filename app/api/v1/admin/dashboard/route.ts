import { jsonError, jsonOk } from '@/lib/api/responses';
import { getAdminDashboardSummary } from '@/lib/dashboard/admin';
import { getAdminContext } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const context = await getAdminContext(request);
    return jsonOk(await getAdminDashboardSummary(context));
  } catch (error) {
    return jsonError(error);
  }
}
