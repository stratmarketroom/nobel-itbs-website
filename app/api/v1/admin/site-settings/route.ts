import { jsonError, jsonOk } from '@/lib/api/responses';
import { getAdminContext, ApiError } from '@/lib/supabase/server';
import { getAdminSiteSetting, updateForOrganisationsApplicationUrl } from '@/lib/content/site-settings';

export async function GET(request: Request) {
  try { const context = await getAdminContext(request); return jsonOk({ setting: await getAdminSiteSetting(context) }); }
  catch (error) { return jsonError(error); }
}
export async function PATCH(request: Request) {
  try {
    const context = await getAdminContext(request);
    const body = await request.json().catch(() => null) as { value?: unknown } | null;
    if (!body || (body.value !== null && typeof body.value !== 'string')) throw new ApiError('bad_request', 400, 'Value must be an HTTPS URL or null.');
    const value = typeof body.value === 'string' && body.value.trim() ? body.value.trim() : null;
    if (value && (!value.startsWith('https://') || value.length > 2000)) throw new ApiError('bad_request', 400, 'Value must be a valid HTTPS URL.');
    return jsonOk({ setting: await updateForOrganisationsApplicationUrl(context, value) });
  } catch (error) { return jsonError(error); }
}
