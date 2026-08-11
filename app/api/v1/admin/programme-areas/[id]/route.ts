import { jsonError, jsonOk } from '@/lib/api/responses';
import { deleteProgrammeArea, getProgrammeArea, saveProgrammeAreaTranslation, updateProgrammeArea } from '@/lib/programmes/admin';
import { areaRecordPayload, areaTranslationPayload, mutationPart } from '@/lib/programmes/admin-payloads';
import { assertUuid, readObject } from '@/lib/programmes/admin-input';
import { getAdminContext } from '@/lib/supabase/server';

type RouteProps = { params: Promise<{ id: string }> };

export async function GET(request: Request, props: RouteProps) {
  try { const context = await getAdminContext(request); const { id } = await props.params; return jsonOk({ area: await getProgrammeArea(context, assertUuid(id, 'area ID')) }); }
  catch (error) { return jsonError(error); }
}

export async function PATCH(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request); const { id: rawId } = await props.params; const id = assertUuid(rawId, 'area ID');
    const mutation = mutationPart(await readObject(request));
    const area = mutation.kind === 'record'
      ? await updateProgrammeArea(context, id, areaRecordPayload(mutation.value, true))
      : await saveProgrammeAreaTranslation(context, id, areaTranslationPayload(mutation.value, id));
    return jsonOk({ area });
  } catch (error) { return jsonError(error); }
}

export async function DELETE(request: Request, props: RouteProps) {
  try { const context = await getAdminContext(request); const { id } = await props.params; return jsonOk({ deleted: await deleteProgrammeArea(context, assertUuid(id, 'area ID')) }); }
  catch (error) { return jsonError(error); }
}
