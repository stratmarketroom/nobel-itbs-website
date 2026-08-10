import { jsonError, jsonOk } from '@/lib/api/responses';
import { readVoidPendingCredentialInput } from '@/lib/credentials/void-input';
import { voidPendingCredential } from '@/lib/credentials/void';
import { assertUuid } from '@/lib/learners/admin-input';
import { getAdminContext } from '@/lib/supabase/server';

type RouteProps = { params: Promise<{ id: string }> };

export async function POST(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request);
    const { id } = await props.params;
    return jsonOk({
      voiding: await voidPendingCredential(
        context,
        assertUuid(id, 'credential ID'),
        await readVoidPendingCredentialInput(request),
      ),
    });
  } catch (error) {
    return jsonError(error);
  }
}
