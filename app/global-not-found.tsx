import { Manrope } from 'next/font/google';
import './base.css';
import './public.css';
import { CookieConsent } from '@/components/cookie-consent';
import { GoogleAnalytics } from '@/components/google-analytics';
import {
  generateNotFoundMetadata,
  getRequestLocale,
  PublicNotFound,
} from '@/components/public-not-found';

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
  adjustFontFallback: true,
});

const htmlLanguageByLocale = {
  en: 'en',
  ua: 'uk',
  cz: 'cs',
} as const;

export const generateMetadata = generateNotFoundMetadata;

export default async function GlobalNotFound() {
  const locale = await getRequestLocale();

  return (
    <html lang={htmlLanguageByLocale[locale]} className={manrope.variable}>
      <body>
        <PublicNotFound locale={locale} />
        <GoogleAnalytics />
        <CookieConsent />
      </body>
    </html>
  );
}
