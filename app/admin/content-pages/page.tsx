import { AdminContentPages } from '@/components/admin-content-pages';

export const metadata = {
  title: 'Content Pages | Nobel ITBS Admin',
  robots: { index: false, follow: false },
};

export default function AdminContentPagesPage() {
  return <AdminContentPages />;
}
