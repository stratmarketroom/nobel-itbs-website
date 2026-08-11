import { listAdminUsers, updateAdminUser } from '@/lib/admin/user-management';
import { jsonError, jsonOk } from '@/lib/api/responses';
import { ApiError, assertCanManageRoles, assertCanManageUsers, getAdminContext } from '@/lib/supabase/server';

type UserRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateUserBody = {
  fullName?: unknown;
  isActive?: unknown;
  mfaRequired?: unknown;
};

function parseUpdateUserBody(body: UpdateUserBody) {
  const input: { fullName?: string | null; isActive?: boolean; mfaRequired?: boolean } = {};

  if ('fullName' in body) {
    input.fullName = typeof body.fullName === 'string' && body.fullName.trim() ? body.fullName.trim() : null;
  }

  if ('isActive' in body) {
    if (typeof body.isActive !== 'boolean') {
      throw new ApiError('bad_request', 400, 'isActive must be boolean.');
    }

    input.isActive = body.isActive;
  }

  if ('mfaRequired' in body) {
    if (typeof body.mfaRequired !== 'boolean') {
      throw new ApiError('bad_request', 400, 'mfaRequired must be boolean.');
    }

    input.mfaRequired = body.mfaRequired;
  }

  return input;
}

export async function PATCH(request: Request, { params }: UserRouteProps) {
  try {
    const context = await getAdminContext(request);
    const { id } = await params;
    const body = parseUpdateUserBody((await request.json()) as UpdateUserBody);
    const target = (await listAdminUsers()).find((user) => user.id === id);

    if (!target) {
      throw new ApiError('not_found', 404, 'Admin user was not found.');
    }

    if (target.isOwner || target.roles.includes('owner') || target.roles.includes('super_admin')) {
      assertCanManageRoles(context, target.roles);
    } else {
      assertCanManageUsers(context);
    }

    await updateAdminUser(context, id, body);

    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
