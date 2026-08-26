import { jsonError, jsonOk } from '@/lib/api/responses';
import { previewCredentialGenerationBatch } from '@/lib/credentials/batch-generation';
import { batchContextPayload, readBatchObject } from '@/lib/credentials/batch-generation-input';
import { getAdminContext } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const context = await getAdminContext(request);
    const input = batchContextPayload(await readBatchObject(request));
    return jsonOk({ preview: await previewCredentialGenerationBatch(context, input) });
  } catch (error) {
    return jsonError(error);
  }
}
