import { jsonError, jsonOk } from '@/lib/api/responses';
import { deleteLearnerContact, updateLearnerContact } from '@/lib/learners/admin';
import { assertUuid, emailPayload, readObject } from '@/lib/learners/admin-input';
import { getAdminContext } from '@/lib/supabase/server';

type RouteProps = { params: Promise<{ id: string; contactId: string }> };

export async function PATCH(request: Request, props: RouteProps) {
  try { const context = await getAdminContext(request); const params = await props.params; return jsonOk({ learner: await updateLearnerContact(context, assertUuid(params.id, 'learner ID'), 'email', assertUuid(params.contactId, 'email ID'), emailPayload(await readObject(request), true)) }); }
  catch (error) { return jsonError(error); }
}

export async function DELETE(request: Request, props: RouteProps) {
  try { const context = await getAdminContext(request); const params = await props.params; return jsonOk({ learner: await deleteLearnerContact(context, assertUuid(params.id, 'learner ID'), 'email', assertUuid(params.contactId, 'email ID')) }); }
  catch (error) { return jsonError(error); }
}
