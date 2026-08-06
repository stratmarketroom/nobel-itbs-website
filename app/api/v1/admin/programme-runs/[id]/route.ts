import { jsonError, jsonOk } from '@/lib/api/responses';
import { deleteProgrammeRun, getProgrammeRun, updateProgrammeRun } from '@/lib/programmes/admin';
import { mutationPart, runRecordPayload } from '@/lib/programmes/admin-payloads';
import { ApiError, getAdminContext } from '@/lib/supabase/server';
import { assertUuid, readObject } from '@/lib/programmes/admin-input';

type RouteProps = { params: Promise<{ id: string }> };

export async function GET(request: Request, props: RouteProps) {
  try { const context = await getAdminContext(request); const { id } = await props.params; return jsonOk({ run: await getProgrammeRun(context, assertUuid(id, 'run ID')) }); }
  catch (error) { return jsonError(error); }
}

export async function PATCH(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request); const { id: rawId } = await props.params; const id = assertUuid(rawId, 'run ID');
    const mutation = mutationPart(await readObject(request));
    if (mutation.kind !== 'record') throw new ApiError('bad_request', 400, 'Programme runs do not have translations.');
    return jsonOk({ run: await updateProgrammeRun(context, id, runRecordPayload(mutation.value, true)) });
  } catch (error) { return jsonError(error); }
}

export async function DELETE(request: Request, props: RouteProps) {
  try { const context = await getAdminContext(request); const { id } = await props.params; return jsonOk({ deleted: await deleteProgrammeRun(context, assertUuid(id, 'run ID')) }); }
  catch (error) { return jsonError(error); }
}
