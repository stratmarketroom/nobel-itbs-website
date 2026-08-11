import { jsonError, jsonOk } from '@/lib/api/responses';
import { readRevokeCredentialInput } from '@/lib/credentials/revoke-input';
import { revokeCredential } from '@/lib/credentials/revoke';
import { assertUuid } from '@/lib/learners/admin-input';
import { getAdminContext } from '@/lib/supabase/server';

type RouteProps = { params: Promise<{ id: string }> };

export async function POST(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request);
    const { id } = await props.params;
    return jsonOk({
      revocation: await revokeCredential(
        context,
        assertUuid(id, 'credential ID'),
        await readRevokeCredentialInput(request),
      ),
    });
  } catch (error) {
    return jsonError(error);
  }
}
