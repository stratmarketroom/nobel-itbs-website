import type { Metadata } from 'next';
import './globals.css';
import { CookieConsent } from '@/components/cookie-consent';

export const metadata: Metadata = {
  title: 'Nobel ITBS',
  description: 'International business school website and credential registry.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}<CookieConsent /></body>
    </html>
  );
}
