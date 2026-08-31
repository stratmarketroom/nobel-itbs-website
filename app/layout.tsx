import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Manrope } from 'next/font/google';
import './globals.css';
import { CookieConsent } from '@/components/cookie-consent';
import { GoogleAnalytics } from '@/components/google-analytics';
import { htmlLanguageHeader, resolveHtmlLanguage } from '@/lib/content/html-language';
import { createSocialMetadata, getInstitutionalSocialAlt, socialImagePaths } from '@/lib/seo/social';
import { canonicalOrigin, localizedAbsoluteUrl } from '@/lib/seo/urls';

const rootTitle = 'Nobel ITBS';
const rootDescription = 'International business school website and credential registry.';

const manrope = Manrope({
  // Preload only the shared Latin subset. Next.js still self-hosts the
  // Cyrillic and Latin Extended unicode ranges, which browsers request only
  // on the Ukrainian and Czech routes that need them.
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(canonicalOrigin),
  title: rootTitle,
  description: rootDescription,
  ...createSocialMetadata({
    title: rootTitle,
    description: rootDescription,
    canonical: localizedAbsoluteUrl('en', '/'),
    locale: 'en',
    imagePath: socialImagePaths.institutional,
    imageAlt: getInstitutionalSocialAlt('en'),
  }),
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const htmlLanguage = resolveHtmlLanguage(requestHeaders.get(htmlLanguageHeader));

  return (
    <html lang={htmlLanguage} className={manrope.variable}>
      <body>{children}<GoogleAnalytics /><CookieConsent /></body>
    </html>
  );
}
