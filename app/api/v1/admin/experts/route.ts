import { jsonError, jsonOk } from '@/lib/api/responses';
import { createExpert, listExperts } from '@/lib/partnerships/admin';
import { expertRecordPayload, readObject } from '@/lib/partnerships/admin-payloads';
import { getAdminContext } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try { const context = await getAdminContext(request); return jsonOk({ experts: await listExperts(context) }); }
  catch (error) { return jsonError(error); }
}

export async function POST(request: Request) {
  try { const context = await getAdminContext(request); return jsonOk({ expert: await createExpert(context, expertRecordPayload(await readObject(request), false)) }, { status: 201 }); }
  catch (error) { return jsonError(error); }
}
