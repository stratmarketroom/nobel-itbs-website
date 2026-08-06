import { jsonError, jsonOk } from '@/lib/api/responses';
import { deleteExpert, getExpert, saveExpertTranslation, updateExpert } from '@/lib/partnerships/admin';
import { expertRecordPayload, expertTranslationPayload, mutationPart, readObject } from '@/lib/partnerships/admin-payloads';
import { assertUuid } from '@/lib/programmes/admin-input';
import { getAdminContext } from '@/lib/supabase/server';

type RouteProps = { params: Promise<{ id: string }> };

export async function GET(request: Request, props: RouteProps) {
  try { const context = await getAdminContext(request); const { id } = await props.params; return jsonOk({ expert: await getExpert(context, assertUuid(id, 'expert ID')) }); }
  catch (error) { return jsonError(error); }
}

export async function PATCH(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request); const { id: rawId } = await props.params; const id = assertUuid(rawId, 'expert ID');
    const mutation = mutationPart(await readObject(request));
    const expert = mutation.kind === 'record' ? await updateExpert(context, id, expertRecordPayload(mutation.value, true)) : await saveExpertTranslation(context, id, expertTranslationPayload(mutation.value, id));
    return jsonOk({ expert });
  } catch (error) { return jsonError(error); }
}

export async function DELETE(request: Request, props: RouteProps) {
  try { const context = await getAdminContext(request); const { id } = await props.params; return jsonOk({ deleted: await deleteExpert(context, assertUuid(id, 'expert ID')) }); }
  catch (error) { return jsonError(error); }
}
