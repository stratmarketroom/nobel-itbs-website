import { jsonError, jsonOk } from '@/lib/api/responses';
import { deletePartner, getPartner, savePartnerTranslation, updatePartner } from '@/lib/partnerships/admin';
import { mutationPart, partnerRecordPayload, partnerTranslationPayload, readObject } from '@/lib/partnerships/admin-payloads';
import { assertUuid } from '@/lib/programmes/admin-input';
import { getAdminContext } from '@/lib/supabase/server';

type RouteProps = { params: Promise<{ id: string }> };

export async function GET(request: Request, props: RouteProps) {
  try { const context = await getAdminContext(request); const { id } = await props.params; return jsonOk({ partner: await getPartner(context, assertUuid(id, 'partner ID')) }); }
  catch (error) { return jsonError(error); }
}

export async function PATCH(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request); const { id: rawId } = await props.params; const id = assertUuid(rawId, 'partner ID');
    const mutation = mutationPart(await readObject(request));
    const partner = mutation.kind === 'record' ? await updatePartner(context, id, partnerRecordPayload(mutation.value, true)) : await savePartnerTranslation(context, id, partnerTranslationPayload(mutation.value, id));
    return jsonOk({ partner });
  } catch (error) { return jsonError(error); }
}

export async function DELETE(request: Request, props: RouteProps) {
  try { const context = await getAdminContext(request); const { id } = await props.params; return jsonOk({ deleted: await deletePartner(context, assertUuid(id, 'partner ID')) }); }
  catch (error) { return jsonError(error); }
}
