import type { Metadata } from 'next';
import { VerifyPage } from '@/components/verify-page';
import { verifyCopy } from '@/lib/i18n';

export const metadata: Metadata = {
  title: 'Verify a Document | Nobel ITBS',
  description: 'Verify a Nobel ITBS document by number or open its verification page using the QR code printed on the document.',
  openGraph: {
    title: 'Nobel ITBS Document Verification',
    description: "Check a document's status using its number or QR code.",
  },
};

export default function VerifyRoute() {
  return <VerifyPage copy={verifyCopy.en} locale="en" />;
}
