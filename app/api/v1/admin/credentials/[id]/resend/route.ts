import { jsonError, jsonOk } from '@/lib/api/responses';
import { readResendCredentialInput } from '@/lib/credentials/resend-input';
import { resendCredential } from '@/lib/credentials/resend';
import { assertUuid } from '@/lib/learners/admin-input';
import { getAdminContext } from '@/lib/supabase/server';

type RouteProps = { params: Promise<{ id: string }> };

export async function POST(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request);
    const { id } = await props.params;
    return jsonOk({
      resend: await resendCredential(
        context,
        assertUuid(id, 'credential ID'),
        await readResendCredentialInput(request),
      ),
    });
  } catch (error) {
    return jsonError(error);
  }
}
