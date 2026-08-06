import 'server-only';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

export const appRoles = ['owner', 'super_admin', 'content_manager', 'credential_manager'] as const;

export type AppRole = (typeof appRoles)[number];

export type AdminContext = {
  accessToken: string;
  user: User;
  profile: {
    id: string;
    full_name: string | null;
    is_active: boolean;
    is_owner: boolean;
    mfa_required: boolean;
  };
  roles: AppRole[];
  aal: string | null;
  mfaSatisfied: boolean;
};

export type ApiErrorCode = 'unauthorized' | 'forbidden' | 'bad_request' | 'not_found' | 'server_error';

export class ApiError extends Error {
  code: ApiErrorCode;
  status: number;

  constructor(code: ApiErrorCode, status: number, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const serviceRoleEnvName = 'SUPABASE_SERVICE_ROLE_KEY';
const anonKeyEnvName = 'NEXT_PUBLIC_SUPABASE_ANON_KEY';
const urlEnvName = 'NEXT_PUBLIC_SUPABASE_URL';

export function getSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl = process.env[urlEnvName];
  const serviceRoleKey = process.env[serviceRoleEnvName];

  if (!supabaseUrl || !serviceRoleKey) {
    throw new ApiError('server_error', 500, 'Supabase server configuration is missing.');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export function getSupabaseRequestClient(accessToken: string): SupabaseClient {
  const supabaseUrl = process.env[urlEnvName];
  const anonKey = process.env[anonKeyEnvName];

  if (!supabaseUrl || !anonKey) {
    throw new ApiError('server_error', 500, 'Supabase public configuration is missing.');
  }

  return createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });
}

export function getBearerToken(request: Request): string {
  const authorization = request.headers.get('authorization');
  const match = authorization?.match(/^Bearer\s+(.+)$/i);

  if (!match?.[1]) {
    throw new ApiError('unauthorized', 401, 'Bearer session is required.');
  }

  return match[1];
}

export function readJwtAal(accessToken: string): string | null {
  const [, payload] = accessToken.split('.');

  if (!payload) {
    return null;
  }

  try {
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = Buffer.from(normalizedPayload, 'base64').toString('utf8');
    const claims = JSON.parse(decoded) as { aal?: unknown };
    return typeof claims.aal === 'string' ? claims.aal : null;
  } catch {
    return null;
  }
}

export function isValidAppRole(role: unknown): role is AppRole {
  return typeof role === 'string' && appRoles.includes(role as AppRole);
}

export function normalizeRoles(input: unknown): AppRole[] {
  if (!Array.isArray(input)) {
    return [];
  }

  const roles = new Set<AppRole>();

  for (const role of input) {
    if (isValidAppRole(role)) {
      roles.add(role);
    }
  }

  return [...roles];
}

export function requiresMfaForRole(role: AppRole): boolean {
  return role === 'owner' || role === 'super_admin' || role === 'credential_manager';
}

export function requiresOwnerForRole(role: AppRole): boolean {
  return role === 'owner' || role === 'super_admin';
}

export async function getAdminContext(request: Request): Promise<AdminContext> {
  const accessToken = getBearerToken(request);
  const requestClient = getSupabaseRequestClient(accessToken);
  const adminClient = getSupabaseAdminClient();
  const { data: userData, error: userError } = await requestClient.auth.getUser();

  if (userError || !userData.user) {
    throw new ApiError('unauthorized', 401, 'Valid Supabase session is required.');
  }

  const { data: profile, error: profileError } = await adminClient
    .from('user_profiles')
    .select('id, full_name, is_active, is_owner, mfa_required')
    .eq('id', userData.user.id)
    .maybeSingle();

  if (profileError) {
    throw new ApiError('server_error', 500, 'Failed to load admin profile.');
  }

  if (!profile || !profile.is_active) {
    throw new ApiError('forbidden', 403, 'Active admin profile is required.');
  }

  const { data: roleRows, error: rolesError } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userData.user.id);

  if (rolesError) {
    throw new ApiError('server_error', 500, 'Failed to load admin roles.');
  }

  const roles = normalizeRoles(roleRows?.map((row) => row.role));
  const aal = readJwtAal(accessToken);
  const roleRequiresMfa = roles.some(requiresMfaForRole);
  const mfaSatisfied = !profile.mfa_required && !roleRequiresMfa ? true : aal === 'aal2';

  return {
    accessToken,
    user: userData.user,
    profile,
    roles,
    aal,
    mfaSatisfied,
  };
}

export function assertCanManageUsers(context: AdminContext): void {
  if (!context.roles.includes('owner') && !context.roles.includes('super_admin')) {
    throw new ApiError('forbidden', 403, 'Owner or Super Admin role is required.');
  }

  if (!context.mfaSatisfied) {
    throw new ApiError('forbidden', 403, 'MFA/AAL2 is required for user management.');
  }
}

export function assertCanManageRoles(context: AdminContext, roles: AppRole[]): void {
  assertCanManageUsers(context);

  if (roles.some(requiresOwnerForRole) && !context.roles.includes('owner')) {
    throw new ApiError('forbidden', 403, 'Only Owner can change Owner or Super Admin roles.');
  }
}

export function assertCanAccessContactSubmissions(context: AdminContext): void {
  const hasContactRole = context.roles.some((role) => (
    role === 'owner' || role === 'super_admin' || role === 'credential_manager'
  ));

  if (!hasContactRole) {
    throw new ApiError('forbidden', 403, 'Contact submission access is not permitted.');
  }

  if (!context.mfaSatisfied) {
    throw new ApiError('forbidden', 403, 'MFA/AAL2 is required for contact submissions.');
  }
}

export function assertCanManageContent(context: AdminContext): void {
  const allowed = context.roles.some((role) => (
    role === 'owner' || role === 'super_admin' || role === 'content_manager'
  ));

  if (!allowed) {
    throw new ApiError('forbidden', 403, 'Content management access is not permitted.');
  }

  if (!context.mfaSatisfied) {
    throw new ApiError('forbidden', 403, 'MFA/AAL2 is required for content management.');
  }
}

export function assertCanManageSiteSettings(context: AdminContext): void {
  if (!context.roles.includes('owner') && !context.roles.includes('super_admin')) {
    throw new ApiError('forbidden', 403, 'Owner or Super Admin role is required for site settings.');
  }
  if (!context.mfaSatisfied) {
    throw new ApiError('forbidden', 403, 'MFA/AAL2 is required for site settings.');
  }
}
