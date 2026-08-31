import type { Metadata } from 'next';
import { PublicVerification } from '@/components/public-verification';
import { verificationCopy } from '@/lib/credentials/verification-copy';
import { createSocialMetadata, getVerificationSocialAlt, socialImagePaths } from '@/lib/seo/social';
import { languageAlternates, localizedAbsoluteUrl } from '@/lib/seo/urls';

const copy = verificationCopy.en;
const canonical = localizedAbsoluteUrl('en', '/verify');
export const metadata: Metadata = {
  title: copy.seo.title,
  description: copy.seo.description,
  ...createSocialMetadata({
    title: copy.seo.ogTitle,
    description: copy.seo.ogDescription,
    canonical,
    locale: 'en',
    imagePath: socialImagePaths.verify,
    imageAlt: getVerificationSocialAlt('en'),
  }),
  alternates: { canonical, languages: languageAlternates('/verify') },
};

type Props = { searchParams: Promise<{ documentNumber?: string | string[] }> };

export default async function VerifyPage({ searchParams }: Props) {
  const value = (await searchParams).documentNumber;
  return <PublicVerification locale="en" initialDocumentNumber={Array.isArray(value) ? value[0] : value} />;
}
