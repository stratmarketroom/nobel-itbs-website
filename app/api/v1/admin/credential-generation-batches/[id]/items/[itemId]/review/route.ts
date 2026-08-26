import { jsonError, jsonOk } from '@/lib/api/responses';
import { reviewCredentialGenerationBatchItem } from '@/lib/credentials/batch-generation';
import { assertUuid } from '@/lib/learners/admin-input';
import { getAdminContext } from '@/lib/supabase/server';

type RouteProps = { params: Promise<{ id: string; itemId: string }> };

export async function POST(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request);
    const params = await props.params;
    return jsonOk({ batch: await reviewCredentialGenerationBatchItem(
      context,
      assertUuid(params.id, 'batch ID'),
      assertUuid(params.itemId, 'batch item ID'),
    ) });
  } catch (error) {
    return jsonError(error);
  }
}
