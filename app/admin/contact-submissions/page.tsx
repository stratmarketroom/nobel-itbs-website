import { AdminContactSubmissions } from '@/components/admin-contact-submissions';

export const metadata = {
  title: 'Contact Submissions | Nobel ITBS Admin',
  robots: { index: false, follow: false },
};

export default function AdminContactSubmissionsPage() {
  return <AdminContactSubmissions />;
}
