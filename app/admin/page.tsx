import { AdminDashboard } from '@/components/admin-dashboard';

export const metadata = {
  title: 'Dashboard | Nobel ITBS Admin',
  robots: { index: false, follow: false },
};

export default function AdminDashboardPage() {
  return <AdminDashboard />;
}
