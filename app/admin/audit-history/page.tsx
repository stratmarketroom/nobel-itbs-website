import { AdminAuditHistory } from '@/components/admin-audit-history';

export const metadata = {
  title: 'Audit / History | Nobel ITBS Admin',
  robots: { index: false, follow: false },
};

export default function AdminAuditHistoryPage() {
  return <AdminAuditHistory />;
}
