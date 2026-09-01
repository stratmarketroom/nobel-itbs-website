import { listAdminUsers, updateAdminUserAtomic } from '@/lib/admin/user-management';
import { jsonError, jsonOk } from '@/lib/api/responses';
import {
  ApiError,
  assertCanManageRoles,
  assertCanManageUsers,
  getAdminContext,
  isValidAppRole,
  normalizeRoles,
} from '@/lib/supabase/server';

type UserRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateUserBody = {
  fullName?: unknown;
  isActive?: unknown;
  mfaRequired?: unknown;
  roles?: unknown;
};

function parseUpdateUserBody(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError('bad_request', 400, 'User update must be a JSON object.');
  }

  const body = value as UpdateUserBody;

  if (!('fullName' in body) || (typeof body.fullName !== 'string' && body.fullName !== null)) {
    throw new ApiError('bad_request', 400, 'fullName must be a string or null.');
  }

  if (typeof body.isActive !== 'boolean') {
    throw new ApiError('bad_request', 400, 'isActive must be boolean.');
  }

  if (typeof body.mfaRequired !== 'boolean') {
    throw new ApiError('bad_request', 400, 'mfaRequired must be boolean.');
  }

  if (!Array.isArray(body.roles) || body.roles.length === 0 || !body.roles.every(isValidAppRole)) {
    throw new ApiError('bad_request', 400, 'At least one valid admin role is required.');
  }

  return {
    fullName: typeof body.fullName === 'string' && body.fullName.trim() ? body.fullName.trim() : null,
    isActive: body.isActive,
    mfaRequired: body.mfaRequired,
    roles: normalizeRoles(body.roles),
  };
}

export async function PATCH(request: Request, { params }: UserRouteProps) {
  try {
    const context = await getAdminContext(request);
    assertCanManageUsers(context);
    const { id } = await params;
    const body = parseUpdateUserBody(await request.json());
    const target = (await listAdminUsers()).find((user) => user.id === id);

    if (!target) {
      throw new ApiError('not_found', 404, 'Admin user was not found.');
    }

    const governedRoles = normalizeRoles([...target.roles, ...body.roles]);
    if (target.isOwner || governedRoles.includes('owner') || governedRoles.includes('super_admin')) {
      assertCanManageRoles(context, governedRoles);
    }

    if (target.isOwner !== body.roles.includes('owner')) {
      throw new ApiError('bad_request', 400, 'Owner role cannot be changed through this user update.');
    }

    const user = await updateAdminUserAtomic(context, id, body);

    return jsonOk({ user });
  } catch (error) {
    return jsonError(error);
  }
}
