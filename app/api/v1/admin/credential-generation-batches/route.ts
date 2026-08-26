import { jsonError, jsonOk } from '@/lib/api/responses';
import { getBatchReferenceData, listCredentialGenerationBatches } from '@/lib/credentials/batch-generation';
import { getAdminContext } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const context = await getAdminContext(request);
    const [batches, references] = await Promise.all([
      listCredentialGenerationBatches(context),
      getBatchReferenceData(context),
    ]);
    return jsonOk({ batches, references });
  } catch (error) {
    return jsonError(error);
  }
}
