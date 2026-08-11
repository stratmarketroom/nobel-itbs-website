import { jsonError, jsonOk } from '@/lib/api/responses';
import { readActivateCredentialInput } from '@/lib/credentials/activation-input';
import { activateCredential } from '@/lib/credentials/activation';
import { assertUuid } from '@/lib/learners/admin-input';
import { getAdminContext } from '@/lib/supabase/server';

type RouteProps = { params: Promise<{ id: string }> };

export async function POST(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request);
    const { id } = await props.params;
    return jsonOk({
      activation: await activateCredential(
        context,
        assertUuid(id, 'credential ID'),
        await readActivateCredentialInput(request),
      ),
    });
  } catch (error) {
    return jsonError(error);
  }
}
