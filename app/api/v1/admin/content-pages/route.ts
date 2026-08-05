import { listContentPages } from '@/lib/content/admin';
import { jsonError, jsonOk } from '@/lib/api/responses';
import { getAdminContext } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const context = await getAdminContext(request);
    return jsonOk({ pages: await listContentPages(context) });
  } catch (error) {
    return jsonError(error);
  }
}
