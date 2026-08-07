import { jsonError, jsonOk } from '@/lib/api/responses';
import { getLearner, updateLearner } from '@/lib/learners/admin';
import { assertUuid, learnerProfilePayload, readObject } from '@/lib/learners/admin-input';
import { getAdminContext } from '@/lib/supabase/server';

type RouteProps = { params: Promise<{ id: string }> };

export async function GET(request: Request, props: RouteProps) {
  try { const context = await getAdminContext(request); const { id } = await props.params; return jsonOk({ learner: await getLearner(context, assertUuid(id, 'learner ID')) }); }
  catch (error) { return jsonError(error); }
}

export async function PATCH(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request);
    const { id } = await props.params;
    return jsonOk({ learner: await updateLearner(context, assertUuid(id, 'learner ID'), learnerProfilePayload(await readObject(request), true)) });
  } catch (error) { return jsonError(error); }
}
