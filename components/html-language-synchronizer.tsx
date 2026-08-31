'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { htmlLanguageForPathname } from '@/lib/content/html-language';

export function HtmlLanguageSynchronizer() {
  const pathname = usePathname();

  useEffect(() => {
    const language = htmlLanguageForPathname(pathname);

    if (document.documentElement.lang !== language) {
      document.documentElement.lang = language;
    }
  }, [pathname]);

  return null;
}
