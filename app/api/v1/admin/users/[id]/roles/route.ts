import { assignRoles, removeRoles } from '@/lib/admin/user-management';
import { jsonError, jsonOk } from '@/lib/api/responses';
import { ApiError, assertCanManageRoles, getAdminContext, normalizeRoles } from '@/lib/supabase/server';

type UserRolesRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

type RolesBody = {
  roles?: unknown;
};

function parseRolesBody(body: RolesBody) {
  const roles = normalizeRoles(body.roles);

  if (roles.length === 0) {
    throw new ApiError('bad_request', 400, 'At least one role is required.');
  }

  return roles;
}

export async function PUT(request: Request, { params }: UserRolesRouteProps) {
  try {
    const context = await getAdminContext(request);
    const { id } = await params;
    const roles = parseRolesBody((await request.json()) as RolesBody);
    assertCanManageRoles(context, roles);

    await assignRoles(context, id, roles);

    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(request: Request, { params }: UserRolesRouteProps) {
  try {
    const context = await getAdminContext(request);
    const { id } = await params;
    const roles = parseRolesBody((await request.json()) as RolesBody);
    assertCanManageRoles(context, roles);

    await removeRoles(context, id, roles);

    return jsonOk({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
