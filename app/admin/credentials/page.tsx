import { AdminCredentials } from '@/components/admin-credentials';

export const metadata = { title: 'Credentials | Nobel ITBS Admin', robots: { index: false, follow: false } };

export default function AdminCredentialsPage() {
  return <AdminCredentials smtpSmokeEnabled={process.env.VERCEL_ENV === 'preview'} />;
}
