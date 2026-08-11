import type { Metadata } from 'next';
import { PublicVerification } from '@/components/public-verification';

type Props = { params: Promise<{ token: string }> };

export const metadata: Metadata = {
  title: 'Document Verification | Nobel ITBS',
  robots: { index: false, follow: false },
  alternates: { canonical: '/verify' },
};

export default async function TokenVerifyPage({ params }: Props) {
  const { token } = await params;
  return <PublicVerification locale="en" token={token} />;
}
