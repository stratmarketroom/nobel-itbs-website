import { jsonError, jsonOk } from '@/lib/api/responses';
import { deleteProgramme, getProgramme, saveProgrammeTranslation, updateProgramme } from '@/lib/programmes/admin';
import { mutationPart, programmeRecordPayload, programmeTranslationPayload } from '@/lib/programmes/admin-payloads';
import { assertUuid, readObject } from '@/lib/programmes/admin-input';
import { getAdminContext } from '@/lib/supabase/server';

type RouteProps = { params: Promise<{ id: string }> };

export async function GET(request: Request, props: RouteProps) {
  try { const context = await getAdminContext(request); const { id } = await props.params; return jsonOk({ programme: await getProgramme(context, assertUuid(id, 'programme ID')) }); }
  catch (error) { return jsonError(error); }
}

export async function PATCH(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request); const { id: rawId } = await props.params; const id = assertUuid(rawId, 'programme ID');
    const mutation = mutationPart(await readObject(request));
    const programme = mutation.kind === 'record'
      ? await updateProgramme(context, id, programmeRecordPayload(mutation.value, true))
      : await saveProgrammeTranslation(context, id, programmeTranslationPayload(mutation.value, id));
    return jsonOk({ programme });
  } catch (error) { return jsonError(error); }
}

export async function DELETE(request: Request, props: RouteProps) {
  try { const context = await getAdminContext(request); const { id } = await props.params; return jsonOk({ deleted: await deleteProgramme(context, assertUuid(id, 'programme ID')) }); }
  catch (error) { return jsonError(error); }
}
