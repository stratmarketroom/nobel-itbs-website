import { jsonError, jsonOk } from '@/lib/api/responses';
import { generateSingleCredential, getCredentialGenerationState } from '@/lib/credentials/generation';
import { readSingleGenerationInput } from '@/lib/credentials/generation-input';
import { assertUuid } from '@/lib/learners/admin-input';
import { getAdminContext } from '@/lib/supabase/server';

type RouteProps = { params: Promise<{ id: string }> };

export async function GET(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request);
    const { id } = await props.params;
    return jsonOk({
      generation: await getCredentialGenerationState(context, assertUuid(id, 'credential ID')),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request);
    const { id } = await props.params;
    const credentialId = assertUuid(id, 'credential ID');
    const input = await readSingleGenerationInput(request);
    return jsonOk({
      generation: await generateSingleCredential(
        context,
        credentialId,
        input.templateVersionId,
        new URL(request.url).origin,
      ),
    });
  } catch (error) {
    return jsonError(error);
  }
}
