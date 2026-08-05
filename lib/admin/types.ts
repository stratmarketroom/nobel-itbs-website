export const adminRoles = ['owner', 'super_admin', 'content_manager', 'credential_manager'] as const;

export type AdminRole = (typeof adminRoles)[number];

export type AdminUserSummary = {
  id: string;
  email: string | null;
  fullName: string | null;
  isActive: boolean;
  isOwner: boolean;
  mfaRequired: boolean;
  roles: AdminRole[];
  createdAt: string;
  updatedAt: string;
};
