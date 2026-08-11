import { jsonError, jsonOk } from '@/lib/api/responses';
import { createProgrammeRun, listProgrammeRuns } from '@/lib/programmes/admin';
import { runRecordPayload } from '@/lib/programmes/admin-payloads';
import { readObject } from '@/lib/programmes/admin-input';
import { getAdminContext } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try { const context = await getAdminContext(request); return jsonOk({ runs: await listProgrammeRuns(context) }); }
  catch (error) { return jsonError(error); }
}

export async function POST(request: Request) {
  try {
    const context = await getAdminContext(request);
    const run = await createProgrammeRun(context, runRecordPayload(await readObject(request), false));
    return jsonOk({ run }, { status: 201 });
  } catch (error) { return jsonError(error); }
}
