import { jsonError, jsonOk } from '@/lib/api/responses';
import { readUpdateValidPublicDataInput } from '@/lib/credentials/public-data-input';
import { updateValidPublicData } from '@/lib/credentials/public-data';
import { assertUuid } from '@/lib/learners/admin-input';
import { getAdminContext } from '@/lib/supabase/server';

type RouteProps = { params: Promise<{ id: string }> };

export async function PUT(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request);
    const { id } = await props.params;
    return jsonOk({
      credential: await updateValidPublicData(
        context,
        assertUuid(id, 'credential ID'),
        await readUpdateValidPublicDataInput(request),
      ),
    });
  } catch (error) {
    return jsonError(error);
  }
}
