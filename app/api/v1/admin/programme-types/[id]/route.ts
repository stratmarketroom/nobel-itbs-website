import { jsonError, jsonOk } from '@/lib/api/responses';
import { deleteProgrammeType, getProgrammeType, saveProgrammeTypeTranslation, updateProgrammeType } from '@/lib/programmes/admin';
import { mutationPart, typeRecordPayload, typeTranslationPayload } from '@/lib/programmes/admin-payloads';
import { assertUuid, readObject } from '@/lib/programmes/admin-input';
import { getAdminContext } from '@/lib/supabase/server';

type RouteProps = { params: Promise<{ id: string }> };

export async function GET(request: Request, props: RouteProps) {
  try { const context = await getAdminContext(request); const { id } = await props.params; return jsonOk({ type: await getProgrammeType(context, assertUuid(id, 'type ID')) }); }
  catch (error) { return jsonError(error); }
}

export async function PATCH(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request); const { id: rawId } = await props.params; const id = assertUuid(rawId, 'type ID');
    const mutation = mutationPart(await readObject(request));
    const type = mutation.kind === 'record'
      ? await updateProgrammeType(context, id, typeRecordPayload(mutation.value, true))
      : await saveProgrammeTypeTranslation(context, id, typeTranslationPayload(mutation.value, id));
    return jsonOk({ type });
  } catch (error) { return jsonError(error); }
}

export async function DELETE(request: Request, props: RouteProps) {
  try { const context = await getAdminContext(request); const { id } = await props.params; return jsonOk({ deleted: await deleteProgrammeType(context, assertUuid(id, 'type ID')) }); }
  catch (error) { return jsonError(error); }
}
