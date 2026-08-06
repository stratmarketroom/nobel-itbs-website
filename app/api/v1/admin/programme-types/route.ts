import { jsonError, jsonOk } from '@/lib/api/responses';
import { createProgrammeType, listProgrammeTypes } from '@/lib/programmes/admin';
import { typeRecordPayload } from '@/lib/programmes/admin-payloads';
import { readObject } from '@/lib/programmes/admin-input';
import { getAdminContext } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try { const context = await getAdminContext(request); return jsonOk({ types: await listProgrammeTypes(context) }); }
  catch (error) { return jsonError(error); }
}

export async function POST(request: Request) {
  try {
    const context = await getAdminContext(request);
    const type = await createProgrammeType(context, typeRecordPayload(await readObject(request), false));
    return jsonOk({ type }, { status: 201 });
  } catch (error) { return jsonError(error); }
}
