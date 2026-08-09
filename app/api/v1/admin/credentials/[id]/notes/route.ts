import { jsonError, jsonOk } from '@/lib/api/responses';
import { readCredentialObject } from '@/lib/credentials/admin-input';
import { addCredentialNote } from '@/lib/credentials/workspace';
import { assertUuid } from '@/lib/learners/admin-input';
import { assertKeys } from '@/lib/programmes/admin-input';
import { ApiError, getAdminContext } from '@/lib/supabase/server';

type RouteProps = { params: Promise<{ id: string }> };

function noteBody(body: Record<string, unknown>): string {
  assertKeys(body, ['body']);
  if (typeof body.body !== 'string' || !body.body.trim()) throw new ApiError('bad_request', 400, 'Note body is required.');
  const value = body.body.trim();
  if (value.length > 4000) throw new ApiError('bad_request', 400, 'Note body is too long.');
  return value;
}

export async function POST(request: Request, props: RouteProps) {
  try {
    const context = await getAdminContext(request);
    const { id } = await props.params;
    return jsonOk({ note: await addCredentialNote(context, assertUuid(id, 'credential ID'), noteBody(await readCredentialObject(request))) }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
