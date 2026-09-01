import { jsonError, jsonOk } from '@/lib/api/responses';
import { adminPagination } from '@/lib/admin/pagination';
import { listDocumentNumbers } from '@/lib/credentials/workspace';
import { getAdminContext } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const context = await getAdminContext(request);
    const url = new URL(request.url);
    return jsonOk(await listDocumentNumbers(context, adminPagination(url.searchParams)));
  } catch (error) {
    return jsonError(error);
  }
}
