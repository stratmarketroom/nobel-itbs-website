import { jsonError, jsonOk } from '@/lib/api/responses';
import { activateCredentialGenerationBatchChunk } from '@/lib/credentials/batch-generation';
import { batchActivationPayload, readBatchObject } from '@/lib/credentials/batch-generation-input';
import { assertUuid } from '@/lib/learners/admin-input';
import { getAdminContext } from '@/lib/supabase/server';

type RouteProps = { params: Promise<{ id: string }> };

export async function POST(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request);
    const { id } = await props.params;
    return jsonOk({ result: await activateCredentialGenerationBatchChunk(
      context,
      assertUuid(id, 'batch ID'),
      batchActivationPayload(await readBatchObject(request)),
      new URL(request.url).origin,
    ) });
  } catch (error) {
    return jsonError(error);
  }
}
