import { jsonError, jsonOk } from '@/lib/api/responses';
import { listProgrammeSlugRedirects } from '@/lib/programmes/admin';
import { getAdminContext } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try { const context = await getAdminContext(request); return jsonOk({ redirects: await listProgrammeSlugRedirects(context) }); }
  catch (error) { return jsonError(error); }
}
