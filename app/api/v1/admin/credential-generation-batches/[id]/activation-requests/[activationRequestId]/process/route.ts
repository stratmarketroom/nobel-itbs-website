import { jsonError, jsonOk } from '@/lib/api/responses';
import { resumeCredentialGenerationBatchActivationRequest } from '@/lib/credentials/batch-generation';
import { assertUuid } from '@/lib/learners/admin-input';
import { getAdminContext } from '@/lib/supabase/server';

type RouteProps = { params: Promise<{ id: string; activationRequestId: string }> };

export async function POST(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request);
    const params = await props.params;
    return jsonOk({ result: await resumeCredentialGenerationBatchActivationRequest(
      context,
      assertUuid(params.id, 'batch ID'),
      assertUuid(params.activationRequestId, 'batch activation request ID'),
      new URL(request.url).origin,
    ) });
  } catch (error) {
    return jsonError(error);
  }
}
