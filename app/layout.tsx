import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import { CookieConsent } from '@/components/cookie-consent';
import { htmlLanguageHeader, resolveHtmlLanguage } from '@/lib/content/html-language';

export const metadata: Metadata = {
  title: 'Nobel ITBS',
  description: 'International business school website and credential registry.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const htmlLanguage = resolveHtmlLanguage(requestHeaders.get(htmlLanguageHeader));

  return (
    <html lang={htmlLanguage}>
      <body>{children}<CookieConsent /></body>
    </html>
  );
}
