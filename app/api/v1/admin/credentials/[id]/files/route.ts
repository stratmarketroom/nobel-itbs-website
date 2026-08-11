import { jsonError, jsonOk } from '@/lib/api/responses';
import { readPdfUpload } from '@/lib/credentials/file-input';
import { listCredentialFiles, uploadCredentialFile } from '@/lib/credentials/files';
import { assertUuid } from '@/lib/learners/admin-input';
import { getAdminContext } from '@/lib/supabase/server';

type RouteProps = { params: Promise<{ id: string }> };

export async function GET(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request);
    const { id } = await props.params;
    return jsonOk(await listCredentialFiles(context, assertUuid(id, 'credential ID')));
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request);
    const { id } = await props.params;
    const credentialId = assertUuid(id, 'credential ID');
    return jsonOk({
      file: await uploadCredentialFile(context, credentialId, await readPdfUpload(request, true)),
    }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
