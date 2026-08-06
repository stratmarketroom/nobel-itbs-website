import { jsonError, jsonOk } from '@/lib/api/responses';
import { deletePricingOption, getPricingOption, savePricingTranslation, updatePricingOption } from '@/lib/programmes/admin';
import { mutationPart, pricingRecordPayload, pricingTranslationPayload } from '@/lib/programmes/admin-payloads';
import { assertUuid, readObject } from '@/lib/programmes/admin-input';
import { getAdminContext } from '@/lib/supabase/server';

type RouteProps = { params: Promise<{ id: string }> };

export async function GET(request: Request, props: RouteProps) {
  try { const context = await getAdminContext(request); const { id } = await props.params; return jsonOk({ pricingOption: await getPricingOption(context, assertUuid(id, 'pricing option ID')) }); }
  catch (error) { return jsonError(error); }
}

export async function PATCH(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request); const { id: rawId } = await props.params; const id = assertUuid(rawId, 'pricing option ID');
    const mutation = mutationPart(await readObject(request));
    const pricingOption = mutation.kind === 'record'
      ? await updatePricingOption(context, id, pricingRecordPayload(mutation.value, true))
      : await savePricingTranslation(context, id, pricingTranslationPayload(mutation.value, id));
    return jsonOk({ pricingOption });
  } catch (error) { return jsonError(error); }
}

export async function DELETE(request: Request, props: RouteProps) {
  try { const context = await getAdminContext(request); const { id } = await props.params; return jsonOk({ deleted: await deletePricingOption(context, assertUuid(id, 'pricing option ID')) }); }
  catch (error) { return jsonError(error); }
}
