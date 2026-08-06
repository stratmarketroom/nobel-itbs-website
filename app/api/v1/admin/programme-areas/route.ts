import { jsonError, jsonOk } from '@/lib/api/responses';
import { createProgrammeArea, listProgrammeAreas } from '@/lib/programmes/admin';
import { areaRecordPayload } from '@/lib/programmes/admin-payloads';
import { readObject } from '@/lib/programmes/admin-input';
import { getAdminContext } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try { const context = await getAdminContext(request); return jsonOk({ areas: await listProgrammeAreas(context) }); }
  catch (error) { return jsonError(error); }
}

export async function POST(request: Request) {
  try {
    const context = await getAdminContext(request);
    const area = await createProgrammeArea(context, areaRecordPayload(await readObject(request), false));
    return jsonOk({ area }, { status: 201 });
  } catch (error) { return jsonError(error); }
}
