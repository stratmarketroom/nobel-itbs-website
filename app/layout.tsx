import { headers } from 'next/headers';
import { Manrope } from 'next/font/google';
import './base.css';
import { htmlLanguageHeader, resolveHtmlLanguage } from '@/lib/content/html-language';

const manrope = Manrope({
  // Preload only the shared Latin subset. Next.js still self-hosts the
  // Cyrillic and Latin Extended unicode ranges, which browsers request only
  // on the Ukrainian and Czech routes that need them.
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
  adjustFontFallback: true,
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const htmlLanguage = resolveHtmlLanguage(requestHeaders.get(htmlLanguageHeader));

  return (
    <html lang={htmlLanguage} className={manrope.variable}>
      <body>{children}</body>
    </html>
  );
}
