import { jsonError, jsonOk } from '@/lib/api/responses';
import { getCredentialGenerationBatch } from '@/lib/credentials/batch-generation';
import { assertUuid } from '@/lib/learners/admin-input';
import { getAdminContext } from '@/lib/supabase/server';

type RouteProps = { params: Promise<{ id: string }> };

export async function GET(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request);
    const { id } = await props.params;
    return jsonOk({ batch: await getCredentialGenerationBatch(context, assertUuid(id, 'batch ID')) });
  } catch (error) {
    return jsonError(error);
  }
}
