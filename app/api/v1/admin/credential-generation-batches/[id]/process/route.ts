import { jsonError, jsonOk } from '@/lib/api/responses';
import { processCredentialGenerationBatchChunk } from '@/lib/credentials/batch-generation';
import { assertUuid } from '@/lib/learners/admin-input';
import { getAdminContext } from '@/lib/supabase/server';

type RouteProps = { params: Promise<{ id: string }> };

export async function POST(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request);
    const { id } = await props.params;
    return jsonOk({ result: await processCredentialGenerationBatchChunk(
      context,
      assertUuid(id, 'batch ID'),
      new URL(request.url).origin,
    ) });
  } catch (error) {
    return jsonError(error);
  }
}
