import { jsonError, jsonOk } from '@/lib/api/responses';
import { listDocumentNumbers } from '@/lib/credentials/workspace';
import { getAdminContext } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const context = await getAdminContext(request);
    return jsonOk({ documentNumbers: await listDocumentNumbers(context) });
  } catch (error) {
    return jsonError(error);
  }
}
