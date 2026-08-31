import type { Metadata } from 'next';
import '../public.css';
import { CookieConsent } from '@/components/cookie-consent';
import { GoogleAnalytics } from '@/components/google-analytics';
import { HtmlLanguageSynchronizer } from '@/components/html-language-synchronizer';
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

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <HtmlLanguageSynchronizer />
      {children}
      <GoogleAnalytics />
      <CookieConsent />
    </>
  );
}
