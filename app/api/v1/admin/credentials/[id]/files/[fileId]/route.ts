import { jsonError, jsonOk } from '@/lib/api/responses';
import { readFilePatch, readPdfUpload } from '@/lib/credentials/file-input';
import {
  createCredentialFileSignedUrl,
  deleteCredentialFile,
  replaceCredentialFile,
  updateCredentialFile,
} from '@/lib/credentials/files';
import { assertUuid } from '@/lib/learners/admin-input';
import { getAdminContext } from '@/lib/supabase/server';

type RouteProps = { params: Promise<{ id: string; fileId: string }> };

async function ids(props: RouteProps) {
  const params = await props.params;
  return {
    credentialId: assertUuid(params.id, 'credential ID'),
    fileId: assertUuid(params.fileId, 'credential file ID'),
  };
}

export async function GET(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request);
    const { credentialId, fileId } = await ids(props);
    const disposition = new URL(request.url).searchParams.get('disposition') === 'inline' ? 'inline' : 'download';
    return jsonOk(await createCredentialFileSignedUrl(context, credentialId, fileId, disposition));
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request);
    const { credentialId, fileId } = await ids(props);
    return jsonOk({
      file: await replaceCredentialFile(context, credentialId, fileId, await readPdfUpload(request, false)),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request);
    const { credentialId, fileId } = await ids(props);
    return jsonOk({ file: await updateCredentialFile(context, credentialId, fileId, await readFilePatch(request)) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request);
    const { credentialId, fileId } = await ids(props);
    await deleteCredentialFile(context, credentialId, fileId);
    return jsonOk({ deleted: true });
  } catch (error) {
    return jsonError(error);
  }
}
