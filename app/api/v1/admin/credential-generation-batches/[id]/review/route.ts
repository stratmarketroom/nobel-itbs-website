import { jsonError, jsonOk } from '@/lib/api/responses';
import { batchReviewPayload, readBatchObject } from '@/lib/credentials/batch-generation-input';
import { reviewCredentialGenerationBatchItems } from '@/lib/credentials/batch-generation';
import { assertUuid } from '@/lib/learners/admin-input';
import { getAdminContext } from '@/lib/supabase/server';

type RouteProps = { params: Promise<{ id: string }> };

export async function POST(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request);
    const { id } = await props.params;
    const input = batchReviewPayload(await readBatchObject(request));
    return jsonOk({
      result: await reviewCredentialGenerationBatchItems(
        context,
        assertUuid(id, 'batch ID'),
        input.itemIds,
      ),
    });
  } catch (error) {
    return jsonError(error);
  }
}
