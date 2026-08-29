import { jsonError, jsonOk } from '@/lib/api/responses';
import { getAuditEvent } from '@/lib/audit/admin';
import { assertAuditId } from '@/lib/audit/input';
import { getAdminContext } from '@/lib/supabase/server';

type RouteProps = { params: Promise<{ id: string }> };

export async function GET(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request);
    const { id } = await props.params;
    return jsonOk({ event: await getAuditEvent(context, assertAuditId(id)) });
  } catch (error) {
    return jsonError(error);
  }
}
