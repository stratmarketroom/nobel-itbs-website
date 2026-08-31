import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import '../public.css';
import { CookieConsent } from '@/components/cookie-consent';
import { GoogleAnalytics } from '@/components/google-analytics';
import {
  COOKIE_CONSENT_STORAGE_KEY,
  parseCookieConsentDecision,
} from '@/lib/privacy/cookie-consent';
import { createSocialMetadata, getInstitutionalSocialAlt, socialImagePaths } from '@/lib/seo/social';
import { canonicalOrigin, localizedAbsoluteUrl } from '@/lib/seo/urls';

const rootTitle = 'Nobel ITBS';
const rootDescription = 'International business school website and credential registry.';

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

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const initialConsent = parseCookieConsentDecision(
    cookieStore.get(COOKIE_CONSENT_STORAGE_KEY)?.value,
  );

  return (
    <>
      {children}
      <GoogleAnalytics initialConsent={initialConsent} />
      <CookieConsent initialConsent={initialConsent} />
    </>
  );
}
