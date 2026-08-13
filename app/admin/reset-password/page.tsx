import { notFound } from 'next/navigation';
import { AdminPasswordRecovery } from '@/components/admin-password-recovery';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Reset Admin Password | Nobel ITBS',
  robots: { index: false, follow: false },
};

export default function AdminResetPasswordPage() {
  if (process.env.VERCEL_ENV !== 'preview') notFound();
  return <AdminPasswordRecovery />;
}
