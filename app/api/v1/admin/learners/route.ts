import { jsonError, jsonOk } from '@/lib/api/responses';
import { createLearner, listLearners } from '@/lib/learners/admin';
import { learnerProfilePayload, readObject } from '@/lib/learners/admin-input';
import { ApiError, getAdminContext } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const context = await getAdminContext(request);
    const url = new URL(request.url);
    const archived = url.searchParams.get('archived') ?? 'active';
    if (!['active', 'archived', 'all'].includes(archived)) throw new ApiError('bad_request', 400, 'Invalid archive filter.');
    return jsonOk(await listLearners(context, { query: url.searchParams.get('query') ?? undefined, archived: archived as 'active' | 'archived' | 'all' }));
  } catch (error) { return jsonError(error); }
}

export async function POST(request: Request) {
  try {
    const context = await getAdminContext(request);
    return jsonOk({ learner: await createLearner(context, learnerProfilePayload(await readObject(request), false)) }, { status: 201 });
  } catch (error) { return jsonError(error); }
}
