import { jsonError, jsonOk } from '@/lib/api/responses';
import { createPartner, listPartners } from '@/lib/partnerships/admin';
import { partnerRecordPayload, readObject } from '@/lib/partnerships/admin-payloads';
import { getAdminContext } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try { const context = await getAdminContext(request); return jsonOk({ partners: await listPartners(context) }); }
  catch (error) { return jsonError(error); }
}

export async function POST(request: Request) {
  try { const context = await getAdminContext(request); return jsonOk({ partner: await createPartner(context, partnerRecordPayload(await readObject(request), false)) }, { status: 201 }); }
  catch (error) { return jsonError(error); }
}
