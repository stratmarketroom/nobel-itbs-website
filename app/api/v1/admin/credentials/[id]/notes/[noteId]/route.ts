import { jsonError, jsonOk } from '@/lib/api/responses';
import { readCredentialObject } from '@/lib/credentials/admin-input';
import { deleteCredentialNote, updateCredentialNote } from '@/lib/credentials/workspace';
import { assertUuid } from '@/lib/learners/admin-input';
import { assertKeys } from '@/lib/programmes/admin-input';
import { ApiError, getAdminContext } from '@/lib/supabase/server';

type RouteProps = { params: Promise<{ id: string; noteId: string }> };

async function ids(props: RouteProps): Promise<{ credentialId: string; noteId: string }> {
  const params = await props.params;
  return {
    credentialId: assertUuid(params.id, 'credential ID'),
    noteId: assertUuid(params.noteId, 'credential note ID'),
  };
}

function noteBody(body: Record<string, unknown>): string {
  assertKeys(body, ['body']);
  if (typeof body.body !== 'string' || !body.body.trim()) throw new ApiError('bad_request', 400, 'Note body is required.');
  const value = body.body.trim();
  if (value.length > 4000) throw new ApiError('bad_request', 400, 'Note body is too long.');
  return value;
}

export async function PATCH(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request);
    const { credentialId, noteId } = await ids(props);
    return jsonOk({ note: await updateCredentialNote(context, credentialId, noteId, noteBody(await readCredentialObject(request))) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request);
    const { credentialId, noteId } = await ids(props);
    return jsonOk({ note: await deleteCredentialNote(context, credentialId, noteId) });
  } catch (error) {
    return jsonError(error);
  }
}
