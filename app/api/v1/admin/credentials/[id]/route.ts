import { jsonError, jsonOk } from '@/lib/api/responses';
import { getCredentialDetail } from '@/lib/credentials/workspace';
import { assertUuid } from '@/lib/learners/admin-input';
import { getAdminContext } from '@/lib/supabase/server';

type RouteProps = { params: Promise<{ id: string }> };

export async function GET(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request);
    const { id } = await props.params;
    return jsonOk({
      credential: await getCredentialDetail(
        context,
        assertUuid(id, 'credential ID'),
        new URL(request.url).origin,
      ),
    });
  } catch (error) {
    return jsonError(error);
  }
}
