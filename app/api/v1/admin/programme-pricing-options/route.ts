import { jsonError, jsonOk } from '@/lib/api/responses';
import { createPricingOption, listPricingOptions } from '@/lib/programmes/admin';
import { pricingRecordPayload } from '@/lib/programmes/admin-payloads';
import { readObject } from '@/lib/programmes/admin-input';
import { getAdminContext } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try { const context = await getAdminContext(request); return jsonOk({ pricingOptions: await listPricingOptions(context) }); }
  catch (error) { return jsonError(error); }
}

export async function POST(request: Request) {
  try {
    const context = await getAdminContext(request);
    const pricingOption = await createPricingOption(context, pricingRecordPayload(await readObject(request), false));
    return jsonOk({ pricingOption }, { status: 201 });
  } catch (error) { return jsonError(error); }
}
