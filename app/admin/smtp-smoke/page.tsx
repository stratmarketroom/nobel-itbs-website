import { notFound } from 'next/navigation';
import { AdminSmtpSmoke } from '@/components/admin-smtp-smoke';

export default function AdminSmtpSmokePage() {
  if (process.env.VERCEL_ENV !== 'preview') notFound();
  return <AdminSmtpSmoke />;
}
