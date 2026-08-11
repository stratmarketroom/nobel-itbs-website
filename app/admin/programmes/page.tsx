import { AdminProgrammes } from '@/components/admin-programmes';

export const metadata = {
  title: 'Programmes | Nobel ITBS Admin',
  robots: { index: false, follow: false },
};

export default function AdminProgrammesPage() {
  return <AdminProgrammes />;
}
