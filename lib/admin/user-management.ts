import {
  ApiError,
  type AppRole,
  type AdminContext,
  getSupabaseAdminClient,
  getSupabaseRequestClient,
} from '@/lib/supabase/server';
import type { AdminUserSummary } from './types';

export type { AdminUserSummary } from './types';

type UserRoleRow = {
  user_id: string;
  role: AppRole;
  assigned_at: string;
};

type UserProfileRow = {
  id: string;
  full_name: string | null;
  is_active: boolean;
  is_owner: boolean;
  mfa_required: boolean;
  created_at: string;
  updated_at: string;
  user_roles: UserRoleRow[] | null;
};

export type CreateAdminUserInput = {
  email: string;
  temporaryPassword: string;
  fullName?: string | null;
  roles: AppRole[];
};

export type UpdateAdminUserAtomicInput = {
  fullName: string | null;
  isActive: boolean;
  mfaRequired: boolean;
  roles: AppRole[];
};

export function toAdminUserSummary(row: UserProfileRow, emailByUserId: Map<string, string | null>): AdminUserSummary {
  return {
    id: row.id,
    email: emailByUserId.get(row.id) ?? null,
    fullName: row.full_name,
    isActive: row.is_active,
    isOwner: row.is_owner,
    mfaRequired: row.mfa_required,
    roles: row.user_roles?.map((roleRow) => roleRow.role) ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAdminUsers(): Promise<AdminUserSummary[]> {
  const supabase = getSupabaseAdminClient();
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select(
      `
      id,
      full_name,
      is_active,
      is_owner,
      mfa_required,
      created_at,
      updated_at,
      user_roles!user_roles_user_id_fkey (
        user_id,
        role,
        assigned_at
      )
    `,
    )
    .order('created_at', { ascending: false });

  if (profilesError) {
    throw new ApiError('server_error', 500, 'Failed to list admin users.');
  }

  const { data: authUsers, error: authUsersError } = await supabase.auth.admin.listUsers();

  if (authUsersError) {
    throw new ApiError('server_error', 500, 'Failed to list auth users.');
  }

  const emailByUserId = new Map(authUsers.users.map((user) => [user.id, user.email ?? null]));

  return ((profiles ?? []) as UserProfileRow[]).map((profile) => toAdminUserSummary(profile, emailByUserId));
}

export async function createAdminUser(context: AdminContext, input: CreateAdminUserInput): Promise<AdminUserSummary> {
  const adminClient = getSupabaseAdminClient();
  const requestClient = getSupabaseRequestClient(context.accessToken);

  const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
    email: input.email,
    password: input.temporaryPassword,
    email_confirm: true,
    user_metadata: input.fullName ? { full_name: input.fullName } : undefined,
  });

  if (createError || !createdUser.user) {
    throw new ApiError('bad_request', 400, createError?.message ?? 'Failed to create auth user.');
  }

  const userId = createdUser.user.id;

  const { error: profileError } = await requestClient.rpc('create_admin_profile', {
    p_full_name: input.fullName ?? null,
    p_roles: input.roles,
    p_user_id: userId,
  });

  if (profileError) {
    await adminClient.auth.admin.deleteUser(userId);
    throw new ApiError('bad_request', 400, profileError.message);
  }

  const users = await listAdminUsers();
  const user = users.find((candidate) => candidate.id === userId);

  if (!user) {
    throw new ApiError('server_error', 500, 'Created admin user could not be loaded.');
  }

  return user;
}

export async function updateAdminUser(
  context: AdminContext,
  userId: string,
  input: { fullName?: string | null; isActive?: boolean; mfaRequired?: boolean },
): Promise<void> {
  const hasFullName = 'fullName' in input;
  const hasIsActive = 'isActive' in input;
  const hasMfaRequired = 'mfaRequired' in input;

  if (!hasFullName && !hasIsActive && !hasMfaRequired) {
    throw new ApiError('bad_request', 400, 'No user profile changes were provided.');
  }

  const requestClient = getSupabaseRequestClient(context.accessToken);
  const { error } = await requestClient.rpc('update_admin_profile', {
    p_full_name: input.fullName ?? null,
    p_is_active: input.isActive ?? null,
    p_mfa_required: input.mfaRequired ?? null,
    p_update_full_name: hasFullName,
    p_update_is_active: hasIsActive,
    p_update_mfa_required: hasMfaRequired,
    p_user_id: userId,
  });

  if (error) {
    throw new ApiError('bad_request', 400, error.message);
  }
}

export async function updateAdminUserAtomic(
  context: AdminContext,
  userId: string,
  input: UpdateAdminUserAtomicInput,
): Promise<AdminUserSummary> {
  if (input.roles.length === 0) {
    throw new ApiError('bad_request', 400, 'At least one role is required.');
  }

  const requestClient = getSupabaseRequestClient(context.accessToken);
  const { error } = await requestClient.rpc('update_admin_user_atomic', {
    p_full_name: input.fullName,
    p_is_active: input.isActive,
    p_mfa_required: input.mfaRequired,
    p_roles: input.roles,
    p_user_id: userId,
  });

  if (error) {
    const forbidden = error.code === '42501';
    throw new ApiError(forbidden ? 'forbidden' : 'bad_request', forbidden ? 403 : 400, error.message);
  }

  const user = (await listAdminUsers()).find((candidate) => candidate.id === userId);
  if (!user) {
    throw new ApiError('server_error', 500, 'Updated admin user could not be loaded.');
  }

  return user;
}

export async function assignRoles(context: AdminContext, userId: string, roles: AppRole[]): Promise<void> {
  if (roles.length === 0) {
    throw new ApiError('bad_request', 400, 'At least one role is required.');
  }

  const requestClient = getSupabaseRequestClient(context.accessToken);
  const { error } = await requestClient.rpc('assign_admin_roles', {
    p_roles: roles,
    p_user_id: userId,
  });

  if (error) {
    throw new ApiError('bad_request', 400, error.message);
  }
}

export async function removeRoles(context: AdminContext, userId: string, roles: AppRole[]): Promise<void> {
  if (roles.length === 0) {
    throw new ApiError('bad_request', 400, 'At least one role is required.');
  }

  const requestClient = getSupabaseRequestClient(context.accessToken);
  const { error } = await requestClient.rpc('remove_admin_roles', {
    p_roles: roles,
    p_user_id: userId,
  });

  if (error) {
    throw new ApiError('bad_request', 400, error.message);
  }
}
