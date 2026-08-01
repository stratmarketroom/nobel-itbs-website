import type { Metadata } from 'next';
import { SystemPage } from '@/components/system-page';
import { systemCopy } from '@/lib/system-copy';

export const metadata: Metadata = {
  title: 'Please Wait | Nobel ITBS',
  robots: { index: false, follow: false },
};

export default function RateLimitPage() {
  return <SystemPage copy={systemCopy.en['rate-limit']} />;
}
