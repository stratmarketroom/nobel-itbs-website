import { jsonError, jsonOk } from '@/lib/api/responses';
import { createPendingCredential } from '@/lib/credentials/admin';
import { createPendingCredentialPayload, readCredentialObject } from '@/lib/credentials/admin-input';
import { getAdminContext } from '@/lib/supabase/server';
import { getCredentialReferences, listCredentials } from '@/lib/credentials/workspace';

export async function GET(request: Request) {
  try {
    const context = await getAdminContext(request);
    const [credentials, references] = await Promise.all([
      listCredentials(context),
      getCredentialReferences(context),
    ]);
    return jsonOk({ credentials, references });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await getAdminContext(request);
    const input = createPendingCredentialPayload(await readCredentialObject(request));
    return jsonOk({ credential: await createPendingCredential(context, input) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
