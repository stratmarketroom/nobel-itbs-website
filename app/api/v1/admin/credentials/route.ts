import { jsonError, jsonOk } from '@/lib/api/responses';
import { adminPagination, adminSearch } from '@/lib/admin/pagination';
import { createPendingCredential } from '@/lib/credentials/admin';
import { createPendingCredentialPayload, readCredentialObject } from '@/lib/credentials/admin-input';
import { ApiError, getAdminContext } from '@/lib/supabase/server';
import { getCredentialReferences, listCredentials } from '@/lib/credentials/workspace';
import type { CredentialStatus } from '@/lib/credentials/workspace-types';

const credentialStatuses = ['pending', 'valid', 'revoked', 'voided'] as const;

export async function GET(request: Request) {
  try {
    const context = await getAdminContext(request);
    const url = new URL(request.url);
    const statusValue = url.searchParams.get('status');
    if (statusValue && !credentialStatuses.includes(statusValue as CredentialStatus)) {
      throw new ApiError('bad_request', 400, 'Invalid credential status.');
    }
    const learnerId = url.searchParams.get('learnerId')?.trim() || undefined;
    if (learnerId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(learnerId)) {
      throw new ApiError('bad_request', 400, 'Invalid learner identifier.');
    }
    const [result, references] = await Promise.all([
      listCredentials(context, {
        query: adminSearch(url.searchParams),
        status: statusValue as CredentialStatus | undefined,
        learnerId,
        ...adminPagination(url.searchParams),
      }),
      getCredentialReferences(context),
    ]);
    return jsonOk({ ...result, references });
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
