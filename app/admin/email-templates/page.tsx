import { AdminEmailTemplates } from '@/components/admin-email-templates';

export const metadata = {
  title: 'Email Templates | Nobel ITBS Admin',
  robots: { index: false, follow: false },
};

export default function AdminEmailTemplatesPage() {
  return <AdminEmailTemplates />;
}
