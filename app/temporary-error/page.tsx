import type { Metadata } from 'next';
import { SystemPage } from '@/components/system-page';
import { systemCopy } from '@/lib/system-copy';

export const metadata: Metadata = {
  title: 'Service Temporarily Unavailable | Nobel ITBS',
  robots: { index: false, follow: false },
};

export default function TemporaryErrorPage() {
  return <SystemPage copy={systemCopy.en['temporary-error']} />;
}
