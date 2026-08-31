import type { Metadata } from 'next';
import { PublicVerification } from '@/components/public-verification';
import { verificationCopy } from '@/lib/credentials/verification-copy';
import { createSocialMetadata, getVerificationSocialAlt, socialImagePaths } from '@/lib/seo/social';
import { localizedAbsoluteUrl } from '@/lib/seo/urls';

type Props = { params: Promise<{ token: string }> };

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
    publishedLocales: ['en'],
  }),
  robots: { index: false, follow: false },
  alternates: { canonical },
};

export default async function TokenVerifyPage({ params }: Props) {
  const { token } = await params;
  return <PublicVerification locale="en" token={token} />;
}
