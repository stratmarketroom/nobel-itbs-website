import { AdminUserManagement } from '@/components/admin-user-management';

export const metadata = {
  title: 'Users and Roles | Nobel ITBS Admin',
  robots: { index: false, follow: false },
};

export default function AdminUsersPage() {
  return <AdminUserManagement />;
}
