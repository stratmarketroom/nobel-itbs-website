'use client';

import { usePathname } from 'next/navigation';
import { SystemPage } from '@/components/system-page';
import { notFoundCopy } from '@/lib/system-copy';

export function LocalizedNotFound() {
  const pathname = usePathname();
  const locale = pathname.startsWith('/ua') ? 'ua' : pathname.startsWith('/cz') ? 'cz' : 'en';

  return <SystemPage copy={notFoundCopy[locale]} />;
}
