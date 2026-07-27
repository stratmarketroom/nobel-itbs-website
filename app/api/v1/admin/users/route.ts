import { createAdminUser, listAdminUsers } from '@/lib/admin/user-management';
import { jsonError, jsonOk } from '@/lib/api/responses';
import {
  ApiError,
  assertCanManageRoles,
  assertCanManageUsers,
  getAdminContext,
  normalizeRoles,
} from '@/lib/supabase/server';

type CreateUserBody = {
  email?: unknown;
  temporaryPassword?: unknown;
  fullName?: unknown;
  roles?: unknown;
};

function parseCreateUserBody(body: CreateUserBody) {
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const temporaryPassword = typeof body.temporaryPassword === 'string' ? body.temporaryPassword : '';
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : null;
  const roles = normalizeRoles(body.roles);

  if (!email || !email.includes('@')) {
    throw new ApiError('bad_request', 400, 'Valid email is required.');
  }

  if (temporaryPassword.length < 12) {
    throw new ApiError('bad_request', 400, 'Temporary password must be at least 12 characters.');
  }

  if (roles.length === 0) {
    throw new ApiError('bad_request', 400, 'At least one admin role is required.');
  }

  return {
    email,
    temporaryPassword,
    fullName,
    roles,
  };
}

export async function GET(request: Request) {
  try {
    const context = await getAdminContext(request);
    assertCanManageUsers(context);

    return jsonOk({
      users: await listAdminUsers(),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    const context = await getAdminContext(request);
    const input = parseCreateUserBody((await request.json()) as CreateUserBody);
    assertCanManageRoles(context, input.roles);

    const user = await createAdminUser(context, input);

    return jsonOk({ user }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
