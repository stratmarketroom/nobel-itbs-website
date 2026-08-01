import type { Metadata } from 'next';
import { SystemPage } from '@/components/system-page';
import { systemCopy } from '@/lib/system-copy';

export const metadata: Metadata = {
  title: 'Access Denied | Nobel ITBS',
  robots: { index: false, follow: false },
};

export default function AccessDeniedPage() {
  return <SystemPage copy={systemCopy.en['access-denied']} />;
}
