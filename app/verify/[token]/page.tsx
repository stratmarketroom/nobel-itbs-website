import type { Metadata } from 'next';
import { VerifyTokenPage } from '@/components/verify-page';
import { verifyCopy } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Verification Result | Nobel ITBS',
  robots: {
    index: false,
    follow: false,
  },
};

export default function VerifyTokenRoute() {
  return <VerifyTokenPage copy={verifyCopy.en} locale="en" />;
}
