import { jsonError, jsonOk } from '@/lib/api/responses';
import { listEmailTemplates } from '@/lib/email-templates/admin';
import { getAdminContext } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const context = await getAdminContext(request);
    return jsonOk({ templates: await listEmailTemplates(context) });
  } catch (error) {
    return jsonError(error);
  }
}
