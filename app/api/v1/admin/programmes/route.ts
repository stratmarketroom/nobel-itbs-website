import { jsonError, jsonOk } from '@/lib/api/responses';
import { createProgramme, listProgrammes } from '@/lib/programmes/admin';
import { programmeRecordPayload } from '@/lib/programmes/admin-payloads';
import { readObject } from '@/lib/programmes/admin-input';
import { getAdminContext } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try { const context = await getAdminContext(request); return jsonOk({ programmes: await listProgrammes(context) }); }
  catch (error) { return jsonError(error); }
}

export async function POST(request: Request) {
  try {
    const context = await getAdminContext(request);
    const programme = await createProgramme(context, programmeRecordPayload(await readObject(request), false));
    return jsonOk({ programme }, { status: 201 });
  } catch (error) { return jsonError(error); }
}
