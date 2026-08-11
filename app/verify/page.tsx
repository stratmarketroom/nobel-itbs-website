import type { Metadata } from 'next';
import { PublicVerification } from '@/components/public-verification';
import { verificationCopy } from '@/lib/credentials/verification-copy';

const copy = verificationCopy.en;
export const metadata: Metadata = {
  title: copy.seo.title,
  description: copy.seo.description,
  openGraph: { title: copy.seo.ogTitle, description: copy.seo.ogDescription },
  alternates: { canonical: '/verify', languages: { en: '/verify', uk: '/ua/verify', cs: '/cz/verify' } },
};

export default function VerifyPage() {
  return <PublicVerification locale="en" />;
}
