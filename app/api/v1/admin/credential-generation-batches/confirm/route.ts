import { jsonError, jsonOk } from '@/lib/api/responses';
import { confirmCredentialGenerationBatch } from '@/lib/credentials/batch-generation';
import { batchContextPayload, readBatchObject } from '@/lib/credentials/batch-generation-input';
import { getAdminContext } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const context = await getAdminContext(request);
    const input = batchContextPayload(await readBatchObject(request));
    return jsonOk({ batch: await confirmCredentialGenerationBatch(context, input) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
