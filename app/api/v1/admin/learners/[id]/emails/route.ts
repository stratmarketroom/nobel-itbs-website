import { jsonError, jsonOk } from '@/lib/api/responses';
import { createLearnerContact } from '@/lib/learners/admin';
import { assertUuid, emailPayload, readObject } from '@/lib/learners/admin-input';
import { getAdminContext } from '@/lib/supabase/server';

type RouteProps = { params: Promise<{ id: string }> };

export async function POST(request: Request, props: RouteProps) {
  try { const context = await getAdminContext(request); const { id } = await props.params; return jsonOk({ learner: await createLearnerContact(context, assertUuid(id, 'learner ID'), 'email', emailPayload(await readObject(request), false)) }, { status: 201 }); }
  catch (error) { return jsonError(error); }
}
