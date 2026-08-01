import type { Metadata, Viewport } from 'next';
import { CookieConsent } from '@/components/cookie-consent';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nobel ITBS',
  description: 'International business school website and credential registry.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
